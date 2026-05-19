// components/empleados/EmployeeProfileCard.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { MapPin, Calendar, MoreVertical } from "lucide-react";
import { Empleado, EstadoEmpleado } from "@/services/empleadosService";
import ChangeStatusModal from "@/components/empleados/ChangeStatusModal";
import ToastNotification from "@/components/ToastNotification";
import EditInfoModal from "@/components/perfil/EditInfoModal";
import { Contrato, obtenerContratosPorEmpleado } from "@/services/contratosService";
import { PerformanceMain, PerformanceSidebar } from "@/components/perfil/PerformanceTab";

interface Props {
  empleado: Empleado;
  onEstadoCambiado: (nuevoEstado: EstadoEmpleado) => void;
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
} as const;

function StatusToggle({ estado }: { estado: EstadoEmpleado }) {
  const config = CONFIG_ESTADO[estado];

  return (
    <div className="flex items-center gap-2.5">
      <span className="text-xs font-medium text-[#8aa3ad]">Status</span>
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

type TabActiva = "trayectoria" | "contratos" | "desempeño";

export default function EmployeeProfileCard({ empleado, onEstadoCambiado }: Props) {
  const [tabActiva, setTabActiva] = useState<TabActiva>("trayectoria");
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [modalEstadoAbierto, setModalEstadoAbierto] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState({ title: "", message: "" });
  const menuRef = useRef<HTMLDivElement>(null);

  // Local editable state to reflect edits performed via modal
  const [nombreLocal, setNombreLocal] = useState(empleado.nombre);
  const [apellidosLocal, setApellidosLocal] = useState(empleado.apellidos);
  const [emailLocal, setEmailLocal] = useState(empleado.email);
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [toastEditVisible, setToastEditVisible] = useState(false);
  const [contratos, setContratos] = useState<Contrato[]>([]);

  const iniciales = `${(nombreLocal || empleado.nombre).charAt(0)}${(apellidosLocal || empleado.apellidos).charAt(0)}`.toUpperCase();

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

  const handleConfirmarEstado = async (
    nuevoEstado: EstadoEmpleado,
    _motivo: string
  ) => {
    onEstadoCambiado(nuevoEstado);
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
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Joined Feb 2019
                  </span>
                  <span className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {empleado.ubicacion}
                  </span>
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
                <h2 className="mb-8 text-lg font-bold text-[#0F1819]">
                  Trayectoria Profesional
                </h2>
                <div className="space-y-8">
                  {[
                    {
                      fecha: "ENE 2024",
                      titulo: "Ascenso a Arquitecto Senior",
                      area: "ENGINEERING HUB",
                      descripcion:
                        "Transición a rol de liderazgo supervisando proyectos de modernización de infraestructura cloud en regiones de Norteamérica.",
                      icon: "●",
                    },
                    {
                      fecha: "JUN 2021",
                      titulo: "Traslado a División Cloud",
                      area: "INFRAESTRUCTURA ESTRATÉGICA",
                      descripcion:
                        "Movimiento departamental alineado con la transición corporativa hacia arquitectura serverless.",
                      icon: "◆",
                    },
                    {
                      fecha: "MAR 2019",
                      titulo: "Ingreso como Desarrollador Junior",
                      area: "CORE PLATFORMS",
                      descripcion:
                        "Incorporación al programa de desarrollo para graduados enfocado en mantenimiento de sistemas legados.",
                      icon: "■",
                    },
                  ].map((item, idx) => (
                    <div key={idx} className="flex gap-6">
                      <div className="flex shrink-0 flex-col items-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#BDD5EA] text-sm font-bold text-[#203D47] shadow-sm">
                          {item.icon}
                        </div>
                        {idx < 2 && (
                          <div className="mt-4 h-24 w-0.5 bg-[#d1dde2]" />
                        )}
                      </div>
                      <div className="flex-1 pb-4 pt-1">
                        <p className="text-xs font-bold uppercase tracking-wider text-[#8aa3ad]">
                          {item.fecha} · {item.area}
                        </p>
                        <h3 className="mt-2 text-base font-bold text-[#0F1819]">
                          {item.titulo}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-[#576975]">
                          {item.descripcion}
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

            {tabActiva === "desempeño" && <PerformanceMain />}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {tabActiva === "desempeño" ? (
              <PerformanceSidebar />
            ) : (
              <div className="rounded-xl bg-white p-6 shadow-sm border border-[#e4ebee]">
              <div className="mb-6 flex items-center gap-2 border-b border-[#f0f4f5] pb-4">
                <span className="text-lg">📋</span>
                <h3 className="font-bold text-[#0F1819]">Información Personal</h3>
              </div>
              <div className="space-y-5 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#8aa3ad]">Email</p>
                        <p className="break-words text-xs font-medium text-[#0F1819]">{emailLocal}</p>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#8aa3ad]">Tipo</p>
                    <p className="text-xs font-medium text-[#0F1819]">{empleado.tipoEmpleo}</p>
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
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#8aa3ad]">Ubicación</p>
                  <p className="text-xs font-medium text-[#0F1819]">{empleado.ubicacion}</p>
                </div>
              </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      <ChangeStatusModal
        isOpen={modalEstadoAbierto}
        estadoActual={empleado.estado}
        onCerrar={() => setModalEstadoAbierto(false)}
        onConfirmar={handleConfirmarEstado}
      />

      {/* Edit Info Modal */}
      <EditInfoModal
        isOpen={modalEditarAbierto}
        onClose={() => setModalEditarAbierto(false)}
        initialData={{
          fullName: `${nombreLocal} ${apellidosLocal}`.trim(),
          phoneNumber: "",
          emailAddress: emailLocal,
        }}
        onSave={async (data) => {
          // Simular actualización: actualizar estado local y mostrar toast
          const parts = data.fullName.trim().split(" ");
          setNombreLocal(parts.shift() ?? "");
          setApellidosLocal(parts.join(" ") ?? "");
          setEmailLocal(data.emailAddress);
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
