// Tipos espejo de:
//   gateway/src/trajectory/career-history/dto/*
//   gateway/src/trajectory/performance-evaluation/dto/*

export type CareerTypeChange =
  | "promotion"
  | "transfer"
  | "contract_modification"
  | "salary_change"
  | "evaluation";

export interface CareerHistoryDto {
  id: number;
  description: string;
  event_date: string;
  type: CareerTypeChange;
  id_employee: number;
  id_evaluation?: number | null;
  created_at?: string;
}

export interface CreateCareerHistoryPayload {
  description: string;
  event_date: string;
  type: CareerTypeChange;
  id_employee: number;
  id_evaluation?: number;
}

export type UpdateCareerHistoryPayload = Partial<CreateCareerHistoryPayload>;

export interface PerformanceEvaluationDto {
  id: number;
  id_director: number;
  id_employee?: number;
  observations?: string;
  evaluation_date: string;
  communication?: number;
  technical_proficiency?: number;
  leadership_influence?: number;
  innovation?: number;
  reliability?: number;
  created_at?: string;
}

export interface CreatePerformanceEvaluationPayload {
  id_director: number;
  id_employee?: number;
  observations?: string;
  evaluation_date: string;
  communication?: number;
  technical_proficiency?: number;
  leadership_influence?: number;
  innovation?: number;
  reliability?: number;
}

export type UpdatePerformanceEvaluationPayload =
  Partial<CreatePerformanceEvaluationPayload>;

export type ReportExportFormat = "json" | "csv";

export interface GenerateConsolidatedReportPayload {
  employeeIds?: number[];
  startDate?: string;
  endDate?: string;
  export?: ReportExportFormat;
}

export interface GenerateAreaReportPayload {
  areaId: number;
  startDate?: string;
  endDate?: string;
  export?: ReportExportFormat;
}
