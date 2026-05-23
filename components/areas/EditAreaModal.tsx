"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { Area, editarArea } from "@/services/areasService";
import { translateBackendError } from "@/lib/api/translateError";

interface EditAreaModalProps {
  area: Area;
  // `todasLasAreas` se mantiene en la firma por compatibilidad con el caller,
  // pero ya no se usa: el backend no modela jerarquía de áreas.
  todasLasAreas?: Area[];
  onCerrar: () => void;
  onEditada: () => void;
}

export default function EditAreaModal({ area, onCerrar, onEditada }: EditAreaModalProps) {
  const [nombre, setNombre] = useState(area.nombre);
  const [descripcion, setDescripcion] = useState(area.descripcion);
  const [activo, setActivo] = useState(area.estado === "ACTIVO");
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState<{ nombre?: string; descripcion?: string }>({});

  const validar = () => {
    const nuevosErrores: typeof errores = {};
    const n = nombre.trim();
    if (!n) nuevosErrores.nombre = "El nombre del área es obligatorio.";
    else if (n.length < 3) nuevosErrores.nombre = "Debe tener al menos 3 caracteres.";
    else if (n.length > 100) nuevosErrores.nombre = "No puede superar 100 caracteres.";
    const d = descripcion.trim();
    if (!d) nuevosErrores.descripcion = "La descripción es obligatoria.";
    else if (d.length < 3) nuevosErrores.descripcion = "Debe tener al menos 3 caracteres.";
    else if (d.length > 500) nuevosErrores.descripcion = "No puede superar 500 caracteres.";
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
      const raw = err instanceof Error ? err.message : "";
      toast.error(translateBackendError(raw) || "No se pudo actualizar el área.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#f0f4f5]">
          <h2 className="text-base font-semibold text-[#0F1819]">Editar Área</h2>
          <button
            onClick={onCerrar}
            className="p-1.5 text-[#8aa3ad] hover:text-[#0F1819] hover:bg-[#f4f7f8] rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#0F1819]">
              Nombre del Área <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => { setNombre(e.target.value); setErrores((p) => ({ ...p, nombre: undefined })); }}
              className={`w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 text-[#0F1819] ${
                errores.nombre ? "border-rose-400 bg-rose-50" : "border-[#d1dde2]"
              }`}
            />
            {errores.nombre && <p className="text-xs text-rose-500">{errores.nombre}</p>}
          </div>

          {/* Nota: el backend no modela jerarquía de áreas, por eso quitamos
              el selector de "área padre" que aparecía antes y no se persistía. */}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#0F1819]">
              Descripción <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => { setDescripcion(e.target.value); setErrores((p) => ({ ...p, descripcion: undefined })); }}
              rows={4}
              maxLength={500}
              className={`w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 text-[#0F1819] resize-none ${
                errores.descripcion ? "border-rose-400 bg-rose-50" : "border-[#d1dde2]"
              }`}
            />
            <p className="text-xs text-[#8aa3ad] text-right">{descripcion.length}/500 caracteres.</p>
            {errores.descripcion && <p className="text-xs text-rose-500">{errores.descripcion}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[#0F1819]">Estado</label>
            <p className="text-xs text-[#8aa3ad]">Controla si esta área es visible en la planificación de talento.</p>
            <button
              onClick={() => setActivo(!activo)}
              className={`relative w-10 h-6 rounded-full transition-colors ${activo ? "bg-emerald-500" : "bg-[#d1dde2]"}`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${activo ? "translate-x-4" : "translate-x-0"}`}
              />
            </button>
            <span className={`text-sm font-medium ${activo ? "text-emerald-600" : "text-[#8aa3ad]"}`}>
              {activo ? "Activo" : "Inactivo"}
            </span>
          </div>
        </div>

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
