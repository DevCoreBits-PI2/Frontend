// Perfil del usuario autenticado.
//
// Endpoints (gateway):
//   GET   /employees/getMyProfile/:supabaseUserId       (auth — dueño/jefe/HT/admin)
//   PATCH /employees/updateUser/:supabaseUserId         (auth — el propio empleado)
//
// El backend NO expone phone/birthdate/office/location ni permite cambiar nombre
// o email aquí: el DTO UpdateProfile solo acepta { id_employee, photo_url?, age? }.
// Además, el PATCH responde solo { id_employee, email, age, photo_url } (sin
// nombre/cargo/manager), por eso después del update hacemos un re-fetch completo
// con `obtenerPerfilUsuario` para no perder los campos no devueltos.

import { apiGet, apiPatch } from "@/lib/api/client";
import { EMPLOYEES } from "@/lib/api/endpoints";
import { createClient } from "@/utils/supabase/client";
import type { AdminDto } from "@/types/api/admin";
import type { EmployeeDto, EmployeeStatus, UpdateProfilePayload } from "@/types/api/employee";
import type { EstadoPerfilUsuario, UserProfile } from "@/types/funcionario";

function statusBackendToUi(s?: EmployeeStatus): EstadoPerfilUsuario {
  switch (s) {
    case "active":    return "ACTIVO";
    case "suspended": return "SUSPENDIDO";
    case "retired":   return "RETIRADO";
    case "invited":   return "INVITADO";
    case "inactive":  return "INACTIVO";
    default:          return "INACTIVO";
  }
}

export function empleadoDtoToUserProfile(dto: EmployeeDto): UserProfile {
  const id = dto.id ?? dto.id_employee ?? 0;
  const managerNombre = dto.manager
    ? `${dto.manager.first_name ?? ""} ${dto.manager.last_name ?? ""}`.trim()
    : "";
  return {
    idFuncionario: id,
    codigo: dto.code,
    nombre: dto.first_name ?? "",
    apellidos: dto.last_name ?? "",
    cargo: dto.position?.name ?? "",
    area: dto.position?.area?.name ?? dto.area?.name ?? "",
    email: dto.email ?? "",
    phone: "",
    fechaIngreso: dto.created_at?.slice(0, 10) ?? "",
    ubicacion: "",
    foto: dto.photo_url ?? "",
    estado: statusBackendToUi(dto.status),
    fechaNacimiento: "",
    oficina: "",
    reportaA: managerNombre,
    edad: dto.age,
  };
}

// Mapea un AdminDto al shape `UserProfile` que la UI espera. Los admins no
// están en employees, no tienen cargo/área/manager/edad; rellenamos lo mínimo
// para que la card no rompa.
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

export interface ActualizarPerfilInput {
  idEmployee: number;
  photoUrl?: string;
  edad?: number;
}

export async function actualizarPerfilUsuario(
  input: ActualizarPerfilInput,
): Promise<UserProfile> {
  if (!input.idEmployee) {
    throw new Error("No se conoce el id del empleado.");
  }
  const payload: UpdateProfilePayload = { id_employee: input.idEmployee };
  if (input.photoUrl !== undefined) payload.photo_url = input.photoUrl;
  if (input.edad !== undefined) payload.age = input.edad;

  // OJO: el endpoint /employees/updateUser/:id usa el `id_employee` numérico,
  // no el supabase_user_id (a diferencia de getMyProfile/:id). El backend
  // valida `Number(id) !== employeeId` y devuelve 403 si no coincide.
  // El PATCH responde un subset (id_employee, email, age, photo_url). Para que
  // el resto del UI no pierda nombre/cargo/área/manager, re-leemos el perfil
  // completo después de guardar.
  await apiPatch<unknown>(EMPLOYEES.updateProfile(input.idEmployee), payload);
  return obtenerPerfilUsuario();
}
