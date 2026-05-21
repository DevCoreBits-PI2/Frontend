"use client";

import React, { useState } from "react";
import { X, ChevronDown } from "lucide-react";
import { Area, editarArea } from "@/services/areasService";

interface EditAreaModalProps {
  area: Area;
  todasLasAreas: Area[];
  onCerrar: () => void;
  onEditada: () => void;
}

export default function EditAreaModal({ area, todasLasAreas, onCerrar, onEditada }: EditAreaModalProps) {
  const [nombre, setNombre] = useState(area.nombre);
  const [descripcion, setDescripcion] = useState(area.descripcion);
  const [areaPadreId, setAreaPadreId] = useState<string>("");
  const [activo, setActivo] = useState(area.estado === "ACTIVO");
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState<{ nombre?: string }>({});
  const isActive = activo;


  const validar = () => {
    const nuevosErrores: typeof errores = {};
    if (!nombre.trim()) nuevosErrores.nombre = "El nombre del area es obligatorio.";
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const manejarGuardar = async () => {
    if (!validar()) return;
    setGuardando(true);
    try {
      await editarArea(area.id, {
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        estado: activo ? "ACTIVO" : "INACTIVO",
      });
      onEditada();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo actualizar el área.";
      console.error(msg);
    } finally {
      setGuardando(false);
    }
  };

  const areasFiltradas = todasLasAreas.filter((a) => a.id !== area.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
        {/* Encabezado */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#f0f4f5]">
          <h2 className="text-base font-semibold text-[#0F1819]">Editar Area</h2>
          <button
            onClick={onCerrar}
            className="p-1.5 text-[#8aa3ad] hover:text-[#0F1819] hover:bg-[#f4f7f8] rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Campos */}
        <div className="px-6 py-5 flex flex-col gap-5">
          {/* Nombre */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#0F1819]">
              Nombre del Area <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => { setNombre(e.target.value); setErrores({}); }}
              className={`w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 text-[#0F1819] ${errores.nombre ? "border-rose-400 bg-rose-50" : "border-[#d1dde2]"
                }`}
            />
            {errores.nombre && <p className="text-xs text-rose-500">{errores.nombre}</p>}
          </div>

          {/* Area padre */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#0F1819]">Area Padre</label>
            <div className="relative">
              <select
                value={areaPadreId}
                onChange={(e) => setAreaPadreId(e.target.value)}
                className="w-full appearance-none px-3.5 py-2.5 text-sm border border-[#d1dde2] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 text-[#0F1819] bg-white pr-10"
              >
                <option value="">Sin area padre</option>
                {areasFiltradas.map((a) => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8aa3ad] pointer-events-none" />
            </div>
          </div>

          {/* Descripcion */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#0F1819]">Descripcion</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={4}
              className="w-full px-3.5 py-2.5 text-sm border border-[#d1dde2] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 text-[#0F1819] resize-none"
            />
          </div>

          {/* Estado toggle */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[#0F1819]">Estado</label>
            <p className="text-xs text-[#8aa3ad]">Controla si esta area es visible en la planificacion de talento.</p>
            <button
              onClick={() => setActivo(!activo)}
              className={`relative w-10 h-6 rounded-full transition-colors ${activo ? "bg-emerald-500" : "bg-[#d1dde2]"
                }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${activo ? "translate-x-4" : "translate-x-0"
                  }`}
              />
            </button>

            <span
              className={`text-sm font-medium ${isActive ? "text-emerald-600" : "text-[#8aa3ad]"
                }`}
            >
              {isActive ? "Activo" : "Inactivo"}
            </span>
          </div>
        </div>

        {/* Botones */}
        <div className="flex items-center justify-end gap-3 px-6 pb-6">
          <button
            onClick={onCerrar}
            className="px-4 py-2 text-sm text-[#8aa3ad] hover:text-[#0F1819] border border-[#d1dde2] rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={manejarGuardar}
            disabled={guardando}
            className="px-4 py-2 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-400 rounded-lg transition-colors disabled:opacity-60"
          >
            {guardando ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}