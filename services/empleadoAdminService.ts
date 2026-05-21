// Operaciones administrativas sobre empleados (cambio de estado, etc.).
//
// El cambio de estado usa /employees/updateEmployee/:id (PATCH) que requiere rol
// HumanTalent o Admin. El "motivo" se persiste como evento en el historial de
// carrera para mantener trazabilidad (HU2.3).

import { Empleado, dtoToEmpleado, statusToBackend, EstadoEmpleado } from "@/services/empleadosService";
import { apiGet, apiPatch, apiPost } from "@/lib/api/client";
import { CAREER_HISTORY, EMPLOYEES } from "@/lib/api/endpoints";
import type { EmployeeDto } from "@/types/api/employee";

export async function obtenerEmpleadoAdmin(id: string): Promise<Empleado | null> {
  try {
    const dto = await apiGet<EmployeeDto>(EMPLOYEES.findOne(id));
    return dtoToEmpleado(dto);
  } catch {
    return null;
  }
}

export async function cambiarEstadoEmpleado(
  id: string,
  nuevoEstado: EstadoEmpleado,
  motivo: string,
): Promise<Empleado> {
  // 1) Obtener empleado actual para construir el payload de updateEmployee (requiere id_employee + status).
  const actual = await apiGet<EmployeeDto>(EMPLOYEES.findOne(id));

  // 2) Actualizar estado.
  const updated = await apiPatch<EmployeeDto>(EMPLOYEES.updateEmployee(id), {
    id_employee: actual.id ?? actual.id_employee ?? Number(id),
    status: statusToBackend(nuevoEstado),
    id_position: actual.id_position,
    id_manager: actual.id_manager,
  });

  // 3) Registrar evento en historial laboral para trazabilidad (no bloqueante).
  try {
    await apiPost(CAREER_HISTORY.create, {
      description: motivo || `Cambio de estado a ${nuevoEstado}`,
      event_date: new Date().toISOString().slice(0, 10),
      type: "contract_modification",
      id_employee: actual.id ?? actual.id_employee ?? Number(id),
    });
  } catch (err) {
    console.warn("[empleadoAdmin] no se pudo registrar el evento en historial:", err);
  }

  return dtoToEmpleado(updated);
}
