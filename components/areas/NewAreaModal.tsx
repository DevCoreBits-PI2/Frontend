"use client";
import React, { useState } from "react";
import { X } from "lucide-react";
import { crearArea } from "@/services/areasService";
import { useAuth } from "@/lib/auth/AuthContext";
import toast from "react-hot-toast";

interface NewAreaModalProps {
  onCerrar: () => void;
  onCreada: () => void;
}

export default function NewAreaModal({ onCerrar, onCreada }: NewAreaModalProps) {
  const { authUser } = useAuth();
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState<{ nombre?: string; descripcion?: string }>({});

  const validar = () => {
    const nuevosErrores: typeof errores = {};
    if (!nombre.trim()) nuevosErrores.nombre = "El nombre del area es obligatorio.";
    if (!descripcion.trim()) nuevosErrores.descripcion = "La descripcion es obligatoria.";
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const manejarGuardar = async () => {
    if (!validar()) return;
    // El backend exige `id_administrator` (FK a la tabla `administrators`).
    // Si el usuario es admin, usamos el adminId resuelto vía GET /api/admin/:id.
    // Como fallback (HT empleado actuando), usamos su employeeId.
    const idAdministrator = authUser?.adminId ?? authUser?.employeeId ?? null;
    if (!idAdministrator) {
      toast.error("Tu sesión no tiene un administrador asociado para registrar el área.");
      return;
    }
    setGuardando(true);
    try {
      await crearArea({
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        posiciones: 0,
        estado: "ACTIVO",
        color: "#10B981",
        icono: "default",
        idAdministrator,
      });
      onCreada();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo crear el área.";
      toast.error(msg);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
        {/* Encabezado */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#f0f4f5]">
          <h2 className="text-base font-semibold text-[#0F1819]">Crear Nueva Area</h2>
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
              onChange={(e) => { setNombre(e.target.value); setErrores((p) => ({ ...p, nombre: undefined })); }}
              placeholder="ej. Marketing de Producto"
              className={`placeholder:text-gray-500  w-full px-3.5 py-2.5 text-sm  border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 text-[#0F1819] placeholder:text-[#c5d5db] ${
                errores.nombre ? "border-rose-400 bg-rose-50" : "border-[#d1dde2]"
              }`}
            />
            {errores.nombre && <p className="text-xs text-rose-500">{errores.nombre}</p>}
          </div>

          {/* Descripcion */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#0F1819]">Descripcion</label>
            <textarea
              value={descripcion}
              onChange={(e) => { setDescripcion(e.target.value); setErrores((p) => ({ ...p, descripcion: undefined })); }}
              placeholder="Proporciona una breve descripcion de las responsabilidades y proposito del area..."
              rows={4}
              maxLength={500}
              className={`placeholder:text-gray-500 w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 text-[#0F1819] placeholder:text-[#c5d5db] resize-none ${
                errores.descripcion ? "border-rose-400 bg-rose-50" : "border-[#d1dde2]"
              }`}
            />
            <p className="text-xs text-[#8aa3ad] text-right">{descripcion.length}/500 caracteres.</p>
            {errores.descripcion && <p className="text-xs text-rose-500">{errores.descripcion}</p>}
          </div>
        </div>

        {/* Botones */}
        <div className="flex items-center justify-end gap-3 px-6 pb-6">
          <button
            onClick={onCerrar}
            className="px-4 py-2 text-sm text-gray-700 hover:text-white border hover:bg-red-600 border-red-600 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={manejarGuardar}
            disabled={guardando}
            className="px-4 py-2 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-400 rounded-lg transition-colors disabled:opacity-60"
          >
            {guardando ? "Guardando..." : "Guardar Area"}
          </button>
        </div>
      </div>
    </div>
  );
}