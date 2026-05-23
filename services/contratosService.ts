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

export type TipoContrato =
  | "FIJO"
  | "INDEFINIDO"
  | "SERVICIO"
  | "TIEMPO_PARCIAL"
  | "APRENDIZAJE"
  | "OBRA";
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
  APRENDIZAJE: "apprenticeship_contract",
  OBRA: "work_or_project_based_contract",
};

const BACKEND_TO_TIPO: Record<ContractType, TipoContrato> = {
  fixed_term_contract: "FIJO",
  indefinite_term_contract: "INDEFINIDO",
  service_provision_contract: "SERVICIO",
  temporary_contract: "TIEMPO_PARCIAL",
  apprenticeship_contract: "APRENDIZAJE",
  work_or_project_based_contract: "OBRA",
};

export const TIPO_CONTRATO_LABEL: Record<TipoContrato, string> = {
  FIJO: "Término fijo",
  INDEFINIDO: "Término indefinido",
  SERVICIO: "Prestación de servicios",
  TIEMPO_PARCIAL: "Temporal",
  APRENDIZAJE: "Aprendizaje",
  OBRA: "Obra o labor",
};

function deriveEstado(dto: ContractDto): { estado: EstadoContrato; validez: ValidezContrato } {
  const status = dto.contract_status ?? dto.status;
  const today = new Date();
  const end = dto.end_date ? new Date(dto.end_date) : null;

  if (status === "annulled") {
    return { estado: "ANULADO", validez: "VOIDED" };
  }
  if (status === "renewed") {
    return { estado: "RENOVADO", validez: "COMPLETED" };
  }
  if (status === "expired") {
    // Workaround: el gateway tiene un bug en su enum `contract_status` (solo
    // acepta `valid` y `expired`), así que NO podemos enviar `annulled` al
    // backend. Cuando el admin "cancela" un contrato lo marcamos como expired.
    // Para distinguir visualmente una cancelación de una expiración real:
    //   - Si el contrato tiene fecha fin FUTURA pero está marcado expired,
    //     entendemos que fue cancelado manualmente → "ANULADO".
    //   - Si NO tiene fecha fin (indefinido) y está expired, no pudo haberse
    //     expirado por tiempo → fue cancelación manual → "ANULADO".
    //   - Si la fecha fin ya pasó, fue expirado naturalmente → "EXPIRADO".
    // Cuando el bug del backend se arregle, esto se puede simplificar volviendo
    // a usar `annulled` directo.
    if (!end || end.getTime() > today.getTime()) {
      return { estado: "ANULADO", validez: "VOIDED" };
    }
    return { estado: "EXPIRADO", validez: "EXPIRED" };
  }
  if (end && end.getTime() < today.getTime()) {
    return { estado: "EXPIRADO", validez: "EXPIRED" };
  }
  return { estado: "ACTIVO", validez: "ONGOING" };
}

function dtoToContrato(dto: ContractDto): Contrato {
  const id = dto.id ?? dto.id_contract ?? 0;
  const { estado, validez } = deriveEstado(dto);
  return {
    id: `c-${id}`,
    rawId: id,
    idEmpleado: String(dto.id_employee),
    idManager: dto.id_manager,
    tipo: BACKEND_TO_TIPO[dto.contract_type] ?? "FIJO",
    fechaInicio: dto.start_date?.slice(0, 10) ?? "",
    fechaFin: dto.end_date ? dto.end_date.slice(0, 10) : null,
    notas: dto.conditions ?? "",
    pdfUrl: dto.pdf_url ?? dto.pdf_document ?? null,
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
  // Bug del backend: el enum `contract_status` del gateway solo acepta
  // `valid` y `expired` (le faltan `renewed` y `annulled`). Mandar
  // `contractStatus: "annulled"` rebota con 400 "valid status are: valid,expired".
  // Workaround: enviamos `expired`. `deriveEstado` después detecta que la
  // fecha fin es futura y lo muestra como "ANULADO" en la UI para preservar
  // la semántica visual.
  const dto = await apiPatch<ContractDto>(CONTRACTS.update(realId), {
    contractStatus: "expired",
  });
  return dtoToContrato(dto);
};

// Reglas de duración por tipo de contrato (en días). Validación pura del
// frontend: el backend no las exige. Basadas en derecho laboral colombiano
// típico. Los rangos son inclusivos. `null` significa sin límite.
//
//   FIJO         → mín. 30 días, máx. 3 años (Art. 46 CST).
//   INDEFINIDO   → sin fecha fin, no aplica.
//   OBRA         → depende de la obra; no hay máximo legal.
//   TEMPORAL     → contratos ocasionales/transitorios, máx. 30 días (Art. 6 CST).
//   APRENDIZAJE  → mín. 6 meses, máx. 24 meses (Ley 789/2002 art. 30).
//   SERVICIOS    → máx. 11 meses (práctica común para evitar laboralización).
export const DURATION_RULES: Record<
  TipoContrato,
  { minDays: number | null; maxDays: number | null; descripcion: string }
> = {
  FIJO:           { minDays: 30,  maxDays: 365 * 3, descripcion: "entre 30 días y 3 años" },
  INDEFINIDO:     { minDays: null, maxDays: null,    descripcion: "sin fecha fin" },
  OBRA:           { minDays: 1,    maxDays: null,    descripcion: "mínimo 1 día" },
  TIEMPO_PARCIAL: { minDays: 1,    maxDays: 30,      descripcion: "máximo 30 días" },
  APRENDIZAJE:    { minDays: 180,  maxDays: 365 * 2, descripcion: "entre 6 y 24 meses" },
  SERVICIO:       { minDays: 1,    maxDays: 330,     descripcion: "máximo ~11 meses" },
};

// Validación local (no hay endpoint dedicado); se evalúa contra los contratos
// activos del empleado que devuelve el backend. El backend no maneja salario
// en contratos, así que esa validación no aplica.
export interface ResultadoValidacion {
  rangoFechasValido: boolean;
  sinSolapamiento: boolean;
  duracionValida: boolean;
  mensajeDuracion?: string;
}

// Calcula la duración del contrato en días (entre fechas) y la compara con
// las reglas legales del tipo. Si el contrato es INDEFINIDO devuelve siempre
// válido (no aplica). Si el tipo no se pasa, no chequea duración.
function validarDuracion(
  tipo: TipoContrato | undefined,
  inicio: Date,
  fin: Date | null,
): { duracionValida: boolean; mensajeDuracion?: string } {
  if (!tipo) return { duracionValida: true };
  const rules = DURATION_RULES[tipo];
  if (tipo === "INDEFINIDO") return { duracionValida: true };
  if (!fin) return { duracionValida: true };

  const dias = Math.round((fin.getTime() - inicio.getTime()) / 86_400_000);
  if (dias <= 0) return { duracionValida: true }; // rangoFechasValido lo cubre

  if (rules.minDays !== null && dias < rules.minDays) {
    return {
      duracionValida: false,
      mensajeDuracion: `La duración de un contrato ${tipo === "FIJO" ? "fijo" : tipo === "TIEMPO_PARCIAL" ? "temporal" : tipo === "APRENDIZAJE" ? "de aprendizaje" : tipo === "SERVICIO" ? "de prestación de servicios" : "de obra"} debe ser ${rules.descripcion}. Actualmente: ${dias} día(s).`,
    };
  }
  if (rules.maxDays !== null && dias > rules.maxDays) {
    return {
      duracionValida: false,
      mensajeDuracion: `La duración de un contrato ${tipo === "FIJO" ? "fijo" : tipo === "TIEMPO_PARCIAL" ? "temporal" : tipo === "APRENDIZAJE" ? "de aprendizaje" : tipo === "SERVICIO" ? "de prestación de servicios" : "de obra"} debe ser ${rules.descripcion}. Actualmente: ${dias} día(s).`,
    };
  }
  return { duracionValida: true };
}

export const validarContrato = async (
  idEmpleado: string,
  fechaInicio: string,
  fechaFin: string | null,
  excludeContratoId?: string,
  tipo?: TipoContrato,
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

  const { duracionValida, mensajeDuracion } = validarDuracion(tipo, inicio, fin);

  return { rangoFechasValido, sinSolapamiento, duracionValida, mensajeDuracion };
};
