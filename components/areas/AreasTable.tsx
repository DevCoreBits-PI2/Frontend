"use client";

import React, { useState } from "react";
import { Area } from "@/services/areasService";
import AreaRow from "./AreaRow";
import { Search, Filter } from "lucide-react";

interface AreasTableProps {
  areas: Area[];
  onVer: (area: Area) => void;
  onEditar?: (area: Area) => void;
  onEliminar?: (id: string) => void;
  /** Si es `false`, las acciones de fila (editar / eliminar) se ocultan.
   *  Solo Admin puede gestionar áreas. */
  puedeGestionar?: boolean;
}

const ITEMS_POR_PAGINA = 6;

export default function AreasTable({
  areas,
  onVer,
  onEditar,
  onEliminar,
  puedeGestionar = true,
}: AreasTableProps) {
  const [busqueda, setBusqueda] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);

  // Filtrar por busqueda
  const areasFiltradas = areas.filter(
    (a) =>
      a.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      a.descripcion.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Paginacion
  const totalPaginas = Math.ceil(areasFiltradas.length / ITEMS_POR_PAGINA);
  const inicio = (paginaActual - 1) * ITEMS_POR_PAGINA;
  const areasPagina = areasFiltradas.slice(inicio, inicio + ITEMS_POR_PAGINA);

  const irAPagina = (pagina: number) => {
    if (pagina >= 1 && pagina <= totalPaginas) setPaginaActual(pagina);
  };

  return (
    <div className="bg-white rounded-2xl border border-[#e8eef0] overflow-hidden">
      {/* Barra de busqueda y filtros */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#f0f4f5]">
        <div className="flex items-center gap-2 flex-1 bg-[#f8fafb] border border-[#e8eef0] rounded-xl px-3.5 py-2.5">
          <Search size={14} className="text-[#8aa3ad] shrink-0" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setPaginaActual(1); }}
            placeholder="Buscar areas..."
            className="flex-1 text-sm bg-transparent outline-none text-[#0F1819] placeholder:text-[#c5d5db]"
          />
        </div>
        <button className="flex items-center gap-2 px-3.5 py-2.5 text-sm text-[#203D47] border border-[#d1dde2] rounded-xl hover:bg-[#ECEFF1] transition-colors">
          <Filter size={14} />
          Filtrar
        </button>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#f0f4f5]">
              <th className="px-5 py-3 text-left text-[10px] font-bold text-[#8aa3ad] uppercase tracking-widest">
                Nombre del Area
              </th>
              <th className="px-5 py-3 text-left text-[10px] font-bold text-[#8aa3ad] uppercase tracking-widest">
                Descripcion
              </th>
              <th className="px-5 py-3 text-left text-[10px] font-bold text-[#8aa3ad] uppercase tracking-widest">
                Posiciones
              </th>
              <th className="px-5 py-3 text-left text-[10px] font-bold text-[#8aa3ad] uppercase tracking-widest">
                Estado
              </th>
              <th className="px-5 py-3 text-left text-[10px] font-bold text-[#8aa3ad] uppercase tracking-widest">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {areasPagina.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-sm text-[#8aa3ad]">
                  No se encontraron areas con esa busqueda.
                </td>
              </tr>
            ) : (
              areasPagina.map((area) => (
                <AreaRow
                  key={area.id}
                  area={area}
                  onVer={onVer}
                  // Si el rol no puede gestionar, no pasamos los handlers.
                  // AreaRow muestra solo la acción "Ver" en ese caso.
                  onEditar={puedeGestionar ? onEditar : undefined}
                  onEliminar={puedeGestionar ? onEliminar : undefined}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginacion */}
      <div className="flex items-center justify-between px-5 py-4 border-t border-[#f0f4f5]">
        <span className="text-xs text-[#8aa3ad]">
          Mostrando {areasFiltradas.length === 0 ? 0 : inicio + 1} a{" "}
          {Math.min(inicio + ITEMS_POR_PAGINA, areasFiltradas.length)} de{" "}
          {areasFiltradas.length} registros
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => irAPagina(paginaActual - 1)}
            disabled={paginaActual === 1}
            className="px-3 py-1.5 text-xs border border-[#d1dde2] rounded-lg text-[#203D47] hover:bg-[#ECEFF1] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Anterior
          </button>
          {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pagina) => (
            <button
              key={pagina}
              onClick={() => irAPagina(pagina)}
              className={`w-8 h-8 text-xs rounded-lg transition-colors ${
                pagina === paginaActual
                  ? "bg-emerald-500 text-white font-semibold"
                  : "border border-[#d1dde2] text-[#203D47] hover:bg-[#ECEFF1]"
              }`}
            >
              {pagina}
            </button>
          ))}
          <button
            onClick={() => irAPagina(paginaActual + 1)}
            disabled={paginaActual === totalPaginas}
            className="px-3 py-1.5 text-xs border border-[#d1dde2] rounded-lg text-[#203D47] hover:bg-[#ECEFF1] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}