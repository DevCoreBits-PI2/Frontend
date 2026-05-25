// Tipos espejo de:
//   users-ms (entidad administrators) + gateway/src/users/admin/dto/create-admin.dto.ts

export interface AdminDto {
  id: number;
  name: string;
  last_name: string;
  age: number;
  email: string;
  supabase_user_id: string | null;
}

export interface CreateAdminPayload {
  email: string;
  name: string;
  last_name: string;
  age: number;
}
