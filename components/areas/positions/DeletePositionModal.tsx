// components/areas/positions/DeletePositionModal.tsx
"use client";

import React, { useMemo, useState } from "react";
import { AlertTriangle, AlertCircle } from "lucide-react";
import { Position, eliminarPosicion } from "@/services/positionsService";

interface DeletePositionModalProps {
  position: Position | null;
  /** Lista completa de posiciones — se usa para detectar subordinados. */
  allPositions: Position[];
  isOpen: boolean;
  onCerrar: () => void;
  onEliminada: () => void;
  /** Callback opcional para reportar fallo (ej. el backend rechazó). */
  onError?: (msg: string) => void;
}

export default function DeletePositionModal({
  position,
  allPositions,
  isOpen,
  onCerrar,
  onEliminada,
  onError,
}: DeletePositionModalProps) {
  const [eliminando, setEliminando] = useState(false);

  // El backend rechaza eliminar si:
  //  - la posición tiene empleados activos
  //  - la posición tiene padre (es decir, es hijo de otra)
  //  - la posición tiene subordinados
  // El frontend no puede borrarlos por el usuario, pero sí avisarle de cada caso.
  const subordinados = useMemo(() => {
    if (!position) return [];
    return allPositions.filter((p) => p.posicionSuperiorId === position.rawId);
  }, [position, allPositions]);

  const tieneEmpleados = (position?.empleados.length ?? 0) > 0;
  const tienePadre = position?.posicionSuperiorId != null;
  const tieneSubordinados = subordinados.length > 0;
  const puedeEliminarse = !tieneEmpleados && !tienePadre && !tieneSubordinados;

  if (!isOpen || !position) return null;

  const manejarEliminar = async () => {
    setEliminando(true);
    try {
      await eliminarPosicion(position.id);
      onEliminada();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo eliminar la posición.";
      onError?.(msg);
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 flex flex-col gap-4">

        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <AlertTriangle size={18} className="text-amber-500" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#0F1819]">
              ¿Eliminar esta posición?
            </h2>
            <p className="text-sm text-[#8aa3ad] mt-1 leading-relaxed">
              Estás a punto de eliminar{" "}
              <span className="font-semibold text-[#0F1819]">{position.nombre}</span>.
              Esta acción no se puede deshacer.
            </p>
          </div>
        </div>

        {tieneEmpleados && (
          <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
            <AlertCircle size={15} className="text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-rose-600">
                Hay {position.empleados.length} empleado(s) en esta posición.
              </p>
              <p className="text-xs text-rose-400 mt-0.5">
                Reasigna o retira a los empleados antes de eliminarla.
              </p>
            </div>
          </div>
        )}

        {tienePadre && (
          <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
            <AlertCircle size={15} className="text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-rose-600">
                Esta posición depende de {position.posicionSuperior}.
              </p>
              <p className="text-xs text-rose-400 mt-0.5">
                Solo las posiciones raíz (sin posición superior) pueden eliminarse.
              </p>
            </div>
          </div>
        )}

        {tieneSubordinados && (
          <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
            <AlertCircle size={15} className="text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-rose-600">
                Tiene {subordinados.length} posición(es) subordinada(s).
              </p>
              <p className="text-xs text-rose-400 mt-0.5">
                Reasigna a estas posiciones a otra superior antes de eliminar:
                {" "}
                <span className="italic">{subordinados.map((p) => p.nombre).join(", ")}</span>
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            onClick={onCerrar}
            className="px-4 py-2 text-sm text-[#8aa3ad] hover:text-[#0F1819] border border-[#d1dde2] rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={manejarEliminar}
            disabled={eliminando || !puedeEliminarse}
            title={!puedeEliminarse ? "Resuelve los bloqueos listados arriba antes de eliminar." : undefined}
            className="px-4 py-2 text-sm font-semibold text-white bg-rose-500 hover:bg-rose-400 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {eliminando ? "Eliminando..." : "Eliminar Posición"}
          </button>
        </div>

      </div>
    </div>
  );
}
