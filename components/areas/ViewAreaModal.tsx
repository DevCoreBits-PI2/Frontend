"use client";
import React from "react";
import { X, FolderKanban, Users, Briefcase, Activity } from "lucide-react";
import { Area } from "@/services/areasService";

interface ViewAreaModalProps {
  area: Area;
  onCerrar: () => void;
}

const BADGE_ESTADO: Record<string, string> = {
  ACTIVO:      "bg-emerald-100 text-emerald-700",
  INACTIVO:    "bg-slate-100 text-slate-500",
  EN_REVISION: "bg-amber-100 text-amber-700",
};

const ETIQUETA_ESTADO: Record<string, string> = {
  ACTIVO:      "Activo",
  INACTIVO:    "Inactivo",
  EN_REVISION: "En revision",
};

function FilaDetalle({ icono: Icono, etiqueta, valor }: { icono: any; etiqueta: string; valor: string | number }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-[#f0f4f5] last:border-0">
      <div className="w-8 h-8 rounded-lg bg-[#f4f7f8] flex items-center justify-center shrink-0">
        <Icono size={15} className="text-[#203D47]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-widest text-[#8aa3ad] font-semibold">{etiqueta}</p>
        <p className="text-sm font-medium text-[#0F1819] mt-0.5">{valor}</p>
      </div>
    </div>
  );
}

export default function ViewAreaModal({ area, onCerrar }: ViewAreaModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
        {/* Encabezado */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#f0f4f5]">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: area.color + "22" }}
            >
              <FolderKanban size={16} style={{ color: area.color }} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#0F1819]">{area.nombre}</h2>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${BADGE_ESTADO[area.estado]}`}>
                {ETIQUETA_ESTADO[area.estado]}
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

        {/* Descripcion */}
        <div className="px-6 pt-5 pb-2">
          <p className="text-[10px] uppercase tracking-widest text-[#8aa3ad] font-semibold mb-1">Descripcion</p>
          <p className="text-sm text-[#203D47] leading-relaxed">{area.descripcion}</p>
        </div>

        {/* Detalles */}
        <div className="px-6 py-2">
          <FilaDetalle icono={Users} etiqueta="Posiciones" valor={area.posiciones} />
          <FilaDetalle icono={Briefcase} etiqueta="Estado" valor={ETIQUETA_ESTADO[area.estado]} />
          <FilaDetalle icono={Activity} etiqueta="Identificador de color" valor={area.color.toUpperCase()} />
        </div>

        {/* Boton cerrar */}
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