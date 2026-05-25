// Verifica si el empleado necesita configurar contraseña por primera vez.
// Usa el cliente central porque el endpoint exige bearer token.

import { apiGet } from "@/lib/api/client";
import { EMPLOYEES } from "@/lib/api/endpoints";

export interface FirstTimeSetupResponse {
  mustSetPassword?: boolean;
  // Cualquier metadatos extra que entregue el backend.
  [key: string]: unknown;
}

export const checkFirstLogin = async (id: string): Promise<FirstTimeSetupResponse> =>
  apiGet<FirstTimeSetupResponse>(EMPLOYEES.firstTimeSetup(id));
