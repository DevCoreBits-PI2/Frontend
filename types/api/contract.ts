// Tipos espejo de:
//   gateway/src/administrative-data/contracts/dto/*
//   administrative-data-ms (entidad Contract)

export type ContractType =
  | "fixed_term_contract"
  | "indefinite_term_contract"
  | "work_or_project_based_contract"
  | "temporary_contract"
  | "apprenticeship_contract"
  | "service_provision_contract";

export type ContractStatus = "valid" | "expired";

export interface ContractDto {
  id: number;
  conditions: string;
  contract_type: ContractType;
  contract_status: ContractStatus;
  start_date: string;
  end_date: string;
  id_employee: number;
  id_manager: number;
  pdf_url?: string | null;
  created_at?: string;
  updated_at?: string;
  // Relaciones a veces expandidas:
  employee?: { id: number; first_name?: string; last_name?: string };
  manager?: { id: number; first_name?: string; last_name?: string };
}

export interface CreateContractPayload {
  conditions: string;
  contractType: ContractType;
  contractStatus?: ContractStatus;
  startDate: string;
  endDate: string;
  idEmployee: number;
  idManager: number;
}

export type UpdateContractPayload = Partial<CreateContractPayload>;

export interface RenewContractPayload {
  newEndDate: string;
}

export interface ContractPaginationQuery {
  page?: number;
  limit?: number;
  status?: ContractStatus;
  contract_type?: ContractType;
  id_employee?: number;
  id_manager?: number;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface ContractStats {
  activos: number;
  proxAVencer: number;
  renovados: number;
  vencidosAnulados: number;
  // El backend puede usar otras claves; mantenemos ambas formas tolerantes.
  valid?: number;
  expired?: number;
  expiring_soon?: number;
}
