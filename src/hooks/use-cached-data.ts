'use client';

import { useState, useEffect, useCallback } from 'react';

const globalCache = new Map<string, unknown>();

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    ),
  ]);
}

export function useCachedData<T>(key: string | null, fetcher: () => Promise<T>, timeoutMs = 30_000): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  mutate: () => Promise<void>;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!key) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await withTimeout(fetcher(), timeoutMs);
      globalCache.set(key, result);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, timeoutMs]);

  useEffect(() => {
    if (!key) {
      setData(null);
      setLoading(false);
      return;
    }
    if (globalCache.has(key)) {
      setData(globalCache.get(key) as T);
      return;
    }
    fetchData();
  }, [key, fetchData]);

  return { data, loading, error, mutate: fetchData };
}
