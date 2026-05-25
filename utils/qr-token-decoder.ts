/**
 * Decodificador de tokens JWT para QR.
 * Extrae información del payload sin validar la firma (es un JWT temporal del servidor).
 */

interface QrTokenPayload {
  employeeId?: number;
  purpose?: string;
  exp?: number;
}

/**
 * Decodifica un JWT sin validar la firma.
 * El token debe tener formato: header.payload.signature
 */
export function decodeQrToken(token: string): QrTokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      console.warn("[qr-decoder] Token no tiene formato JWT válido");
      return null;
    }

    const payload = parts[1];
    // Agregar padding si es necesario (base64 requiere múltiples de 4)
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    const decoded = atob(padded);
    return JSON.parse(decoded) as QrTokenPayload;
  } catch (error) {
    console.error("[qr-decoder] Error decodificando token:", error);
    return null;
  }
}

/**
 * Obtiene el employeeId del token QR, si existe.
 */
export function getEmployeeIdFromQrToken(token: string): number | null {
  const payload = decodeQrToken(token);
  return payload?.employeeId ?? null;
}

/**
 * Verifica si el token ha expirado.
 */
export function isQrTokenExpired(token: string): boolean {
  const payload = decodeQrToken(token);
  if (!payload?.exp) return false;

  const expiresAt = payload.exp * 1000; // convertir a ms
  return Date.now() > expiresAt;
}
