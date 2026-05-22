"use client";

import { useMemo } from "react";
import { Position } from "@/types/orgChart";
import {
  User, Cloud, Code2, Crown, Shield,
  ChevronDown, X, Plus, Link2Off, Save,
} from "lucide-react";

const ICON_MAP = { crown: Crown, person: User, cloud: Cloud, code: Code2, shield: Shield };
const ICON_BG: Record<string, string> = {
  person: "bg-teal-100 text-teal-600",
  cloud:  "bg-blue-100 text-blue-600",
  code:   "bg-violet-100 text-violet-600",
  shield: "bg-rose-100 text-rose-600",
  crown:  "bg-amber-100 text-amber-600",
};

const NO_SUPERIOR_VALUE = "";

interface Props {
  position: Position | null;
  allPositions: Position[];
  /** Id (string del numérico) del superior seleccionado en la UI, o "" para "sin superior". */
  superiorId: string;
  reports: string[];
  onSuperiorIdChange: (v: string) => void;
  onReportsChange: (v: string[]) => void;
  onSaveSuperior: () => void;
  superiorSaving?: boolean;
  onClose: () => void;
  onDetach?: () => void;
}

/** Devuelve el set de IDs de la posición y todos sus descendientes. */
function collectSelfAndDescendants(rootId: string, all: Position[]): Set<string> {
  const childrenByParent = new Map<string, Position[]>();
  for (const p of all) {
    if (p.parentId == null) continue;
    const list = childrenByParent.get(p.parentId) ?? [];
    list.push(p);
    childrenByParent.set(p.parentId, list);
  }
  const out = new Set<string>([rootId]);
  const stack = [rootId];
  while (stack.length) {
    const id = stack.pop()!;
    for (const child of childrenByParent.get(id) ?? []) {
      if (!out.has(child.id)) {
        out.add(child.id);
        stack.push(child.id);
      }
    }
  }
  return out;
}

export default function PositionDetailPanel({
  position,
  allPositions,
  superiorId,
  reports,
  onSuperiorIdChange,
  onReportsChange,
  onSaveSuperior,
  superiorSaving = false,
  onClose,
  onDetach,
}: Props) {
  const blockedIds = useMemo(
    () => (position ? collectSelfAndDescendants(position.id, allPositions) : new Set<string>()),
    [position, allPositions],
  );

  // Opciones válidas como nuevo superior: cualquier posición que no sea la
  // propia ni un descendiente (evita ciclos). Incluye nodos raíz.
  const superiorOptions = useMemo(
    () => (position ? allPositions.filter((p) => !blockedIds.has(p.id)) : []),
    [position, allPositions, blockedIds],
  );

  if (!position) return null;

  const Icon = ICON_MAP[position.iconType] ?? User;
  const iconColors = ICON_BG[position.iconType] ?? ICON_BG.person;

  const currentParentId = position.parentId ?? NO_SUPERIOR_VALUE;
  const isDirty = superiorId !== currentParentId;

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
          <div className="relative">
            <select
              value={superiorId}
              onChange={(e) => onSuperiorIdChange(e.target.value)}
              disabled={superiorSaving}
              className="w-full appearance-none bg-white border border-[#d1dde2] rounded-xl px-3 py-2.5 text-sm text-[#0F1819] font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer pr-8 transition-colors hover:border-[#b0c4cc] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value={NO_SUPERIOR_VALUE}>(Sin superior — posición raíz)</option>
              {superiorOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.department ? ` — ${p.department}` : ""}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8aa3ad] pointer-events-none"
            />
          </div>
          <p className="text-[11px] text-[#8aa3ad] leading-relaxed mt-2">
            Selecciona la nueva posición superior. No se listan ni la propia posición ni sus descendientes para evitar ciclos.
          </p>
          <button
            onClick={onSaveSuperior}
            disabled={!isDirty || superiorSaving}
            className="mt-3 w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={14} />
            {superiorSaving ? "Guardando..." : "Guardar superior"}
          </button>
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
