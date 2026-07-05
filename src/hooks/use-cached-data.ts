'use client';

import { useState, useEffect, useCallback } from 'react';

const globalCache = new Map<string, unknown>();

export function useCachedData<T>(key: string | null, fetcher: () => Promise<T>): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  mutate: () => Promise<void>;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!key) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      globalCache.set(key, result);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [key, fetcher]);

  useEffect(() => {
    if (!key) return;
    if (globalCache.has(key)) {
      setData(globalCache.get(key) as T);
      return;
    }
    fetchData();
  }, [key, fetchData]);

  return { data, loading, error, mutate: fetchData };
}
