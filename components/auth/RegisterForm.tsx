"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import InputField from "../InputField";
import AuthButton from "./AuthButton";
import LoadingSpinner from "../LoadingSpinner";
import { createClient } from "@/utils/supabase/client";
import { checkFirstLogin } from "@/services/firstLogin";
import { updatePassword } from "@/services/passwordFirstTime";

// Mismas reglas que ChangePasswordModal para mantener una sola fuente de verdad
// de "qué es una contraseña aceptable" en el sistema.
const PASSWORD_RULES = [
  { key: "length", label: "Mínimo 8 caracteres", test: (v: string) => v.length >= 8 },
  { key: "uppercase", label: "Una mayúscula", test: (v: string) => /[A-Z]/.test(v) },
  { key: "number", label: "Un número", test: (v: string) => /\d/.test(v) },
  { key: "special", label: "Un carácter especial", test: (v: string) => /[^A-Za-z0-9]/.test(v) },
] as const;

export default function RegisterForm() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  // Mensaje de error visible cuando el setup de sesión falla (token expirado,
  // link viejo, etc.). Antes se ocultaba y el usuario solo veía "No autorizado".
  const [bootError, setBootError] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);

        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (!accessToken || !refreshToken) {
          setBootError(
            "El enlace de invitación no es válido o ya expiró. Pídele a tu administrador que te reenvíe la invitación.",
          );
          setLoading(false);
          return;
        }

        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        const { data } = await supabase.auth.getUser();
        const user = data.user;
        if (!user) {
          setBootError("No se pudo verificar el usuario invitado. Reintentá desde el correo.");
          setLoading(false);
          return;
        }

        const result = await checkFirstLogin(user.id);
        // El backend retorna `{ isFirstLogin: boolean }`. Aceptamos también la
        // variante boolean por compatibilidad con versiones previas.
        const isFirstLogin =
          typeof result === "boolean"
            ? result
            : result?.isFirstLogin ?? result?.mustSetPassword ?? false;

        if (!isFirstLogin) {
          router.push("/login");
          return;
        }

        setAllowed(true);
      } catch (err) {
        console.error("[register] init error:", err);
        setBootError(
          "Ocurrió un error al validar tu invitación. Pídele a tu administrador que te reenvíe el correo.",
        );
      } finally {
        setLoading(false);
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Estado visual de los requisitos en vivo (chip verde/gris).
  const ruleStatus = useMemo(
    () => PASSWORD_RULES.map((r) => ({ ...r, met: r.test(password) })),
    [password],
  );
  const allRulesMet = ruleStatus.every((r) => r.met);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!password || !confirmPassword) {
      toast.error("Completa los dos campos de contraseña.");
      return;
    }
    if (!allRulesMet) {
      toast.error("La contraseña no cumple todos los requisitos de seguridad.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }

    setSubmitting(true);
    try {
      await updatePassword(password);
      toast.success("Contraseña creada. Ahora podés iniciar sesión.");
      router.push("/login");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo crear la contraseña.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (bootError) {
    return (
      <div className="bg-white p-8 rounded-xl shadow w-[350px] flex flex-col gap-4 text-center">
        <h2 className="text-lg font-semibold text-gray-700">Invitación inválida</h2>
        <p className="text-sm text-gray-600 leading-relaxed">{bootError}</p>
        <button
          onClick={() => router.push("/login")}
          className="mt-2 text-sm text-emerald-600 hover:underline"
        >
          Ir al login
        </button>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="text-center">
        <p>No autorizado</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-8 rounded-xl shadow w-[380px] flex flex-col gap-4"
    >
      <h2 className="text-lg font-semibold text-center text-gray-700">
        Definir contraseña
      </h2>
      <p className="text-xs text-center text-gray-500 -mt-2">
        Es tu primer ingreso. Definí una contraseña segura para activar tu cuenta.
      </p>

      <InputField
        label="Contraseña"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <InputField
        label="Confirmar contraseña"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />

      {/* Lista visual de requisitos. Chips se ponen en verde cuando se cumplen. */}
      <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2.5 text-xs text-gray-700">
        <p className="font-semibold mb-1.5">Requisitos:</p>
        <ul className="space-y-1">
          {ruleStatus.map((r) => (
            <li key={r.key} className="flex items-center gap-2">
              <span
                className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                  r.met
                    ? "bg-emerald-500 text-white"
                    : "border border-gray-300 bg-white text-transparent"
                }`}
              >
                ✓
              </span>
              <span className={r.met ? "text-emerald-700" : ""}>{r.label}</span>
            </li>
          ))}
          <li className="flex items-center gap-2">
            <span
              className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                password && confirmPassword && password === confirmPassword
                  ? "bg-emerald-500 text-white"
                  : "border border-gray-300 bg-white text-transparent"
              }`}
            >
              ✓
            </span>
            <span
              className={
                password && confirmPassword && password === confirmPassword
                  ? "text-emerald-700"
                  : ""
              }
            >
              Las contraseñas coinciden
            </span>
          </li>
        </ul>
      </div>

      <AuthButton text={submitting ? "Guardando..." : "Guardar contraseña"} />
    </form>
  );
}
