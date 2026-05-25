/**
 * Hook reutilizable para fetch de datos del dashboard
 * Maneja loading, error, y retry automático
 */

import { useCallback, useEffect, useState } from "react";

export interface UseDashboardDataState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  retry: () => void;
}

export function useDashboardData<T>(
  fetchFn: () => Promise<T>,
  dependencies: unknown[] = []
): UseDashboardDataState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    fetch();
  }, [fetch, retryCount, ...dependencies]);

  return {
    data,
    loading,
    error,
    retry: () => setRetryCount((c) => c + 1),
  };
}

export function useDashboardMultipleData<T extends Record<string, Promise<unknown>>>(
  fetchFns: T,
  dependencies: unknown[] = []
): {
  data: { [K in keyof T]: Awaited<T[K]> } | null;
  loading: boolean;
  error: Error | null;
  retry: () => void;
} {
  const [data, setData] = useState<{ [K in keyof T]: Awaited<T[K]> } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const entries = Object.entries(fetchFns);
      const results = await Promise.all(entries.map(([, fn]) => fn as Promise<unknown>));
      const resultObj = entries.reduce(
        (acc, [key], idx) => {
          acc[key as keyof T] = results[idx] as Awaited<T[keyof T]>;
          return acc;
        },
        {} as { [K in keyof T]: Awaited<T[K]> }
      );
      setData(resultObj);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch, retryCount, ...dependencies]);

  return {
    data,
    loading,
    error,
    retry: () => setRetryCount((c) => c + 1),
  };
}
