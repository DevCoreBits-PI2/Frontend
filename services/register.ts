// Invitación de un nuevo empleado (alias histórico).
// Usa el cliente central con bearer token; el endpoint exige HumanTalent | Admin.

import { apiPost } from "@/lib/api/client";
import { EMPLOYEES } from "@/lib/api/endpoints";
import type { EmployeeDto, InviteUserPayload } from "@/types/api/employee";

export const registerUser = async (data: InviteUserPayload): Promise<EmployeeDto> =>
  apiPost<EmployeeDto>(EMPLOYEES.invite, data);
