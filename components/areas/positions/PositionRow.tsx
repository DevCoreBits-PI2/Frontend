"use client";

import React from "react";
import { Position } from "@/services/positionsService";
import { Eye, Pencil, Trash2 } from "lucide-react";

interface PositionRowProps {
  position: Position;
  onView?: (position: Position) => void;
  onEdit?: (position: Position) => void;
  onDelete?: (position: Position) => void;
}

const BADGE_ESTADO: Record<string, string> = {
  Active: "bg-emerald-100 text-emerald-700",
  Inactive: "bg-slate-100 text-slate-500",
};

const ETIQUETA_ESTADO: Record<string, string> = {
  Active: "Activo",
  Inactive: "Inactivo",
};

export default function PositionRow({ position, onView, onEdit, onDelete }: PositionRowProps) {
  return (
    <tr className="border-b border-[#f0f4f5] hover:bg-[#f8fafb] transition-colors">
      {/* Nombre de la posición */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-blue-100">
            <span className="text-sm font-semibold text-blue-600">
              {position.nombre.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <span className="text-sm font-medium text-[#0F1819]">{position.nombre}</span>
            <p className="text-xs text-[#8aa3ad] mt-0.5">{position.id}</p>
          </div>
        </div>
      </td>

      {/* Empleados */}
      <td className="px-5 py-3.5">
        <span className="text-sm text-[#0F1819] font-medium">
          {position.empleados ? position.empleados.length : 0}
        </span>
      </td>

      {/* Posición Superior */}
      <td className="px-5 py-3.5">
        <span className="text-sm text-[#8aa3ad] truncate max-w-[200px] block">
          {position.posicionSuperior || "—"}
        </span>
      </td>

      {/* Estado */}
      <td className="px-5 py-3.5">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${BADGE_ESTADO[position.estado] || BADGE_ESTADO.Inactive}`}>
          {ETIQUETA_ESTADO[position.estado] || position.estado}
        </span>
      </td>

      {/* Acciones */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2">
          {onView && (
            <button
              onClick={() => onView(position)}
              title="Ver detalles"
              className="p-1.5 text-[#8aa3ad] hover:text-[#203D47] hover:bg-[#ECEFF1] rounded-lg transition-colors"
            >
              <Eye size={15} />
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(position)}
              title="Editar posición"
              className="p-1.5 text-[#8aa3ad] hover:text-[#203D47] hover:bg-[#ECEFF1] rounded-lg transition-colors"
            >
              <Pencil size={15} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(position)}
              title="Eliminar posición"
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
