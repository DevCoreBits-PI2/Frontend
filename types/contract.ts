// types/contract.ts
import { ContratoBase } from "./contrato";

export type EstadoContratoUI = "Activo" | "Vencido" | "Renovado" | "Anulado";

export type TipoContrato =
  | "Término Fijo"
  | "Término Indefinido"
  | "Servicio"
  | "Pasantía"
  | "Aprendizaje"
  | "Obra o Labor";

export interface FuncionarioResumen {
  nombre: string;
  idContrato: string;
  avatar: string;
}

export interface ContratoUI extends ContratoBase {
  funcionario: FuncionarioResumen;
  tipoUI: TipoContrato;
  area: string;
  estadoUI: EstadoContratoUI;
  validezTexto: string;
  validezPorcentaje: number;
}

export interface EstadisticasContratos {
  activos: number;
  proxAVencer: number;
  renovados: number;
  vencidosAnulados: number;
}

export interface FiltrosContratos {
  estado: string;
  tipo: string;
  area: string;
  rango: string;
}