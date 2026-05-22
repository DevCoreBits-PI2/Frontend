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
import { AREAS, EMPLOYEES, POSITIONS } from "@/lib/api/endpoints";
import { createClient } from "@/utils/supabase/client";
import type { AdminDto } from "@/types/api/admin";
import type { EmployeeDto, EmployeeStatus, UpdateProfilePayload } from "@/types/api/employee";
import type { PositionTreeNode } from "@/types/api/position";
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

// Busca dentro del árbol de posiciones quién ocupa una posición específica.
// El backend embebe un empleado por posición vía Map (limitación documentada
// en orgChartService); si hay >1 asignado solo veremos el último. Suficiente
// para resolver "quién es tu jefe" en la mayoría de los casos.
function findEmployeeInTreeByPositionId(
  nodes: PositionTreeNode[],
  targetId: number,
): { first_name?: string; last_name?: string } | null {
  const stack = [...nodes];
  while (stack.length) {
    const node = stack.pop();
    if (!node) continue;
    const id = node.id ?? node.id_position;
    if (id === targetId && node.employee) {
      return node.employee;
    }
    if (node.children?.length) stack.push(...node.children);
  }
  return null;
}

// El backend `getMyProfile` no incluye position, area ni cargo superior.
// Enriquecemos client-side: cargo → área → cargo padre + empleado del cargo
// padre (para "reporta a"). Usamos `positions-tree` (público) para resolver
// el nombre del empleado superior, evitando el 403 que daría `findUserById`
// al consultar otro empleado siendo solo "funcionario".
async function enrichProfileDto(dto: EmployeeDto): Promise<EmployeeDto> {
  if (!dto.id_position) return dto;

  try {
    const position = await apiGet<{
      id_position?: number;
      name?: string;
      id_area?: number;
      parent_position_id?: number | null;
    }>(POSITIONS.findOne(dto.id_position));

    const [areaInfo, parentInfo, tree] = await Promise.all([
      position?.id_area
        ? apiGet<{ id_area?: number; id?: number; name?: string }>(
            AREAS.findOne(position.id_area),
          ).catch(() => null)
        : Promise.resolve(null),
      position?.parent_position_id
        ? apiGet<{ id_position?: number; name?: string }>(
            POSITIONS.findOne(position.parent_position_id),
          ).catch(() => null)
        : Promise.resolve(null),
      position?.parent_position_id
        ? apiGet<PositionTreeNode[]>(POSITIONS.tree).catch(() => null)
        : Promise.resolve(null),
    ]);

    // Construye el string "Nombre Apellido — Cargo Superior" para mostrar como
    // "Reporta a". Si no encontramos al empleado, queda solo el cargo. Si
    // tampoco hay cargo (posición raíz), queda vacío y la UI muestra "—".
    let reportaAValue = "";
    if (parentInfo?.name) {
      const empleadoPadre =
        tree && Array.isArray(tree) && position?.parent_position_id
          ? findEmployeeInTreeByPositionId(tree, position.parent_position_id)
          : null;
      const nombreEmpleado = empleadoPadre
        ? `${empleadoPadre.first_name ?? ""} ${empleadoPadre.last_name ?? ""}`.trim()
        : "";
      reportaAValue = nombreEmpleado
        ? `${nombreEmpleado} — ${parentInfo.name}`
        : parentInfo.name;
    }

    return {
      ...dto,
      position: {
        id: position?.id_position,
        id_position: position?.id_position,
        name: position?.name ?? "",
        id_area: position?.id_area,
        area: areaInfo?.name
          ? { id: areaInfo.id_area ?? areaInfo.id ?? 0, name: areaInfo.name }
          : undefined,
      },
      // Reutilizamos el slot `manager` del DTO para que
      // `empleadoDtoToUserProfile` mapee este texto al campo `reportaA` sin
      // cambiar la estructura aguas abajo.
      manager: reportaAValue
        ? { first_name: reportaAValue, last_name: "" }
        : null,
    };
  } catch {
    return dto;
  }
}

export async function obtenerPerfilUsuario(): Promise<UserProfile> {
  const uid = await getSupabaseUserId();
  if (!uid) {
    throw new Error("No hay sesión activa");
  }
  const dto = await apiGet<EmployeeDto>(EMPLOYEES.myProfile(uid));
  const enriched = await enrichProfileDto(dto);
  return empleadoDtoToUserProfile(enriched);
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
