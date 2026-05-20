// components/empleados/ChangeStatusModal.tsx
"use client";

import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import { EstadoEmpleado } from "@/services/empleadosService";

interface Props {
  isOpen: boolean;
  estadoActual: EstadoEmpleado;
  onCerrar: () => void;
  onConfirmar: (nuevoEstado: EstadoEmpleado, motivo: string) => Promise<void>;
}

interface OpcionEstado {
  valor: EstadoEmpleado;
  etiqueta: string;
  descripcion: string;
}

const OPCIONES: OpcionEstado[] = [
  {
    valor: "ACTIVO",
    etiqueta: "Activo",
    descripcion: "Acceso completo a todos los sistemas internos y seguridad del edificio.",
  },
  {
    valor: "SUSPENDIDO",
    etiqueta: "Suspendido",
    descripcion: "Restricción temporal. El acceso es revocado hasta la reactivación.",
  },
  {
    valor: "RETIRADO",
    etiqueta: "Retirado",
    descripcion: "Eliminación permanente de nómina activa y acceso al sistema.",
  },
];

const ADVERTENCIAS: Partial<Record<EstadoEmpleado, string>> = {
  SUSPENDIDO:
    "Cambiar el estado a 'Suspendido' invalidará inmediatamente el código QR de acceso activo del empleado. Esta acción no se puede deshacer automáticamente.",
  RETIRADO:
    "Cambiar el estado a 'Retirado' eliminará permanentemente al empleado de la nómina activa y revocará todos los accesos al sistema.",
};

export default function ChangeStatusModal({
  isOpen,
  estadoActual,
  onCerrar,
  onConfirmar,
}: Props) {
  const [estadoSeleccionado, setEstadoSeleccionado] =
    useState<EstadoEmpleado>(estadoActual);
  const [motivo, setMotivo] = useState("");
  const [cargando, setCargando] = useState(false);

  if (!isOpen) return null;

  const advertencia = ADVERTENCIAS[estadoSeleccionado];
  const cambioRealizado = estadoSeleccionado !== estadoActual;

  const handleConfirmar = async () => {
    if (!cambioRealizado) return;
    setCargando(true);
    try {
      await onConfirmar(estadoSeleccionado, motivo);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-[#f0f4f5]">
          <div>
            <h2 className="text-base font-semibold text-[#0F1819]">
              Cambiar Estado del Empleado
            </h2>
            <p className="text-xs text-[#8aa3ad] mt-1">
              Selecciona un nuevo estado. Esta acción puede afectar el acceso al sistema.
            </p>
          </div>
          <button
            onClick={onCerrar}
            disabled={cargando}
            className="p-1.5 text-[#8aa3ad] hover:text-[#0F1819] hover:bg-[#f4f7f8] rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Opciones */}
        <div className="px-6 py-4 flex flex-col gap-3">
          {OPCIONES.map((op) => {
            const seleccionado = estadoSeleccionado === op.valor;
            const esActual = estadoActual === op.valor;
            return (
              <button
                key={op.valor}
                onClick={() => setEstadoSeleccionado(op.valor)}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border text-left transition-colors ${
                  seleccionado
                    ? "border-emerald-400 bg-emerald-50"
                    : "border-[#e4ebee] hover:bg-[#f4f7f8]"
                }`}
              >
                <div>
                  <p className="text-sm font-semibold text-[#0F1819]">
                    {op.etiqueta}
                    {esActual && (
                      <span className="ml-2 text-[10px] font-medium text-[#8aa3ad]">
                        (Actual)
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-[#8aa3ad] mt-0.5">{op.descripcion}</p>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border-2 shrink-0 ml-4 flex items-center justify-center ${
                    seleccionado
                      ? "border-emerald-500 bg-emerald-500"
                      : "border-[#c5d5db]"
                  }`}
                >
                  {seleccionado && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Motivo */}
        <div className="px-6 pb-4">
          <p className="text-xs font-semibold text-[#0F1819] mb-2">
            Motivo del cambio de estado
          </p>
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Por favor proporciona una breve explicación para la actualización de estado..."
            rows={3}
            className="w-full px-3 py-2.5 text-sm text-[#0F1819] border border-[#d1dde2] rounded-xl resize-none focus:outline-none focus:ring-1 focus:ring-emerald-400 placeholder:text-[#c5d5db]"
          />
        </div>

        {/* Advertencia */}
        {advertencia && cambioRealizado && (
          <div className="mx-6 mb-4 flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">{advertencia}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 pb-6">
          <button
            onClick={onCerrar}
            disabled={cargando}
            className="px-4 py-2 text-sm text-[#8aa3ad] hover:text-[#0F1819] border border-[#d1dde2] rounded-lg transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={!cambioRealizado || cargando}
            className="px-4 py-2 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-400 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {cargando ? "Aplicando..." : "Confirmar Cambio"}
          </button>
        </div>
      </div>
    </div>
  );
}