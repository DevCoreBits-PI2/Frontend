// components/areas/positions/ViewPositionModal.tsx
"use client";

import { useEffect, useState } from "react";
import { X, Briefcase, Users, GitBranch, Activity, Building2, FileText, DollarSign, Hash, RotateCcw } from "lucide-react";
import { Position, editarPosicion, obtenerPosicionPorId } from "@/services/positionsService";
import { LucideIcon } from "lucide-react";
import { Area } from "@/services/areasService";

interface ViewPositionModalProps {
  positionId: string | null;
  fallback: Position | null;
  areas: Area[];
  isOpen: boolean;
  onCerrar: () => void;
  /** Se invoca tras una reactivación exitosa, para que el listado recargue. */
  onReactivada?: (position: Position) => void;
}

const BADGE_ESTADO: Record<string, string> = {
  Active:   "bg-emerald-100 text-emerald-700",
  Inactive: "bg-gray-100 text-gray-600",
};

interface FilaDetalleProps {
  icono: LucideIcon;
  etiqueta: string;
  valor: string | number;
}

function FilaDetalle({ icono: Icono, etiqueta, valor }: FilaDetalleProps) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-[#f0f4f5] last:border-0">
      <div className="w-8 h-8 rounded-lg bg-[#f4f7f8] flex items-center justify-center shrink-0">
        <Icono size={15} className="text-[#203D47]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-widest text-[#8aa3ad] font-semibold">
          {etiqueta}
        </p>
        <p className="text-sm font-medium text-[#0F1819] mt-0.5">{valor}</p>
      </div>
    </div>
  );
}

export default function ViewPositionModal({
  positionId,
  fallback,
  areas,
  isOpen,
  onCerrar,
  onReactivada,
}: ViewPositionModalProps) {
  const [position, setPosition] = useState<Position | null>(fallback);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reactivating, setReactivating] = useState(false);
  const [reactivateError, setReactivateError] = useState<string | null>(null);

  const handleReactivate = async () => {
    if (!position) return;
    setReactivateError(null);
    setReactivating(true);
    try {
      const updated = await editarPosicion(position.id, { estado: "Active" });
      setPosition(updated);
      onReactivada?.(updated);
    } catch (err) {
      setReactivateError(
        err instanceof Error ? err.message : "No se pudo reactivar la posición.",
      );
    } finally {
      setReactivating(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !positionId) return;

    let cancelado = false;
    setPosition(fallback);
    setLoading(true);
    setError(null);

    obtenerPosicionPorId(positionId)
      .then((p) => { if (!cancelado) setPosition(p); })
      .catch(() => { if (!cancelado) setError("No se pudieron obtener los detalles actualizados."); })
      .finally(() => { if (!cancelado) setLoading(false); });

    return () => { cancelado = true; };
  }, [isOpen, positionId, fallback]);

  if (!isOpen || !position) return null;

  const nombreArea =
    position.areaNombre ||
    areas.find((a) => String(a.id) === String(position.areaIdNumber))?.nombre ||
    "Sin área";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between px-6 py-5 border-b border-[#f0f4f5]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#203D47]/10 flex items-center justify-center shrink-0">
              <Briefcase size={16} className="text-[#203D47]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#0F1819]">{position.nombre}</h2>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${BADGE_ESTADO[position.estado]}`}>
                {position.estado === "Active" ? "Activa" : "Inactiva"}
              </span>
            </div>
          </div>
          <button
            onClick={onCerrar}
            className="p-1.5 text-[#8aa3ad] hover:text-[#0F1819] hover:bg-[#f4f7f8] rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {loading && (
          <div className="px-6 py-3 text-xs text-[#8aa3ad]">Refrescando datos...</div>
        )}
        {error && (
          <div className="px-6 py-3 text-xs text-amber-600">{error}</div>
        )}

        <div className="px-6 pt-5 pb-2">
          <p className="text-[10px] uppercase tracking-widest text-[#8aa3ad] font-semibold mb-1">
            Identificador
          </p>
          <p className="text-sm font-mono text-[#203D47]">{position.id}</p>
        </div>

        <div className="px-6 py-2">
          <FilaDetalle
            icono={Building2}
            etiqueta="Área"
            valor={nombreArea}
          />
          <FilaDetalle
            icono={GitBranch}
            etiqueta="Posición Superior"
            valor={position.posicionSuperior ?? "Sin posición superior"}
          />
          <FilaDetalle
            icono={FileText}
            etiqueta="Descripción"
            valor={position.description || "—"}
          />
          <FilaDetalle
            icono={Hash}
            etiqueta="Vacantes definidas"
            valor={position.vacancies}
          />
          <FilaDetalle
            icono={Users}
            etiqueta="Empleados asignados"
            valor={position.empleados.length}
          />
          <FilaDetalle
            icono={Hash}
            etiqueta="Cupos disponibles"
            valor={(() => {
              const disponibles = position.vacancies - position.empleados.length;
              if (disponibles > 0) return disponibles;
              if (disponibles === 0) return "0 (cargo lleno)";
              return `0 (sobreasignado en ${Math.abs(disponibles)})`;
            })()}
          />
          {position.baseSalary != null && (
            <FilaDetalle
              icono={DollarSign}
              etiqueta="Salario base"
              valor={position.baseSalary.toLocaleString("es-CO")}
            />
          )}
          <FilaDetalle
            icono={Users}
            etiqueta={`Empleados asignados (${position.empleados.length})`}
            valor={
              position.empleados.length > 0
                ? position.empleados.map((e) => e.nombre).join(", ")
                : "Sin empleados asignados"
            }
          />
          <FilaDetalle
            icono={Activity}
            etiqueta="Estado"
            valor={position.estado === "Active" ? "Activa" : "Inactiva"}
          />
        </div>

        {reactivateError && (
          <div className="px-6 pt-2 text-xs text-rose-600">{reactivateError}</div>
        )}

        <div className="flex justify-end items-center gap-3 px-6 pb-6 pt-3">
          {position.estado === "Inactive" && (
            <button
              onClick={handleReactivate}
              disabled={reactivating}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-400 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <RotateCcw size={14} />
              {reactivating ? "Activando..." : "Activar posición"}
            </button>
          )}
          <button
            onClick={onCerrar}
            className="px-4 py-2 text-sm text-[#8aa3ad] hover:text-[#0F1819] border border-[#d1dde2] rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
