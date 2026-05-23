// Login por OTP (One-Time Password) — usa Supabase Auth directamente desde el
// cliente porque maneja la sesión + refresh automáticamente. El backend tiene
// endpoints equivalentes (`/auth/login-otp` y `/auth/verify-otp`) pero solo
// devuelven el access_token sin refresh_token, lo que rompe la persistencia
// de sesión en el frontend. Para uso Postman/curl, los del backend siguen
// disponibles.

import { createClient } from "@/utils/supabase/client";

/**
 * Solicita el envío de un OTP de 6 dígitos al correo indicado. Solo funciona
 * para usuarios que ya existen en Supabase Auth (los empleados invitados).
 *
 * @throws Error con mensaje user-friendly si Supabase rechaza.
 */
export async function solicitarOtp(email: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // No queremos auto-crear usuarios desde el flujo de login. Los empleados
      // se crean vía el invite del admin; este endpoint solo autentica
      // existentes.
      shouldCreateUser: false,
    },
  });
  if (error) {
    const lower = error.message.toLowerCase();
    if (lower.includes("signups not allowed") || lower.includes("not found")) {
      throw new Error(
        "No encontramos una cuenta con ese correo. Confirma que es el correo con el que te invitó tu administrador.",
      );
    }
    if (lower.includes("rate limit") || lower.includes("too many")) {
      throw new Error(
        "Demasiados intentos. Espera unos minutos antes de pedir otro código.",
      );
    }
    throw new Error(error.message);
  }
}

/**
 * Verifica el OTP ingresado por el usuario contra el email correspondiente.
 * Si el token es válido, Supabase guarda la sesión (access_token + refresh_token)
 * automáticamente en localStorage para que el resto del app la reconozca.
 *
 * @throws Error con mensaje user-friendly si el token es inválido.
 */
export async function verificarOtp(email: string, token: string): Promise<void> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });
  if (error || !data.session) {
    const lower = error?.message.toLowerCase() ?? "";
    if (lower.includes("expired")) {
      throw new Error("El código expiró. Solicita uno nuevo.");
    }
    if (lower.includes("invalid")) {
      throw new Error("El código es incorrecto. Revisa los 6 dígitos del correo.");
    }
    throw new Error(error?.message ?? "No se pudo verificar el código.");
  }
}
