"use client";

/**
 * Splash de carga de sesión.
 *
 * Se muestra mientras AuthContext resuelve la sesión de Supabase y carga el
 * perfil del usuario. Por pedido explícito: solo spinner + el texto
 * "Cargando sesión...". Sin logos, sin wordmark, sin mensajes adicionales.
 */
export default function SessionLoadingScreen() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Cargando sesión"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-[#f4f7f8] via-white to-emerald-50/40"
    >
      <div className="flex flex-col items-center gap-5">
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

        <p className="text-sm font-medium text-[#576975]">Cargando sesión...</p>
      </div>
    </div>
  );
}
