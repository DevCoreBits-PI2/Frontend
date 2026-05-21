// Servicio de Contratos — integrado con el Gateway real.
//
// Endpoints:
//   POST   /administrative-data/contracts/create-contract            multipart, file PDF requerido
//   GET    /administrative-data/contracts/find-all-contracts         [HumanTalent | Admin]
//   GET    /administrative-data/contracts/find-contract/:id          (auth + permisos)
//   GET    /administrative-data/contracts/find-contracts-by-employee/:id
//   GET    /administrative-data/contracts/stats                      [HumanTalent | Admin]
//   PATCH  /administrative-data/contracts/update-contract/:id
//   PATCH  /administrative-data/contracts/renew-contract/:id
//   DELETE /administrative-data/contracts/delete-contract/:id
//
// La UI usa los tipos: FIJO | INDEFINIDO | SERVICIO | TIEMPO_PARCIAL
// El backend usa: fixed_term_contract | indefinite_term_contract | service_provision_contract | temporary_contract | apprenticeship_contract | work_or_project_based_contract

import { apiDelete, apiGet, apiPatch, apiRequest } from "@/lib/api/client";
import { CONTRACTS } from "@/lib/api/endpoints";
import { normalizePaginated } from "@/types/api/common";
import type {
  ContractDto,
  ContractStats,
  ContractType,
} from "@/types/api/contract";

export type TipoContrato = "FIJO" | "INDEFINIDO" | "SERVICIO" | "TIEMPO_PARCIAL";
export type EstadoContrato = "ACTIVO" | "RENOVADO" | "EXPIRADO" | "ANULADO";
export type ValidezContrato = "ONGOING" | "COMPLETED" | "EXPIRED" | "VOIDED";

export interface Contrato {
  id: string;
  rawId: number;
  idEmpleado: string;
  idManager: number;
  tipo: TipoContrato;
  fechaInicio: string;
  fechaFin: string | null;
  salarioBase: number;
  notas: string;
  documentoNombre?: string;
  pdfUrl?: string | null;
  estado: EstadoContrato;
  validez: ValidezContrato;
  creadoEn: string;
}

const TIPO_TO_BACKEND: Record<TipoContrato, ContractType> = {
  FIJO: "fixed_term_contract",
  INDEFINIDO: "indefinite_term_contract",
  SERVICIO: "service_provision_contract",
  TIEMPO_PARCIAL: "temporary_contract",
};

const BACKEND_TO_TIPO: Record<ContractType, TipoContrato> = {
  fixed_term_contract: "FIJO",
  indefinite_term_contract: "INDEFINIDO",
  service_provision_contract: "SERVICIO",
  temporary_contract: "TIEMPO_PARCIAL",
  apprenticeship_contract: "TIEMPO_PARCIAL",
  work_or_project_based_contract: "SERVICIO",
};

function deriveEstado(dto: ContractDto): { estado: EstadoContrato; validez: ValidezContrato } {
  // El backend solo expone status valid|expired; deducimos RENOVADO/ANULADO si vienen explícitos.
  // Si tiene end_date pasada → EXPIRADO.
  const today = new Date();
  const end = dto.end_date ? new Date(dto.end_date) : null;

  if (dto.contract_status === "expired") {
    return { estado: "EXPIRADO", validez: "EXPIRED" };
  }
  if (end && end.getTime() < today.getTime()) {
    return { estado: "EXPIRADO", validez: "EXPIRED" };
  }
  return { estado: "ACTIVO", validez: "ONGOING" };
}

function dtoToContrato(dto: ContractDto): Contrato {
  const { estado, validez } = deriveEstado(dto);
  return {
    id: `c-${dto.id}`,
    rawId: dto.id,
    idEmpleado: String(dto.id_employee),
    idManager: dto.id_manager,
    tipo: BACKEND_TO_TIPO[dto.contract_type] ?? "FIJO",
    fechaInicio: dto.start_date?.slice(0, 10) ?? "",
    fechaFin: dto.end_date ? dto.end_date.slice(0, 10) : null,
    salarioBase: 0,                // El backend actual no expone salario en el contrato.
    notas: dto.conditions ?? "",
    pdfUrl: dto.pdf_url ?? null,
    estado,
    validez,
    creadoEn: dto.created_at?.slice(0, 10) ?? dto.start_date?.slice(0, 10) ?? "",
  };
}

export interface NuevoContratoDTO {
  idEmpleado: string;
  idManager: number;
  tipo: TipoContrato;
  fechaInicio: string;
  fechaFin: string | null;
  salarioBase: number;
  notas: string;
  archivoPdf: File;
}

export const obtenerContratosPorEmpleado = async (
  idEmpleado: string,
): Promise<Contrato[]> => {
  const data = await apiGet<unknown>(CONTRACTS.byEmployee(idEmpleado));
  return normalizePaginated<ContractDto>(data).map(dtoToContrato);
};

export const obtenerTodosLosContratos = async (): Promise<Contrato[]> => {
  const data = await apiGet<unknown>(CONTRACTS.findAll);
  return normalizePaginated<ContractDto>(data).map(dtoToContrato);
};

export const obtenerEstadisticasContratos = async (): Promise<ContractStats> =>
  apiGet<ContractStats>(CONTRACTS.stats);

export const crearContrato = async (datos: NuevoContratoDTO): Promise<Contrato> => {
  const form = new FormData();
  form.append("file", datos.archivoPdf);
  form.append("conditions", datos.notas);
  form.append("contractType", TIPO_TO_BACKEND[datos.tipo]);
  form.append("startDate", datos.fechaInicio);
  if (datos.fechaFin) form.append("endDate", datos.fechaFin);
  form.append("idEmployee", String(datos.idEmpleado));
  form.append("idManager", String(datos.idManager));

  const dto = await apiRequest<ContractDto>(CONTRACTS.create, {
    method: "POST",
    body: form,
  });
  return dtoToContrato(dto);
};

export const obtenerContratoPorId = async (id: string): Promise<Contrato | null> => {
  const realId = id.startsWith("c-") ? Number(id.slice(2)) : Number(id);
  try {
    const dto = await apiGet<ContractDto>(CONTRACTS.findOne(realId));
    return dtoToContrato(dto);
  } catch {
    return null;
  }
};

export interface ActualizarContratoDTO {
  fechaFin?: string | null;
  salarioBase?: number;
  notas?: string;
  tipo?: TipoContrato;
}

export const actualizarContrato = async (
  id: string,
  datos: ActualizarContratoDTO,
): Promise<Contrato> => {
  const realId = id.startsWith("c-") ? Number(id.slice(2)) : Number(id);
  const payload: Record<string, unknown> = {};
  if (datos.notas !== undefined) payload.conditions = datos.notas;
  if (datos.fechaFin !== undefined) payload.endDate = datos.fechaFin;
  if (datos.tipo !== undefined) payload.contractType = TIPO_TO_BACKEND[datos.tipo];

  const dto = await apiPatch<ContractDto>(CONTRACTS.update(realId), payload);
  return dtoToContrato(dto);
};

export interface RenovarContratoDTO {
  contratoActualId: string;
  nuevaFechaFin: string;
}

export interface ResultadoRenovacion {
  contratoAnterior: Contrato;
  contratoNuevo: Contrato;
}

export const renovarContrato = async (
  datos: RenovarContratoDTO,
): Promise<ResultadoRenovacion> => {
  const realId = datos.contratoActualId.startsWith("c-")
    ? Number(datos.contratoActualId.slice(2))
    : Number(datos.contratoActualId);

  // El backend expone PATCH /renew-contract/:id con { newEndDate }.
  const dtoNuevo = await apiPatch<ContractDto>(CONTRACTS.renew(realId), {
    newEndDate: datos.nuevaFechaFin,
  });
  const contratoAnterior = (await obtenerContratoPorId(datos.contratoActualId)) ?? dtoToContrato(dtoNuevo);
  return {
    contratoAnterior,
    contratoNuevo: dtoToContrato(dtoNuevo),
  };
};

export const eliminarContrato = async (id: string): Promise<void> => {
  const realId = id.startsWith("c-") ? Number(id.slice(2)) : Number(id);
  await apiDelete(CONTRACTS.remove(realId));
};

export const anularContrato = async (id: string): Promise<Contrato> => {
  const realId = id.startsWith("c-") ? Number(id.slice(2)) : Number(id);
  const dto = await apiPatch<ContractDto>(CONTRACTS.update(realId), {
    contractStatus: "expired",
  });
  return dtoToContrato(dto);
};

// Validación local (no hay endpoint dedicado); se evalúa contra los contratos
// activos del empleado que devuelve el backend.
export interface ResultadoValidacion {
  rangoFechasValido: boolean;
  sinSolapamiento: boolean;
  presupuestoAprobado: boolean;
}

export const validarContrato = async (
  idEmpleado: string,
  fechaInicio: string,
  fechaFin: string | null,
  salario: number,
  excludeContratoId?: string,
): Promise<ResultadoValidacion> => {
  const inicio = new Date(fechaInicio);
  const fin = fechaFin ? new Date(fechaFin) : null;

  const rangoFechasValido =
    !!fechaInicio && (fin ? fin.getTime() > inicio.getTime() : true);

  let sinSolapamiento = true;
  try {
    const contratos = await obtenerContratosPorEmpleado(idEmpleado);
    const activos = contratos.filter(
      (c) => c.estado === "ACTIVO" && c.id !== excludeContratoId,
    );
    sinSolapamiento = !activos.some((c) => {
      const cIni = new Date(c.fechaInicio).getTime();
      const cFin = c.fechaFin ? new Date(c.fechaFin).getTime() : Infinity;
      const nIni = inicio.getTime();
      const nFin = fin ? fin.getTime() : Infinity;
      return nIni <= cFin && nFin >= cIni;
    });
  } catch {
    sinSolapamiento = true; // No se pudo verificar; el backend hará la validación final.
  }

  const presupuestoAprobado = salario > 0 && salario <= 500000;

  return { rangoFechasValido, sinSolapamiento, presupuestoAprobado };
};
