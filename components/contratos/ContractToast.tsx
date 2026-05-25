"use client";

import { useEffect } from "react";
import { CheckCircle2, X } from "lucide-react";

interface ContractToastProps {
  mensaje: string;
  onCerrar: () => void;
  duracionMs?: number;
}

export default function ContractToast({
  mensaje,
  onCerrar,
  duracionMs = 3500,
}: ContractToastProps) {
  useEffect(() => {
    const timer = setTimeout(onCerrar, duracionMs);
    return () => clearTimeout(timer);
  }, [onCerrar, duracionMs]);

  return (
    <div
      className="fixed top-5 right-5 z-[9999] flex items-center gap-3 bg-white rounded-2xl shadow-[0_8px_32px_rgba(15,24,25,0.14)] border border-[#e8eef0] pl-4 pr-3 py-3.5 min-w-[280px]"
      style={{ animation: "toastIn 0.28s cubic-bezier(0.16,1,0.3,1)" }}
    >
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(-14px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>
      <div className="w-8 h-8 rounded-full bg-[#2ECC71] flex items-center justify-center shrink-0 shadow-sm">
        <CheckCircle2 size={16} className="text-white" strokeWidth={2.5} />
      </div>
      <span className="text-sm font-semibold text-[#0F1819] flex-1 leading-snug">{mensaje}</span>
      <button
        onClick={onCerrar}
        className="p-1 text-[#c5d5db] hover:text-[#0F1819] rounded-md transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}
