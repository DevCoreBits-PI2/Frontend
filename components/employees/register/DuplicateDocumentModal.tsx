"use client";

import { AlertTriangle } from "lucide-react";

interface Props {
  isOpen: boolean;
  message?: string;
  onCancel: () => void;
  onTryAgain: () => void;
}

export default function DuplicateDocumentModal({
  isOpen,
  message = "Ya existe un empleado registrado en el sistema con este número de documento. Por favor, inténtalo de nuevo con un número de documento válido.",
  onCancel,
  onTryAgain,
}: Props) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-100 px-7 py-7"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-labelledby="duplicate-doc-title"
        aria-describedby="duplicate-doc-desc"
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mb-4">
            <AlertTriangle size={26} className="text-amber-500" strokeWidth={2.2} />
          </div>

          <h2
            id="duplicate-doc-title"
            className="text-lg font-bold text-[#0F1819] mb-2"
          >
            Error de duplicado
          </h2>

          <p
            id="duplicate-doc-desc"
            className="text-sm text-platinum-600 leading-relaxed mb-6"
          >
            {message}
          </p>

          <div className="flex items-center justify-center gap-3 w-full">
            <button
              onClick={onCancel}
              className="flex-1 px-5 py-2.5 text-sm font-semibold text-[#203D47] border border-[#d1dde2] hover:bg-[#f4f7f8] rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onTryAgain}
              className="flex-1 px-5 py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-700 text-sm font-semibold rounded-lg transition-colors"
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
