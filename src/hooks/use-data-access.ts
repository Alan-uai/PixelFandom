'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { CatalogEntry, TableItem, SearchResult } from '@/lib/data-access';
import { cacheSubscribe } from '@/lib/cache-registry';

type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: Error | null;
};

type AsyncStateWithData<T> = AsyncState<T> & { refetch: () => void };

function useDataAccess<T>(
  fetcher: () => Promise<T>,
  deps: unknown[],
  cacheKey?: string | null,
): AsyncStateWithData<T> {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: true,
    error: null,
  });
  const mountedRef = useRef(true);
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const depsKey = JSON.stringify(deps);

  const execute = useCallback(() => {
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true }));

    fetcherRef.current()
      .then((result) => {
        if (!cancelled && mountedRef.current) {
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
  }, [depsKey]);

  useEffect(() => {
    mountedRef.current = true;
    const cleanup = execute();
    return () => {
      mountedRef.current = false;
      cleanup?.();
    };
  }, [execute]);

  // Subscribe to cache changes for realtime updates
  useEffect(() => {
    if (!cacheKey) return;
    const unsub = cacheSubscribe(cacheKey, () => {
      execute();
    });
    return unsub;
  }, [cacheKey, execute]);

  // Also subscribe to global '*' notifications
  useEffect(() => {
    const unsub = cacheSubscribe('*', () => {
      execute();
    });
    return unsub;
  }, [execute]);

  const refetch = useCallback(() => {
    execute();
  }, [execute]);

  return { ...state, refetch };
}

export function useTableCatalog(
  tenantSlug: string | null,
  includeCounts = true,
) {
  const cacheKey = tenantSlug ? `catalog:${tenantSlug}:counts` : null;
  return useDataAccess<CatalogEntry[]>(
    async () => {
      const { getTableCatalog } = await import('@/lib/data-access');
      if (!tenantSlug) return [];
      return getTableCatalog(tenantSlug, includeCounts);
    },
    [tenantSlug, includeCounts],
    cacheKey,
  );
}

export function useTableItems(
  tenantSlug: string | null,
  tableName: string | null,
) {
  const cacheKey = tenantSlug && tableName ? `items:${tenantSlug}:${tableName}` : null;
  return useDataAccess<{ items: TableItem[]; labelCol: string }>(
    async () => {
      const { getTableItems } = await import('@/lib/data-access');
      if (!tenantSlug || !tableName) return { items: [], labelCol: 'name' };
      return getTableItems(tenantSlug, tableName);
    },
    [tenantSlug, tableName],
    cacheKey,
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
    null,
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
    null,
  );
}

export function useViewerConfig(
  tenantSlug: string | null,
  table: string | null,
) {
  const cacheKey = tenantSlug && table ? `viewer-config:${tenantSlug}:${table}` : null;
  return useDataAccess<Record<string, unknown> | null>(
    async () => {
      const { getTableViewerConfig } = await import('@/lib/data-access');
      if (!tenantSlug || !table) return null;
      return getTableViewerConfig(tenantSlug, table);
    },
    [tenantSlug, table],
    cacheKey,
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
    null,
  );
}
