"use client";

import { Position } from "@/types/orgChart";
import {
  User, Cloud, Code2, Crown, Shield,
  ChevronDown, ArrowUpDown, X, Plus, Link2Off,
} from "lucide-react";

const ICON_MAP = { crown: Crown, person: User, cloud: Cloud, code: Code2, shield: Shield };
const ICON_BG: Record<string, string> = {
  person: "bg-teal-100 text-teal-600",
  cloud:  "bg-blue-100 text-blue-600",
  code:   "bg-violet-100 text-violet-600",
  shield: "bg-rose-100 text-rose-600",
  crown:  "bg-amber-100 text-amber-600",
};

interface Props {
  position: Position | null;
  allPositions: Position[];
  superior: string;
  reports: string[];
  onSuperiorChange: (v: string) => void;
  onReportsChange: (v: string[]) => void;
  onClose: () => void;
  onDetach?: () => void;
}

export default function PositionDetailPanel({
  position,
  allPositions,
  superior,
  reports,
  onSuperiorChange,
  onReportsChange,
  onClose,
  onDetach,
}: Props) {
  if (!position) return null;

  const Icon = ICON_MAP[position.iconType] ?? User;
  const iconColors = ICON_BG[position.iconType] ?? ICON_BG.person;

  const superiorOptions = allPositions.filter(
    (p) => p.id !== position.id && p.level < position.level
  );

  const removeReport = (name: string) =>
    onReportsChange(reports.filter((r) => r !== name));

  return (
    <div className="w-[310px] shrink-0 border-l border-[#e8eff2] flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-[#f0f4f5]">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${iconColors}`}>
              <Icon size={18} />
            </div>
            <div>
              <p className="text-[#0F1819] font-bold text-base leading-tight">{position.name}</p>
              <p className="text-[#8aa3ad] text-xs mt-0.5">
                {position.department} • Posición Nivel {position.level}
              </p>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            title="Cerrar panel"
            className="p-1.5 text-[#8aa3ad] hover:text-[#0F1819] hover:bg-[#f4f7f8] rounded-lg transition-colors shrink-0 mt-0.5"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-5 px-5 py-5 flex-1">
        {/* Superior Position */}
        <div>
          <span className="text-[10px] font-bold tracking-widest uppercase text-[#8aa3ad] block mb-2">
            Posición Superior
          </span>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <select
                value={superior}
                onChange={(e) => onSuperiorChange(e.target.value)}
                className="w-full appearance-none bg-white border border-[#d1dde2] rounded-xl px-3 py-2.5 text-sm text-[#0F1819] font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer pr-8 transition-colors hover:border-[#b0c4cc]"
              >
                {superiorOptions.length > 0
                  ? superiorOptions.map((p) => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))
                  : <option value={superior}>{superior || "—"}</option>
                }
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8aa3ad] pointer-events-none"
              />
            </div>
            <button
              title="Intercambiar posición"
              className="p-2.5 border border-[#d1dde2] rounded-xl text-[#8aa3ad] hover:text-[#0F1819] hover:border-[#b0c4cc] transition-colors"
            >
              <ArrowUpDown size={14} />
            </button>
          </div>
          <p className="text-[11px] text-[#8aa3ad] leading-relaxed mt-2">
            Cambiar la posición superior moverá automáticamente todos los reportes directos de{" "}
            <span className="text-[#4a7880] font-medium">{position.name}</span> bajo la nueva estructura.
          </p>
        </div>

        {/* Direct Reports */}
        <div>
          <span className="text-[10px] font-bold tracking-widest uppercase text-[#8aa3ad] block mb-2">
            Reportes Directos ({reports.length})
          </span>
          <div className="flex flex-wrap gap-2">
            {reports.map((name) => (
              <span
                key={name}
                className="flex items-center gap-1.5 bg-[#f4f7f8] border border-[#d1dde2] text-xs text-[#0F1819] font-medium px-2.5 py-1 rounded-lg"
              >
                {name}
                <button
                  onClick={() => removeReport(name)}
                  className="text-[#8aa3ad] hover:text-rose-500 transition-colors"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
          <button className="flex items-center gap-1 text-emerald-600 hover:text-emerald-500 text-xs font-semibold mt-2.5 transition-colors">
            <Plus size={12} />
            Agregar Reporte
          </button>
        </div>

        {/* Remove Hierarchy */}
        <div className="pt-1">
          <span className="text-sm font-semibold text-[#0F1819] block mb-1.5">
            Eliminar Jerarquía
          </span>
          <p className="text-[11px] text-[#8aa3ad] leading-relaxed mb-3">
            Desvincular esta posición de la jerarquía la convertirá en un nodo sin asignar. Todos los hijos también perderán su línea de reporte.
          </p>
          <button
            onClick={onDetach}
            className="w-full flex items-center justify-center gap-2 border border-rose-200 text-rose-500 hover:bg-rose-50 text-sm font-semibold py-2.5 rounded-xl transition-colors"
          >
            <Link2Off size={14} />
            Desvincular de Jerarquía
          </button>
        </div>
      </div>
    </div>
  );
}
