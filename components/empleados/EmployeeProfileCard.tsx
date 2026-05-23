// components/empleados/EmployeeProfileCard.tsx
"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { MapPin, Calendar, MoreVertical, Plus } from "lucide-react";
import {
  Empleado,
  EstadoEmpleado,
  actualizarEmpleado,
  obtenerSubordinadosPorJerarquia,
  statusToBackend,
} from "@/services/empleadosService";
import { reenviarInvitacion, suspenderEmpleado } from "@/services/adminService";
import { useAuth } from "@/lib/auth/AuthContext";
import ChangeStatusModal from "@/components/empleados/ChangeStatusModal";
import RegisterWorkChangeModal from "@/components/empleados/RegisterWorkChangeModal";
import ToastNotification from "@/components/ToastNotification";
import EditInfoModal from "@/components/perfil/EditInfoModal";
import { Contrato, TIPO_CONTRATO_LABEL, obtenerContratosPorEmpleado } from "@/services/contratosService";
import { listarEvaluacionesPorEmpleado } from "@/services/evaluacionService";
import {
  crearEventoCarrera,
  listarHistorialPorEmpleado,
} from "@/services/carreraHistorialService";
import type {
  CareerHistoryDto,
  CareerTypeChange,
  PerformanceEvaluationDto,
} from "@/types/api/career";
import { PerformanceMain, PerformanceSidebar } from "@/components/perfil/PerformanceTab";

interface Props {
  empleado: Empleado;
  onEstadoCambiado: (nuevoEstado: EstadoEmpleado, motivo: string) => void;
  /** Se invoca cuando algún cambio (cargo/manager) requiere recargar el empleado. */
  onEmpleadoActualizado?: () => Promise<void> | void;
}

const CONFIG_ESTADO: Record<
  EstadoEmpleado,
  { etiqueta: string; trackColor: string; thumbPosition: string; labelColor: string }
> = {
  ACTIVO: {
    etiqueta: "Active",
    trackColor: "bg-emerald-500",
    thumbPosition: "translate-x-0",
    labelColor: "text-emerald-500",
  },
  SUSPENDIDO: {
    etiqueta: "Suspended",
    trackColor: "bg-amber-400",
    thumbPosition: "translate-x-[12px]",
    labelColor: "text-amber-500",
  },
  RETIRADO: {
    etiqueta: "Retired",
    trackColor: "bg-rose-500",
    thumbPosition: "translate-x-[22px]",
    labelColor: "text-rose-500",
  },
  INACTIVO: {
    etiqueta: "Inactive",
    trackColor: "bg-slate-400",
    thumbPosition: "translate-x-[22px]",
    labelColor: "text-slate-500",
  },
  INVITADO: {
    etiqueta: "Invited",
    trackColor: "bg-sky-400",
    thumbPosition: "translate-x-0",
    labelColor: "text-sky-500",
  },
} as const;

function StatusToggle({ estado }: { estado: EstadoEmpleado }) {
  const config = CONFIG_ESTADO[estado];

  return (
    <div className="flex items-center gap-2.5">
      <span className="text-xs font-medium text-[#8aa3ad]">Estado</span>
      <div className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${config.trackColor}`}>
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${config.thumbPosition}`}
        />
      </div>
      <span className={`text-sm font-semibold transition-colors duration-300 ${config.labelColor}`}>
        {config.etiqueta}
      </span>
    </div>
  );
}

type TabActiva = "trayectoria" | "contratos" | "desempeño" | "equipo";

// Mismos labels que usa el perfil propio (UserProfileCard) para los tipos del backend.
const CAREER_TYPE_LABEL: Record<string, string> = {
  promotion: "Promoción",
  transfer: "Traslado",
  contract_modification: "Cambio de contrato",
  salary_change: "Cambio salarial",
  evaluation: "Evaluación",
};

// Mapeo entre los tipos UI del modal (RegisterWorkChangeModal) y los tipos
// que acepta el backend en `CreateCareerHistoryPayload.type`. Quitamos
// `modificacion_contractual` porque no se expone desde el modal — la edición
// del contrato se hace desde el módulo de Contratos directamente.
const UI_TIPO_TO_BACKEND: Record<string, CareerTypeChange> = {
  traslado: "transfer",
  ascenso: "promotion",
  cambio_salarial: "salary_change",
};

function formatCareerDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-ES", { month: "short", year: "numeric" }).toUpperCase();
}

export default function EmployeeProfileCard({ empleado, onEstadoCambiado, onEmpleadoActualizado }: Props) {
  const { authUser } = useAuth();
  const [tabActiva, setTabActiva] = useState<TabActiva>("trayectoria");
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [modalEstadoAbierto, setModalEstadoAbierto] = useState(false);
  const [modalCambioAbierto, setModalCambioAbierto] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState({ title: "", message: "" });
  const [trayectoria, setTrayectoria] = useState<CareerHistoryDto[]>([]);
  const [trayectoriaLoading, setTrayectoriaLoading] = useState(false);
  const [trayectoriaError, setTrayectoriaError] = useState<string | null>(null);
  const [subordinados, setSubordinados] = useState<Empleado[]>([]);
  const [subordinadosLoading, setSubordinadosLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Local editable state to reflect edits performed via modal
  const [nombreLocal, setNombreLocal] = useState(empleado.nombre);
  const [apellidosLocal, setApellidosLocal] = useState(empleado.apellidos);
  const [emailLocal, setEmailLocal] = useState(empleado.email);
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [toastEditVisible, setToastEditVisible] = useState(false);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [evaluaciones, setEvaluaciones] = useState<PerformanceEvaluationDto[]>([]);
  const [evaluacionesLoading, setEvaluacionesLoading] = useState(false);
  const [evaluacionesError, setEvaluacionesError] = useState<string | null>(null);

  const iniciales = `${(nombreLocal || empleado.nombre).charAt(0)}${(apellidosLocal || empleado.apellidos).charAt(0)}`.toUpperCase();

  // El backend NO guarda fecha de ingreso en la tabla `employees`. La mejor
  // aproximación es el `start_date` del contrato más antiguo del empleado; si
  // todavía no tiene contratos, no mostramos nada (evita la fecha hardcodeada
  // "Feb 2019" que estaba antes).
  const fechaIngreso = useMemo(() => {
    if (contratos.length === 0) return null;
    const fechas = contratos
      .map((c) => (c.fechaInicio ? new Date(c.fechaInicio).getTime() : NaN))
      .filter((t) => !Number.isNaN(t));
    if (fechas.length === 0) return null;
    return new Date(Math.min(...fechas));
  }, [contratos]);

  const fechaIngresoFormateada = useMemo(() => {
    if (!fechaIngreso) return null;
    return fechaIngreso
      .toLocaleDateString("es-CO", { month: "short", year: "numeric" })
      .replace(/^(\w)/, (c) => c.toUpperCase())
      .replace(/\./g, "");
  }, [fechaIngreso]);

  // Tipo de empleo real, derivado del contrato ACTIVO actual del empleado.
  // El backend no guarda "tipo de empleo" en `employees`; vive en `contracts`.
  // Si no hay contrato vigente, mostramos "Sin contrato" (transparente).
  const tipoEmpleoActual = useMemo(() => {
    const vigente = contratos.find((c) => c.estado === "ACTIVO");
    if (!vigente) return "Sin contrato vigente";
    return TIPO_CONTRATO_LABEL[vigente.tipo] ?? vigente.tipo;
  }, [contratos]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuAbierto(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let mounted = true;
    obtenerContratosPorEmpleado(empleado.id).then((data) => {
      if (!mounted) return;
      setContratos(data);
    });
    return () => { mounted = false; };
  }, [empleado.id]);

  // Trayectoria real desde el backend (mismo endpoint que usa el perfil propio).
  const fetchTrayectoria = useCallback(async () => {
    setTrayectoriaLoading(true);
    setTrayectoriaError(null);
    try {
      const data = await listarHistorialPorEmpleado(empleado.rawId, 1, 100);
      setTrayectoria(data);
    } catch {
      setTrayectoriaError("No se pudo cargar la trayectoria del empleado.");
    } finally {
      setTrayectoriaLoading(false);
    }
  }, [empleado.rawId]);

  useEffect(() => {
    fetchTrayectoria();
  }, [fetchTrayectoria]);

  // Equipo directo derivado de la jerarquía de cargos
  // (positions.parent_position_id), no de employees.id_manager. Así nunca se
  // desactualiza: al cambiar el cargo padre del empleado, la lista refleja
  // automáticamente a los nuevos subordinados sin depender de que alguien
  // actualice manualmente el campo id_manager.
  useEffect(() => {
    let mounted = true;
    if (!empleado.cargoId) {
      setSubordinados([]);
      setSubordinadosLoading(false);
      return;
    }
    setSubordinadosLoading(true);
    obtenerSubordinadosPorJerarquia(empleado.cargoId)
      .then((data) => {
        if (!mounted) return;
        // Excluimos al propio empleado del listado (caso borde donde un cargo
        // se tiene a sí mismo como padre por error de datos).
        setSubordinados(data.filter((s) => s.rawId !== empleado.rawId));
      })
      .catch(() => {
        if (mounted) setSubordinados([]);
      })
      .finally(() => {
        if (mounted) setSubordinadosLoading(false);
      });
    return () => { mounted = false; };
  }, [empleado.cargoId, empleado.rawId]);

  const trayectoriaOrdenada = useMemo(
    () =>
      [...trayectoria].sort(
        (a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime(),
      ),
    [trayectoria],
  );

  useEffect(() => {
    let mounted = true;
    setEvaluacionesLoading(true);
    setEvaluacionesError(null);
    listarEvaluacionesPorEmpleado(empleado.rawId, 1, 100)
      .then((data) => {
        if (!mounted) return;
        setEvaluaciones(data);
      })
      .catch(() => {
        if (!mounted) return;
        setEvaluacionesError("No se pudieron cargar las evaluaciones.");
      })
      .finally(() => {
        if (!mounted) return;
        setEvaluacionesLoading(false);
      });
    return () => { mounted = false; };
  }, [empleado.rawId]);

  // Acción admin: suspende al empleado vía /api/admin/suspendEmployee/:id.
  // Esta es distinta a `cambiarEstado` (que hace updateEmployee); el endpoint
  // admin bloquea la sesión Supabase del usuario también.
  const handleSuspenderAdmin = async () => {
    setMenuAbierto(false);
    const confirma = window.confirm(
      `¿Suspender la cuenta de ${empleado.nombre}? El empleado no podrá iniciar sesión hasta que un admin lo desbloquee.`,
    );
    if (!confirma) return;
    try {
      await suspenderEmpleado(empleado.rawId);
      await onEmpleadoActualizado?.();
      setToastMsg({
        title: "Empleado suspendido",
        message: `${empleado.nombre} fue suspendido. No podrá iniciar sesión.`,
      });
      setToastVisible(true);
    } catch (err) {
      const raw = err instanceof Error ? err.message : "";
      setToastMsg({
        title: "Error",
        message: raw || "No se pudo suspender al empleado.",
      });
      setToastVisible(true);
    }
  };

  // Reenvía la invitación de Supabase al correo del empleado. El backend exige
  // status='invited'; el botón se muestra solo en ese caso.
  const handleReenviarInvitacion = async () => {
    setMenuAbierto(false);
    try {
      await reenviarInvitacion(empleado.rawId);
      setToastMsg({
        title: "Invitación reenviada",
        message: `Se envió un nuevo correo de invitación a ${empleado.email}.`,
      });
      setToastVisible(true);
    } catch (err) {
      const raw = err instanceof Error ? err.message : "";
      let msg = raw || "No se pudo reenviar la invitación.";
      if (raw.toLowerCase().includes("solo se puede reenviar")) {
        msg = "Solo se puede reenviar a empleados que aún no han activado su cuenta.";
      }
      setToastMsg({ title: "Error", message: msg });
      setToastVisible(true);
    }
  };

  const handleConfirmarEstado = async (
    nuevoEstado: EstadoEmpleado,
    motivo: string,
  ) => {
    // El motivo escrito por el admin se propaga al servicio: se persiste como
    // descripción del evento en career_history para mantener trazabilidad.
    onEstadoCambiado(nuevoEstado, motivo);
    setModalEstadoAbierto(false);
    setToastMsg(
      nuevoEstado === "RETIRADO"
        ? {
            title: "Proceso de retiro completado",
            message: "El empleado fue retirado del sistema correctamente.",
          }
        : {
            title: "Estado actualizado con éxito",
            message: "El estado del empleado fue cambiado correctamente.",
          }
    );
    setToastVisible(true);
  };

  return (
    <div className="min-h-screen bg-[#f4f7f8]">
      {/* Header */}
      <div className="border-b border-[#d1dde2] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex items-start justify-between gap-8">
            <div className="flex flex-1 items-start gap-6">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-20 h-20 rounded-lg border-4 border-[#BDD5EA] bg-gradient-to-br from-[#203D47] to-[#0F1819] flex items-center justify-center text-white text-xl font-bold shadow-sm">
                  {iniciales}
                </div>
                <div
                  className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white transition-colors duration-300 ${
                    empleado.estado === "ACTIVO"
                      ? "bg-emerald-500"
                      : empleado.estado === "SUSPENDIDO"
                      ? "bg-amber-400"
                      : "bg-rose-500"
                  }`}
                />
              </div>

              {/* Info */}
              <div className="flex-1 pt-1">
                <h1 className="text-3xl font-bold text-[#0F1819]">
                    {nombreLocal} {apellidosLocal}
                </h1>
                <p className="mt-1 font-medium text-[#8aa3ad]">
                  {empleado.cargo} • {empleado.departamento}
                </p>
                <div className="mt-4 flex gap-6 text-sm text-[#8aa3ad]">
                  <span className="font-semibold text-[#203D47]">
                    {empleado.codigoEmpleado}
                  </span>
                  {fechaIngresoFormateada && (
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Ingresó {fechaIngresoFormateada}
                    </span>
                  )}
                  {empleado.ubicacion && (
                    <span className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {empleado.ubicacion}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Toggle + menú */}
            <div className="flex flex-col items-end gap-3 shrink-0">
              <StatusToggle estado={empleado.estado} />

              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuAbierto((v) => !v)}
                  className="p-2 rounded-xl hover:bg-[#f4f7f8] transition-colors"
                >
                  <MoreVertical size={18} className="text-[#8aa3ad]" />
                </button>

                {menuAbierto && (
                  <div className="absolute right-0 mt-1 bg-white border border-[#d1dde2] rounded-xl shadow-lg py-2 z-20 min-w-max">
                    <button
                      className="w-full px-4 py-2 text-sm text-[#0F1819] hover:bg-[#f4f7f8] flex items-center gap-2 transition-colors"
                      onClick={() => {
                        setMenuAbierto(false);
                        setModalEditarAbierto(true);
                      }}
                    >
                      Editar
                    </button>
                    <button
                      className="w-full px-4 py-2 text-sm text-[#0F1819] hover:bg-[#f4f7f8] flex items-center gap-2 transition-colors"
                      onClick={() => {
                        setMenuAbierto(false);
                        setModalEstadoAbierto(true);
                      }}
                    >
                      Cambiar estado
                    </button>
                    {empleado.estado === "INVITADO" && (
                      <button
                        className="w-full px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 flex items-center gap-2 transition-colors"
                        onClick={handleReenviarInvitacion}
                      >
                        Reenviar invitación
                      </button>
                    )}
                    {authUser?.isAdmin && empleado.estado !== "SUSPENDIDO" && empleado.estado !== "INVITADO" && (
                      <button
                        className="w-full px-4 py-2 text-sm text-amber-600 hover:bg-amber-50 flex items-center gap-2 transition-colors border-t border-[#f0f4f5]"
                        onClick={handleSuspenderAdmin}
                      >
                        Suspender cuenta (admin)
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#d1dde2] bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex gap-8">
            {[
              { id: "trayectoria", label: "Trayectoria", icon: "◆" },
              { id: "contratos", label: "Contratos", icon: "□" },
              { id: "desempeño", label: "Desempeño", icon: "▽" },
              // Solo mostramos "Equipo Directo" si efectivamente tiene gente a cargo.
              ...(subordinados.length > 0
                ? [{ id: "equipo", label: `Equipo Directo (${subordinados.length})`, icon: "◇" }]
                : []),
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTabActiva(tab.id as TabActiva)}
                className={`flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                  tabActiva === tab.id
                    ? "border-[#0F1819] text-[#0F1819]"
                    : "border-transparent text-[#8aa3ad] hover:text-[#0F1819]"
                }`}
              >
                <span className="text-xs">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            {tabActiva === "trayectoria" && (
              <div className="rounded-xl bg-white p-8 shadow-sm border border-[#e4ebee]">
                <div className="mb-8 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-[#0F1819]">
                    Trayectoria Profesional
                  </h2>
                  <button
                    onClick={() => setModalCambioAbierto(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-400 rounded-lg transition-colors"
                  >
                    <Plus size={13} />
                    Registrar Cambio Laboral
                  </button>
                </div>

                {trayectoriaLoading && (
                  <p className="py-6 text-center text-sm text-[#8aa3ad]">
                    Cargando trayectoria...
                  </p>
                )}
                {trayectoriaError && (
                  <p className="py-6 text-center text-sm text-rose-500">
                    {trayectoriaError}
                  </p>
                )}
                {!trayectoriaLoading && !trayectoriaError && trayectoriaOrdenada.length === 0 && (
                  <p className="py-6 text-center text-sm text-[#8aa3ad]">
                    Este empleado aún no tiene eventos registrados en su trayectoria.
                  </p>
                )}

                <div className="space-y-8">
                  {trayectoriaOrdenada.map((item, idx) => (
                    <div key={item.id ?? item.id_record ?? idx} className="flex gap-6">
                      <div className="flex shrink-0 flex-col items-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#BDD5EA] text-sm font-bold text-[#203D47] shadow-sm">
                          ●
                        </div>
                        {idx < trayectoriaOrdenada.length - 1 && (
                          <div className="mt-4 h-24 w-0.5 bg-[#d1dde2]" />
                        )}
                      </div>
                      <div className="flex-1 pb-4 pt-1">
                        <p className="text-xs font-bold uppercase tracking-wider text-[#8aa3ad]">
                          {formatCareerDate(item.event_date)} · {CAREER_TYPE_LABEL[item.type] ?? item.type}
                        </p>
                        <h3 className="mt-2 text-base font-bold text-[#0F1819]">
                          {CAREER_TYPE_LABEL[item.type] ?? "Evento de carrera"}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-[#576975]">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tabActiva === "contratos" && (
              <div className="rounded-xl bg-white p-8 shadow-sm border border-[#e4ebee]">
                <h2 className="mb-6 text-lg font-bold text-[#0F1819]">Contratos</h2>
                {contratos.length === 0 ? (
                  <p className="py-12 text-center text-[#8aa3ad]">
                    No hay contratos disponibles actualmente.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {contratos.map((contrato) => (
                      <div key={contrato.id} className="rounded-xl border border-[#e8eef0] px-4 py-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-[#0F1819]">{contrato.tipo}</p>
                            <p className="text-xs text-[#8aa3ad] mt-0.5">
                              {contrato.fechaInicio} {contrato.fechaFin ? `• ${contrato.fechaFin}` : "• Indefinido"}
                            </p>
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${contrato.estado === "ACTIVO" ? "bg-emerald-50 text-emerald-600" : contrato.estado === "RENOVADO" ? "bg-sky-50 text-sky-600" : contrato.estado === "EXPIRADO" ? "bg-rose-50 text-rose-500" : "bg-slate-100 text-slate-500"}`}>
                            {contrato.estado}
                          </span>
                        </div>
                        <p className="text-xs text-[#576975] mt-2 line-clamp-2">
                          {contrato.notas || "Sin notas registradas."}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tabActiva === "desempeño" && (
              <PerformanceMain
                evaluations={evaluaciones}
                loading={evaluacionesLoading}
                error={evaluacionesError}
              />
            )}

            {tabActiva === "equipo" && (
              <div className="rounded-xl bg-white p-6 shadow-sm border border-[#e4ebee]">
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-[#0F1819]">Equipo Directo</h2>
                  <p className="text-xs text-[#8aa3ad] mt-0.5">
                    Empleados que ocupan cargos que reportan al cargo de {empleado.nombre} ({empleado.cargo}).
                  </p>
                </div>
                {subordinadosLoading ? (
                  <p className="py-6 text-center text-sm text-[#8aa3ad]">Cargando equipo...</p>
                ) : subordinados.length === 0 ? (
                  <p className="py-6 text-center text-sm text-[#8aa3ad]">
                    Este empleado no tiene subordinados directos.
                  </p>
                ) : (
                  <ul className="divide-y divide-[#f0f4f5]">
                    {subordinados.map((s) => {
                      const iniciales = `${s.nombre.charAt(0)}${s.apellidos.charAt(0)}`.toUpperCase();
                      return (
                        <li key={s.id} className="flex items-center gap-3 py-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#203D47] to-[#0F1819] flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {iniciales}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#0F1819] truncate">
                              {s.nombre} {s.apellidos}
                            </p>
                            <p className="text-xs text-[#8aa3ad] truncate">
                              {s.cargo}
                              {s.departamento ? ` · ${s.departamento}` : ""}
                            </p>
                          </div>
                          <a
                            href={`/dashboard/empleados/${s.id}`}
                            className="text-xs font-semibold text-emerald-600 hover:text-emerald-500 shrink-0"
                          >
                            Ver perfil →
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {tabActiva === "desempeño" ? (
              <PerformanceSidebar
                evaluations={evaluaciones}
                loading={evaluacionesLoading}
                error={evaluacionesError}
              />
            ) : (
              <div className="rounded-xl bg-white p-6 shadow-sm border border-[#e4ebee]">
              <div className="mb-6 flex items-center gap-2 border-b border-[#f0f4f5] pb-4">
                <span className="text-lg">📋</span>
                <h3 className="font-bold text-[#0F1819]">Información Personal</h3>
              </div>
              <div className="space-y-5 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#8aa3ad]">Correo</p>
                        <p className="break-words text-xs font-medium text-[#0F1819]">{emailLocal}</p>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#8aa3ad]">Tipo de contrato</p>
                    <p className="text-xs font-medium text-[#0F1819]">{tipoEmpleoActual}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#8aa3ad]">Cargo</p>
                    <p className="text-xs font-medium text-[#0F1819]">{empleado.cargo}</p>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#8aa3ad]">Departamento</p>
                    <p className="text-xs font-medium text-[#0F1819]">{empleado.departamento}</p>
                  </div>
                </div>
                <div className="border-t border-[#f0f4f5] pt-2">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#8aa3ad]">Reporta a</p>
                  <p className="text-xs font-medium text-[#0F1819]">
                    {empleado.superiorEmpleadoNombre && empleado.cargoSuperiorNombre
                      ? `${empleado.superiorEmpleadoNombre} — ${empleado.cargoSuperiorNombre}`
                      : empleado.cargoSuperiorNombre
                        ? empleado.cargoSuperiorNombre
                        : "—"}
                  </p>
                </div>
              </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal estado */}
      <ChangeStatusModal
        isOpen={modalEstadoAbierto}
        estadoActual={empleado.estado}
        onCerrar={() => setModalEstadoAbierto(false)}
        onConfirmar={handleConfirmarEstado}
      />

      {/* Modal registro de cambio laboral — persiste vía POST /create-career-history. */}
      <RegisterWorkChangeModal
        isOpen={modalCambioAbierto}
        onCerrar={() => setModalCambioAbierto(false)}
        salarioBaseCargo={empleado.salarioBaseCargo}
        cargoActualNombre={empleado.cargo}
        cargoSuperiorId={empleado.cargoSuperiorId}
        cargoSuperiorNombre={empleado.cargoSuperiorNombre}
        onGuardar={async (datos) => {
          if (datos.tipo === "") return;

          const backendType = UI_TIPO_TO_BACKEND[datos.tipo];
          if (!backendType) {
            setToastMsg({
              title: "Tipo de cambio no soportado",
              message: "El backend no acepta este tipo de evento de carrera.",
            });
            setToastVisible(true);
            return;
          }

          // El backend exige `description` y `event_date`. Para aumentos
          // salariales prefijamos el porcentaje y, si tenemos el salario base
          // del cargo, también el monto estimado nuevo — todo en el texto del
          // evento, porque el backend no tiene un campo estructurado de salario
          // por empleado.
          let description = datos.justificacion.trim();
          if (datos.tipo === "cambio_salarial") {
            const pct = parseFloat(datos.porcentajeAjuste) || 0;
            const base = empleado.salarioBaseCargo ?? 0;
            const nuevo = base > 0 ? Math.round(base * (1 + pct / 100)) : 0;
            const montoTxt = nuevo > 0 ? ` ≈ COP ${nuevo.toLocaleString("es-CO")}` : "";
            description = `[+${datos.porcentajeAjuste}%${montoTxt}] ${description}`;
          }

          try {
            // 1) Registra el evento en career_history (trayectoria visible).
            await crearEventoCarrera({
              description,
              event_date: datos.fechaEfectiva,
              type: backendType,
              id_employee: empleado.rawId,
            });

            // 2) Si el cambio implica un nuevo cargo, aplicamos el cambio REAL
            //    vía updateEmployee. Casos:
            //    - Transfer: cargo destino lo elige el admin (datos.nuevaPosicion).
            //      Llega como string "POS-00012" (el `id` de Position en UI),
            //      hay que parsear quitándole el prefijo.
            //    - Promotion: cargo destino es SIEMPRE el cargo padre del actual
            //      (empleado.cargoSuperiorId). El admin no lo elige; ya es number.
            //    El backend además autogenera otro evento en career_history al
            //    detectar el cambio de id_position (esperado, lo conversamos).
            let cargoActualizado = false;
            let nuevoIdPosition: number | null = null;
            if (datos.tipo === "traslado" && datos.nuevaPosicion) {
              const raw = datos.nuevaPosicion.startsWith("POS-")
                ? datos.nuevaPosicion.slice(4)
                : datos.nuevaPosicion;
              const n = Number(raw);
              if (!Number.isNaN(n) && n > 0 && n !== empleado.cargoId) {
                nuevoIdPosition = n;
              }
            } else if (datos.tipo === "ascenso" && empleado.cargoSuperiorId) {
              if (empleado.cargoSuperiorId !== empleado.cargoId) {
                nuevoIdPosition = empleado.cargoSuperiorId;
              }
            }

            if (nuevoIdPosition !== null) {
              await actualizarEmpleado(empleado.rawId, {
                id_employee: empleado.rawId,
                status: statusToBackend(empleado.estado),
                id_position: nuevoIdPosition,
              });
              cargoActualizado = true;
            }

            setModalCambioAbierto(false);
            await fetchTrayectoria();
            // Recarga el empleado en el page padre si hubo cambio estructural,
            // para que cargo/departamento del header se actualicen sin F5.
            if (cargoActualizado) {
              await onEmpleadoActualizado?.();
            }
            setToastMsg({
              title: cargoActualizado
                ? "Cambio laboral aplicado"
                : "Cambio laboral registrado",
              message: cargoActualizado
                ? "Se actualizó el cargo del empleado y se añadió el evento a la trayectoria."
                : "El evento se añadió a la trayectoria del empleado.",
            });
            setToastVisible(true);
          } catch (err) {
            const msg = err instanceof Error ? err.message : "No se pudo registrar el cambio laboral.";
            setToastMsg({ title: "Error", message: msg });
            setToastVisible(true);
          }
        }}
      />

      {/* Edit Info Modal — la edición de otro empleado por un admin va por
          /employees/updateEmployee (otra sección, distinto endpoint). Este
          modal solo permite editar edad/foto; lo conservamos para mostrar la
          info actual del empleado. La persistencia aquí se conectará cuando
          atendamos la sección de empleados. */}
      <EditInfoModal
        isOpen={modalEditarAbierto}
        onClose={() => setModalEditarAbierto(false)}
        readOnly={{
          fullName: `${nombreLocal} ${apellidosLocal}`.trim(),
          emailAddress: emailLocal,
        }}
        initialValues={{ edad: null, currentPhotoUrl: "" }}
        onSave={async () => {
          setModalEditarAbierto(false);
          setToastEditVisible(true);
        }}
      />

      {/* Toast */}
      <ToastNotification
        isVisible={toastVisible}
        onClose={() => setToastVisible(false)}
        title={toastMsg.title}
        message={toastMsg.message}
      />

      <ToastNotification
        isVisible={toastEditVisible}
        onClose={() => setToastEditVisible(false)}
        title="Información actualizada"
        message="Los datos del empleado fueron actualizados correctamente."
      />
    </div>
  );
}
