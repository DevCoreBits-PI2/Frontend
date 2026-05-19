// components/empleados/EmployeeProfileCard.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { MapPin, Calendar, MoreVertical, Plus } from "lucide-react";
import { Empleado, EstadoEmpleado } from "@/services/empleadosService";
import ChangeStatusModal from "@/components/empleados/ChangeStatusModal";
import RegisterWorkChangeModal from "@/components/empleados/RegisterWorkChangeModal";
import ToastNotification from "@/components/ToastNotification";

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
    trackColor: "bg-gray-300",
    thumbPosition: "translate-x-[36px]",
    labelColor: "text-gray-400",
  },
} as const;

// Toggle visual — solo representación, no clickeable
function StatusToggle({ estado }: { estado: EstadoEmpleado }) {
  const config = CONFIG_ESTADO[estado];

  return (
    <div className="flex items-center gap-2.5">
      <span className="text-xs font-medium text-[#8aa3ad]">Status</span>
      {/* Track */}
      <div
        className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${config.trackColor}`}
      >
        {/* Thumb */}
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
  const [modalCambioAbierto, setModalCambioAbierto] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const iniciales = `${empleado.nombre.charAt(0)}${empleado.apellidos.charAt(0)}`.toUpperCase();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuAbierto(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleConfirmarEstado = async (
    nuevoEstado: EstadoEmpleado,
    _motivo: string
  ) => {
    onEstadoCambiado(nuevoEstado);
    setModalEstadoAbierto(false);
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
                      : "bg-gray-300"
                  }`}
                />
              </div>

              {/* Info */}
              <div className="flex-1 pt-1">
                <h1 className="text-3xl font-bold text-[#0F1819]">
                  {empleado.nombre} {empleado.apellidos}
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

            {/* Toggle visual + menú */}
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
                      onClick={() => setMenuAbierto(false)}
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
                <div className="mb-8 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-[#0F1819]">
                    Trayectoria Profesional
                  </h2>
                  <button
                    onClick={() => setModalCambioAbierto(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-400 rounded-lg transition-colors"
                  >
                    <Plus size={13} />
                    Register Work Change
                  </button>
                </div>
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
                <p className="py-12 text-center text-[#8aa3ad]">
                  No hay contratos disponibles actualmente.
                </p>
              </div>
            )}

            {tabActiva === "desempeño" && (
              <div className="rounded-xl bg-white p-8 shadow-sm border border-[#e4ebee]">
                <h2 className="mb-6 text-lg font-bold text-[#0F1819]">Desempeño</h2>
                <p className="py-12 text-center text-[#8aa3ad]">
                  No hay datos de desempeño disponibles actualmente.
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="rounded-xl bg-white p-6 shadow-sm border border-[#e4ebee]">
              <div className="mb-6 flex items-center gap-2 border-b border-[#f0f4f5] pb-4">
                <span className="text-lg">📋</span>
                <h3 className="font-bold text-[#0F1819]">Información Personal</h3>
              </div>
              <div className="space-y-5 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#8aa3ad]">Email</p>
                    <p className="break-words text-xs font-medium text-[#0F1819]">{empleado.email}</p>
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

            {/* Digital pass */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#0F1819] via-[#203D47] to-[#1E333A] p-6 text-white shadow-lg">
              <div className="absolute -right-10 -top-10 h-20 w-20 rounded-full bg-white/5" />
              <div className="absolute -bottom-8 -left-8 h-16 w-16 rounded-full bg-white/5" />
              <div className="relative z-10">
                <div className="mb-6 text-right">
                  <span className="text-xs font-semibold tracking-wider opacity-60">
                    EMPLOYEE DIGITAL PASS
                  </span>
                </div>
                <div className="mb-6 flex h-32 items-center justify-center rounded-lg bg-white p-4 shadow-lg">
                  <div className="grid grid-cols-3 gap-1 p-3">
                    {[...Array(9)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 w-2 rounded-sm ${
                          [0, 2, 4, 6, 8].includes(i) ? "bg-[#0F1819]" : "bg-[#ECEFF1]"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="border-t border-white/20 pt-4 text-center">
                  <p className="text-base font-bold uppercase tracking-wide">
                    {empleado.nombre} {empleado.apellidos}
                  </p>
                  <p className="mt-2 text-xs font-medium opacity-60">
                    ID {empleado.codigoEmpleado}
                  </p>
                </div>
              </div>
            </div>
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

      {/* Modal registro de cambio laboral */}
      <RegisterWorkChangeModal
        isOpen={modalCambioAbierto}
        onCerrar={() => setModalCambioAbierto(false)}
        onGuardar={async (_datos) => {
          setModalCambioAbierto(false);
          setToastVisible(true);
        }}
      />

      {/* Toast */}
      <ToastNotification
        isVisible={toastVisible}
        onClose={() => setToastVisible(false)}
        title="Estado actualizado con éxito"
        message="El estado del empleado fue cambiado correctamente."
      />
    </div>
  );
}