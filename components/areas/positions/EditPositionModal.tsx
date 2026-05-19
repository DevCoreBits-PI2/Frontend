"use client";

import { useState, useEffect } from "react";
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
    }
  }, [position]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!position) throw new Error("No position selected");
      if (!nombre.trim()) {
        throw new Error("Position name is required");
      }

      const posicionActualizada = await editarPosicion(position.id, {
        nombre,
        posicionSuperior: posicionSuperior || null,
        estado,
        areaId,
      });

      onSuccess?.(posicionActualizada);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error updating position");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !position) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-xl p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-[#0F1819] mb-6">Edit Position</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-[#203D47] mb-2">
              Position Name *
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-4 py-2 border border-[#BDD5EA] rounded bg-[#ECEFF1] focus:bg-white focus:outline-none focus:border-[#2ECC71] text-[#0F1819] text-sm"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#203D47] mb-2">
              Superior Position
            </label>
            <input
              type="text"
              value={posicionSuperior}
              onChange={(e) => setPosicionSuperior(e.target.value)}
              className="w-full px-4 py-2 border border-[#BDD5EA] rounded bg-[#ECEFF1] focus:bg-white focus:outline-none focus:border-[#2ECC71] text-[#0F1819] text-sm"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#203D47] mb-2">
              Status
            </label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as "Active" | "Drafting")}
              className="w-full px-4 py-2 border border-[#BDD5EA] rounded bg-[#ECEFF1] focus:bg-white focus:outline-none focus:border-[#2ECC71] text-[#0F1819] text-sm"
              disabled={loading}
            >
              <option value="Active">Active</option>
              <option value="Drafting">Drafting</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#203D47] mb-2">
              Area
            </label>
            <select
              value={areaId}
              onChange={(e) => setAreaId(e.target.value)}
              className="w-full px-4 py-2 border border-[#BDD5EA] rounded bg-[#ECEFF1] focus:bg-white focus:outline-none focus:border-[#2ECC71] text-[#0F1819] text-sm"
              disabled={loading}
            >
              <option value="area-1">Engineering</option>
              <option value="area-2">Security</option>
              <option value="area-3">Product</option>
              <option value="area-4">Design</option>
              <option value="area-5">Data</option>
            </select>
          </div>

          {error && <div className="text-red-600 text-sm font-medium">{error}</div>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-[#BDD5EA] text-[#203D47] rounded font-medium hover:bg-[#ECEFF1] disabled:opacity-50 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-[#2ECC71] text-white rounded font-semibold hover:bg-emerald-600 disabled:opacity-50 transition-colors text-sm"
            >
              {loading ? "Updating..." : "Update Position"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
