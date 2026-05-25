// components/contracts/ContractFilters.tsx
"use client";

import { Search, X } from "lucide-react";
import { FiltrosContratos } from "@/types/contract";

interface Props {
  filtros: FiltrosContratos;
  busqueda: string;
  onFiltroChange: (key: keyof FiltrosContratos, value: string) => void;
  onBusquedaChange: (value: string) => void;
  onLimpiar: () => void;
}

const OPCIONES_ESTADO = ["Todos", "Activo", "Vencido", "Renovado", "Anulado"];
const OPCIONES_TIPO = ["Todos", "Término Fijo", "Término Indefinido", "Servicio", "Pasantía"];
const OPCIONES_AREA = ["Todas", "Finanzas", "Operaciones", "Ingeniería", "RRHH", "Analítica", "Legal"];

export default function ContractFilters({
  filtros,
  busqueda,
  onFiltroChange,
  onBusquedaChange,
  onLimpiar,
}: Props) {
  return (
    <div className="bg-white rounded-xl border border-[#e4ebee] px-5 py-4 mb-4">
      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-[#8aa3ad]">
          <span className="font-medium text-[#0F1819]">Estado:</span>
          <select
            value={filtros.estado}
            onChange={(e) => onFiltroChange("estado", e.target.value)}
            className="border border-[#d1dde2] rounded-lg px-2 py-1.5 text-xs text-[#0F1819] bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
          >
            {OPCIONES_ESTADO.map((op) => <option key={op}>{op}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="font-medium text-[#0F1819]">Tipo:</span>
          <select
            value={filtros.tipo}
            onChange={(e) => onFiltroChange("tipo", e.target.value)}
            className="border border-[#d1dde2] rounded-lg px-2 py-1.5 text-xs text-[#0F1819] bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
          >
            {OPCIONES_TIPO.map((op) => <option key={op}>{op}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="font-medium text-[#0F1819]">Área:</span>
          <select
            value={filtros.area}
            onChange={(e) => onFiltroChange("area", e.target.value)}
            className="border border-[#d1dde2] rounded-lg px-2 py-1.5 text-xs text-[#0F1819] bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
          >
            {OPCIONES_AREA.map((op) => <option key={op}>{op}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="font-medium text-[#0F1819]">Rango:</span>
          <select
            value={filtros.rango}
            onChange={(e) => onFiltroChange("rango", e.target.value)}
            className="border border-[#d1dde2] rounded-lg px-2 py-1.5 text-xs text-[#0F1819] bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
          >
            <option value="">Seleccionar periodo</option>
            <option value="7">Últimos 7 días</option>
            <option value="30">Últimos 30 días</option>
            <option value="90">Últimos 90 días</option>
          </select>
        </div>

        <button
          onClick={onLimpiar}
          className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-500 font-medium ml-auto transition-colors"
        >
          <X size={12} />
          Limpiar filtros
        </button>
      </div>

      {/* Buscador — debajo de filtros, antes de tabla */}
      <div className="mt-3 flex items-center gap-2 bg-[#f4f7f8] rounded-lg px-3 py-2 border border-[#d1dde2]">
        <Search size={13} className="text-[#8aa3ad] shrink-0" />
        <input
          type="text"
          placeholder="Buscar por empleado, ID o área..."
          value={busqueda}
          onChange={(e) => onBusquedaChange(e.target.value)}
          className="flex-1 bg-transparent text-xs text-[#0F1819] placeholder-[#8aa3ad] focus:outline-none"
        />
      </div>
    </div>
  );
}