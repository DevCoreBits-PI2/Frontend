// Tipos espejo de:
//   gateway/src/administrative-data/positions/dto/*
//   administrative-data-ms (entidad Position)

export type PositionStatus = "active" | "inactive";

export interface PositionDto {
  id?: number;
  id_position?: number;
  name: string;
  description: string;
  base_salary?: number;
  id_administrator: number;
  id_area: number;
  parent_position_id: number | null;
  status: PositionStatus;
  vacancies: number;
  created_at?: string;
  updated_at?: string;
  // Algunas respuestas vienen anidadas con `areas`/`positions` desde Prisma.
  area?: { id?: number; id_area?: number; name: string };
  areas?: { id?: number; id_area?: number; name: string; description?: string };
  parent_position?: { id?: number; id_position?: number; name: string } | null;
  positions?: { id?: number; id_position?: number; name?: string } | null;
  employees?: Array<{ id?: number; id_employee?: number; first_name?: string; last_name?: string; photo_url?: string }>;
  employee?: { id?: number; id_employee?: number; first_name?: string; last_name?: string; photo_url?: string } | null;
  other_positions?: Array<{ id_position: number }>;
  _count?: { employees?: number };
}

export interface CreatePositionPayload {
  name: string;
  description: string;
  base_salary?: number;
  id_administrator: number;
  id_area: number;
  parent_position_id?: number;
  status?: PositionStatus;
  vacancies: number;
}

export type UpdatePositionPayload = Partial<CreatePositionPayload>;

export interface PositionPaginationQuery {
  page?: number;
  limit?: number;
  status?: PositionStatus;
  id_area?: number;
  parent_position_id?: number;
  search?: string;
}

export interface PositionTreeNode extends PositionDto {
  children?: PositionTreeNode[];
}
