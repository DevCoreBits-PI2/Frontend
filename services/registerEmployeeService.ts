// Servicio de registro (invitación) de empleado — usa el backend real.
//
// El backend (users-ms) exige los campos en snake_case del DTO `InviteUserDto`.
// La UI del wizard pasa `fullName`, `documentNumber`, etc.; aquí convertimos al
// contrato exacto del backend y reportamos errores de manera homogénea.

import { ApiError, apiGet, apiPost } from "@/lib/api/client";
import { EMPLOYEES } from "@/lib/api/endpoints";
import { normalizePaginated } from "@/types/api/common";
import { obtenerAreas } from "./areasService";
import { obtenerPosiciones } from "./positionsService";
import type { EmployeeDto, InviteUserPayload } from "@/types/api/employee";

export interface Position {
  id: string;
  nombre: string;
  areaId: string;
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
  const { data } = await obtenerPosiciones({ pageSize: 100 });
  return data.map((p) => ({
    id: String(p.rawId),
    nombre: p.nombre,
    areaId: String(p.areaIdNumber),
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
  areaId?: string;
  positionId?: string;
  hireDate?: string;
  contractType?: string;
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
    const data = await apiGet<unknown>(EMPLOYEES.findAll);
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

  const body: InviteUserPayload = {
    email: payload.email,
    first_name,
    last_name,
    age: payload.age ?? 0,
    code: documento,
    status: "invited",
    id_position: Number(payload.positionId),
    id_manager: payload.managerId ?? null,
    id_administrator: payload.idAdministrator,
  };

  try {
    const dto = await apiPost<EmployeeDto>(EMPLOYEES.invite, body);
    return { success: true, employeeId: String(dto.id), payload };
  } catch (err) {
    const mensaje = err instanceof ApiError ? err.message : "Error al invitar empleado";
    return { success: false, errorCode: "BACKEND_ERROR", errorMessage: mensaje };
  }
};

// Alias legacy (componentes existentes lo llaman así).
export const enviarRegistroMock = enviarRegistroEmpleado;
