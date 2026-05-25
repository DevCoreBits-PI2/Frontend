// Persistencia de avatar — backend (Cloudinary) como única fuente de verdad.
//
// Endpoint: PATCH /employees/upload-profile-image  (multipart/form-data, `file`)
// El backend resuelve el empleado destino desde el JWT, sube a Cloudinary y
// persiste `photo_url` y `public_id` en el registro del empleado. La nueva
// URL se obtiene re-fetchando el perfil (`obtenerPerfilUsuario`).
//
// Antes este módulo guardaba copia local en localStorage cuando el backend
// fallaba. Esa estrategia se quitó por pedido explícito: la foto vive solo
// en backend, no en el navegador.
//
// Se mantienen `getStoredAvatarFor` y `clearLocalAvatar` como helpers compat
// para no romper callers, pero ya no leen ni escriben localStorage para
// uploads nuevos. `clearLocalAvatar` se sigue ofreciendo para purgar restos
// de la implementación antigua.

import { ApiError, apiRequest } from "@/lib/api/client";
import { EMPLOYEES } from "@/lib/api/endpoints";

const LS_PREFIX = "avatar-data:";

export interface SaveAvatarResult {
  /** URL pública (https://) devuelta por Cloudinary. Puede venir `null` si el
   *  backend confirmó la subida pero no incluyó la URL en la respuesta
   *  (caso actual de users-ms, que devuelve solo `{ id_employee }`). En ese
   *  caso, el caller debe re-fetchear el perfil para obtener `photo_url`. */
  publicUrl: string | null;
  /** Siempre `false`. Se mantiene en la interfaz por compatibilidad. */
  localOnly: false;
}

/** Shape posible de la respuesta del backend de upload. */
interface UploadResponse {
  id_employee?: number;
  photo_url?: string;
  photoUrl?: string;
  secure_url?: string;
  url?: string;
  employee?: { photo_url?: string };
  data?: { photo_url?: string; secure_url?: string };
}

function extractUrl(resp: UploadResponse | null | undefined): string | null {
  if (!resp) return null;
  return (
    resp.photo_url ??
    resp.photoUrl ??
    resp.secure_url ??
    resp.url ??
    resp.employee?.photo_url ??
    resp.data?.photo_url ??
    resp.data?.secure_url ??
    null
  );
}

/** El backend confirma éxito devolviendo `{ id_employee }` aunque la URL no
 *  viaje en la respuesta. */
function isUploadSuccess(resp: UploadResponse | null | undefined): boolean {
  if (!resp) return false;
  return typeof resp.id_employee === "number" || !!extractUrl(resp);
}

/**
 * Sube la imagen al backend (Cloudinary). Si falla, lanza error — no hay
 * fallback local. La foto vive en Cloudinary, no en el navegador.
 */
export async function saveAvatar(file: File): Promise<SaveAvatarResult> {
  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo debe ser una imagen.");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("La imagen no puede pesar más de 5 MB.");
  }

  const form = new FormData();
  form.append("file", file);

  try {
    const resp = await apiRequest<UploadResponse>(EMPLOYEES.uploadProfileImage, {
      method: "PATCH",
      body: form,
    });
    if (!isUploadSuccess(resp)) {
      throw new Error("El servidor no confirmó la subida de la imagen.");
    }
    // Si subió bien al backend, limpiamos cualquier shadow local que hubiera
    // quedado de la implementación anterior. Así no muestra una foto vieja
    // al render siguiente.
    await purgeLocalShadow();
    return { publicUrl: extractUrl(resp), localOnly: false };
  } catch (err) {
    if (err instanceof ApiError) {
      throw new Error(err.message || "No se pudo subir la foto al servidor.");
    }
    throw err instanceof Error
      ? err
      : new Error("No se pudo subir la foto al servidor.");
  }
}

async function tryGetSupabaseUserId(): Promise<string | null> {
  try {
    const { createClient } = await import("@/utils/supabase/client");
    const { data } = await createClient().auth.getUser();
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

async function purgeLocalShadow(): Promise<void> {
  if (typeof window === "undefined") return;
  const userId = await tryGetSupabaseUserId();
  if (!userId) return;
  try {
    localStorage.removeItem(LS_PREFIX + userId);
  } catch {
    // ignorar
  }
}

/**
 * Compat. La foto vive en backend, así que devolvemos siempre el `fallback`
 * (que es la `photo_url` proveniente del perfil cargado). Se mantiene la
 * firma para no romper callers existentes.
 */
export function getStoredAvatarFor(_userId: string | null, fallback: string): string {
  return fallback;
}

/** Limpia cualquier copia local antigua (de la implementación vieja). */
export function clearLocalAvatar(userId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(LS_PREFIX + userId);
  } catch {
    // ignorar
  }
}
