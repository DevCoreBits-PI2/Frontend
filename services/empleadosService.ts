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

import { apiGet, apiPatch, apiPost, ForbiddenError } from "@/lib/api/client";
import { EMPLOYEES, AREAS, POSITIONS } from "@/lib/api/endpoints";
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
import type { PositionDto } from "@/types/api/position";
import { findEmpleadoEnCargo } from "./orgLookupService";

export type EstadoEmpleado = "ACTIVO" | "SUSPENDIDO" | "RETIRADO" | "INACTIVO" | "INVITADO";

export interface Empleado {
  id: string;
  rawId: number;
  codigoEmpleado: string;
  nombre: string;
  apellidos: string;
  cargo: string;
  cargoId: number;
  /** Salario base del CARGO (positions.base_salary). Es compartido por todos
   *  los empleados de ese cargo; el backend no guarda un salario por empleado. */
  salarioBaseCargo: number | null;
  /** Id del cargo padre en la jerarquía organizacional
   *  (positions.parent_position_id). null si el cargo actual es raíz.
   *  Se usa para "Promotion" en el modal de Registrar Cambio Laboral. */
  cargoSuperiorId: number | null;
  /** Nombre legible del cargo padre, para mostrar en UI ("Promover a X"). */
  cargoSuperiorNombre: string | null;
  /** Nombre del empleado que actualmente ocupa el cargo padre (el "jefe" del
   *  empleado en la jerarquía organizacional). null si el cargo está vacante.
   *  Se resuelve consultando positions-tree (que embebe 1 empleado por cargo
   *  vía Map del backend). Si hay varios en el mismo cargo, solo aparece uno. */
  superiorEmpleadoNombre: string | null;
  departamento: string;
  areaId?: number;
  ubicacion: string;
  tipoEmpleo: string;
  email: string;
  estado: EstadoEmpleado;
  foto: string;
  managerId: number | null;
  /** Edad en años. El backend la guarda como `age` (UpdateProfileDto valida
   *  18-100). Puede ser `null` si el empleado nunca la registró. */
  edad: number | null;
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
  const parentId =
    dto.position?.parent_position?.id_position ??
    dto.position?.parent_position?.id ??
    dto.position?.parent_position_id ??
    null;
  const parentName = dto.position?.parent_position?.name ?? null;
  // El enrich inyecta el nombre del empleado del cargo padre acá. Si vino del
  // backend "pelado" sin enrich, este campo queda null.
  const superiorEmpleadoNombre =
    (dto as EmployeeDto & { __superiorEmpleadoNombre?: string | null })
      .__superiorEmpleadoNombre ?? null;
  return {
    id: String(id),
    rawId: id,
    codigoEmpleado: `EMP-${dto.code ?? id}`,
    nombre: dto.first_name ?? "",
    apellidos: dto.last_name ?? "",
    cargo: dto.position?.name ?? "",
    cargoId: dto.id_position,
    salarioBaseCargo:
      typeof dto.position?.base_salary === "number" ? dto.position.base_salary : null,
    cargoSuperiorId: typeof parentId === "number" ? parentId : null,
    cargoSuperiorNombre: parentName,
    superiorEmpleadoNombre,
    departamento: dto.position?.area?.name ?? dto.area?.name ?? "",
    areaId: dto.position?.area?.id ?? dto.position?.id_area,
    ubicacion: "",
    tipoEmpleo: "Full-time Employee",
    email: dto.email ?? "",
    estado: statusToUi(dto.status),
    foto: dto.photo_url ?? "",
    managerId: dto.id_manager,
    edad: typeof dto.age === "number" ? dto.age : null,
  };
}

// ───────────────────────── Empleados ─────────────────────────

export const obtenerEmpleados = async (): Promise<Empleado[]> => {
  // limit alto: el backend pagina con 10 por defecto y el directorio no maneja
  // paginación; sin esto solo veríamos los primeros 10 empleados.
  const data = await apiGet<unknown>(EMPLOYEES.findAll, {
    query: { limit: 1000 },
  });
  return normalizePaginated<EmployeeDto>(data).map(dtoToEmpleado);
};

// El backend `findOne` de empleados retorna `id_position: number` pero NO el
// cargo expandido ni el área (el Prisma findUnique no hace include). Hacemos
// dos lookups extra para que el perfil muestre el nombre del cargo y del área.
// Si alguno de los lookups falla, degradamos a string vacío en vez de romper.
async function enrichEmployeeWithPositionAndArea(dto: EmployeeDto): Promise<EmployeeDto> {
  if (!dto.id_position) return dto;

  try {
    const positionRaw = await apiGet<{
      id_position?: number;
      name?: string;
      id_area?: number;
      base_salary?: number | null;
      parent_position_id?: number | null;
    }>(POSITIONS.findOne(dto.id_position));

    // Cargamos área, cargo padre y empleado-en-cargo-padre en paralelo.
    // `findEmpleadoEnCargo` ya hace su propio fallback (findAll → tree).
    const [areaInfo, parentInfo, jefe] = await Promise.all([
      positionRaw?.id_area
        ? apiGet<{ id_area?: number; id?: number; name?: string }>(
            AREAS.findOne(positionRaw.id_area),
          ).catch(() => null)
        : Promise.resolve(null),
      typeof positionRaw?.parent_position_id === "number"
        ? apiGet<{ id_position?: number; name?: string }>(
            POSITIONS.findOne(positionRaw.parent_position_id),
          ).catch(() => null)
        : Promise.resolve(null),
      typeof positionRaw?.parent_position_id === "number"
        ? findEmpleadoEnCargo(positionRaw.parent_position_id)
        : Promise.resolve(null),
    ]);

    const superiorEmpleadoNombre = jefe?.fullName ?? null;

    const areaIdResolved = areaInfo?.id_area ?? areaInfo?.id;
    return {
      ...dto,
      position: {
        id: positionRaw?.id_position,
        id_position: positionRaw?.id_position,
        name: positionRaw?.name ?? "",
        id_area: positionRaw?.id_area,
        base_salary: positionRaw?.base_salary ?? null,
        parent_position_id: positionRaw?.parent_position_id ?? null,
        parent_position: parentInfo
          ? { id_position: parentInfo.id_position, name: parentInfo.name }
          : null,
        area:
          areaIdResolved && areaInfo?.name
            ? { id: areaIdResolved, name: areaInfo.name }
            : undefined,
      },
      // Inyectamos el nombre del jefe en un campo extra que `dtoToEmpleado`
      // lee. No es parte del schema oficial del backend; es metadato de UI.
      __superiorEmpleadoNombre: superiorEmpleadoNombre,
    } as EmployeeDto & { __superiorEmpleadoNombre: string | null };
  } catch {
    return dto;
  }
}

export const obtenerEmpleadoPorId = async (id: string): Promise<Empleado | null> => {
  try {
    const dto = await apiGet<EmployeeDto>(EMPLOYEES.findOne(id));
    const enriched = await enrichEmployeeWithPositionAndArea(dto);
    return dtoToEmpleado(enriched);
  } catch (err) {
    // 403 → re-lanzamos el ForbiddenError para que la página pueda
    // distinguir "no encontrado" de "no autorizado" y mostrar el mensaje
    // correcto. Otros errores se tragan y devolvemos null (comportamiento
    // anterior, evita romper otros callers).
    if (err instanceof ForbiddenError) throw err;
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
  // El backend devuelve un array plano de empleados activos con manager = this.
  // No paginamos: es razonable asumir &lt; 50 subordinados directos por persona.
  return normalizePaginated<EmployeeDto>(data).map(dtoToEmpleado);
};

/**
 * Devuelve los empleados que ocupan cargos cuya `parent_position_id` apunta al
 * cargo indicado. Es la fuente "estructural" de subordinados (basada en la
 * jerarquía de posiciones, no en `employees.id_manager`).
 *
 * Por qué existe: el endpoint `getSubordinates` del backend filtra por
 * `id_manager`, y ese campo queda en null para los empleados invitados antes
 * de que existiera el auto-set en el frontend. Por la jerarquía siempre se
 * puede recuperar quién depende de quién aunque `id_manager` no esté seteado.
 *
 * Usamos siempre el camino público (`positions-tree`) y no intentamos
 * `EMPLOYEES.findAll` aunque el rol parezca elegible: en la práctica el
 * guard del backend rechaza con 403 a roles que el frontend cree autorizados
 * (lee la position de otro lugar), ensuciando la consola. positions-tree
 * solo trae empleados con `status='active'`, que es lo razonable para mostrar
 * un equipo directo activo.
 */
export const obtenerSubordinadosPorJerarquia = async (
  parentPositionId: number,
): Promise<Empleado[]> => {
  if (!parentPositionId || parentPositionId <= 0) return [];

  // positions-tree (público) — devuelve un array plano con `employee`
  // (singular, solo activos). Buscamos al cargo padre y luego sus hijos.
  // OJO: el endpoint se llama "tree" pero el backend devuelve un ARRAY PLANO
  // de positions enriquecido con `areas`, `other_positions` (ids de hijos) y
  // `employee` (singular, 1 empleado activo por cargo). Ver
  // administrative-data-ms/positions.service.ts → getPositionsTree.
  try {
    type FlatTreeNode = {
      id_position: number;
      name: string;
      parent_position_id: number | null;
      id_area?: number;
      areas?: { name?: string } | null;
      other_positions?: Array<{ id_position: number }>;
      employee?: {
        first_name?: string;
        last_name?: string;
        photo_url?: string;
      } | null;
    };

    const treeRaw = await apiGet<unknown>(POSITIONS.tree);
    const flat: FlatTreeNode[] = Array.isArray(treeRaw)
      ? (treeRaw as FlatTreeNode[])
      : Array.isArray((treeRaw as { data?: unknown })?.data)
        ? ((treeRaw as { data: FlatTreeNode[] }).data)
        : [];

    if (flat.length === 0) return [];

    // Indexamos por id_position para resolver el padre y los hijos por id.
    const byId = new Map<number, FlatTreeNode>(
      flat.map((p) => [p.id_position, p]),
    );
    const parentNode = byId.get(parentPositionId);
    if (!parentNode) return [];

    // Cargos hijos: por parent_position_id (más confiable que other_positions,
    // que a veces viene vacío incluso cuando hay hijos).
    const childPositions = flat.filter(
      (p) => p.parent_position_id === parentPositionId,
    );
    if (childPositions.length === 0) return [];

    // El árbol del backend devuelve `employee` (singular) — 1 empleado activo
    // por cargo, vía Map. Si el cargo tiene más de uno asignado, solo aparece
    // uno (limitación del backend, no nuestra).
    const subordinados: Empleado[] = [];
    for (const child of childPositions) {
      const emp = child.employee;
      if (!emp) continue;
      const firstName = emp.first_name ?? "";
      const lastName = emp.last_name ?? "";
      if (!firstName && !lastName) continue;
      subordinados.push({
        // No tenemos el id del empleado en el árbol; usamos un id sintético
        // por cargo. Es suficiente para mostrar la lista, no se navega.
        id: `tree-pos-${child.id_position}`,
        rawId: 0,
        codigoEmpleado: "",
        nombre: firstName,
        apellidos: lastName,
        cargo: child.name ?? "",
        cargoId: child.id_position,
        salarioBaseCargo: null,
        cargoSuperiorId: parentPositionId,
        cargoSuperiorNombre: parentNode.name ?? null,
        superiorEmpleadoNombre: null,
        departamento: child.areas?.name ?? "",
        areaId: child.id_area,
        ubicacion: "",
        tipoEmpleo: "Full-time Employee",
        email: "",
        estado: "ACTIVO",
        foto: emp.photo_url ?? "",
        managerId: null,
        edad: null,
      });
    }
    return subordinados;
  } catch {
    return [];
  }
};

export const invitarEmpleado = async (payload: InviteUserPayload): Promise<EmployeeDto> =>
  apiPost<EmployeeDto>(EMPLOYEES.invite, payload);

export const actualizarPerfilEmpleado = async (
  supabaseUserId: string,
  payload: UpdateProfilePayload,
): Promise<EmployeeDto> => apiPatch<EmployeeDto>(EMPLOYEES.updateProfile(supabaseUserId), payload);

/**
 * Variante para uso administrativo: actualiza edad y/o photo_url de OTRO
 * empleado. El backend (`PATCH /employees/updateUser/:id`) permite a admin/HT
 * editar a cualquiera; usa el `id_employee` numérico, no el supabase_user_id.
 *
 * El endpoint `upload-profile-image` (archivo) NO es utilizable por el admin
 * para otro empleado — siempre apunta al usuario autenticado. Por eso esta
 * función solo acepta `photoUrl` (URL ya existente) y `edad`.
 */
export const actualizarEmpleadoComoAdmin = async (
  empleadoId: number,
  payload: { edad?: number | null; photoUrl?: string },
): Promise<Empleado> => {
  const body: UpdateProfilePayload = {
    id_employee: empleadoId,
  };
  if (typeof payload.edad === "number") body.age = payload.edad;
  if (typeof payload.photoUrl === "string" && payload.photoUrl.trim()) {
    body.photo_url = payload.photoUrl.trim();
  }
  const dto = await apiPatch<EmployeeDto>(EMPLOYEES.updateProfile(empleadoId), body);
  return dtoToEmpleado(dto);
};

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
