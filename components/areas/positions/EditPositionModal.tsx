"use client";

import { useState, useEffect } from "react";
import { X, Briefcase, Building2, GitBranch, BadgeCheck } from "lucide-react";
import { Position, editarPosicion } from "@/services/positionsService";

interface EditPositionModalProps {
  isOpen: boolean;
  position: Position | null;
  onClose: () => void;
  onSuccess?: (position: Position) => void;
}

export default function EditPositionModal({
  isOpen,
  position,
  onClose,
  onSuccess,
}: EditPositionModalProps) {
  const [nombre, setNombre] = useState("");
  const [posicionSuperior, setPosicionSuperior] = useState("");
  const [areaId, setAreaId] = useState("");
  const [estado, setEstado] = useState<"Active" | "Drafting">("Active");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (position) {
      setNombre(position.nombre);
      setPosicionSuperior(position.posicionSuperior || "");
      setAreaId(position.areaId);
      setEstado(position.estado);
      setError("");
    }
  }, [position, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!position) throw new Error("No position selected");
      if (!nombre.trim()) {
        throw new Error("El nombre de la posición es obligatorio.");
      }

      const posicionActualizada = await editarPosicion(position.id, {
        nombre: nombre.trim(),
        posicionSuperior: posicionSuperior || null,
        estado,
        areaId,
      });

      onSuccess?.(posicionActualizada);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar la posición.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !position) return null;

  const inputClass = (hasError?: boolean) =>
    `w-full rounded-lg border px-4 py-2.5 text-sm text-[#0F1819] outline-none transition bg-[#f8fafb] placeholder:text-[#8aa3ad] focus:ring-2 focus:ring-[#2ECC71]/25 focus:border-[#2ECC71] ${
      hasError ? "border-red-400 bg-red-50" : "border-[#e8eef0]"
    }`;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />

      <div className="relative z-50 w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl mx-4">
        <div className="flex items-center gap-3 border-b border-[#edf2f3] px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0F1819] text-white">
            <Briefcase size={18} />
          </div>
          <div>
            <p className="text-sm font-bold text-[#0F1819]">Editar posición</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto p-1.5 text-[#8aa3ad] hover:text-[#0F1819] hover:bg-[#f4f7f8] rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-widest text-[#8aa3ad]">
              Nombre de posición *
            </label>
            <div className="relative">
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className={inputClass(!!error)}
                disabled={loading}
                placeholder="Senior Architect"
              />
              <Building2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8aa3ad]" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-widest text-[#8aa3ad]">
              Posición superior
            </label>
            <div className="relative">
              <input
                type="text"
                value={posicionSuperior}
                onChange={(e) => setPosicionSuperior(e.target.value)}
                className={inputClass()}
                disabled={loading}
                placeholder="Engineering Manager"
              />
              <GitBranch size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8aa3ad]" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-widest text-[#8aa3ad]">
              Estado
            </label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as "Active" | "Drafting")}
              className={inputClass()}
              disabled={loading}
            >
              <option value="Active">Active</option>
              <option value="Drafting">Drafting</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-widest text-[#8aa3ad]">
              Área
            </label>
            <select
              value={areaId}
              onChange={(e) => setAreaId(e.target.value)}
              className={inputClass()}
              disabled={loading}
            >
              <option value="area-1">Tecnología</option>
              <option value="area-2">Seguridad</option>
              <option value="area-3">Producto</option>
              <option value="area-4">Diseño</option>
              <option value="area-5">Datos</option>
            </select>
          </div>

          {error && <div className="text-red-600 text-sm font-medium">{error}</div>}

          <div className="mt-1 flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg px-4 py-2 text-sm font-medium text-[#203D47] hover:bg-[#f4f7f8] disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-[#0F1819] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#203D47] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
