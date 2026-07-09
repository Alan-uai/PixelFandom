'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const globalCache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    ),
  ]);
}

function isCacheValid<T>(entry: CacheEntry<T> | undefined): entry is CacheEntry<T> {
  if (!entry) return false;
  return Date.now() - entry.timestamp < CACHE_TTL;
}

export function useCachedData<T>(key: string | null, fetcher: () => Promise<T>, timeoutMs = 30_000): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  mutate: () => Promise<void>;
  updateCache: (newData: T) => void;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetcherRef = useRef(fetcher);
  const keyRef = useRef(key);
  const loadingRef = useRef(false);

  useEffect(() => {
    fetcherRef.current = fetcher;
    keyRef.current = key;
  });

  const fetchData = useCallback(async () => {
    const currentKey = keyRef.current;
    if (!currentKey) {
      setLoading(false);
      return;
    }
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const result = await withTimeout(fetcherRef.current(), timeoutMs);
      globalCache.set(currentKey, { data: result, timestamp: Date.now() });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [timeoutMs]);

  const updateCache = useCallback((newData: T) => {
    const currentKey = keyRef.current;
    if (currentKey) {
      globalCache.set(currentKey, { data: newData, timestamp: Date.now() });
    }
    setData(newData);
  }, []);

  useEffect(() => {
    if (!key) {
      setData(null);
      setLoading(false);
      return;
    }
    const entry = globalCache.get(key) as CacheEntry<T> | undefined;
    if (isCacheValid(entry)) {
      setData(entry.data);
      return;
    }
    fetchData();
  }, [key, fetchData]);

  return { data, loading, error, mutate: fetchData, updateCache };
}
