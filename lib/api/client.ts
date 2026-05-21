import { createClient } from "@/utils/supabase/client";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

if (!apiUrl) {
  // No detener el build, pero advertir en runtime.
  // El backend NO se puede modificar, así que la URL siempre debe venir del .env.local
  console.warn("[api] NEXT_PUBLIC_API_URL no está definida");
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "No autorizado") {
    super(401, message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = "No tiene permisos para esta acción") {
    super(403, message);
    this.name = "ForbiddenError";
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  // body se acepta como objeto JSON, FormData o string.
  body?: unknown;
  // query string opcional (objeto plano).
  query?: Record<string, string | number | boolean | undefined | null>;
  // si es true, NO se envía el token aunque la sesión exista (endpoints públicos).
  skipAuth?: boolean;
};

async function getAccessToken(forceRefresh = false): Promise<string | null> {
  const supabase = createClient();

  if (forceRefresh) {
    const { data, error } = await supabase.auth.refreshSession();
    if (error || !data.session) return null;
    return data.session.access_token;
  }

  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) return null;
  return data.session.access_token;
}

function buildQueryString(query?: RequestOptions["query"]): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.append(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

async function parseErrorBody(res: Response): Promise<{ message: string; data: unknown }> {
  const fallback = res.statusText || `HTTP ${res.status}`;
  try {
    const text = await res.text();
    if (!text) return { message: fallback, data: null };
    try {
      const json = JSON.parse(text);
      const msg =
        (typeof json?.message === "string" && json.message) ||
        (Array.isArray(json?.message) && json.message.join(", ")) ||
        (typeof json?.error === "string" && json.error) ||
        fallback;
      return { message: msg, data: json };
    } catch {
      return { message: text || fallback, data: text };
    }
  } catch {
    return { message: fallback, data: null };
  }
}

async function doFetch(path: string, init: RequestInit, token: string | null): Promise<Response> {
  const headers = new Headers(init.headers);
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  // No fijamos Content-Type cuando el body es FormData; el browser pone el boundary.
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(path, { ...init, headers });
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, query, skipAuth, ...rest } = options;

  if (!apiUrl) {
    throw new ApiError(0, "API_URL no configurada");
  }

  const url = `${apiUrl}${path}${buildQueryString(query)}`;

  let serializedBody: BodyInit | undefined;
  if (body !== undefined && body !== null) {
    if (body instanceof FormData || typeof body === "string") {
      serializedBody = body as BodyInit;
    } else {
      serializedBody = JSON.stringify(body);
    }
  }

  const init: RequestInit = { ...rest, body: serializedBody };

  let token: string | null = null;
  if (!skipAuth) {
    token = await getAccessToken(false);
  }

  let res = await doFetch(url, init, token);

  // 401 → intentar refresh de la sesión una sola vez
  if (res.status === 401 && !skipAuth) {
    const refreshed = await getAccessToken(true);
    if (refreshed) {
      res = await doFetch(url, init, refreshed);
    }
    if (res.status === 401) {
      const { message } = await parseErrorBody(res);
      throw new UnauthorizedError(message);
    }
  }

  if (res.status === 403) {
    const { message, data } = await parseErrorBody(res);
    throw new ForbiddenError(message || "No tiene permisos para esta acción");
  }

  if (!res.ok) {
    const { message, data } = await parseErrorBody(res);
    throw new ApiError(res.status, message, data);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  // Permitir respuestas no-JSON (CSV de reportes)
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return (await res.json()) as T;
  }
  if (contentType.startsWith("text/")) {
    return (await res.text()) as unknown as T;
  }
  return (await res.blob()) as unknown as T;
}

export const apiGet = <T>(path: string, options: Omit<RequestOptions, "method" | "body"> = {}) =>
  apiRequest<T>(path, { ...options, method: "GET" });

export const apiPost = <T>(path: string, body?: unknown, options: Omit<RequestOptions, "method"> = {}) =>
  apiRequest<T>(path, { ...options, method: "POST", body });

export const apiPatch = <T>(path: string, body?: unknown, options: Omit<RequestOptions, "method"> = {}) =>
  apiRequest<T>(path, { ...options, method: "PATCH", body });

export const apiPut = <T>(path: string, body?: unknown, options: Omit<RequestOptions, "method"> = {}) =>
  apiRequest<T>(path, { ...options, method: "PUT", body });

export const apiDelete = <T>(path: string, options: Omit<RequestOptions, "method" | "body"> = {}) =>
  apiRequest<T>(path, { ...options, method: "DELETE" });
