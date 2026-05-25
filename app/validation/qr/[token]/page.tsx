"use client";

/**
 * Página pública de validación de QR.
 *
 * Ruta: /validation/qr/<token>
 *
 * El QR que muestra el carné digital del empleado encodea esta URL. Cuando
 * alguien lo escanea (camera app, otro empleado, recepción, etc.), llega aquí
 * con el `token` JWT temporal en la URL. La página:
 *   1. Toma el token del segmento de URL (route param).
 *   2. Llama a `POST /api/employees/qr/scan` con `{ qrToken }`.
 *   3. Si el visitante tiene sesión Supabase activa, `apiRequest` agrega
 *      automáticamente el Authorization Bearer; el backend (OptionalAuthGuard)
 *      devuelve campos extra según el rol del scanner.
 *   4. Muestra la información del empleado, incluyendo su foto.
 *
 * NO está bajo /dashboard, así que NO pasa por RouteGuard ni AuthProvider.
 * Funciona aunque el visitante no tenga sesión.
 */

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Mail,
  ShieldCheck,
  ShieldX,
  User as UserIcon,
  XCircle,
} from "lucide-react";
import Link from "next/link";

import { escanearQrPublico, escanearQrAutenticado } from "@/services/qrService";
import { translateBackendError } from "@/lib/api/translateError";
import { createClient } from "@/utils/supabase/client";
import type { QrEmployeeView } from "@/types/api/employee";

type EstadoSrc = "active" | "suspended" | "retired" | "inactive" | "invited" | (string & {});

// Adaptador para mapear la respuesta del backend al tipo QrEmployeeView
function mapBackendEmployeeToQrView(backendEmployee: any): QrEmployeeView {
  return {
    id: backendEmployee.id_employee || backendEmployee.id,
    first_name: backendEmployee.first_name,
    last_name: backendEmployee.last_name,
    email: backendEmployee.email,
    photo_url: backendEmployee.photo_url || null,
    status: backendEmployee.status,
    position: backendEmployee.position ? {
      id: backendEmployee.position.id || backendEmployee.position.id_position || 0,
      name: backendEmployee.position.name,
    } : undefined,
    area: backendEmployee.area,
    code: backendEmployee.code,
    manager: backendEmployee.manager,
  };
}

const ESTADO_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; icon: React.ReactNode }
> = {
  active:    { label: "Activo",    bg: "bg-emerald-50",  text: "text-emerald-700",  icon: <CheckCircle2 size={14} /> },
  suspended: { label: "Suspendido",bg: "bg-amber-50",    text: "text-amber-700",    icon: <XCircle size={14} /> },
  retired:   { label: "Retirado",  bg: "bg-rose-50",     text: "text-rose-700",     icon: <XCircle size={14} /> },
  inactive:  { label: "Inactivo",  bg: "bg-slate-100",   text: "text-slate-700",    icon: <XCircle size={14} /> },
  invited:   { label: "Invitado",  bg: "bg-sky-50",      text: "text-sky-700",      icon: <CheckCircle2 size={14} /> },
};

export default function ValidarQrPage() {
  const params = useParams<{ token: string }>();
  const tokenParam = params?.token ?? "";

  const [loading, setLoading] = useState(true);
  const [empleado, setEmpleado] = useState<QrEmployeeView | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tokenParam) {
      setError("Token QR no encontrado en la URL.");
      setLoading(false);
      return;
    }

    let cancelado = false;
    
    const cargarEmpleado = async () => {
      try {
        // Paso 1: Detectar si hay sesión activa
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        console.log("[qr-validation] Sesión detectada:", !!session);
        
        if (cancelado) return;

        try {
          setLoading(true);
          setError(null);
          setEmpleado(null);

          const decodedToken = decodeURIComponent(tokenParam);
          
          // Paso 2: Elegir endpoint según sesión
          // - Con sesión: escanearQrAutenticado() → info ampliada (incluye manager)
          // - Sin sesión: escanearQrPublico() → info pública (sin auth)
          const resp = session
            ? await escanearQrAutenticado(decodedToken)
            : await escanearQrPublico(decodedToken);

          console.log("[qr-validation] Respuesta del backend:", resp);

          if (!cancelado) {
            // El backend devuelve una estructura envuelta con { employee, enabled, status, visibilityLevel, message }
            // Extrae el objeto employee si existe, de lo contrario usa resp directamente
            const empleadoData = (resp as any)?.employee || resp;
            
            if (!empleadoData) {
              setError(
                "Este QR no es válido o ya expiró. Pide al empleado que genere uno nuevo.",
              );
            } else {
              // Mapear los campos del backend al tipo QrEmployeeView esperado
              const empleadoMapeado = mapBackendEmployeeToQrView(empleadoData);
              setEmpleado(empleadoMapeado);
            }
          }
        } catch (err) {
          if (cancelado) return;
          const raw = err instanceof Error ? err.message : "";
          console.error("[qr-validation] Error al escanear QR:", raw);
          setError(
            translateBackendError(raw) ||
              "Este QR no es válido o ya expiró. Pide al empleado que genere uno nuevo.",
          );
        } finally {
          if (!cancelado) setLoading(false);
        }
      } catch (err) {
        if (!cancelado) {
          console.error("[qr-validation] Error al detectar sesión:", err);
          setError("Error al procesar el QR. Intenta de nuevo.");
          setLoading(false);
        }
      }
    };

    cargarEmpleado();

    return () => {
      cancelado = true;
    };
  }, [tokenParam]);

  const iniciales = empleado
    ? `${empleado.first_name?.charAt(0) ?? ""}${empleado.last_name?.charAt(0) ?? ""}`.toUpperCase() || "?"
    : "?";

  const estadoConfig =
    empleado?.status ? ESTADO_CONFIG[empleado.status as EstadoSrc] : undefined;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f4f7f8] via-white to-emerald-50/40 px-4 py-10">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-5 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-sm">
            <ShieldCheck size={22} />
          </div>
          <h1 className="mt-3 text-xl font-bold text-[#0F1819]">Validación de carné digital</h1>
          <p className="mt-1 text-xs text-[#576975]">
            Verifica la identidad del empleado a partir de su código QR.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[#e4ebee] bg-white p-6 shadow-sm">
          {loading && <LoadingState />}

          {!loading && error && <ErrorState message={error} />}

          {!loading && !error && empleado && (
            <div className="flex flex-col items-center">
              {empleado.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={empleado.photo_url}
                  alt={`${empleado.first_name ?? ""} ${empleado.last_name ?? ""}`.trim()}
                  className="h-28 w-28 rounded-full border-4 border-[#BDD5EA] object-cover shadow-sm"
                />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-[#BDD5EA] bg-gradient-to-br from-[#203D47] to-[#0F1819] text-2xl font-bold text-white shadow-sm">
                  {iniciales}
                </div>
              )}

              <div className="mt-4 text-center">
                <p className="text-xl font-bold text-[#0F1819]">
                  {empleado.first_name} {empleado.last_name}
                </p>
                {empleado.position?.name && (
                  <p className="text-sm text-[#576975]">{empleado.position.name}</p>
                )}
                {empleado.area?.name && (
                  <p className="text-xs text-[#8aa3ad]">{empleado.area.name}</p>
                )}
              </div>

              {estadoConfig && (
                <span
                  className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${estadoConfig.bg} ${estadoConfig.text}`}
                >
                  {estadoConfig.icon}
                  {estadoConfig.label}
                </span>
              )}

              <div className="mt-5 grid w-full grid-cols-1 gap-2.5 border-t border-[#f0f4f5] pt-5 text-sm">
                {empleado.email && (
                  <div className="flex items-center gap-2.5">
                    <Mail size={14} className="text-[#8aa3ad] shrink-0" />
                    <span className="text-[#0F1819] break-all">{empleado.email}</span>
                  </div>
                )}
                {empleado.code != null && (
                  <div className="flex items-center gap-2.5">
                    <UserIcon size={14} className="text-[#8aa3ad] shrink-0" />
                    <span className="text-[#0F1819]">
                      Documento <span className="font-mono">{empleado.code}</span>
                    </span>
                  </div>
                )}
                {empleado.manager && (
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck size={14} className="text-[#8aa3ad] shrink-0" />
                    <span className="text-[#0F1819]">
                      Reporta a {empleado.manager.first_name} {empleado.manager.last_name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs font-medium text-[#576975] hover:text-[#0F1819]"
          >
            <ArrowLeft size={12} />
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <div className="relative inline-flex h-14 w-14 items-center justify-center">
        <div className="absolute inset-0 rounded-full border-[3px] border-emerald-100" aria-hidden />
        <div
          className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-emerald-500 border-r-emerald-500/40 animate-spin"
          aria-hidden
        />
        <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden />
      </div>
      <p className="text-sm text-[#576975]">Validando código QR...</p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-500">
        <ShieldX size={26} />
      </div>
      <p className="text-sm font-semibold text-[#0F1819]">QR inválido o expirado</p>
      <p className="text-xs text-[#576975] max-w-xs">{message}</p>
    </div>
  );
}
