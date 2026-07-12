import type { ColumnInfo } from './game-schema';
import { findLabelColumn, invalidateSchemaCache, addColumnToCachedSchema, dropColumnFromCachedSchema, addTableToCachedSchema, removeTableFromCachedSchema } from './game-schema';
import { cacheNotify, cacheNotifyAll, cacheSubscribe } from './cache-registry';
export { cacheSubscribe };

export interface CatalogEntry {
  table_name: string;
  display_label: string;
  parent_table: string | null;
  count: number;
  display_format?: string;
  columns_count?: number;
  icon?: string;
  viewer_config?: Record<string, unknown>;
  is_hidden?: boolean;
}

export interface TableItem {
  id: string;
  [key: string]: unknown;
}

export interface SearchResult {
  source_type: string;
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: Record<string, unknown> | null;
  raw_data: Record<string, unknown> | null;
  rank: number;
  image_url: string | null;
  tags: string[] | null;
  match_type: string;
}

// ── Cache version counter ──
let _cacheVersion = 0;
export function getCacheVersion(): number { return _cacheVersion; }
function bumpVersion() { _cacheVersion++; }

// ── Global cache ──
const cache = new Map<string, unknown>();

function getCached<T>(key: string): T | undefined {
  return cache.get(key) as T | undefined;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, data);
}

export function updateCachedCatalogEntry(
  tenantSlug: string,
  tableName: string,
  updates: Partial<CatalogEntry>,
): void {
  const cacheKey = `catalog:${tenantSlug}:counts`;
  const cached = getCached<CatalogEntry[]>(cacheKey);
  if (cached) {
    const entry = cached.find(e => e.table_name === tableName);
    if (entry) Object.assign(entry, updates);
    cacheNotify(cacheKey);
  }
}

export function invalidateDataCache(pattern?: string): void {
  if (pattern) {
    for (const key of cache.keys()) {
      if (key.includes(pattern)) cache.delete(key);
    }
  } else {
    cache.clear();
  }
  invalidateSchemaCache();
  bumpVersion();
  cacheNotifyAll();
}

// ── Schema mutation helpers (update cache in-place, no invalidation) ──
export async function cacheAddColumn(
  tenantSlug: string,
  tableName: string,
  columnName: string,
  dataType: string,
): Promise<void> {
  const colInfo: ColumnInfo = {
    column_name: columnName,
    data_type: dataType,
    is_nullable: true,
    column_default: null,
    is_system: false,
  };
  addColumnToCachedSchema(tableName, colInfo);

  const columnsKey = `columns:${tableName}`;
  const cached = getCached<ColumnInfo[]>(columnsKey);
  if (cached) {
    cached.push(colInfo);
    cacheNotify(columnsKey);
  }

  bumpVersion();
}

export async function cacheDropColumn(
  tenantSlug: string,
  tableName: string,
  columnName: string,
): Promise<void> {
  dropColumnFromCachedSchema(tableName, columnName);

  const columnsKey = `columns:${tableName}`;
  const cached = getCached<ColumnInfo[]>(columnsKey);
  if (cached) {
    const idx = cached.findIndex((c) => c.column_name === columnName);
    if (idx >= 0) cached.splice(idx, 1);
    cacheNotify(columnsKey);
  }

  bumpVersion();
}

export async function cacheAddTable(
  tableName: string,
  _tenantId: string,
): Promise<void> {
  const supabase = await getSupabase();
  const { data } = await supabase.rpc('get_table_columns', { p_table: tableName });
  if (data && (data as any).ok) {
    const cols = (data as any).columns as ColumnInfo[];
    addTableToCachedSchema(tableName, cols);
    const columnsKey = `columns:${tableName}`;
    setCache(columnsKey, cols);
    cacheNotify(columnsKey);
    bumpVersion();
  }
}

export async function cacheRemoveTable(
  tenantSlug: string,
  tableName: string,
): Promise<void> {
  removeTableFromCachedSchema(tableName);

  const columnsKey = `columns:${tableName}`;
  cache.delete(columnsKey);

  const catKey = `catalog:${tenantSlug}:counts`;
  const cat = getCached<CatalogEntry[]>(catKey);
  if (cat) {
    const idx = cat.findIndex((e) => e.table_name === tableName);
    if (idx >= 0) cat.splice(idx, 1);
    cacheNotify(catKey);
  }

  bumpVersion();
}

async function getSupabase() {
  const { supabase } = await import('@/supabase');
  return supabase;
}

async function getTenantId(slug: string): Promise<string | null> {
  const idKey = `tenant:id:${slug}`;
  const cached = getCached<string>(idKey);
  if (cached) return cached;

  const supabase = await getSupabase();
  const { data } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (data?.id) {
    setCache(idKey, data.id);
    return data.id;
  }
  return null;
}

export async function searchTenant(
  tenantSlug: string,
  query: string,
  limit = 10,
): Promise<SearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const cacheKey = `search:${tenantSlug}:${trimmed}:${limit}`;
  const cached = getCached<SearchResult[]>(cacheKey);
  if (cached) return cached;

  const supabase = await getSupabase();
  const { data, error } = await supabase.rpc('search_all', {
    p_tenant_slug: tenantSlug,
    p_query: trimmed,
    p_limit: limit,
    p_embedding: null,
  });

  if (error) {
    console.error('searchTenant error:', error);
    return [];
  }

  const results = (data ?? []) as unknown as SearchResult[];
  setCache(cacheKey, results);
  return results;
}

export async function getTableItems(
  tenantSlug: string,
  tableName: string,
): Promise<{ items: TableItem[]; labelCol: string }> {
  const cacheKey = `items:${tenantSlug}:${tableName}`;
  const cached = getCached<{ items: TableItem[]; labelCol: string }>(cacheKey);
  if (cached) return cached;

  const tenantId = await getTenantId(tenantSlug);
  if (!tenantId) return { items: [], labelCol: 'name' };

  const schema = await getSchema();
  const t = (schema.tables as any[]).find((t: any) => t.table_name === tableName);
  const columns = t?.columns ?? [];
  const labelCol = findLabelColumn(columns);

  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from(tableName as any)
    .select('*')
    .eq('tenant_id', tenantId)
    .order(labelCol);

  if (error) {
    console.error(`getTableItems(${tableName}) error:`, error);
    return { items: [], labelCol };
  }

  const result = { items: (data ?? []) as TableItem[], labelCol };
  setCache(cacheKey, result);
  cacheNotify(cacheKey);
  return result;
}

export async function getTableItem(
  tenantSlug: string,
  tableName: string,
  itemSlug: string,
): Promise<TableItem | null> {
  const cacheKey = `item:${tenantSlug}:${tableName}:${itemSlug}`;
  const cached = getCached<TableItem | null>(cacheKey);
  if (cached !== undefined) return cached;

  const tenantId = await getTenantId(tenantSlug);
  if (!tenantId) return null;

  const schema = await getSchema();
  const t = (schema.tables as any[]).find((t: any) => t.table_name === tableName);
  const columns = t?.columns ?? [];
  const hasSlugCol = columns.some((c: any) => c.column_name === 'slug');
  const labelCol = findLabelColumn(columns);

  const supabase = await getSupabase();

  let item: TableItem | null = null;

  if (hasSlugCol) {
    const { data } = await supabase
      .from(tableName as any)
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('slug', itemSlug)
      .maybeSingle();
    item = data as TableItem | null;
  }

  if (!item) {
    const searchName = itemSlug.replace(/-/g, ' ');
    const { data } = await supabase
      .from(tableName as any)
      .select('*')
      .eq('tenant_id', tenantId)
      .ilike(labelCol, searchName)
      .maybeSingle();
    item = data as TableItem | null;
  }

  setCache(cacheKey, item);
  return item;
}

export async function getTableCatalog(
  tenantSlug: string,
  includeCounts = true,
): Promise<CatalogEntry[]> {
  const countKey = includeCounts ? ':counts' : '';
  const cacheKey = `catalog:${tenantSlug}${countKey}`;
  const cached = getCached<CatalogEntry[]>(cacheKey);
  if (cached) return cached;

  const tenantId = await getTenantId(tenantSlug);
  if (!tenantId) return [];

  const supabase = await getSupabase();
    const { data: rows, error } = await supabase
      .from('tenant_game_tables')
      .select('table_name, display_label, parent_table, display_format, columns_count, icon, viewer_config, is_hidden')
      .eq('tenant_id', tenantId)
      .order('created_at');

  if (error) {
    console.error('getTableCatalog error:', error);
    return [];
  }

  const entries: CatalogEntry[] = (rows ?? []).map((r: any) => ({
    table_name: r.table_name,
    display_label: r.display_label,
    parent_table: r.parent_table ?? null,
    count: 0,
    display_format: r.display_format ?? undefined,
    columns_count: r.columns_count ?? undefined,
    icon: r.icon ?? undefined,
    viewer_config: r.viewer_config ?? undefined,
    is_hidden: r.is_hidden ?? false,
  }));

  if (includeCounts && entries.length > 0) {
    await Promise.all(
      entries.map(async (entry) => {
        const { count } = await supabase
          .from(entry.table_name as any)
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenantId);
        entry.count = count ?? 0;
      }),
    );
  }

  setCache(cacheKey, entries);
  cacheNotify(cacheKey);
  return entries;
}

export async function resolveSlug(
  tenantSlug: string,
  slug: string,
): Promise<{ table: string; item: TableItem } | null> {
  const cacheKey = `resolve:${tenantSlug}:${slug}`;
  const cached = getCached<{ table: string; item: TableItem } | null>(cacheKey);
  if (cached !== undefined) return cached;

  const tenantId = await getTenantId(tenantSlug);
  if (!tenantId) return null;

  const supabase = await getSupabase();

  const { data: wikiArticle } = await supabase
    .from('wiki_articles')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('slug', slug)
    .maybeSingle();

  if (wikiArticle) {
    const result = { table: 'wiki_articles', item: wikiArticle as unknown as TableItem };
    setCache(cacheKey, result);
    return result;
  }

  const searchName = slug.replace(/-/g, ' ');
  const schema = await getSchema();

  for (const t of schema.tables) {
    const columns = t.columns;
    const hasSlug = columns.some((c: any) => c.column_name === 'slug');
    const labelCol = findLabelColumn(columns);
    const slugColName = hasSlug ? 'slug' : labelCol;
    const slugValue = hasSlug ? slug : searchName;

    const { data } = await supabase
      .from(t.table_name as any)
      .select('*')
      .eq('tenant_id', tenantId)
      .eq(slugColName, slugValue)
      .maybeSingle();

    if (data) {
      const result = { table: t.table_name, item: data as unknown as TableItem };
      setCache(cacheKey, result);
      return result;
    }
  }

  setCache(cacheKey, null);
  return null;
}

let _cachedSchema: any = null;

async function getSchema(): Promise<any> {
  if (_cachedSchema) return _cachedSchema;
  const { getGameSchema } = await import('./game-schema');
  _cachedSchema = await getGameSchema();
  return _cachedSchema;
}


