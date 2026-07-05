'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const globalCache = new Map<string, unknown>();

export function useCachedData<T>(key: string | null, fetcher: () => Promise<T>): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  mutate: () => Promise<void>;
} {
  const [data, setData] = useState<T | null>(() => {
    if (key && globalCache.has(key)) return globalCache.get(key) as T;
    return null;
  });
  const [loading, setLoading] = useState(!data && !!key);
  const [error, setError] = useState<Error | null>(null);
  const keyRef = useRef(key);
  keyRef.current = key;

  const fetchData = useCallback(async () => {
    const k = keyRef.current;
    if (!k) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      globalCache.set(k, result);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    if (!key) return;
    if (globalCache.has(key)) {
      setData(globalCache.get(key) as T);
      setLoading(false);
      return;
    }
    fetchData();
  }, [key, fetchData]);

  return { data, loading, error, mutate: fetchData };
}
