// Persistencia de avatar.
//
// Estrategia: intentamos Supabase Storage (bucket "avatars" público); si no
// existe, hacemos fallback automático a localStorage como data URL, indexado
// por supabase_user_id. Así el usuario ve su foto al menos en el navegador
// donde la subió, sin tener que tocar configuración de Supabase.
//
// Lectura: `getStoredAvatar(userId, fallback)` devuelve la URL local primero
// (más reciente) y si no hay nada, la del backend.

import { createClient } from "@/utils/supabase/client";

const AVATARS_BUCKET = "avatars";
const LS_PREFIX = "avatar-data:";
const LS_BUCKET_SKIP = "avatar-bucket-skip";

function shouldSkipBucket(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(LS_BUCKET_SKIP) === "1";
  } catch {
    return false;
  }
}

function markBucketSkip(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_BUCKET_SKIP, "1");
  } catch {
    // ignorar
  }
}

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function extensionFor(file: File): string {
  const fromMime = MIME_TO_EXT[file.type];
  if (fromMime) return fromMime;
  const fromName = file.name.split(".").pop();
  return fromName && fromName.length <= 5 ? fromName.toLowerCase() : "bin";
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("No se pudo leer la imagen."));
    };
    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
    reader.readAsDataURL(file);
  });
}

export interface SaveAvatarResult {
  /** URL aceptable por el backend (https://) o `null` si no hay URL pública. */
  publicUrl: string | null;
  /** True cuando la foto se guardó solo en localStorage, no en Storage. */
  localOnly: boolean;
}

function getSupabase() {
  return createClient();
}

async function getCurrentUserId(): Promise<string> {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("No hay sesión activa.");
  return data.user.id;
}

/**
 * Guarda el archivo intentando Supabase Storage; si el bucket no existe o el
 * usuario no tiene permisos, hace fallback a localStorage.
 */
export async function saveAvatar(file: File): Promise<SaveAvatarResult> {
  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo debe ser una imagen.");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("La imagen no puede pesar más de 5 MB.");
  }

  const userId = await getCurrentUserId();

  // 1) Intentar Supabase Storage — solo si no marcamos antes que el bucket no
  //    existe (así no llenamos la consola con 400s en cada intento).
  if (!shouldSkipBucket()) {
    try {
      const supabase = getSupabase();
      const path = `${userId}/${Date.now()}.${extensionFor(file)}`;
      const { error: uploadError } = await supabase.storage
        .from(AVATARS_BUCKET)
        .upload(path, file, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.type,
        });

      if (!uploadError) {
        const { data: publicData } = supabase.storage
          .from(AVATARS_BUCKET)
          .getPublicUrl(path);
        if (publicData?.publicUrl) {
          // Si la subida sirvió, limpiamos cualquier fallback local previo para
          // evitar mostrar una foto vieja en lugar de la nueva del backend.
          clearLocalAvatar(userId);
          return { publicUrl: publicData.publicUrl, localOnly: false };
        }
      } else {
        // 400/404 → el bucket no existe o no tenemos permisos. Marcamos para
        // saltar intentos posteriores en esta sesión.
        markBucketSkip();
      }
    } catch {
      markBucketSkip();
    }
  }

  // 2) Fallback: data URL en localStorage
  const dataUrl = await readFileAsDataUrl(file);
  try {
    localStorage.setItem(LS_PREFIX + userId, dataUrl);
  } catch (err) {
    // El cuota de localStorage es ~5MB. Si la imagen es muy grande, falla aquí.
    throw new Error(
      "No se pudo guardar la foto en este dispositivo (la imagen es muy grande o el navegador bloqueó localStorage).",
    );
  }
  return { publicUrl: null, localOnly: true };
}

/** Devuelve la URL para mostrar el avatar: localStorage primero, si no, fallback. */
export function getStoredAvatarFor(userId: string | null, fallback: string): string {
  if (!userId || typeof window === "undefined") return fallback;
  try {
    return localStorage.getItem(LS_PREFIX + userId) ?? fallback;
  } catch {
    return fallback;
  }
}

export function clearLocalAvatar(userId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(LS_PREFIX + userId);
  } catch {
    // ignorar
  }
}
