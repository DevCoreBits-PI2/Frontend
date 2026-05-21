// Servicio de Áreas — integrado con el Gateway real.
// Conserva la forma `Area` que usan los componentes existentes y mapea
// el backend (snake_case + status en inglés) hacia UI (estado en español).
//
// Endpoints (gateway):
//   POST    /administrative-data/areas/create-area    [HumanTalentAssistant | HumanTalentLead | Admin]
//   GET     /administrative-data/areas/find-all-areas (público)
//   GET     /administrative-data/areas/find-area/:id  (público)
//   PATCH   /administrative-data/areas/update-area/:id
//   DELETE  /administrative-data/areas/delete-area/:id

import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api/client";
import { AREAS } from "@/lib/api/endpoints";
import { normalizePaginated } from "@/types/api/common";
import type {
  AreaDto,
  CreateAreaPayload,
  UpdateAreaPayload,
  AreaPaginationQuery,
} from "@/types/api/area";

export interface Area {
  id: string;
  nombre: string;
  descripcion: string;
  posiciones: number;
  estado: "ACTIVO" | "INACTIVO" | "EN_REVISION";
  color: string;
  icono: string;
  idAdministrator: number;
}

const COLOR_POR_INDICE = ["#3B82F6", "#8B5CF6", "#F59E0B", "#EC4899", "#10B981", "#F97316"];
const ICONO_POR_DEFECTO = "ingenieria";

function colorPara(id: number): string {
  return COLOR_POR_INDICE[id % COLOR_POR_INDICE.length];
}

function dtoToArea(dto: AreaDto): Area {
  const posiciones =
    dto.positions_count ??
    dto._count?.positions ??
    0;

  return {
    id: String(dto.id),
    nombre: dto.name,
    descripcion: dto.description,
    posiciones,
    estado: dto.status === "active" ? "ACTIVO" : "INACTIVO",
    color: colorPara(dto.id),
    icono: ICONO_POR_DEFECTO,
    idAdministrator: dto.id_administrator,
  };
}

function areaToCreatePayload(area: Omit<Area, "id">): CreateAreaPayload {
  return {
    name: area.nombre,
    description: area.descripcion,
    id_administrator: area.idAdministrator,
    status: area.estado === "ACTIVO" ? "active" : "inactive",
  };
}

function areaToUpdatePayload(area: Partial<Area>): UpdateAreaPayload {
  const payload: UpdateAreaPayload = {};
  if (area.nombre !== undefined) payload.name = area.nombre;
  if (area.descripcion !== undefined) payload.description = area.descripcion;
  if (area.idAdministrator !== undefined) payload.id_administrator = area.idAdministrator;
  if (area.estado !== undefined) {
    payload.status = area.estado === "ACTIVO" ? "active" : "inactive";
  }
  return payload;
}

export const obtenerAreas = async (query?: AreaPaginationQuery): Promise<Area[]> => {
  const data = await apiGet<unknown>(AREAS.findAll, { query: query as Record<string, string | number | boolean | undefined> });
  return normalizePaginated<AreaDto>(data).map(dtoToArea);
};

export const obtenerAreaPorId = async (id: number | string): Promise<Area> => {
  const dto = await apiGet<AreaDto>(AREAS.findOne(id));
  return dtoToArea(dto);
};

export const crearArea = async (datos: Omit<Area, "id">): Promise<Area> => {
  const dto = await apiPost<AreaDto>(AREAS.create, areaToCreatePayload(datos));
  return dtoToArea(dto);
};

export const editarArea = async (id: string, datos: Partial<Area>): Promise<Area> => {
  const dto = await apiPatch<AreaDto>(AREAS.update(id), areaToUpdatePayload(datos));
  return dtoToArea(dto);
};

export const eliminarArea = async (id: string): Promise<void> => {
  await apiDelete(AREAS.remove(id));
};
