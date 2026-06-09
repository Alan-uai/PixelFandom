'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { CatalogEntry, TableItem, SearchResult } from '@/lib/data-access';

type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: Error | null;
};

type AsyncStateWithData<T> = AsyncState<T> & { refetch: () => void };

function useDataAccess<T>(
  fetcher: () => Promise<T>,
  deps: unknown[],
): AsyncStateWithData<T> {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: true,
    error: null,
  });
  const cacheRef = useRef<T | null>(null);
  const depsRef = useRef<string>("");
  const mountedRef = useRef(true);

  const depsKey = JSON.stringify(deps);
  if (depsKey !== depsRef.current) {
    depsRef.current = depsKey;
    cacheRef.current = null;
  }

  const execute = useCallback(() => {
    if (cacheRef.current !== null) {
      setState({ data: cacheRef.current, loading: false, error: null });
      return;
    }

    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true }));

    fetcher()
      .then((result) => {
        if (!cancelled && mountedRef.current) {
          cacheRef.current = result;
          setState({ data: result, loading: false, error: null });
        }
      })
      .catch((err) => {
        if (!cancelled && mountedRef.current) {
          setState({ data: null, loading: false, error: err as Error });
        }
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    mountedRef.current = true;
    const cleanup = execute();
    return () => {
      mountedRef.current = false;
      cleanup?.();
    };
  }, [execute]);

  const refetch = useCallback(() => {
    cacheRef.current = null;
    execute();
  }, [execute]);

  return { ...state, refetch };
}

export function useTableCatalog(
  tenantSlug: string | null,
  includeCounts = true,
) {
  return useDataAccess<CatalogEntry[]>(
    async () => {
      const { getTableCatalog } = await import('@/lib/data-access');
      if (!tenantSlug) return [];
      return getTableCatalog(tenantSlug, includeCounts);
    },
    [tenantSlug, includeCounts],
  );
}

export function useTableItems(
  tenantSlug: string | null,
  tableName: string | null,
) {
  return useDataAccess<{ items: TableItem[]; labelCol: string }>(
    async () => {
      const { getTableItems } = await import('@/lib/data-access');
      if (!tenantSlug || !tableName) return { items: [], labelCol: 'name' };
      return getTableItems(tenantSlug, tableName);
    },
    [tenantSlug, tableName],
  );
}

export function useTableItem(
  tenantSlug: string | null,
  tableName: string | null,
  itemSlug: string | null,
) {
  return useDataAccess<TableItem | null>(
    async () => {
      const { getTableItem } = await import('@/lib/data-access');
      if (!tenantSlug || !tableName || !itemSlug) return null;
      return getTableItem(tenantSlug, tableName, itemSlug);
    },
    [tenantSlug, tableName, itemSlug],
  );
}

export function useSlugResolution(
  tenantSlug: string | null,
  slug: string | null,
) {
  return useDataAccess<{ table: string; item: TableItem } | null>(
    async () => {
      const { resolveSlug } = await import('@/lib/data-access');
      if (!tenantSlug || !slug) return null;
      return resolveSlug(tenantSlug, slug);
    },
    [tenantSlug, slug],
  );
}

export function useSearch(
  tenantSlug: string | null,
  query: string | null,
  limit = 10,
) {
  return useDataAccess<SearchResult[]>(
    async () => {
      const { searchTenant } = await import('@/lib/data-access');
      if (!tenantSlug || !query) return [];
      return searchTenant(tenantSlug, query, limit);
    },
    [tenantSlug, query, limit],
  );
}
