// Cambio de contraseña — vía Supabase Auth.
//
// El backend NO expone un endpoint para cambiar contraseña; el flujo correcto
// es client-side con Supabase:
//   1) Verificar la contraseña actual reautenticando con signInWithPassword.
//   2) Si la verificación pasa, actualizar con updateUser({ password }).

import { createClient } from "@/utils/supabase/client";

export interface CambiarPasswordInput {
  currentPassword: string;
  newPassword: string;
}

export async function cambiarPasswordUsuario({
  currentPassword,
  newPassword,
}: CambiarPasswordInput): Promise<void> {
  if (newPassword.length < 8) {
    throw new Error("La nueva contraseña debe tener al menos 8 caracteres.");
  }
  if (currentPassword === newPassword) {
    throw new Error("La nueva contraseña no puede ser igual a la actual.");
  }

  const supabase = createClient();
  const { data: sessionData } = await supabase.auth.getUser();
  const email = sessionData.user?.email;
  if (!email) {
    throw new Error("No hay sesión activa.");
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword,
  });
  if (signInError) {
    throw new Error("La contraseña actual no es correcta.");
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (updateError) {
    throw new Error(updateError.message || "No se pudo actualizar la contraseña.");
  }
}
