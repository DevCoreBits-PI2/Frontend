// Servicio de registro (invitación) de empleado — usa el backend real.
//
// El backend (users-ms) exige los campos en snake_case del DTO `InviteUserDto`.
// La UI del wizard pasa `fullName`, `documentNumber`, etc.; aquí convertimos al
// contrato exacto del backend y reportamos errores de manera homogénea.

import { ApiError, apiGet, apiPost } from "@/lib/api/client";
import { EMPLOYEES, POSITIONS } from "@/lib/api/endpoints";
import { normalizePaginated } from "@/types/api/common";
import { obtenerAreas } from "./areasService";
import { obtenerPosiciones } from "./positionsService";
import { findEmpleadoEnCargo } from "./orgLookupService";
import type { EmployeeDto, InviteUserPayload } from "@/types/api/employee";
import type { PositionDto } from "@/types/api/position";

export interface Position {
  id: string;
  nombre: string;
  areaId: string;
  /** Cupos definidos en `positions.vacancies` */
  vacancies: number;
  /** Empleados ya asignados a este cargo (calculado en frontend vía
   *  enrichPositionsWithEmployees, porque el backend no lo expone aparte). */
  empleadosAsignados: number;
}

export const DOCUMENT_TYPES = [
  { id: "dni", nombre: "DNI" },
  { id: "passport", nombre: "Passport" },
  { id: "ce", nombre: "Carnet de Extranjeria" },
];

export const CONTRACT_TYPES = [
  { id: "fulltime", nombre: "Full Time" },
  { id: "parttime", nombre: "Part Time" },
  { id: "temporal", nombre: "Temporal" },
];

// Reemplazamos los mocks por datos del backend.
export async function obtenerAreasParaRegistro(): Promise<{ id: string; nombre: string }[]> {
  const areas = await obtenerAreas();
  return areas.map((a) => ({ id: a.id, nombre: a.nombre }));
}

export async function obtenerPosicionesParaRegistro(): Promise<Position[]> {
  // Solo posiciones activas pueden recibir empleados nuevos. Las inactivas
  // (soft-deleted por el backend) se ocultan del selector para evitar
  // asignar personas a una posición que ya no está en uso.
  const { data } = await obtenerPosiciones({ pageSize: 100, status: "Active" });
  return data.map((p) => ({
    id: String(p.rawId),
    nombre: p.nombre,
    areaId: String(p.areaIdNumber),
    vacancies: p.vacancies,
    empleadosAsignados: p.empleados.length,
  }));
}

export interface RegisterPayload {
  fullName: string;
  documentType: string;
  documentNumber: string;
  email: string;
  phone: string;
  photo?: string;
  files?: { name: string; size: number; type: string }[];
  // Solo asignación organizacional. Tipo/fecha/condiciones del contrato viven
  // en otra entidad (`contracts`) y se manejan desde su propio módulo.
  areaId?: string;
  positionId?: string;
  // Campos adicionales que el backend exige:
  age?: number;
  idAdministrator?: number;
  managerId?: number | null;
}

export type RegisterErrorCode = "DUPLICATE_DOCUMENT" | "BACKEND_ERROR";

export interface RegisterResult {
  success: boolean;
  employeeId?: string;
  payload?: RegisterPayload;
  errorCode?: RegisterErrorCode;
  errorMessage?: string;
}

// Chequeo previo contra los empleados existentes (no hay endpoint dedicado
// para "duplicado por documento"; usamos `code` como identificador único).
export const isDocumentDuplicated = async (documentNumber?: string): Promise<boolean> => {
  if (!documentNumber) return false;
  const documento = Number(documentNumber.replace(/\D/g, ""));
  if (!documento) return false;
  try {
    // limit alto: el backend pagina con 10 por defecto, lo que permitiría
    // falsos negativos si el duplicado está fuera de la primera página.
    const data = await apiGet<unknown>(EMPLOYEES.findAll, {
      query: { limit: 1000 },
    });
    return normalizePaginated<EmployeeDto>(data).some((e) => e.code === documento);
  } catch {
    return false; // si no se puede verificar, dejar que el backend valide.
  }
};

function partirNombre(fullName: string): { first_name: string; last_name: string } {
  const partes = fullName.trim().split(/\s+/);
  if (partes.length === 0) return { first_name: "", last_name: "" };
  if (partes.length === 1) return { first_name: partes[0], last_name: "" };
  return {
    first_name: partes.slice(0, -1).join(" "),
    last_name: partes[partes.length - 1],
  };
}

// PostgreSQL `integer` (que es lo que usa la columna employees.code) es int32:
// rango máximo 2_147_483_647 (≈ 2.14 mil millones, ~10 dígitos). Documentos
// más largos disparan P2020 "ValueOutOfRange" en el backend → 500.
// Esto cubre cédulas colombianas válidas hasta ~21 mil millones, pero números
// más grandes (o IDs extranjeros largos) hay que bloquearlos acá.
export const PG_INT32_MAX = 2_147_483_647;

export const enviarRegistroEmpleado = async (
  payload: RegisterPayload,
): Promise<RegisterResult> => {
  if (await isDocumentDuplicated(payload.documentNumber)) {
    return {
      success: false,
      errorCode: "DUPLICATE_DOCUMENT",
      errorMessage:
        "Ya existe un empleado registrado en el sistema con este número de documento.",
    };
  }

  if (!payload.positionId || !payload.idAdministrator) {
    return {
      success: false,
      errorCode: "BACKEND_ERROR",
      errorMessage: "Faltan datos obligatorios (cargo o administrador responsable).",
    };
  }

  const { first_name, last_name } = partirNombre(payload.fullName);
  const documento = Number(payload.documentNumber.replace(/\D/g, ""));

  if (!documento) {
    return {
      success: false,
      errorCode: "BACKEND_ERROR",
      errorMessage: "El número de documento es obligatorio y debe contener dígitos.",
    };
  }
  if (documento > PG_INT32_MAX) {
    return {
      success: false,
      errorCode: "BACKEND_ERROR",
      errorMessage: `El número de documento (${payload.documentNumber}) excede el máximo permitido por el sistema (${PG_INT32_MAX}). Verifica los dígitos.`,
    };
  }

  // Auto-resolución de `id_manager` cuando el caller no lo pasó explícito.
  // Lógica A4: el "jefe" estructural de un empleado nuevo es el ocupante del
  // cargo padre del cargo que va a ocupar. Así `getSubordinates` del backend
  // (que filtra por id_manager) sigue funcionando para futuros consumidores,
  // sin que el invitador tenga que elegir manager a mano.
  let resolvedManagerId: number | null = payload.managerId ?? null;
  if (resolvedManagerId == null) {
    try {
      const positionDto = await apiGet<PositionDto>(
        POSITIONS.findOne(Number(payload.positionId)),
      );
      const parentId = positionDto?.parent_position_id ?? null;
      if (typeof parentId === "number" && parentId > 0) {
        const ocupante = await findEmpleadoEnCargo(parentId);
        if (ocupante?.id) resolvedManagerId = ocupante.id;
      }
    } catch {
      // Si falla la resolución del cargo padre, dejamos `id_manager: null`
      // (el backend lo acepta) y seguimos. El "Equipo Directo" en el perfil
      // ya no depende de este campo, así que no es bloqueante.
    }
  }

  const body: InviteUserPayload = {
    email: payload.email,
    first_name,
    last_name,
    age: payload.age ?? 0,
    code: documento,
    status: "invited",
    id_position: Number(payload.positionId),
    id_manager: resolvedManagerId,
    id_administrator: payload.idAdministrator,
  };

  try {
    const dto = await apiPost<EmployeeDto>(EMPLOYEES.invite, body);
    return { success: true, employeeId: String(dto.id ?? dto.id_employee ?? ""), payload };
  } catch (err) {
    const mensaje = err instanceof ApiError ? err.message : "Error al invitar empleado";
    return { success: false, errorCode: "BACKEND_ERROR", errorMessage: mensaje };
  }
};

// Alias legacy (componentes existentes lo llaman así).
export const enviarRegistroMock = enviarRegistroEmpleado;
