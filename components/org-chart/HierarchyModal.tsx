"use client";

import { useState } from "react";
import { X, ChevronUp, ChevronDown } from "lucide-react";

interface Props {
  mode: "add" | "edit";
  superiorPosition: string;
  currentName?: string;
  subordinates?: string[];
  onClose: () => void;
  onConfirm: (positionName: string) => void;
}

export default function HierarchyModal({
  mode,
  superiorPosition,
  currentName = "",
  subordinates = [],
  onClose,
  onConfirm,
}: Props) {
  const [name, setName] = useState(currentName);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-[460px] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-[#0F1819]">
            {mode === "add" ? "Agregar Jerarquía" : "Editar Jerarquía"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8aa3ad] hover:text-[#0F1819] hover:bg-[#f4f7f8] rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {/* Superior Position — read only */}
          <div>
            <label className="text-sm font-semibold text-[#0F1819] block mb-1.5">
              Posición Superior
            </label>
            <div className="w-full border border-[#d1dde2] rounded-xl px-3 py-2.5 text-sm text-[#8aa3ad] bg-[#f9fafb]">
              {superiorPosition}
            </div>
          </div>

          {/* Actual Position — editable */}
          <div>
            <label className="text-sm font-semibold text-[#0F1819] block mb-1.5">
              Posición Actual
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onConfirm(name.trim())}
                placeholder="Ingresa el nombre de la posición"
                autoFocus
                className="w-full border border-[#d1dde2] rounded-xl px-3 py-2.5 text-sm text-[#0F1819] focus:outline-none focus:ring-2 focus:ring-emerald-400 pr-8 transition-colors hover:border-[#b0c4cc]"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 pointer-events-none">
                <ChevronUp size={10} className="text-[#8aa3ad]" />
                <ChevronDown size={10} className="text-[#8aa3ad]" />
              </div>
            </div>
          </div>

          {/* Subordinates — informational */}
          {subordinates.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-[#0F1819] text-center mb-3">
                Subordinados
              </p>
              <div className="grid grid-cols-2 gap-3">
                {subordinates.slice(0, 4).map((sub, i) => (
                  <div
                    key={i}
                    className="border border-[#d1dde2] rounded-xl px-3 py-2.5 text-sm text-[#8aa3ad] bg-[#f9fafb] text-center truncate"
                  >
                    {sub}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-[#4a7880] hover:text-[#0F1819] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(name.trim())}
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}
