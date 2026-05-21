// Dashboard agregado — no hay endpoints específicos de dashboard en el backend,
// así que computamos los indicadores combinando datos reales:
//   - Estadísticas de personal: derivadas de GET /employees/findAll
//   - Alertas de contratos: derivadas de GET /administrative-data/contracts/find-all-contracts
//     y filtrando los que vencen en ≤ 30 días (HU3.2).
//   - Jerarquía departamental: derivada de GET /administrative-data/areas/find-all-areas
//
// Tolerante a 403 (un empleado sin permisos verá listas vacías en vez de error).

import { ApiError, ForbiddenError, apiGet } from "@/lib/api/client";
import { AREAS, CONTRACTS, EMPLOYEES } from "@/lib/api/endpoints";
import { normalizePaginated } from "@/types/api/common";
import type { ContratoBase } from "@/types/contrato";
import type { NodoOrg } from "@/types/orgChart";
import type { AreaDto } from "@/types/api/area";
import type { ContractDto } from "@/types/api/contract";
import type { EmployeeDto } from "@/types/api/employee";

export interface EstadisticaDashboard {
  personalActivo: number;
  variacionPersonalActivo: number;
  suspendidos: number;
  estadoSuspendidos: "Stable" | "Up" | "Down";
  retiradosYTD: number;
  variacionRetirados: number;
}

export interface AlertaContrato extends ContratoBase {
  nombre: string;
  codigoContrato: string;
  departamento: string;
  diasRestantes: number;
}

async function tryFetch<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    // 403: el usuario actual no tiene permisos para ver este dataset → devolvemos vacío.
    if (err instanceof ForbiddenError) return fallback;
    if (err instanceof ApiError && err.status === 401) return fallback;
    console.warn("[dashboard] error obteniendo datos:", err);
    return fallback;
  }
}

export async function obtenerEstadisticas(): Promise<EstadisticaDashboard> {
  return tryFetch(async () => {
    const raw = await apiGet<unknown>(EMPLOYEES.findAll);
    const empleados = normalizePaginated<EmployeeDto>(raw);

    const personalActivo = empleados.filter((e) => e.status === "active").length;
    const suspendidos = empleados.filter((e) => e.status === "suspended").length;

    const currentYear = new Date().getFullYear();
    const retiradosYTD = empleados.filter((e) => {
      if (e.status !== "retired") return false;
      const ref = e.updated_at ?? e.created_at;
      if (!ref) return true;
      return new Date(ref).getFullYear() === currentYear;
    }).length;

    return {
      personalActivo,
      variacionPersonalActivo: 0,
      suspendidos,
      estadoSuspendidos: suspendidos === 0 ? "Stable" : "Up",
      retiradosYTD,
      variacionRetirados: 0,
    };
  }, {
    personalActivo: 0,
    variacionPersonalActivo: 0,
    suspendidos: 0,
    estadoSuspendidos: "Stable" as const,
    retiradosYTD: 0,
    variacionRetirados: 0,
  });
}

function diasHasta(fecha: string): number {
  const fin = new Date(fecha).getTime();
  const hoy = new Date().getTime();
  return Math.ceil((fin - hoy) / (1000 * 60 * 60 * 24));
}

export async function obtenerAlertasContratos(): Promise<AlertaContrato[]> {
  return tryFetch(async () => {
    const raw = await apiGet<unknown>(CONTRACTS.findAll, { query: { limit: 100 } });
    const contratos = normalizePaginated<ContractDto>(raw);

    return contratos
      .filter((c) => c.end_date && (c.contract_status ?? c.status) !== "expired")
      .map<AlertaContrato | null>((c) => {
        const dias = diasHasta(c.end_date);
        if (dias < 0 || dias > 30) return null;
        const employeeName = c.employee
          ? `${c.employee.first_name ?? ""} ${c.employee.last_name ?? ""}`.trim()
          : `Empleado #${c.id_employee}`;
        return {
          idContrato: c.id ?? c.id_contract ?? 0,
          nombre: employeeName,
          codigoContrato: `CN-${String(c.id ?? c.id_contract ?? 0).padStart(4, "0")}`,
          departamento: "",
          diasRestantes: dias,
          condiciones: c.conditions,
          tipo: c.contract_type,
          vigencia: "vigente",
          fechaInicio: c.start_date,
          fechaFin: c.end_date,
        };
      })
      .filter((x): x is AlertaContrato => x !== null)
      .sort((a, b) => a.diasRestantes - b.diasRestantes);
  }, []);
}

export async function obtenerJerarquiaDepartamental(): Promise<NodoOrg[]> {
  return tryFetch(async () => {
    const raw = await apiGet<unknown>(AREAS.findAll, { query: { limit: 100 } });
    const areas = normalizePaginated<AreaDto>(raw);

    return areas.map<NodoOrg>((a) => ({
      id: String(a.id),
      nombre: a.name,
      nivel: "GESTION",
      estado: a.status === "active" ? "ACTIVO" : "INACTIVO",
      cantidadMiembros: a._count?.positions ?? a.positions_count ?? 0,
      idPadre: null,
      descripcion: a.description,
      avatares: [],
      vacantes: 0,
      utilizacionPresupuesto: 0,
      retencion: 0,
      lideres: [],
    }));
  }, []);
}
