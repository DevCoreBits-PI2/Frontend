// Historial laboral (career history) — ms-trayectoria.
//
// Endpoints:
//   POST   /create-career-history                       (auth + permisos)
//   GET    /find-all-career-history                     [HumanTalent | Admin]
//   GET    /find-career-history-by-employee/:id         (auth + permisos)
//   GET    /find-career-history/:id                     (auth + permisos)
//   PATCH  /update-career-history/:id                   [HumanTalent | Admin]
//   DELETE /delete-career-history/:id                   [HumanTalent | Admin]

import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api/client";
import { CAREER_HISTORY } from "@/lib/api/endpoints";
import { normalizePaginated } from "@/types/api/common";
import type {
  CareerHistoryDto,
  CreateCareerHistoryPayload,
  UpdateCareerHistoryPayload,
} from "@/types/api/career";

export const listarHistorialCarrera = async (page = 1, limit = 10): Promise<CareerHistoryDto[]> => {
  const data = await apiGet<unknown>(CAREER_HISTORY.findAll, { query: { page, limit } });
  return normalizePaginated<CareerHistoryDto>(data);
};

export const listarHistorialPorEmpleado = async (
  idEmpleado: number | string,
  page = 1,
  limit = 10,
): Promise<CareerHistoryDto[]> => {
  const data = await apiGet<unknown>(CAREER_HISTORY.byEmployee(idEmpleado), {
    query: { page, limit },
  });
  return normalizePaginated<CareerHistoryDto>(data);
};

export const obtenerEventoCarrera = (id: number | string) =>
  apiGet<CareerHistoryDto>(CAREER_HISTORY.findOne(id));

export const crearEventoCarrera = (payload: CreateCareerHistoryPayload) =>
  apiPost<CareerHistoryDto>(CAREER_HISTORY.create, payload);

export const actualizarEventoCarrera = (
  id: number | string,
  payload: UpdateCareerHistoryPayload,
) => apiPatch<CareerHistoryDto>(CAREER_HISTORY.update(id), payload);

export const eliminarEventoCarrera = (id: number | string) =>
  apiDelete<void>(CAREER_HISTORY.remove(id));
