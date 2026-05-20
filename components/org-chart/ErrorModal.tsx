"use client";

import { X } from "lucide-react";

interface Props {
  message: string;
  onClose: () => void;
  onTryAgain: () => void;
}

export default function ErrorModal({ message, onClose, onTryAgain }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-[460px] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[#0F1819]">Error</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8aa3ad] hover:text-[#0F1819] hover:bg-[#f4f7f8] rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-4 text-sm text-rose-600 leading-relaxed mb-6">
          {message}
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-[#4a7880] hover:text-[#0F1819] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onTryAgain}
            className="px-6 py-2.5 bg-rose-500 hover:bg-rose-400 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    </div>
  );
}
