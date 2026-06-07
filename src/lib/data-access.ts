import type { ColumnInfo, GameSchema } from './game-schema';

export interface CatalogEntry {
  table_name: string;
  display_label: string;
  parent_table: string | null;
  count: number;
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

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const TTL = 5 * 60 * 1000;

function getCached<T>(key: string): T | undefined {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (entry && Date.now() < entry.expiry) return entry.data;
  cache.delete(key);
  return undefined;
}

function setCache<T>(key: string, data: T, ttl = TTL): void {
  cache.set(key, { data, expiry: Date.now() + ttl });
}

export function invalidateDataCache(pattern?: string): void {
  if (pattern) {
    for (const key of cache.keys()) {
      if (key.includes(pattern)) cache.delete(key);
    }
  } else {
    cache.clear();
  }
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
    setCache(idKey, data.id, 60 * 60 * 1000);
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
  setCache(cacheKey, results, 60_000);
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
  const t = schema.tables.find((t) => t.table_name === tableName);
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
  const t = schema.tables.find((t) => t.table_name === tableName);
  const columns = t?.columns ?? [];
  const hasSlugCol = columns.some((c) => c.column_name === 'slug');
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
    .select('table_name, display_label, parent_table')
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
    const hasSlug = columns.some((c) => c.column_name === 'slug');
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

let cachedSchema: GameSchema | null = null;
let schemaExpiry = 0;

async function getSchema(): Promise<GameSchema> {
  if (cachedSchema && Date.now() < schemaExpiry) return cachedSchema;
  const { getGameSchema } = await import('./game-schema');
  cachedSchema = await getGameSchema();
  schemaExpiry = Date.now() + TTL;
  return cachedSchema;
}

function findLabelColumn(columns: ColumnInfo[]): string {
  if (columns.some((c) => c.column_name === 'name')) return 'name';
  const nameCol = columns.find((c) => c.column_name.endsWith('_name'));
  if (nameCol) return nameCol.column_name;
  if (columns.some((c) => c.column_name === 'code')) return 'code';
  return 'name';
}
