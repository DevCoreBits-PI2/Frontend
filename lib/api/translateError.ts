// Traducciones de mensajes técnicos que el backend (Prisma + class-validator)
// emite en inglés. La estrategia es match por substring (case-insensitive) y
// devolver la versión en español. Si no hay match, devuelve el mensaje original
// para no perder información.
//
// Esta función es defensiva: pensada para usarse en catch blocks de los
// services antes de propagar el error al UI vía toast.

const RULES: Array<{ match: RegExp; es: string }> = [
  // Contratos
  { match: /already has an active contract|overlapping/i, es: "Este empleado ya tiene un contrato activo que se solapa con las fechas elegidas." },
  { match: /end date must be after start date/i, es: "La fecha de fin debe ser posterior a la de inicio." },
  { match: /end date is required/i, es: "Este tipo de contrato requiere una fecha de fin." },
  { match: /cannot be modified/i, es: "Este contrato ya no se puede modificar (está expirado, renovado o anulado)." },
  { match: /indefinite-term contracts cannot be renewed/i, es: "Los contratos indefinidos no se pueden renovar (no tienen fecha de fin)." },
  { match: /only active contracts can be renewed/i, es: "Solo se pueden renovar contratos en estado activo." },
  { match: /contract cannot be deleted because it has been renewed/i, es: "No se puede eliminar un contrato que fue renovado: forma parte del historial laboral." },

  // Posiciones
  { match: /position name must be between/i, es: "El nombre del cargo debe tener entre 3 y 100 caracteres." },
  { match: /position with this name already exists/i, es: "Ya existe un cargo con ese nombre en el área seleccionada." },
  { match: /position cannot be its own parent/i, es: "Un cargo no puede ser su propio cargo superior." },
  { match: /parent position with id.*not found/i, es: "El cargo superior seleccionado no existe." },
  { match: /parent position must be active/i, es: "El cargo superior debe estar activo." },
  { match: /circular reference/i, es: "Esta jerarquía generaría un ciclo (un cargo no puede depender de uno de sus subordinados)." },

  // Áreas
  { match: /area name must be between/i, es: "El nombre del área debe tener entre 3 y 100 caracteres." },
  { match: /area with this name already exists/i, es: "Ya existe un área con ese nombre." },

  // Empleados
  { match: /no se ha encontrado registro del funcionario/i, es: "No se encontró el empleado en el sistema." },
  { match: /no se ha encontrado perfil asociado a este usuario/i, es: "No se encontró tu perfil de empleado. Contacta a Talento Humano." },
  { match: /ya existe un usuario con ese correo/i, es: "Ya existe un usuario registrado con ese correo." },
  { match: /value.*is out of range for type integer/i, es: "Uno de los valores numéricos excede el máximo permitido por el sistema (probablemente el número de documento)." },

  // Permisos genéricos
  { match: /insufficient employee access/i, es: "No tenés permisos para ver o modificar este empleado." },
  { match: /forbidden|no tiene permisos/i, es: "No tenés permisos para realizar esta acción." },
  { match: /unauthorized|no autorizado/i, es: "Tu sesión expiró o no es válida. Inicia sesión de nuevo." },

  // Auth / OTP
  { match: /signups not allowed/i, es: "No hay una cuenta con ese correo. Confirma con tu administrador." },
  { match: /token has expired|otp expired/i, es: "El código expiró. Solicita uno nuevo." },
  { match: /invalid otp|otp invalid/i, es: "El código es incorrecto." },
  { match: /rate limit|too many/i, es: "Demasiados intentos. Esperá unos minutos antes de reintentar." },
];

/**
 * Traduce un error técnico del backend a un mensaje en español user-friendly.
 * Si el error no matchea ninguna regla, devuelve el mensaje original.
 *
 * Uso típico:
 *   } catch (err) {
 *     const raw = err instanceof Error ? err.message : "";
 *     toast.error(translateBackendError(raw) || "Algo salió mal.");
 *   }
 */
export function translateBackendError(rawMsg: string): string {
  if (!rawMsg) return "";
  for (const rule of RULES) {
    if (rule.match.test(rawMsg)) return rule.es;
  }
  return rawMsg;
}
