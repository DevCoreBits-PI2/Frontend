// Evaluaciones de desempeño — ms-trayectoria.
//
// Endpoints:
//   POST   /create-performance-evaluation                  (auth)
//   GET    /find-all-performance-evaluation                [HumanTalent | Admin]
//   GET    /find-performance-evaluation/:id                (auth)
//   GET    /find-performance-evaluations-by-employee/:id   (auth + permisos)
//   POST   /generate-performance-evaluation-report         [HumanTalent | Admin]
//   POST   /generate-performance-evaluation-report-by-area [HumanTalent | Admin]
//   PATCH  /update-performance-evaluation/:id              [HumanTalent | Admin]
//   DELETE /delete-performance-evaluation/:id              [HumanTalent | Admin]

import { apiDelete, apiGet, apiPatch, apiPost, apiRequest } from "@/lib/api/client";
import { PERFORMANCE } from "@/lib/api/endpoints";
import { normalizePaginated } from "@/types/api/common";
import type {
  CreatePerformanceEvaluationPayload,
  GenerateAreaReportPayload,
  GenerateConsolidatedReportPayload,
  PerformanceEvaluationDto,
  UpdatePerformanceEvaluationPayload,
} from "@/types/api/career";

export const listarEvaluaciones = async (page = 1, limit = 10) => {
  const data = await apiGet<unknown>(PERFORMANCE.findAll, { query: { page, limit } });
  return normalizePaginated<PerformanceEvaluationDto>(data);
};

export const obtenerEvaluacion = (id: number | string) =>
  apiGet<PerformanceEvaluationDto>(PERFORMANCE.findOne(id));

export const listarEvaluacionesPorEmpleado = async (
  idEmpleado: number | string,
  page = 1,
  limit = 10,
) => {
  const data = await apiGet<unknown>(PERFORMANCE.byEmployee(idEmpleado), {
    query: { page, limit },
  });
  return normalizePaginated<PerformanceEvaluationDto>(data);
};

export const crearEvaluacion = (payload: CreatePerformanceEvaluationPayload) =>
  apiPost<PerformanceEvaluationDto>(PERFORMANCE.create, payload);

export const actualizarEvaluacion = (
  id: number | string,
  payload: UpdatePerformanceEvaluationPayload,
) => apiPatch<PerformanceEvaluationDto>(PERFORMANCE.update(id), payload);

export const eliminarEvaluacion = (id: number | string) =>
  apiDelete<void>(PERFORMANCE.remove(id));

// Reportes consolidados (JSON o CSV).
export const generarReporteConsolidado = async (
  payload: GenerateConsolidatedReportPayload,
): Promise<unknown> =>
  apiRequest(PERFORMANCE.generateReport, { method: "POST", body: payload });

export const generarReportePorArea = async (
  payload: GenerateAreaReportPayload,
): Promise<unknown> =>
  apiRequest(PERFORMANCE.generateAreaReport, { method: "POST", body: payload });
