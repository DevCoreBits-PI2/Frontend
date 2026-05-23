"use client";

import { useEffect, useState } from "react";
import { KeyRound, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

import { useAuth } from "@/lib/auth/AuthContext";
import { checkFirstLogin } from "@/services/firstLogin";
import { updatePassword } from "@/services/passwordFirstTime";
import LoadingSpinner from "@/components/LoadingSpinner";

const REGLAS = [
  { label: "Mínimo 8 caracteres", test: (v: string) => v.length >= 8 },
  { label: "Una mayúscula", test: (v: string) => /[A-Z]/.test(v) },
  { label: "Un número", test: (v: string) => /\d/.test(v) },
  { label: "Un carácter especial", test: (v: string) => /[^A-Za-z0-9]/.test(v) },
] as const;

/**
 * Gate que bloquea el acceso al dashboard hasta que el empleado complete su
 * primer login (definir contraseña). Se monta dentro del DashboardLayout —
 * después del RouteGuard, así sabemos que ya hay sesión.
 *
 * Flow:
 *   1. Al montarse, consulta `GET /employees/firstTimeSetup/:supabaseUserId`.
 *   2. Si `mustSetPassword=true`, monta un overlay full-screen con form.
 *   3. Al guardar, llama `updatePassword(pw)` que: (a) actualiza la
 *      contraseña en Supabase y (b) llama `PATCH /completeFirstLogin/:id`.
 *
 * Admins NO pasan por este gate porque no tienen registro en `employees`.
 */
export default function FirstLoginGate({ children }: { children: React.ReactNode }) {
  const { authUser, ready, refreshProfile } = useAuth();
  const [checked, setChecked] = useState(false);
  const [mustSet, setMustSet] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!ready || !authUser || authUser.isAdmin) {
      setChecked(true);
      return;
    }
    let cancelado = false;
    checkFirstLogin(authUser.supabaseUserId)
      .then((res) => {
        if (cancelado) return;
        setMustSet(!!res.mustSetPassword);
      })
      .catch(() => {
        if (cancelado) return;
        setMustSet(false);
      })
      .finally(() => {
        if (!cancelado) setChecked(true);
      });
    return () => { cancelado = true; };
  }, [ready, authUser]);

  if (!checked) {
    // Mientras chequea, mantenemos children visibles para no parpadear; el
    // RouteGuard ya garantizó que hay sesión.
    return <>{children}</>;
  }

  if (!mustSet) {
    return <>{children}</>;
  }

  const reglas = REGLAS.map((r) => ({ ...r, ok: r.test(password) }));
  const validas = reglas.every((r) => r.ok);
  const coincide = password.length > 0 && password === confirm;
  const habilitado = validas && coincide && !saving;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!habilitado) return;
    setSaving(true);
    try {
      await updatePassword(password);
      toast.success("¡Contraseña configurada! Bienvenido.");
      setMustSet(false);
      await refreshProfile();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo configurar la contraseña.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="first-login-title"
      className="fixed inset-0 z-[110] flex items-center justify-center bg-gradient-to-br from-[#f4f7f8] via-white to-emerald-50/40 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-2xl border border-[#e4ebee] bg-white p-8 shadow-2xl mx-4">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500 text-white">
            <KeyRound size={20} />
          </div>
          <div>
            <h2 id="first-login-title" className="text-base font-semibold text-[#0F1819]">
              Configurá tu contraseña
            </h2>
            <p className="text-xs text-[#576975]">
              Es la primera vez que ingresas. Define una contraseña para tu cuenta.
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#0F1819]">Nueva contraseña</label>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="w-full rounded-lg border border-[#d1dde2] px-3.5 py-2.5 pr-10 text-sm text-[#0F1819] focus:outline-none focus:ring-2 focus:ring-emerald-400"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-[#8aa3ad] hover:text-[#0F1819]"
                aria-label={show ? "Ocultar" : "Mostrar"}
              >
                {show ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#0F1819]">Confirma la contraseña</label>
            <input
              type={show ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repetí la contraseña"
              className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-[#0F1819] focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
                confirm && !coincide ? "border-rose-400 bg-rose-50" : "border-[#d1dde2]"
              }`}
            />
            {confirm && !coincide && (
              <p className="text-xs text-rose-500">Las contraseñas no coinciden.</p>
            )}
          </div>

          <div className="flex flex-col gap-1 rounded-lg border border-[#f0f4f5] bg-[#fafcfc] p-3">
            {reglas.map((r) => (
              <span
                key={r.label}
                className={`flex items-center gap-2 text-xs ${
                  r.ok ? "text-emerald-600" : "text-[#8aa3ad]"
                }`}
              >
                <span
                  className={`inline-block h-1.5 w-1.5 rounded-full ${
                    r.ok ? "bg-emerald-500" : "bg-[#d1dde2]"
                  }`}
                />
                {r.label}
              </span>
            ))}
          </div>

          <button
            type="submit"
            disabled={!habilitado}
            className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Guardando..." : "Configurar y continuar"}
          </button>

          {saving && <LoadingSpinner mensaje="Guardando contraseña..." size="sm" />}
        </form>
      </div>
    </div>
  );
}
