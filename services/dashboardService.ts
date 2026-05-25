// Dashboard agregado — no hay endpoints específicos de dashboard en el backend,
// así que computamos los indicadores combinando datos reales:
//   - Estadísticas de personal: derivadas de GET /employees/findAll
//   - Alertas de contratos: derivadas de GET /administrative-data/contracts/find-all-contracts
//     y filtrando los que vencen en ≤ 30 días (HU3.2).
//   - Jerarquía departamental: derivada de GET /administrative-data/areas/find-all-areas
//
// Tolerante a 403 (un empleado sin permisos verá listas vacías en vez de error).

import { ApiError, ForbiddenError, apiGet } from "@/lib/api/client";
import { AREAS, CONTRACTS, EMPLOYEES, POSITIONS } from "@/lib/api/endpoints";
import type { ContratoBase } from "@/types/contrato";
import type { NodoOrg } from "@/types/orgChart";
import type { AreaDto } from "@/types/api/area";
import type { ContractDto } from "@/types/api/contract";
import type { EmployeeDto } from "@/types/api/employee";

/** Debug logging para diagnosticar problemas con datos del backend */
function debugLog(context: string, data: unknown): void {
  if (typeof window !== "undefined" && (window as any).__DEBUG_DASHBOARD) {
    console.log(`[Dashboard/${context}]`, data);
  }
}

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

/**
 * Normaliza respuestas del backend de dos formas:
 * 1. Array directo: [] → devuelve el array
 * 2. Respuesta paginada: {data: T[], meta: {...}} → devuelve data
 * 
 * CRÍTICO: El backend pagina con limit=10 por defecto.
 * Siempre pedir limit=1000 en queries para obtener todos los registros.
 */
function normalizePaginatedSafe<T>(input: unknown): T[] {
  debugLog("normalizePaginatedSafe:input", input);
  
  if (Array.isArray(input)) {
    debugLog("normalizePaginatedSafe:result", `Array directo (${input.length} items)`);
    return input as T[];
  }
  
  if (input && typeof input === "object") {
    const obj = input as Record<string, unknown>;
    
    // Backend responde {data: T[], meta: {...}}
    if (Array.isArray(obj.data)) {
      const itemCount = obj.data.length;
      const total = (obj as any).meta?.total ?? "?";
      debugLog("normalizePaginatedSafe:result", `Respuesta paginada (${itemCount} items, total: ${total})`);
      return obj.data as T[];
    }
    
    // Fallback: si responde directamente con estructura diferente
    if (Array.isArray(obj.results)) {
      return obj.results as T[];
    }
  }
  
  debugLog("normalizePaginatedSafe:warning", "Respuesta no es array ni estructura pagindada conocida");
  return [];
}

async function tryFetch<T>(
  context: string,
  fn: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    debugLog(`tryFetch:${context}:start`, "Iniciando fetch...");
    const result = await fn();
    debugLog(`tryFetch:${context}:success`, result);
    return result;
  } catch (err) {
    // 403: el usuario actual no tiene permisos para ver este dataset → devolvemos vacío.
    if (err instanceof ForbiddenError) {
      console.warn(`[dashboard/${context}] 403 Forbidden - usuario sin permisos`);
      return fallback;
    }
    if (err instanceof ApiError && err.status === 401) {
      console.warn(`[dashboard/${context}] 401 Unauthorized`);
      return fallback;
    }
    console.error(`[dashboard/${context}] Error obteniendo datos:`, err);
    debugLog(`tryFetch:${context}:error`, err);
    return fallback;
  }
}

export async function obtenerEstadisticas(): Promise<EstadisticaDashboard> {
  return tryFetch("obtenerEstadisticas", async () => {
    // CRÍTICO: el backend pagina con limit=10 por defecto.
    // Sin esto, las métricas del dashboard contarían solo los primeros 10 empleados.
    const raw = await apiGet<unknown>(EMPLOYEES.findAll, {
      query: { limit: 1000 },
    });
    
    const empleados = normalizePaginatedSafe<EmployeeDto>(raw);
    
    debugLog("obtenerEstadisticas:empleados_totales", empleados.length);
    debugLog("obtenerEstadisticas:sample_empleado", empleados[0]);
    
    // Contar por estado
    const personalActivo = empleados.filter((e) => e.status === "active").length;
    const suspendidos = empleados.filter((e) => e.status === "suspended").length;
    
    // Retirados en el año actual
    const currentYear = new Date().getFullYear();
    const retiradosYTD = empleados.filter((e) => {
      if (e.status !== "retired") return false;
      const ref = e.updated_at ?? e.created_at;
      if (!ref) return true;
      return new Date(ref).getFullYear() === currentYear;
    }).length;

    const stats = {
      personalActivo,
      variacionPersonalActivo: 0,
      suspendidos,
      estadoSuspendidos: suspendidos === 0 ? "Stable" as const : ("Up" as const),
      retiradosYTD,
      variacionRetirados: 0,
    };
    
    debugLog("obtenerEstadisticas:resultado", stats);
    return stats;
  }, {
    personalActivo: 0,
    variacionPersonalActivo: 0,
    suspendidos: 0,
    estadoSuspendidos: "Stable" as const,
    retiradosYTD: 0,
    variacionRetirados: 0,
  });
}

function diasHasta(fecha: string | null | undefined): number {
  if (!fecha) return Infinity; // Contratos sin fecha de fin → no alertar
  try {
    const fin = new Date(fecha).getTime();
    const hoy = new Date().getTime();
    return Math.ceil((fin - hoy) / (1000 * 60 * 60 * 24));
  } catch {
    return Infinity; // Fecha inválida → ignorar
  }
}

export async function obtenerAlertasContratos(): Promise<AlertaContrato[]> {
  return tryFetch("obtenerAlertasContratos", async () => {
    // Igual que en el resto del frontend: el backend pagina con limit=10 por
    // defecto. Pedimos 1000 para asegurar contar todas las alertas.
    const [contratosRaw, empleadosRaw] = await Promise.all([
      apiGet<unknown>(CONTRACTS.findAll, { query: { limit: 1000 } }),
      // Cargamos empleados en paralelo para resolver el `departamento` que el
      // backend de contracts no devuelve. Si el rol no tiene permiso para
      // findAll de empleados, queda en "" igual que antes (degradación graceful).
      apiGet<unknown>(EMPLOYEES.findAll, { query: { limit: 1000 } }).catch(() => null),
    ]);

    const contratos = normalizePaginatedSafe<ContractDto>(contratosRaw);
    const empleados = empleadosRaw 
      ? normalizePaginatedSafe<EmployeeDto>(empleadosRaw)
      : [];

    debugLog("obtenerAlertasContratos:contratos_totales", contratos.length);
    debugLog("obtenerAlertasContratos:empleados_totales", empleados.length);
    debugLog("obtenerAlertasContratos:sample_contrato", contratos[0]);

    // Map id_employee → nombre del área del cargo (si lo conocemos).
    const areaByEmployee = new Map<number, string>();
    for (const e of empleados) {
      const id = e.id ?? e.id_employee;
      const areaName = e.position?.area?.name;
      if (typeof id === "number" && areaName) areaByEmployee.set(id, areaName);
    }

    debugLog("obtenerAlertasContratos:areaByEmployee", Object.fromEntries(areaByEmployee));

    const alertas = contratos
      .filter((c) => {
        // Solo contratos vigentes (no expirados ni anulados)
        const status = (c.contract_status ?? c.status)?.toLowerCase() ?? "valid";
        return status !== "expired" && status !== "annulled";
      })
      .map<AlertaContrato | null>((c) => {
        const dias = diasHasta(c.end_date);
        
        // Solo alertar si vence en ≤ 30 días
        if (dias < 0 || dias > 30) return null;
        
        const employeeName = c.employee
          ? `${c.employee.first_name ?? ""} ${c.employee.last_name ?? ""}`.trim()
          : `Empleado #${c.id_employee}`;
          
        const alert: AlertaContrato = {
          idContrato: c.id ?? c.id_contract ?? 0,
          nombre: employeeName,
          codigoContrato: `CN-${String(c.id ?? c.id_contract ?? 0).padStart(4, "0")}`,
          departamento: areaByEmployee.get(c.id_employee) ?? "",
          diasRestantes: dias,
          condiciones: c.conditions,
          tipo: c.contract_type,
          vigencia: "vigente",
          fechaInicio: c.start_date,
          fechaFin: c.end_date,
        };
        return alert;
      })
      .filter((x): x is AlertaContrato => x !== null)
      .sort((a, b) => a.diasRestantes - b.diasRestantes);

    debugLog("obtenerAlertasContratos:alertas_finales", alertas.length);
    return alertas;
  }, []);
}

export async function obtenerJerarquiaDepartamental(): Promise<NodoOrg[]> {
  return tryFetch("obtenerJerarquiaDepartamental", async () => {
    // El backend devuelve empleados CON id_position pero SIN la relación position expandida.
    // Así que hacemos 3 fetches: areas, posiciones (para mapear id_position → id_area), y empleados.
    const [areasRaw, posicionesRaw, empleadosRaw] = await Promise.all([
      apiGet<unknown>(AREAS.findAll, { query: { limit: 1000 } }),
      apiGet<unknown>(POSITIONS.findAll, { query: { limit: 1000 } }),
      apiGet<unknown>(EMPLOYEES.findAll, { query: { limit: 1000 } }).catch(() => null),
    ]);

    const areas = normalizePaginatedSafe<AreaDto>(areasRaw);
    const posiciones = normalizePaginatedSafe<any>(posicionesRaw);
    const empleados = empleadosRaw 
      ? normalizePaginatedSafe<EmployeeDto>(empleadosRaw)
      : [];

    // Crea un mapa: id_position → id_area
    const posicionAreaMap = new Map<number, number>();
    for (const pos of posiciones) {
      const posId = pos.id ?? pos.id_position;
      const areaId = pos.id_area ?? pos.area?.id;
      if (typeof posId === "number" && typeof areaId === "number") {
        posicionAreaMap.set(posId, areaId);
      }
    }
    
    debugLog("obtenerJerarquiaDepartamental:posicion_area_map", Object.fromEntries(posicionAreaMap));

    // empleados por área (usando el mapa de posiciones)
    const empleadosPorArea = new Map<number, number>();
    for (const e of empleados) {
      const areaId = posicionAreaMap.get(e.id_position);
      if (typeof areaId === "number") {
        empleadosPorArea.set(areaId, (empleadosPorArea.get(areaId) ?? 0) + 1);
      }
    }

    debugLog("obtenerJerarquiaDepartamental:areas_totales", areas.length);
    debugLog("obtenerJerarquiaDepartamental:empleados_totales", empleados.length);
    debugLog("obtenerJerarquiaDepartamental:empleadosPorArea", 
      Object.fromEntries(empleadosPorArea)
    );

    const resultado = areas
      .map<NodoOrg | null>((a) => {
        // CRÍTICO: El área puede tener id o id_area (ambos opcionales)
        const areaId = a.id ?? a.id_area;
        
        // Si no hay ID válido, saltar esta área
        if (typeof areaId !== "number") {
          debugLog("obtenerJerarquiaDepartamental:skip_sin_id", `Área sin ID: ${a.name}`);
          return null;
        }

        return {
          id: String(areaId),
          nombre: a.name ?? "Sin nombre",
          nivel: "GESTION",
          estado: a.status === "active" ? "ACTIVO" : "INACTIVO",
          cantidadMiembros: empleadosPorArea.get(areaId) ?? 0,
          idPadre: null,
          descripcion: a.description,
          avatares: [],
          vacantes: a._count?.positions ?? a.positions_count ?? 0,
          utilizacionPresupuesto: 0,
          retencion: 0,
          lideres: [],
        };
      })
      .filter((x): x is NodoOrg => x !== null);

    debugLog("obtenerJerarquiaDepartamental:resultado", resultado);
    return resultado;
  }, []);
}
