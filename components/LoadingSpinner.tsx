"use client";

interface LoadingSpinnerProps {
  mensaje?: string;
  /** Si es true, ocupa toda la pantalla con un fondo semi-transparente.
   *  Útil para overlays globales (ej. resolución de sesión). */
  fullscreen?: boolean;
  /** Tamaño del spinner. Default: "md". */
  size?: "sm" | "md" | "lg";
}

const SIZE_MAP = {
  sm: { ring: "h-8 w-8", dot: "h-2 w-2", label: "text-xs" },
  md: { ring: "h-14 w-14", dot: "h-3 w-3", label: "text-sm" },
  lg: { ring: "h-20 w-20", dot: "h-4 w-4", label: "text-base" },
} as const;

export default function LoadingSpinner({
  mensaje = "Cargando...",
  fullscreen = false,
  size = "md",
}: LoadingSpinnerProps) {
  const dims = SIZE_MAP[size];

  const content = (
    <div className="flex flex-col items-center gap-4">
      <div className="relative inline-flex items-center justify-center">
        <div
          className={`${dims.ring} rounded-full border-[3px] border-emerald-100`}
          aria-hidden
        />
        <div
          className={`absolute inset-0 ${dims.ring} rounded-full border-[3px] border-transparent border-t-emerald-500 border-r-emerald-500/40 animate-spin`}
          aria-hidden
        />
        <span
          className={`absolute ${dims.dot} rounded-full bg-emerald-500 animate-pulse`}
          aria-hidden
        />
      </div>
      {mensaje && (
        <span className={`${dims.label} font-medium text-[#576975]`}>
          {mensaje}
        </span>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-[#f4f7f8] via-white to-emerald-50/30 backdrop-blur-sm"
      >
        {content}
      </div>
    );
  }

  return (
    <div role="status" aria-live="polite" className="flex items-center justify-center py-20">
      {content}
    </div>
  );
}
