// Configura la contraseña del primer login y marca el flag en el backend.

import { apiPatch } from "@/lib/api/client";
import { EMPLOYEES } from "@/lib/api/endpoints";
import { createClient } from "@/utils/supabase/client";

export async function updatePassword(password: string) {
  const supabase = createClient();

  // 1. Actualizar contraseña en Supabase.
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;

  // 2. Obtener usuario actual.
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) throw new Error("Usuario no encontrado");

  // 3. Notificar al backend que se completó el primer login.
  // apiPatch envía el bearer token automáticamente.
  await apiPatch(EMPLOYEES.completeFirstLogin(user.id));
}
