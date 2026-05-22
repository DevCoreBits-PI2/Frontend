// Servicio de Cargos / Posiciones — integrado con el Gateway real.
//
// Endpoints:
//   POST   /administrative-data/positions/create-position    [HumanTalent | Admin]
//   GET    /administrative-data/positions/find-all-positions (público)
//   GET    /administrative-data/positions/find-position/:id  (público)
//   PATCH  /administrative-data/positions/update-position/:id
//   DELETE /administrative-data/positions/delete-position/:id
//   GET    /administrative-data/positions/positions-tree     (público)
//   PUT    /administrative-data/positions/remove-father/:id
//
// La forma `Position` que retornamos respeta el contrato que usan los componentes
// existentes (PositionsTable, etc.), agregando algunos campos extra (areaIdNumber,
// parentPositionId) para conservar el id del backend cuando se necesita actualizar.

import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/lib/api/client";
import { EMPLOYEES, POSITIONS } from "@/lib/api/endpoints";
import { normalizePaginated } from "@/types/api/common";
import type {
  CreatePositionPayload,
  PositionDto,
  PositionPaginationQuery,
  PositionTreeNode,
  UpdatePositionPayload,
} from "@/types/api/position";
import type { EmployeeDto } from "@/types/api/employee";

export interface Position {
  id: string;                          // string-id derivado del numérico ("POS-00012")
  rawId: number;                       // id numérico real del backend
  nombre: string;
  empleados: {
    id: string;
    nombre: string;
    foto?: string;
    iniciales: string;
  }[];
  posicionSuperior: string | null;
  posicionSuperiorId: number | null;
  estado: "Active" | "Inactive";
  areaId: string;                      // string ("area-1") para retrocompat
  areaIdNumber: number;
  areaNombre: string;
  vacancies: number;
  baseSalary?: number;
  description: string;
  idAdministrator: number;
}

export interface PositionsResponse {
  data: Position[];
  total: number;
  page: number;
  pageSize: number;
}

function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");
}

function dtoToPosition(dto: PositionDto): Position {
  const id = dto.id ?? dto.id_position ?? 0;
  const area = dto.area ?? dto.areas;
  const parent = dto.parent_position ?? dto.positions;
  const rawEmployees = dto.employees ?? (dto.employee ? [dto.employee] : []);
  const empleados = rawEmployees.map((e) => {
    const nombre = `${e.first_name ?? ""} ${e.last_name ?? ""}`.trim() || `Empleado ${e.id}`;
    return {
      id: String(e.id ?? e.id_employee ?? ""),
      nombre,
      foto: e.photo_url,
      iniciales: iniciales(nombre),
    };
  });

  return {
    id: `POS-${String(id).padStart(5, "0")}`,
    rawId: id,
    nombre: dto.name,
    empleados,
    posicionSuperior: parent?.name ?? null,
    posicionSuperiorId: parent?.id ?? parent?.id_position ?? dto.parent_position_id ?? null,
    estado: dto.status === "active" ? "Active" : "Inactive",
    areaId: `area-${dto.id_area}`,
    areaIdNumber: dto.id_area,
    areaNombre: area?.name ?? "",
    vacancies: dto.vacancies ?? 0,
    baseSalary: dto.base_salary,
    description: dto.description ?? "",
    idAdministrator: dto.id_administrator,
  };
}

// Input mínimo necesario para crear/editar desde la UI. Los campos no provistos
// usan defaults razonables.
export interface NuevaPosicionInput {
  nombre: string;
  areaIdNumber?: number;
  areaId?: string; // fallback retrocompat ("area-1")
  idAdministrator?: number;
  posicionSuperiorId?: number | null;
  estado?: "Active" | "Inactive";
  vacancies?: number;
  description?: string;
  baseSalary?: number;
}

function areaIdFromInput(p: { areaIdNumber?: number; areaId?: string }): number {
  if (typeof p.areaIdNumber === "number") return p.areaIdNumber;
  if (p.areaId?.startsWith("area-")) return Number(p.areaId.slice(5));
  if (p.areaId) {
    const n = Number(p.areaId);
    if (!Number.isNaN(n)) return n;
  }
  throw new Error("Debes seleccionar un área para la posición.");
}

function positionToCreatePayload(p: NuevaPosicionInput, fallbackAdmin: number): CreatePositionPayload {
  return {
    name: p.nombre,
    description: p.description ?? "",
    base_salary: p.baseSalary,
    id_administrator: p.idAdministrator ?? fallbackAdmin,
    id_area: areaIdFromInput(p),
    parent_position_id: p.posicionSuperiorId ?? undefined,
    status: p.estado === "Inactive" ? "inactive" : "active",
    vacancies: p.vacancies ?? 1,
  };
}

function positionToUpdatePayload(p: Partial<Position>): UpdatePositionPayload {
  const payload: UpdatePositionPayload = {};
  if (p.nombre !== undefined) payload.name = p.nombre;
  if (p.description !== undefined) payload.description = p.description;
  if (p.baseSalary !== undefined) payload.base_salary = p.baseSalary;
  if (p.idAdministrator !== undefined) payload.id_administrator = p.idAdministrator;
  if (p.areaIdNumber !== undefined) payload.id_area = p.areaIdNumber;
  if (p.posicionSuperiorId !== undefined) {
    payload.parent_position_id = p.posicionSuperiorId ?? undefined;
  }
  if (p.estado !== undefined) payload.status = p.estado === "Active" ? "active" : "inactive";
  if (p.vacancies !== undefined) payload.vacancies = p.vacancies;
  return payload;
}

export interface GetPositionsFilter {
  searchText?: string;
  status?: "Active" | "Inactive" | "all";
  tab?: "All" | "Hierarchy" | "Archived";
  page?: number;
  pageSize?: number;
  areaId?: number;
}

export const obtenerPosiciones = async (
  filters?: GetPositionsFilter,
): Promise<PositionsResponse> => {
  const {
    searchText = "",
    status = "all",
    tab = "All",
    page = 1,
    pageSize = 4,
    areaId,
  } = filters || {};

  // Mapear tab → status del backend
  let backendStatus: "active" | "inactive" | undefined;
  if (tab === "Hierarchy" || status === "Active") backendStatus = "active";
  else if (tab === "Archived" || status === "Inactive") backendStatus = "inactive";

  const query: PositionPaginationQuery = {
    page,
    limit: pageSize,
    status: backendStatus,
    search: searchText.trim() || undefined,
    id_area: areaId,
  };

  const raw = await apiGet<unknown>(POSITIONS.findAll, {
    query: query as Record<string, string | number | boolean | undefined>,
  });

  const items = normalizePaginated<PositionDto>(raw).map(dtoToPosition);

  // El backend ya hace paginación; intentamos extraer total si viene.
  let total = items.length;
  if (raw && typeof raw === "object" && "total" in (raw as Record<string, unknown>)) {
    const t = (raw as { total: unknown }).total;
    if (typeof t === "number") total = t;
  } else if (raw && typeof raw === "object" && "meta" in (raw as Record<string, unknown>)) {
    const meta = (raw as { meta: { total?: number } }).meta;
    if (meta?.total) total = meta.total;
  }

  // `findAllPositions` del backend NO incluye los empleados de cada cargo
  // (`getPositionsTree` sí). Para que la tabla de posiciones muestre el conteo
  // y los avatares correctos, hacemos un fetch adicional de todos los empleados
  // y agrupamos por id_position. Si el endpoint falla (p.ej. 403 por permisos),
  // degradamos a la lista sin empleados.
  await enrichPositionsWithEmployees(items);

  return { data: items, total, page, pageSize };
};

async function enrichPositionsWithEmployees(items: Position[]): Promise<void> {
  if (items.length === 0) return;
  try {
    // El backend pagina con limit=10 por defecto. Pedimos límite alto para
    // que los cargos cuenten todos sus empleados (no solo los primeros 10).
    const raw = await apiGet<unknown>(EMPLOYEES.findAll, {
      query: { limit: 1000 },
    });
    const employees = normalizePaginated<EmployeeDto>(raw);
    const byPosition = new Map<number, Position["empleados"]>();

    for (const emp of employees) {
      const positionId = emp.id_position;
      if (!positionId) continue;
      const empId = emp.id ?? emp.id_employee ?? 0;
      const nombre = `${emp.first_name ?? ""} ${emp.last_name ?? ""}`.trim() || `Empleado ${empId}`;
      const entry = {
        id: String(empId),
        nombre,
        foto: emp.photo_url ?? undefined,
        iniciales: iniciales(nombre),
      };
      const list = byPosition.get(positionId) ?? [];
      list.push(entry);
      byPosition.set(positionId, list);
    }

    for (const position of items) {
      const enriched = byPosition.get(position.rawId);
      if (enriched && enriched.length > 0) {
        position.empleados = enriched;
      }
    }
  } catch {
    // 403 esperable si el rol no es HumanTalent / Admin. Mantenemos la lista
    // base sin empleados (igual que antes del enrich).
  }
}

export const obtenerPosicionPorId = async (id: number | string): Promise<Position> => {
  const realId = typeof id === "string" && id.startsWith("POS-") ? Number(id.slice(4)) : id;
  const dto = await apiGet<PositionDto>(POSITIONS.findOne(realId));
  const position = dtoToPosition(dto);
  // Mismo enriquecimiento que `obtenerPosiciones`: el backend `findOnePosition`
  // tampoco hace include de employees, así que la vista de detalle quedaba con
  // empleados vacíos. Hacemos el lookup adicional acá también.
  await enrichPositionsWithEmployees([position]);
  return position;
};

export const obtenerArbolPosiciones = async (): Promise<PositionTreeNode[]> => {
  const data = await apiGet<PositionTreeNode[]>(POSITIONS.tree);
  return Array.isArray(data) ? data : [];
};

export const crearPosicion = async (
  datos: NuevaPosicionInput,
  idAdministratorFallback?: number,
): Promise<Position> => {
  const fallback = idAdministratorFallback ?? datos.idAdministrator ?? 0;
  if (!fallback) {
    throw new Error("Falta el id del administrador para crear la posición.");
  }
  const dto = await apiPost<PositionDto>(
    POSITIONS.create,
    positionToCreatePayload(datos, fallback),
  );
  return dtoToPosition(dto);
};

export const editarPosicion = async (
  id: string,
  datos: Partial<Position>,
): Promise<Position> => {
  const realId = id.startsWith("POS-") ? Number(id.slice(4)) : Number(id);
  const dto = await apiPatch<PositionDto>(POSITIONS.update(realId), positionToUpdatePayload(datos));
  return dtoToPosition(dto);
};

export const eliminarPosicion = async (id: string): Promise<void> => {
  const realId = id.startsWith("POS-") ? Number(id.slice(4)) : Number(id);
  await apiDelete(POSITIONS.remove(realId));
};

export const eliminarJerarquiaPadre = async (id: string): Promise<void> => {
  const realId = id.startsWith("POS-") ? Number(id.slice(4)) : Number(id);
  await apiPut(POSITIONS.removeFather(realId));
};
