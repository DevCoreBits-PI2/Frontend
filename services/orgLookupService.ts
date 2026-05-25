// Helpers compartidos para resolver "quién ocupa un cargo" a partir del id.
//
// Usamos siempre `GET /positions/positions-tree` (público — sin AuthGuard) en
// vez de `GET /employees/findAll?id_position=<id>` porque este último tiene
// un guard `@Positions(HumanTalentLead, HumanTalentAssistant)` que, en la
// práctica, rechaza incluso a roles que el frontend cree autorizados (el
// backend lee el position desde otro lugar y a veces no coincide con lo que
// el frontend infiere). Eso producía 403 ruidosos en consola.
//
// Trade-off del camino único: positions-tree solo trae empleados con
// `status='active'` y a lo sumo 1 por cargo (lo arma con un Map). Para
// "quién ocupa este cargo" en UI es suficiente.

import { apiGet } from "@/lib/api/client";
import { POSITIONS } from "@/lib/api/endpoints";

export interface OcupanteCargo {
  /** id_employee del backend (employees.id). Útil para setear `id_manager`
   *  cuando se invita a un subordinado de este cargo. null si solo lo
   *  pudimos resolver vía positions-tree (que no expone el id). */
  id: number | null;
  /** id_position del cargo que ocupa. */
  idPosition: number;
  firstName: string;
  lastName: string;
  fullName: string;
}

/**
 * Devuelve el empleado activo que ocupa el cargo indicado, según
 * `positions-tree`. Si el cargo está vacío o el ocupante no es active,
 * retorna `null`.
 */
export async function findEmpleadoEnCargo(
  idPosition: number,
): Promise<OcupanteCargo | null> {
  try {
    type FlatNode = {
      id_position: number;
      employee?: {
        id?: number;
        id_employee?: number;
        first_name?: string;
        last_name?: string;
      } | null;
    };

    const raw = await apiGet<unknown>(POSITIONS.tree);
    const list: FlatNode[] = Array.isArray(raw)
      ? (raw as FlatNode[])
      : Array.isArray((raw as { data?: unknown }).data)
        ? ((raw as { data: FlatNode[] }).data)
        : [];

    const node = list.find((p) => p.id_position === idPosition);
    if (!node?.employee) return null;

    const firstName = node.employee.first_name ?? "";
    const lastName = node.employee.last_name ?? "";
    const fullName = `${firstName} ${lastName}`.trim();
    if (!fullName) return null;

    return {
      id: node.employee.id ?? node.employee.id_employee ?? null,
      idPosition,
      firstName,
      lastName,
      fullName,
    };
  } catch {
    return null;
  }
}
