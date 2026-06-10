'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSiteCache } from '@/lib/site-cache';

export function useCachedData<T>(
  key: string | null | undefined,
  fetcher: () => Promise<T>
): {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
} {
  const cached = key ? useSiteCache.getState().get<T>(key) : null;
  const [data, setData] = useState<T | null>(cached);
  const [loading, setLoading] = useState(!cached && !!key);
  const [error, setError] = useState<string | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const fetchId = useRef(0);

  const fetch = useCallback(async () => {
    if (!key) return;
    const existing = useSiteCache.getState().get<T>(key);
    if (existing) {
      setData(existing);
      setLoading(false);
      return;
    }
    const id = ++fetchId.current;
    setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current();
      if (id !== fetchId.current) return;
      useSiteCache.getState().set(key, result);
      setData(result);
    } catch (err) {
      if (id !== fetchId.current) return;
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      if (id === fetchId.current) setLoading(false);
    }
  }, [key]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refresh: fetch };
}
