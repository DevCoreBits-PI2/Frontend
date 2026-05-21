// Tipos espejo de:
//   gateway/src/administrative-data/areas/dto/*
//   administrative-data-ms (entidad Area)
//
// El backend usa snake_case en las respuestas; estos tipos lo reflejan tal cual.

export type AreaStatus = "active" | "inactive";

export interface AreaDto {
  id: number;
  name: string;
  description: string;
  id_administrator: number;
  status: AreaStatus;
  created_at?: string;
  updated_at?: string;
  // El backend puede incluir el conteo de cargos asociados:
  _count?: { positions?: number };
  positions_count?: number;
}

export interface CreateAreaPayload {
  name: string;
  description: string;
  id_administrator: number;
  status?: AreaStatus;
}

export type UpdateAreaPayload = Partial<CreateAreaPayload>;

export interface AreaPaginationQuery {
  page?: number;
  limit?: number;
  status?: AreaStatus;
  search?: string;
}
