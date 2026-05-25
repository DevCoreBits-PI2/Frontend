"use client";

import React from "react";
import { Area } from "@/services/areasService";
import { Eye, Pencil, Trash2 } from "lucide-react";

interface AreaRowProps {
  area: Area;
  onVer: (area: Area) => void;
  /** Si vienen `undefined`, los botones correspondientes no se renderizan
   *  (solo lectura — rol sin permisos de gestión). */
  onEditar?: (area: Area) => void;
  onEliminar?: (id: string) => void;
}

const BADGE_ESTADO: Record<string, string> = {
  ACTIVO:     "bg-emerald-100 text-emerald-700",
  INACTIVO:   "bg-slate-100 text-slate-500",
  EN_REVISION:"bg-amber-100 text-amber-700",
};

const ETIQUETA_ESTADO: Record<string, string> = {
  ACTIVO:     "Activo",
  INACTIVO:   "Inactivo",
  EN_REVISION:"En revision",
};

export default function AreaRow({ area, onVer, onEditar, onEliminar }: AreaRowProps) {
  return (
    <tr className="border-b border-[#f0f4f5] hover:bg-[#f8fafb] transition-colors">
      {/* Nombre del area */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: area.color + "22" }}
          >
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: area.color }}
            />
          </div>
          <span className="text-sm font-medium text-[#0F1819]">{area.nombre}</span>
        </div>
      </td>

      {/* Descripcion */}
      <td className="px-5 py-3.5">
        <span className="text-sm text-[#8aa3ad] truncate max-w-[280px] block">
          {area.descripcion}
        </span>
      </td>

      {/* Posiciones */}
      <td className="px-5 py-3.5">
        <span className="text-sm text-[#0F1819] font-medium">{area.posiciones}</span>
      </td>

      {/* Estado */}
      <td className="px-5 py-3.5">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${BADGE_ESTADO[area.estado]}`}>
          {ETIQUETA_ESTADO[area.estado]}
        </span>
      </td>

      {/* Acciones */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onVer(area)}
            title="Ver detalles"
            className="p-1.5 text-[#8aa3ad] hover:text-[#203D47] hover:bg-[#ECEFF1] rounded-lg transition-colors"
          >
            <Eye size={15} />
          </button>
          {onEditar && (
            <button
              onClick={() => onEditar(area)}
              title="Editar area"
              className="p-1.5 text-[#8aa3ad] hover:text-[#203D47] hover:bg-[#ECEFF1] rounded-lg transition-colors"
            >
              <Pencil size={15} />
            </button>
          )}
          {onEliminar && (
            <button
              onClick={() => onEliminar(area.id)}
              title="Eliminar area"
              className="p-1.5 text-[#8aa3ad] hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}