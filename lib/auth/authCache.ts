// Cache module-level del usuario autenticado, alimentado por AuthContext.
//
// Los services (que no son React components) no pueden leer el AuthContext
// directamente. Este módulo expone un snapshot mínimo del rol para que los
// services decidan si vale la pena intentar endpoints restringidos a HT/Admin
// o si conviene saltar directo al fallback público. Evita disparar requests
// que el navegador loguearía como `403 (Forbidden)` en la consola — molesto
// y confuso aunque la app funcione gracias al fallback.

import type { AuthUserContext } from "./roles";
import { isHumanTalent } from "./roles";

let current: AuthUserContext | null = null;

export function setCurrentAuthUser(user: AuthUserContext | null): void {
  current = user;
}

export function getCurrentAuthUser(): AuthUserContext | null {
  return current;
}

/**
 * `true` si el usuario actual puede llamar `GET /employees/findAll` sin recibir
 * un 403. El backend lo restringe ESTRICTAMENTE a HumanTalent (Assistant/Lead);
 * los Admins también reciben 403 porque no aparecen en `@Positions(...)` del
 * guard. Por eso aquí NO incluimos `isAdmin`.
 *
 * IMPORTANTE: defaultea a `false` cuando aún no se ha cargado el authUser, para
 * NO disparar requests privilegiados durante el bootstrap (que loguearían un
 * 403 ruidoso en consola). Los servicios que usan este helper tienen un
 * fallback público (positions-tree) que funciona para cualquier autenticado.
 */
export function canCallPrivilegedEmployeeEndpoints(): boolean {
  if (!current) return false;
  return isHumanTalent(current.position);
}
