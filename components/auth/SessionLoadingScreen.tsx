"use client";

/**
 * Splash de carga de sesión.
 *
 * Se muestra mientras AuthContext resuelve la sesión de Supabase y carga el
 * perfil del usuario (employee o admin). Estilo minimalista esmeralda,
 * alineado con el branding del producto.
 */
export default function SessionLoadingScreen() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Cargando sesión"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-[#f4f7f8] via-white to-emerald-50/40"
    >
      <div className="flex flex-col items-center gap-6">
        {/* Wordmark */}
        <div className="flex items-center gap-2 text-[#0F1819]">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-sm">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </span>
          <span className="text-xl font-semibold tracking-tight">Conexión</span>
        </div>

        {/* Spinner doble */}
        <div className="relative inline-flex h-16 w-16 items-center justify-center">
          <div
            className="absolute inset-0 rounded-full border-[3px] border-emerald-100"
            aria-hidden
          />
          <div
            className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-emerald-500 border-r-emerald-500/40 animate-spin"
            aria-hidden
          />
          <div
            className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"
            aria-hidden
          />
        </div>

        <p className="text-sm font-medium text-[#576975]">
          Preparando tu sesión...
        </p>
      </div>
    </div>
  );
}
