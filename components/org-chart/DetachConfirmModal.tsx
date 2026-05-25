"use client";

import { AlertTriangle, X } from "lucide-react";
import { Position } from "@/types/orgChart";

interface Props {
  position: Position;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DetachConfirmModal({ position, onClose, onConfirm }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-[420px] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle size={16} className="text-amber-500" />
            </div>
            <h2 className="text-base font-bold text-[#0F1819] leading-snug">
              ¿Eliminar esta relación jerárquica?
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8aa3ad] hover:text-[#0F1819] hover:bg-[#f4f7f8] rounded-lg transition-colors shrink-0"
          >
            <X size={15} />
          </button>
        </div>

        <div className="pl-12 flex flex-col gap-2.5">
          <p className="text-sm text-[#4a7880]">
            ¿Estás seguro de que deseas eliminar esta relación jerárquica?
          </p>
          <p className="text-sm text-[#4a7880]">
            <span className="font-semibold text-[#0F1819]">Importante:</span> Las posiciones no serán eliminadas. Simplemente se reorganizarán bajo la siguiente posición superior. El área removida solo será excluida de esta jerarquía pero no será eliminada.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-[#4a7880] hover:text-[#0F1819] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2.5 bg-rose-500 hover:bg-rose-400 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Desvincular
          </button>
        </div>
      </div>
    </div>
  );
}
