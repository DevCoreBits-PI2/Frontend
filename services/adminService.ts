// Servicio de administradores.
//
// Endpoints (todos requieren AuthGuard + RoleGuard → sólo admins):
//   POST   /api/admin/create-admin
//   GET    /api/admin/admin                (lista todos los admins)
//   GET    /api/admin/:id                  (admin por id numérico — preferido por el equipo backend)
//   GET    /api/admin/blockUser/:id
//   GET    /api/admin/unblockUser/:id
//   GET    /api/admin/suspendEmployee/:id
//   GET    /api/admin/resendInvitation/:id
//
// El JWT trae el `supabase_user_id` (UUID) pero no el `administrators.id`
// numérico. Para usar `GET /api/admin/:id` necesitamos resolverlo primero:
// `obtenerAdminActual(uuid)` lista los admins (sólo admins pueden hacerlo),
// busca el match por `supabase_user_id` y devuelve el registro completo
// usando el endpoint preferido por el backend.

import { ApiError, ForbiddenError, apiGet, apiPost } from "@/lib/api/client";
import { ADMIN } from "@/lib/api/endpoints";
import { normalizePaginated } from "@/types/api/common";
import type { AdminDto, CreateAdminPayload } from "@/types/api/admin";

export const listarAdministradores = async (): Promise<AdminDto[]> => {
  const data = await apiGet<unknown>(ADMIN.findAll);
  return normalizePaginated<AdminDto>(data);
};

export const obtenerAdminPorId = (id: number | string): Promise<AdminDto> =>
  apiGet<AdminDto>(ADMIN.findOne(id));

/**
 * Resuelve y verifica el administrador correspondiente al usuario logueado.
 *
 * Flujo (alineado con la regla del backend de usar `GET /api/admin/:id` como
 * fuente de verdad para datos de admin):
 *   1. Lista los admins → busca el que tenga el `supabase_user_id` recibido.
 *   2. Si lo encuentra, llama `GET /api/admin/:id` con el id numérico
 *      → devuelve el registro confirmado por el endpoint preferido.
 *   3. Si no existe en la tabla `administrators`, devuelve `null`.
 *
 * @returns El AdminDto verificado o `null` si el usuario no es admin en la DB.
 */
export const obtenerAdminActual = async (
  supabaseUserId: string,
): Promise<AdminDto | null> => {
  try {
    const admins = await listarAdministradores();
    const match = admins.find((a) => a.supabase_user_id === supabaseUserId);
    console.log(match?.id);
    if (!match) return null;
    return await obtenerAdminPorId(match.id);
  } catch (err) {
    // 403 = el JWT no marca al usuario como admin → no es admin del sistema.
    // 401 = sesión inválida (lo maneja el cliente HTTP más arriba).
    if (err instanceof ForbiddenError) return null;
    if (err instanceof ApiError && err.status === 401) return null;
    throw err;
  }
};

export const crearAdministrador = (payload: CreateAdminPayload) =>
  apiPost<AdminDto>(ADMIN.create, payload);

export const bloquearUsuario = (id: number | string) =>
  apiGet<void>(ADMIN.block(id));

export const desbloquearUsuario = (id: number | string) =>
  apiGet<void>(ADMIN.unblock(id));

export const suspenderEmpleado = (id: number | string) =>
  apiGet<void>(ADMIN.suspend(id));

export const reenviarInvitacion = (id: number | string) =>
  apiGet<void>(ADMIN.resendInvitation(id));
