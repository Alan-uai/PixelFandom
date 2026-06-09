import type { ColumnInfo, GameSchema } from './game-schema';

export interface CatalogEntry {
  table_name: string;
  display_label: string;
  parent_table: string | null;
  count: number;
  display_format?: string;
  columns_count?: number;
  icon?: string;
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

const cache = new Map<string, unknown>();

function getCached<T>(key: string): T | undefined {
  return cache.get(key) as T | undefined;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, data);
}

export function invalidateDataCache(pattern?: string): void {
  if (pattern) {
    for (const key of cache.keys()) {
      if (key.includes(pattern)) cache.delete(key);
    }
  } else {
    cache.clear();
  }
  cachedSchema = null;
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
      .select('table_name, display_label, parent_table, display_format, columns_count, icon')
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

async function getSchema(): Promise<GameSchema> {
  if (cachedSchema) return cachedSchema;
  const { getGameSchema } = await import('./game-schema');
  cachedSchema = await getGameSchema();
  return cachedSchema;
}

function findLabelColumn(columns: ColumnInfo[]): string {
  const candidates = ['name', 'title', 'code', 'label', 'item_name', 'display_name', 'full_name', 'username', 'config_key'];
  for (const col of candidates) {
    if (columns.some((c) => c.column_name === col)) return col;
  }
  const nameEnding = columns.find((c) => c.column_name.endsWith('_name'));
  if (nameEnding) return nameEnding.column_name;
  const orderable = columns.find((c) =>
    !['id', 'tenant_id'].includes(c.column_name) &&
    ['character varying', 'text', 'varchar', 'integer', 'bigint', 'numeric', 'real'].includes(c.data_type),
  );
  if (orderable) return orderable.column_name;
  return columns[0]?.column_name || 'id';
}
