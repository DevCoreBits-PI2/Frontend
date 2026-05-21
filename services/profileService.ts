// Perfil del usuario autenticado.
//
// Endpoints:
//   GET   /employees/getMyProfile/:id   (auth)
//   PATCH /employees/updateUser/:id     (auth — el propio empleado)
//
// El backend no tiene un endpoint `dashboard/perfil`; usamos los del MS Users.

import { apiGet, apiPatch } from "@/lib/api/client";
import { EMPLOYEES } from "@/lib/api/endpoints";
import { createClient } from "@/utils/supabase/client";
import type { AdminDto } from "@/types/api/admin";
import type { EmployeeDto, UpdateProfilePayload } from "@/types/api/employee";
import type { UserProfile } from "@/types/funcionario";

function empleadoDtoToUserProfile(dto: EmployeeDto): UserProfile {
  return {
    idFuncionario: dto.id,
    nombre: dto.first_name ?? "",
    apellidos: dto.last_name ?? "",
    cargo: dto.position?.name ?? "",
    area: dto.position?.area?.name ?? dto.area?.name ?? "",
    email: dto.email ?? "",
    phone: "",
    fechaIngreso: dto.created_at?.slice(0, 10) ?? "",
    ubicacion: "",
    foto: dto.photo_url ?? "",
    estado: dto.status === "active" ? "ACTIVO" : "INACTIVO",
    fechaNacimiento: "",
    oficina: "",
    reportaA: dto.manager
      ? `${dto.manager.first_name ?? ""} ${dto.manager.last_name ?? ""}`.trim()
      : "",
  };
}

// Mapea un AdminDto al shape `UserProfile` que la UI espera. Los admins no
// tienen cargo/área/manager, así que esos campos quedan en blanco o con un
// texto fijo ("Administrador") para que la card se renderice bien.
export function adminDtoToUserProfile(dto: AdminDto): UserProfile {
  return {
    idFuncionario: dto.id,
    nombre: dto.name ?? "",
    apellidos: dto.last_name ?? "",
    cargo: "Administrador",
    area: "Administración",
    email: dto.email ?? "",
    phone: "",
    fechaIngreso: "",
    ubicacion: "",
    foto: "",
    estado: "ACTIVO",
    fechaNacimiento: "",
    oficina: "",
    reportaA: "",
  };
}

async function getSupabaseUserId(): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function obtenerPerfilUsuario(): Promise<UserProfile> {
  const uid = await getSupabaseUserId();
  if (!uid) {
    throw new Error("No hay sesión activa");
  }
  const dto = await apiGet<EmployeeDto>(EMPLOYEES.myProfile(uid));
  return empleadoDtoToUserProfile(dto);
}

export async function actualizarPerfilUsuario(
  perfil: UserProfile,
): Promise<UserProfile> {
  const uid = await getSupabaseUserId();
  if (!uid) {
    throw new Error("No hay sesión activa");
  }
  const payload: UpdateProfilePayload = {
    id_employee: perfil.idFuncionario,
    photo_url: perfil.foto || undefined,
  };
  const dto = await apiPatch<EmployeeDto>(EMPLOYEES.updateProfile(uid), payload);
  return empleadoDtoToUserProfile(dto);
}
