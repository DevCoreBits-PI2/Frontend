// Servicio de Empleados — integrado con el Gateway real.
//
// Endpoints:
//   POST   /employees/inviteUser              [HumanTalent | Admin]
//   GET    /employees/findAll                 [HumanTalent | Admin]
//   GET    /employees/:id                     (auth; permisos: dueño / jefe / HT / admin)
//   GET    /employees/getMyProfile/:id        (auth)
//   GET    /employees/getSubordinates/:id     (auth)
//   PATCH  /employees/updateUser/:id          (auth — perfil propio)
//   PATCH  /employees/updateEmployee/:id      [HumanTalent | Admin]
//   GET    /employees/firstTimeSetup/:id      (auth)
//   PATCH  /employees/completeFirstLogin/:id  (auth)
//
// Las evaluaciones SE PERSISTEN en el backend vía /create-performance-evaluation,
// pero los componentes existentes esperan la forma `Evaluation`; usamos el adapter.

import { apiGet, apiPatch, apiPost } from "@/lib/api/client";
import { EMPLOYEES } from "@/lib/api/endpoints";
import { CAREER_HISTORY, PERFORMANCE } from "@/lib/api/endpoints";
import { normalizePaginated } from "@/types/api/common";
import type {
  EmployeeDto,
  EmployeeStatus,
  InviteUserPayload,
  UpdateEmployeePayload,
  UpdateProfilePayload,
} from "@/types/api/employee";
import type {
  CreatePerformanceEvaluationPayload,
  PerformanceEvaluationDto,
} from "@/types/api/career";

export type EstadoEmpleado = "ACTIVO" | "SUSPENDIDO" | "RETIRADO" | "INACTIVO" | "INVITADO";

export interface Empleado {
  id: string;
  rawId: number;
  codigoEmpleado: string;
  nombre: string;
  apellidos: string;
  cargo: string;
  cargoId: number;
  departamento: string;
  areaId?: number;
  ubicacion: string;
  tipoEmpleo: string;
  email: string;
  estado: EstadoEmpleado;
  foto: string;
  managerId: number | null;
}

export interface EvaluationCompetency {
  name: string;
  score: number;
}

export interface Evaluation {
  id: string;
  title: string;
  reviewer: string;
  date: string;
  score: number;
  isRecent?: boolean;
  competencies: EvaluationCompetency[];
  observations?: string;
}

function statusToUi(s?: EmployeeStatus): EstadoEmpleado {
  switch (s) {
    case "active": return "ACTIVO";
    case "suspended": return "SUSPENDIDO";
    case "retired": return "RETIRADO";
    case "inactive": return "INACTIVO";
    case "invited": return "INVITADO";
    default: return "ACTIVO";
  }
}

export function statusToBackend(s: EstadoEmpleado): EmployeeStatus {
  switch (s) {
    case "ACTIVO": return "active";
    case "SUSPENDIDO": return "suspended";
    case "RETIRADO": return "retired";
    case "INACTIVO": return "inactive";
    case "INVITADO": return "invited";
  }
}

export function dtoToEmpleado(dto: EmployeeDto): Empleado {
  const id = dto.id ?? dto.id_employee ?? 0;
  return {
    id: String(id),
    rawId: id,
    codigoEmpleado: `EMP-${dto.code ?? id}`,
    nombre: dto.first_name ?? "",
    apellidos: dto.last_name ?? "",
    cargo: dto.position?.name ?? "",
    cargoId: dto.id_position,
    departamento: dto.position?.area?.name ?? dto.area?.name ?? "",
    areaId: dto.position?.area?.id ?? dto.position?.id_area,
    ubicacion: "",
    tipoEmpleo: "Full-time Employee",
    email: dto.email ?? "",
    estado: statusToUi(dto.status),
    foto: dto.photo_url ?? "",
    managerId: dto.id_manager,
  };
}

// ───────────────────────── Empleados ─────────────────────────

export const obtenerEmpleados = async (): Promise<Empleado[]> => {
  const data = await apiGet<unknown>(EMPLOYEES.findAll);
  return normalizePaginated<EmployeeDto>(data).map(dtoToEmpleado);
};

export const obtenerEmpleadoPorId = async (id: string): Promise<Empleado | null> => {
  try {
    const dto = await apiGet<EmployeeDto>(EMPLOYEES.findOne(id));
    return dtoToEmpleado(dto);
  } catch {
    return null;
  }
};

export const obtenerMiPerfil = async (supabaseUserId: string): Promise<Empleado | null> => {
  try {
    const dto = await apiGet<EmployeeDto>(EMPLOYEES.myProfile(supabaseUserId));
    return dtoToEmpleado(dto);
  } catch {
    return null;
  }
};

export const obtenerSubordinados = async (managerId: number | string): Promise<Empleado[]> => {
  const data = await apiGet<unknown>(EMPLOYEES.subordinates(managerId));
  return normalizePaginated<EmployeeDto>(data).map(dtoToEmpleado);
};

export const invitarEmpleado = async (payload: InviteUserPayload): Promise<EmployeeDto> =>
  apiPost<EmployeeDto>(EMPLOYEES.invite, payload);

export const actualizarPerfilEmpleado = async (
  supabaseUserId: string,
  payload: UpdateProfilePayload,
): Promise<EmployeeDto> => apiPatch<EmployeeDto>(EMPLOYEES.updateProfile(supabaseUserId), payload);

export const actualizarEmpleado = async (
  employeeId: number | string,
  payload: UpdateEmployeePayload,
): Promise<EmployeeDto> => apiPatch<EmployeeDto>(EMPLOYEES.updateEmployee(employeeId), payload);

// ───────────────────────── Evaluaciones ─────────────────────────
//
// El backend modela 5 competencias con nombres fijos:
//   communication, technical_proficiency, leadership_influence, innovation, reliability
// La UI maneja nombres con etiquetas; mapeamos en ambas direcciones.

// Las claves se comparan en lowercase contra `competency.name` del UI. Se
// listan todas las variantes (con/sin tilde, español/inglés, label corto/largo)
// que efectivamente envía la página de evaluación; faltaba "competencia técnica"
// y "liderazgo e influencia", lo que hacía que esos dos puntajes se guardaran
// como 0 en el backend.
const COMPETENCY_TO_FIELD: Record<string, keyof CreatePerformanceEvaluationPayload> = {
  comunicacion: "communication",
  comunicación: "communication",
  communication: "communication",
  tecnica: "technical_proficiency",
  técnica: "technical_proficiency",
  "competencia tecnica": "technical_proficiency",
  "competencia técnica": "technical_proficiency",
  technical: "technical_proficiency",
  "technical proficiency": "technical_proficiency",
  liderazgo: "leadership_influence",
  "liderazgo e influencia": "leadership_influence",
  leadership: "leadership_influence",
  "leadership influence": "leadership_influence",
  innovacion: "innovation",
  innovación: "innovation",
  innovation: "innovation",
  confianza: "reliability",
  confiabilidad: "reliability",
  reliability: "reliability",
};

const FIELD_TO_LABEL: Record<string, string> = {
  communication: "Comunicación",
  technical_proficiency: "Técnica",
  leadership_influence: "Liderazgo",
  innovation: "Innovación",
  reliability: "Confianza",
};

function evaluationToPayload(ev: Evaluation, directorId: number): CreatePerformanceEvaluationPayload {
  const payload: CreatePerformanceEvaluationPayload = {
    id_director: directorId,
    observations: ev.observations,
    evaluation_date: ev.date,
  };
  for (const c of ev.competencies) {
    const key = COMPETENCY_TO_FIELD[c.name.toLowerCase()];
    if (key && typeof c.score === "number") {
      (payload as unknown as Record<string, unknown>)[key] = c.score;
    }
  }
  return payload;
}

function dtoToEvaluation(dto: PerformanceEvaluationDto & { performance_evaluations?: PerformanceEvaluationDto | null }): Evaluation {
  const evaluation = dto.performance_evaluations ?? dto;
  const id = evaluation.id ?? evaluation.id_evaluation ?? dto.id ?? dto.id_evaluation ?? 0;
  const competencies: EvaluationCompetency[] = [];
  const map = {
    communication: evaluation.communication,
    technical_proficiency: evaluation.technical_proficiency,
    leadership_influence: evaluation.leadership_influence,
    innovation: evaluation.innovation,
    reliability: evaluation.reliability,
  } as const;
  let sum = 0;
  let count = 0;
  for (const [field, score] of Object.entries(map)) {
    if (typeof score === "number") {
      competencies.push({ name: FIELD_TO_LABEL[field], score });
      sum += score;
      count += 1;
    }
  }
  const avg = count > 0 ? sum / count : 0;
  return {
    id: String(id),
    title: "Evaluación de desempeño",
    reviewer: String(evaluation.id_director),
    date: evaluation.evaluation_date,
    score: Number(avg.toFixed(2)),
    competencies,
    observations: evaluation.observations,
  };
}

export const guardarEvaluacion = async (
  empleadoId: string,
  evaluation: Evaluation,
  directorId: number,
): Promise<Evaluation> => {
  const payload = evaluationToPayload(evaluation, directorId);
  const dto = await apiPost<PerformanceEvaluationDto>(PERFORMANCE.create, payload);
  const evaluationId = dto.id ?? dto.id_evaluation;
  if (evaluationId) {
    await apiPost(CAREER_HISTORY.create, {
      description: evaluation.observations || "Evaluación de desempeño registrada",
      event_date: evaluation.date,
      type: "evaluation",
      id_employee: Number(empleadoId),
      id_evaluation: evaluationId,
    });
  }
  return dtoToEvaluation(dto);
};

export const obtenerEvaluacionesEmpleado = async (
  empleadoId: string,
): Promise<Evaluation[]> => {
  try {
    const data = await apiGet<unknown>(PERFORMANCE.byEmployee(empleadoId));
    return normalizePaginated<PerformanceEvaluationDto & { performance_evaluations?: PerformanceEvaluationDto | null }>(data).map(dtoToEvaluation);
  } catch {
    return [];
  }
};
