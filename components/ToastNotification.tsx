"use client";

import { useEffect, useRef } from "react";
import { X, CheckCircle2 } from "lucide-react";

interface ToastNotificationProps {
  isVisible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  duration?: number;
}

export default function ToastNotification({
  isVisible,
  onClose,
  title = "Información editada con éxito",
  message = "Los datos fueron actualizados",
  duration = 4000,
}: ToastNotificationProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isVisible) return;
    timerRef.current = setTimeout(onClose, duration);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed top-5 right-5 z-[9999] flex items-start gap-3 bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] px-4 py-3.5 min-w-[280px] max-w-[340px] animate-slide-in-right"
    >
      {/* Ícono */}
      <CheckCircle2
        size={36}
        className="shrink-0 text-white fill-emerald-500"
        strokeWidth={2.5}
      />

      {/* Texto */}
      <div className="flex-1 pt-0.5">
        <p className="text-sm font-bold text-[#0F1819] leading-snug">{title}</p>
        <p className="text-xs text-[#8aa3ad] mt-0.5">{message}</p>
      </div>

      {/* Cerrar */}
      <button
        onClick={onClose}
        aria-label="Cerrar notificación"
        className="shrink-0 p-1 text-[#c5d5db] hover:text-[#0F1819] rounded-lg transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}
