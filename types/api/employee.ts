// Tipos espejo de:
//   gateway/src/users/employees/dto/*
//   users-ms (entidad Employee)

export type EmployeeStatus =
  | "active"
  | "inactive"
  | "suspended"
  | "retired"
  | "invited";

export interface EmployeeDto {
  id?: number;
  id_employee?: number;
  first_name: string;
  last_name: string;
  email: string;
  age?: number;
  code: number;
  photo_url?: string | null;
  status: EmployeeStatus;
  id_position: number;
  id_manager: number | null;
  id_administrator: number;
  supabase_user_id?: string;
  must_set_password?: boolean;
  created_at?: string;
  updated_at?: string;
  // Algunas respuestas pueden incluir relaciones expandidas:
  position?: {
    id?: number;
    id_position?: number;
    name: string;
    id_area?: number;
    base_salary?: number | null;
    parent_position_id?: number | null;
    parent_position?: { id_position?: number; id?: number; name?: string } | null;
    area?: { id: number; name: string };
  };
  area?: { id: number; name: string };
  manager?: { id?: number; id_employee?: number; first_name?: string; last_name?: string } | null;
}

export interface InviteUserPayload {
  email: string;
  first_name: string;
  last_name: string;
  age: number;
  code: number;
  status: EmployeeStatus;
  id_position: number;
  id_manager?: number | null;
  id_administrator: number;
}

export interface UpdateProfilePayload {
  id_employee: number;
  photo_url?: string;
  age?: number;
}

export interface UpdateEmployeePayload {
  id_employee: number;
  id_position?: number;
  id_manager?: number | null;
  status: EmployeeStatus;
}

export interface ScanQrPayload {
  qrToken: string;
}

export interface QrTokenResponse {
  token?: string;
  qrToken?: string;
  expires_at?: string;
  expiresAt?: string;
}

export interface QrEmployeeView {
  // El payload visible cambia según permisos del scanner; mantenemos todo opcional.
  id?: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  photo_url?: string | null;
  status?: EmployeeStatus;
  position?: { id: number; name: string };
  area?: { id: number; name: string };
  code?: number;
  manager?: { id: number; first_name?: string; last_name?: string } | null;
}
