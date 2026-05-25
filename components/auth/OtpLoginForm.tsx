"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { ArrowLeft, Mail, KeyRound } from "lucide-react";

import InputField from "../InputField";
import AuthButton from "./AuthButton";
import { solicitarOtp, verificarOtp } from "@/services/otpService";

type Paso = "email" | "codigo";

// Cuánto esperar entre un reenvío y otro (cubre el rate-limit típico de
// Supabase de 60s para email OTP).
const SECONDS_REENVIO = 60;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function OtpLoginForm() {
  const router = useRouter();
  const [paso, setPaso] = useState<Paso>("email");
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Cuenta regresiva para habilitar el botón "Reenviar código".
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handlePedirCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!EMAIL_RE.test(email.trim())) {
      toast.error("Correo electrónico con formato inválido");
      return;
    }

    setSubmitting(true);
    try {
      await solicitarOtp(email.trim());
      toast.success(`Código enviado a ${email}. Revisa tu bandeja de entrada.`);
      setPaso("codigo");
      setCooldown(SECONDS_REENVIO);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo enviar el código.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerificar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    // Supabase admite OTPs configurables de 6 a 10 dígitos en el dashboard
    // de Auth. No asumimos el largo exacto; pedimos al menos 6 y dejamos que
    // el servidor rechace si no coincide con lo que generó.
    const codigoLimpio = codigo.replace(/\D/g, "");
    if (codigoLimpio.length < 6 || codigoLimpio.length > 10) {
      toast.error("El código debe tener entre 6 y 10 dígitos");
      return;
    }

    setSubmitting(true);
    try {
      await verificarOtp(email.trim(), codigoLimpio);
      toast.success("Sesión iniciada correctamente.");
      router.push("/dashboard");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo verificar el código.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReenviar = async () => {
    if (cooldown > 0 || submitting) return;
    setSubmitting(true);
    try {
      await solicitarOtp(email.trim());
      toast.success("Nuevo código enviado.");
      setCooldown(SECONDS_REENVIO);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo reenviar el código.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (paso === "email") {
    return (
      <form
        onSubmit={handlePedirCodigo}
        className="bg-white p-8 rounded-xl shadow w-[380px] flex flex-col gap-4"
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-white">
            <Mail size={18} />
          </div>
          <h2 className="text-lg font-semibold text-gray-700">
            Iniciar sesión con código
          </h2>
        </div>
        <p className="text-xs text-gray-500 -mt-2 leading-relaxed">
          Ingresa tu correo y te enviaremos un código de 6 dígitos para entrar
          sin contraseña.
        </p>

        <InputField
          label="Correo electrónico"
          type="email"
          placeholder="nombre@empresa.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <AuthButton text={submitting ? "Enviando..." : "Enviar código"} />

        <Link
          href="/login"
          className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 justify-center mt-1"
        >
          <ArrowLeft size={12} /> Volver al login con contraseña
        </Link>
      </form>
    );
  }

  return (
    <form
      onSubmit={handleVerificar}
      className="bg-white p-8 rounded-xl shadow w-[380px] flex flex-col gap-4"
    >
      <div className="flex items-center gap-3 mb-1">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-white">
          <KeyRound size={18} />
        </div>
        <h2 className="text-lg font-semibold text-gray-700">Verificar código</h2>
      </div>
      <p className="text-xs text-gray-500 -mt-2 leading-relaxed">
        Te enviamos un código a <strong className="text-gray-700">{email}</strong>.
        Revisa la bandeja de entrada (y la carpeta de spam).
      </p>

      <div>
        <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">
          Código recibido por correo
        </label>
        <input
          type="text"
          inputMode="numeric"
          // Supabase permite OTPs configurables (6 a 10 dígitos). Mantenemos
          // un máximo de 10 para cubrir cualquier configuración del proyecto.
          maxLength={10}
          autoComplete="one-time-code"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 10))}
          placeholder="Ingresa los dígitos del código"
          className="w-full px-4 py-3 border-2 border-gray-300 rounded text-center text-2xl font-mono tracking-[0.3em] bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-700"
          autoFocus
        />
        <p className="text-[11px] text-gray-500 mt-1.5 leading-snug">
          El código puede tener entre 6 y 10 dígitos según la configuración de tu organización.
        </p>
      </div>

      <AuthButton text={submitting ? "Verificando..." : "Iniciar sesión"} />

      <div className="flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={() => {
            setPaso("email");
            setCodigo("");
          }}
          className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <ArrowLeft size={12} /> Cambiar correo
        </button>
        <button
          type="button"
          onClick={handleReenviar}
          disabled={cooldown > 0 || submitting}
          className="text-emerald-600 hover:text-emerald-500 hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
        >
          {cooldown > 0 ? `Reenviar en ${cooldown}s` : "Reenviar código"}
        </button>
      </div>
    </form>
  );
}
