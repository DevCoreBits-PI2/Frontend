"use client";

import { useState, useRef, useEffect } from "react";
import { Position } from "@/types/orgChart";
import { Crown, User, Cloud, Code2, Shield, GripVertical } from "lucide-react";

const ICON_MAP = { crown: Crown, person: User, cloud: Cloud, code: Code2, shield: Shield };
const ICON_BG: Record<string, string> = {
  person: "bg-teal-100 text-teal-600",
  cloud:  "bg-blue-100 text-blue-600",
  code:   "bg-violet-100 text-violet-600",
  shield: "bg-rose-100 text-rose-600",
  crown:  "bg-amber-100 text-amber-600",
};

// Context menu shown on non-root nodes via the grip handle
function ContextMenu({
  position,
  onEdit,
  onDetach,
}: {
  position: Position;
  onEdit?: (p: Position) => void;
  onDetach?: (p: Position) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div
      ref={ref}
      className="relative"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        title="Opciones"
        className="p-1 text-[#c5d5db] hover:text-[#8aa3ad] rounded transition-colors"
      >
        <GripVertical size={14} />
      </button>

      {open && (
        <div className="absolute right-0 top-7 z-50 bg-white rounded-xl shadow-lg border border-[#d1dde2] overflow-hidden min-w-[110px]">
          <button
            onClick={() => { setOpen(false); onEdit?.(position); }}
            className="w-full text-left px-4 py-2.5 text-sm font-bold text-[#0F1819] hover:bg-[#f4f7f8] transition-colors"
          >
            Editar
          </button>
          <div className="px-2 pb-2 pt-0.5">
            <button
              onClick={() => { setOpen(false); onDetach?.(position); }}
              className="w-full py-2 text-sm font-bold bg-rose-500 hover:bg-rose-400 text-white rounded-lg transition-colors"
            >
              Desvincular
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface OrgNodeProps {
  position: Position;
  isSelected: boolean;
  onClick: (pos: Position) => void;
  isRoot?: boolean;
  isLeaf?: boolean;
  onEdit?: (pos: Position) => void;
  onDetach?: (pos: Position) => void;
}

export default function OrgNode({
  position,
  isSelected,
  onClick,
  isRoot = false,
  isLeaf = false,
  onEdit,
  onDetach,
}: OrgNodeProps) {
  const Icon = ICON_MAP[position.iconType] ?? User;

  /* ── ROOT NODE — no context menu ── */
  if (isRoot) {
    return (
      <button
        onClick={() => onClick(position)}
        className={`relative flex flex-col rounded-2xl px-5 py-4 min-w-[220px] cursor-pointer transition-all duration-200 select-none text-left ${
          isSelected
            ? "bg-[#1E333A] ring-2 ring-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.2)]"
            : "bg-[#0F1819] hover:bg-[#1A2E35] ring-1 ring-[#203D47]"
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="w-8 h-8 rounded-lg bg-amber-400/20 flex items-center justify-center">
            <Crown size={16} className="text-amber-400" />
          </div>
          <GripVertical size={15} className="text-[#3d6370]" />
        </div>
        <span className="text-white font-bold text-base leading-tight">{position.name}</span>
        <span className="text-[#8aa3ad] text-[11px] font-semibold tracking-widest uppercase mt-0.5">
          {position.department}
        </span>
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap">
            {position.employeeCount} Reportes Directos
          </span>
          <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold px-2.5 py-1 rounded-full">
            {position.status}
          </span>
        </div>
      </button>
    );
  }

  // Solo renderizamos el menú contextual si al menos una acción está
  // disponible (Editar o Desvincular). En modo solo-lectura ambas vienen en
  // `undefined`, así el menú directamente no aparece.
  const showMenu = !!onEdit || !!onDetach;

  /* ── LEAF NODE ── */
  if (isLeaf) {
    return (
      // Wrapper div so we can place ContextMenu outside the clickable area
      <div className="relative inline-block" data-nodecard>
        <button
          onClick={() => onClick(position)}
          className={`flex flex-col rounded-xl px-4 py-3 min-w-[155px] cursor-pointer transition-all duration-200 select-none text-left ${
            showMenu ? "pr-9" : "pr-4"
          } ${
            isSelected
              ? "bg-white ring-2 ring-emerald-500 shadow-md"
              : "bg-white ring-1 ring-[#d1dde2] hover:ring-[#b0c4cc] hover:shadow-sm"
          }`}
        >
          <span className="text-sm font-semibold text-[#0F1819] leading-tight">{position.name}</span>
          <span className="text-[11px] text-[#8aa3ad] mt-0.5">
            {position.department} • {position.employeeCount} Personas
          </span>
        </button>
        {showMenu && (
          <div className="absolute top-2 right-1.5">
            <ContextMenu position={position} onEdit={onEdit} onDetach={onDetach} />
          </div>
        )}
      </div>
    );
  }

  /* ── BRANCH NODE ── */
  const iconColors = ICON_BG[position.iconType] ?? ICON_BG.person;

  return (
    <div className="relative inline-block" data-nodecard>
      <button
        onClick={() => onClick(position)}
        className={`relative flex flex-col rounded-xl p-4 min-w-[190px] cursor-pointer transition-all duration-200 select-none text-left ${
          showMenu ? "pr-10" : "pr-4"
        } ${
          isSelected
            ? "bg-white ring-2 ring-emerald-500 shadow-md"
            : "bg-white ring-1 ring-[#d1dde2] hover:ring-[#b0c4cc] hover:shadow-sm"
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${iconColors}`}>
            <Icon size={15} />
          </div>
          {/* Spacer for grip area */}
          {showMenu && <div className="w-5 h-5" />}
        </div>
        <span className="text-[#0F1819] font-semibold text-sm leading-tight">{position.name}</span>
        <span className="text-[9px] font-semibold tracking-widest uppercase text-[#8aa3ad] mt-1">
          REPORTA A:{" "}
          {position.superiorName
            ? position.superiorName.toUpperCase().replace("DEPARTAMENTO ", "DEPTO. ")
            : "—"}
        </span>
        <span className="text-[11px] text-[#8aa3ad] mt-2">{position.employeeCount} Empleados</span>
      </button>
      {showMenu && (
        <div className="absolute top-3 right-2.5">
          <ContextMenu position={position} onEdit={onEdit} onDetach={onDetach} />
        </div>
      )}
    </div>
  );
}
