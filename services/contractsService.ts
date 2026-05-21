// services/contractsService.ts
//
// Listado/Estadísticas de contratos para la vista global (/dashboard/contratos).
// Se apoya 100% en contratosService.ts + el endpoint /stats del backend.

import { apiGet, ForbiddenError } from "@/lib/api/client";
import { CONTRACTS } from "@/lib/api/endpoints";
import { normalizePaginated } from "@/types/api/common";
import { obtenerTodosLosContratos, type Contrato } from "@/services/contratosService";
import { obtenerEmpleados, type Empleado } from "@/services/empleadosService";
import type { ContractDto, ContractStats } from "@/types/api/contract";
import type {
  ContratoUI,
  EstadisticasContratos,
  EstadoContratoUI,
  TipoContrato as TipoContratoUI,
} from "@/types/contract";

const TIPO_UI: Record<Contrato["tipo"], TipoContratoUI> = {
  FIJO: "Término Fijo",
  INDEFINIDO: "Término Indefinido",
  SERVICIO: "Servicio",
  TIEMPO_PARCIAL: "Pasantía",
};

const ESTADO_UI: Record<Contrato["estado"], EstadoContratoUI> = {
  ACTIVO: "Activo",
  RENOVADO: "Renovado",
  EXPIRADO: "Vencido",
  ANULADO: "Anulado",
};

function avatar(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");
}

function validezTexto(c: Contrato): { texto: string; porcentaje: number } {
  if (c.estado === "ANULADO") return { texto: "Anulado", porcentaje: 100 };
  if (c.estado === "RENOVADO") return { texto: "Renovado", porcentaje: 60 };
  if (!c.fechaFin) return { texto: "En curso - Sin vencimiento", porcentaje: 50 };

  const fin = new Date(c.fechaFin).getTime();
  const inicio = new Date(c.fechaInicio).getTime();
  const hoy = Date.now();
  const totalMs = Math.max(fin - inicio, 1);
  const consumidoMs = Math.min(Math.max(hoy - inicio, 0), totalMs);
  const porcentaje = Math.round((consumidoMs / totalMs) * 100);
  const diasRestantes = Math.ceil((fin - hoy) / (1000 * 60 * 60 * 24));
  const texto = diasRestantes <= 0 ? `Vencido hace ${Math.abs(diasRestantes)} días`
    : `${diasRestantes} días restantes`;
  return { texto, porcentaje };
}

export async function obtenerEstadisticasContratos(): Promise<EstadisticasContratos> {
  try {
    const stats = await apiGet<ContractStats>(CONTRACTS.stats);
    return {
      activos: stats.activos ?? stats.valid ?? 0,
      proxAVencer: stats.proxAVencer ?? stats.expiring_soon ?? 0,
      renovados: stats.renovados ?? 0,
      vencidosAnulados: stats.vencidosAnulados ?? stats.expired ?? 0,
    };
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return { activos: 0, proxAVencer: 0, renovados: 0, vencidosAnulados: 0 };
    }
    throw err;
  }
}

export async function obtenerContratos(): Promise<ContratoUI[]> {
  let contratos: Contrato[] = [];
  let empleados: Empleado[] = [];
  try {
    [contratos, empleados] = await Promise.all([
      obtenerTodosLosContratos(),
      obtenerEmpleados().catch(() => []),
    ]);
  } catch (err) {
    if (err instanceof ForbiddenError) return [];
    throw err;
  }

  const empleadoById = new Map(empleados.map((e) => [e.id, e]));

  return contratos.map<ContratoUI>((c) => {
    const emp = empleadoById.get(c.idEmpleado);
    const nombre = emp ? `${emp.nombre} ${emp.apellidos}`.trim() : `Empleado #${c.idEmpleado}`;
    const { texto, porcentaje } = validezTexto(c);
    return {
      idContrato: c.rawId,
      funcionario: {
        nombre,
        idContrato: `CN-${String(c.rawId).padStart(4, "0")}`,
        avatar: avatar(nombre),
      },
      tipoUI: TIPO_UI[c.tipo],
      area: emp?.departamento ?? "",
      condiciones: c.notas,
      tipo: c.tipo,
      vigencia: c.estado === "EXPIRADO" || c.estado === "ANULADO" ? "no_vigente" : "vigente",
      fechaInicio: c.fechaInicio,
      fechaFin: c.fechaFin ?? "-",
      estadoUI: ESTADO_UI[c.estado],
      validezTexto: texto,
      validezPorcentaje: porcentaje,
    };
  });
}
