import { EstadoFuncionario } from "./enums";
import { CargoBase, CargoCompleto } from "./cargo";
import { ContratoBase } from "./contrato";
import { HistorialBase } from "./historial";

export interface FuncionarioBase {
  idFuncionario: number;
  nombre: string;
  apellidos: string;
  correo: string;
  estado: EstadoFuncionario;
  salario: number;
  cargo: CargoBase;
}

export type RegistroDTO = {
  nombre: string;
  apellidos: string;
  correo: string;
  password: string;
  cargoId: number;
};

export type EstadoPerfilUsuario =
  | "ACTIVO"
  | "INACTIVO"
  | "SUSPENDIDO"
  | "RETIRADO"
  | "INVITADO";

export interface UserProfile {
  idFuncionario: number;
  // Código visible (dto.code) — distinto del id interno.
  codigo?: number;
  nombre: string;
  apellidos: string;
  cargo: string;
  /** id_position numérico del cargo actual (para resolver subordinados por
   *  jerarquía). Opcional porque los admins no lo tienen. */
  cargoId?: number;
  area: string;
  email: string;
  fechaIngreso: string;
  ubicacion: string;
  foto: string;
  estado: EstadoPerfilUsuario;
  reportaA: string;
  // Edad — sí editable vía PATCH /employees/updateUser/:id (UpdateProfileDto.age).
  edad?: number;
}