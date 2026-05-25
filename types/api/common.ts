// Tipos comunes del backend.

export interface PaginatedResponse<T> {
  data: T[];
  total?: number;
  page?: number;
  limit?: number;
}

// El backend a veces responde directamente con un array, a veces con
// `{ data, meta }`. Esta función normaliza ambas formas.
export function normalizePaginated<T>(input: unknown): T[] {
  if (Array.isArray(input)) return input as T[];
  if (input && typeof input === "object" && "data" in (input as Record<string, unknown>)) {
    const data = (input as { data: unknown }).data;
    if (Array.isArray(data)) return data as T[];
  }
  return [];
}
