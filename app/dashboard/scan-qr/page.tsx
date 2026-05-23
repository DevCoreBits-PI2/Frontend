"use client";

import { useState, type ReactNode } from "react";
import { QrCode, Search, User as UserIcon, CheckCircle2, XCircle, Clipboard } from "lucide-react";
import toast from "react-hot-toast";

import Header from "@/components/Header";
import { RouteGuard } from "@/lib/auth/RouteGuard";
import { escanearQrAutenticado } from "@/services/qrService";
import { translateBackendError } from "@/lib/api/translateError";
import type { QrEmployeeView } from "@/types/api/employee";

const ESTADO_LABEL: Record<string, { label: string; bg: string; text: string; icon: ReactNode }> = {
  active:    { label: "Activo",    bg: "bg-emerald-100", text: "text-emerald-700", icon: <CheckCircle2 size={14} /> },
  suspended: { label: "Suspendido",bg: "bg-amber-100",   text: "text-amber-700",   icon: <XCircle size={14} /> },
  retired:   { label: "Retirado",  bg: "bg-rose-100",    text: "text-rose-700",    icon: <XCircle size={14} /> },
  inactive:  { label: "Inactivo",  bg: "bg-slate-100",   text: "text-slate-700",   icon: <XCircle size={14} /> },
  invited:   { label: "Invitado",  bg: "bg-sky-100",     text: "text-sky-700",     icon: <CheckCircle2 size={14} /> },
};

export default function EscanearQrPage() {
  return (
    <RouteGuard requireHumanTalent>
      <EscanearQrContenido />
    </RouteGuard>
  );
}

function EscanearQrContenido() {
  const [token, setToken] = useState("");
  const [empleado, setEmpleado] = useState<QrEmployeeView | null>(null);
  const [loading, setLoading] = useState(false);

  const escanear = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const t = token.trim();
    if (!t) {
      toast.error("Ingresa o pega el token QR.");
      return;
    }
    setLoading(true);
    setEmpleado(null);
    try {
      const resp = await escanearQrAutenticado(t);
      setEmpleado(resp);
    } catch (err) {
      const raw = err instanceof Error ? err.message : "";
      toast.error(translateBackendError(raw) || "Token QR inválido o expirado.");
    } finally {
      setLoading(false);
    }
  };

  const pegarDesdePortapapeles = async () => {
    try {
      const t = await navigator.clipboard.readText();
      setToken(t);
      toast.success("Token pegado.");
    } catch {
      toast.error("No se pudo leer del portapapeles.");
    }
  };

  const iniciales = empleado
    ? `${empleado.first_name?.charAt(0) ?? ""}${empleado.last_name?.charAt(0) ?? ""}`.toUpperCase() || "?"
    : "?";

  const estadoConfig = empleado?.status ? ESTADO_LABEL[empleado.status] : undefined;

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f7f8]">
      <Header user={null} />

      <main className="flex-1 mx-auto w-full max-w-3xl px-6 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-[#0F1819]">Escanear QR de empleado</h1>
          <p className="text-sm text-[#8aa3ad] mt-0.5">
            Verifica la identidad del empleado leyendo el token de su carné QR digital.
          </p>
        </div>

        <div className="rounded-2xl border border-[#e4ebee] bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <QrCode size={18} className="text-emerald-500" />
            <h2 className="text-base font-semibold text-[#0F1819]">Token QR</h2>
          </div>

          <form onSubmit={escanear} className="flex flex-col gap-3">
            <textarea
              value={token}
              onChange={(e) => setToken(e.target.value)}
              rows={3}
              placeholder="Pega el token JWT que aparece en el QR del empleado..."
              className="w-full resize-none rounded-lg border border-[#d1dde2] px-3.5 py-2.5 text-sm font-mono text-[#0F1819] focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={pegarDesdePortapapeles}
                className="flex items-center gap-2 rounded-lg border border-[#d1dde2] px-3 py-2 text-xs font-medium text-[#576975] transition-colors hover:bg-[#f4f7f8]"
              >
                <Clipboard size={14} />
                Pegar del portapapeles
              </button>
              <button
                type="submit"
                disabled={loading || !token.trim()}
                className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-400 disabled:opacity-60"
              >
                <Search size={14} />
                {loading ? "Validando..." : "Verificar QR"}
              </button>
            </div>
          </form>

          <p className="mt-3 text-xs text-[#8aa3ad]">
            El token está disponible en el carné digital del empleado dentro de su perfil. Es temporal —
            si está expirado, el empleado debe regenerarlo.
          </p>
        </div>

        {empleado && (
          <div className="mt-6 rounded-2xl border border-[#e4ebee] bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2 border-b border-[#f0f4f5] pb-3">
              <UserIcon size={18} className="text-emerald-500" />
              <h2 className="text-base font-semibold text-[#0F1819]">Empleado verificado</h2>
            </div>

            <div className="flex items-start gap-5">
              {empleado.photo_url ? (
                <img
                  src={empleado.photo_url}
                  alt=""
                  className="h-20 w-20 rounded-xl border-4 border-[#BDD5EA] object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-xl border-4 border-[#BDD5EA] bg-gradient-to-br from-[#203D47] to-[#0F1819] text-xl font-bold text-white">
                  {iniciales}
                </div>
              )}

              <div className="flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xl font-bold text-[#0F1819]">
                      {empleado.first_name} {empleado.last_name}
                    </p>
                    <p className="text-sm text-[#576975]">
                      {empleado.position?.name ?? "Sin cargo"} • {empleado.area?.name ?? "Sin área"}
                    </p>
                  </div>
                  {estadoConfig && (
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${estadoConfig.bg} ${estadoConfig.text}`}
                    >
                      {estadoConfig.icon}
                      {estadoConfig.label}
                    </span>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  {empleado.email && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#8aa3ad]">Correo</p>
                      <p className="text-[#0F1819]">{empleado.email}</p>
                    </div>
                  )}
                  {empleado.code != null && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#8aa3ad]">Documento</p>
                      <p className="text-[#0F1819]">{empleado.code}</p>
                    </div>
                  )}
                  {empleado.manager && (
                    <div className="col-span-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#8aa3ad]">Reporta a</p>
                      <p className="text-[#0F1819]">
                        {empleado.manager.first_name} {empleado.manager.last_name}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end">
              <button
                onClick={() => { setEmpleado(null); setToken(""); }}
                className="rounded-lg border border-[#d1dde2] px-4 py-2 text-sm text-[#576975] hover:bg-[#f4f7f8]"
              >
                Escanear otro
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
