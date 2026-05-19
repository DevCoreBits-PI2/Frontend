// components/areas/positions/ViewPositionModal.tsx
"use client";

import React from "react";
import { X, Briefcase, Users, GitBranch, Calendar, Activity, Building2 } from "lucide-react";
import { Position } from "@/services/positionsService";
import { LucideIcon } from "lucide-react";

interface ViewPositionModalProps {
  position: Position | null;
  isOpen: boolean;
  onCerrar: () => void;
}

const BADGE_ESTADO: Record<string, string> = {
  Active:   "bg-emerald-100 text-emerald-700",
  Drafting: "bg-amber-100 text-amber-700",
};

const AREA_NOMBRES: Record<string, string> = {
  "area-1": "Tecnología",
  "area-2": "Seguridad",
  "area-3": "Producto",
  "area-4": "Diseño",
  "area-5": "Datos",
};

// Fecha simulada — reemplazar con dato real cuando exista backend
const FECHA_CREACION_SIMULADA = "15 Mar, 2023";

interface FilaDetalleProps {
  icono: LucideIcon;
  etiqueta: string;
  valor: string | number;
}

function FilaDetalle({ icono: Icono, etiqueta, valor }: FilaDetalleProps) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-[#f0f4f5] last:border-0">
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
  position,
  isOpen,
  onCerrar,
}: ViewPositionModalProps) {
  if (!isOpen || !position) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">

        {/* Encabezado */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#f0f4f5]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#203D47]/10 flex items-center justify-center shrink-0">
              <Briefcase size={16} className="text-[#203D47]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#0F1819]">{position.nombre}</h2>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${BADGE_ESTADO[position.estado]}`}>
                {position.estado}
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

        {/* ID de la posición */}
        <div className="px-6 pt-5 pb-2">
          <p className="text-[10px] uppercase tracking-widest text-[#8aa3ad] font-semibold mb-1">
            Identificador
          </p>
          <p className="text-sm font-mono text-[#203D47]">{position.id}</p>
        </div>

        {/* Detalles */}
        <div className="px-6 py-2">
          <FilaDetalle
            icono={Building2}
            etiqueta="Área"
            valor={AREA_NOMBRES[position.areaId] ?? position.areaId}
          />
          <FilaDetalle
            icono={GitBranch}
            etiqueta="Posición Superior"
            valor={position.posicionSuperior ?? "Sin posición superior"}
          />
          <FilaDetalle
            icono={Users}
            etiqueta="Empleados asignados"
            valor={
              position.empleados.length > 0
                ? position.empleados.map((e) => e.nombre).join(", ")
                : "Sin empleados asignados"
            }
          />
          <FilaDetalle
            icono={Activity}
            etiqueta="Estado"
            valor={position.estado}
          />
          <FilaDetalle
            icono={Calendar}
            etiqueta="Fecha de creación"
            valor={FECHA_CREACION_SIMULADA}
          />
        </div>

        {/* Botón cerrar */}
        <div className="flex justify-end px-6 pb-6 pt-2">
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