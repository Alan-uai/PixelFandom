import type { MentionResult, PendingLink } from './smart-mention-types';
import { getTableCatalog, searchTenant } from '@/lib/data-access';

function sortByRelevance(query: string, items: MentionResult[]): MentionResult[] {
  const q = query.toLowerCase().trim();
  if (!q) return items;

  const scored = items.map((item) => {
    const label = (item.label || '').toLowerCase();
    const slug = (item.slug || '').toLowerCase();
    const desc = (item.description || '').toLowerCase();
    let score = 0;

    if (label === q || slug === q) score = 100;
    else if (label.startsWith(q) || slug.startsWith(q)) score = 75;
    else if (label.includes(' ' + q) || slug.includes(' ' + q)) score = 50;
    else if (label.includes(q) || slug.includes(q)) score = 25;
    else if (desc.includes(q)) score = 10;

    return { item, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || a.item.label.localeCompare(b.item.label))
    .slice(0, 10)
    .map((s) => s.item);
}

export async function queryTables(
  partialSlug: string,
  tenantSlug: string,
): Promise<MentionResult[]> {
  const catalog = await getTableCatalog(tenantSlug);
  const q = partialSlug.toLowerCase();

  const all = catalog.map((e) => ({
    id: e.table_name,
    label: e.display_label,
    description: `${e.count} itens`,
    slug: e.table_name,
  }));

  return sortByRelevance(q, all);
}

export async function queryItems(
  query: string,
  tenantSlug: string,
): Promise<MentionResult[]> {
  const results = await searchTenant(tenantSlug, query, 10);
  const items = results
    .filter((r) => r.match_type === 'game_item')
    .map((r) => ({
      id: r.id,
      label: r.title,
      description: `${r.source_type}`,
      slug: r.slug,
      imageUrl: r.image_url ?? undefined,
    }));
  return sortByRelevance(query, items);
}

export async function queryArticles(
  query: string,
  tenantSlug: string,
): Promise<MentionResult[]> {
  const results = await searchTenant(tenantSlug, query, 10);
  const items = results
    .filter((r) => r.match_type === 'wiki_article')
    .map((r) => ({
      id: r.id,
      label: r.title,
      description: r.summary ?? '',
      slug: r.slug,
    }));
  return sortByRelevance(query, items);
}

export async function queryUsers(
  query: string,
): Promise<MentionResult[]> {
  const { supabase } = await import('@/supabase');
  const q = query.toLowerCase();

  const { data } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, discord_username')
    .or(
      `username.ilike.%${q}%,display_name.ilike.%${q}%,discord_username.ilike.%${q}%`,
    )
    .limit(20);

  const items = (data ?? []).map((u) => ({
    id: u.id,
    label: u.display_name || u.username || u.discord_username || 'Unknown',
    description: `@${u.username || u.discord_username || ''}`,
    avatarUrl: u.avatar_url ?? undefined,
  }));
  return sortByRelevance(query, items);
}

export function extractPendingLinks(content: string): PendingLink[] {
  const links: PendingLink[] = [];
  const pattern = /\$([tia])<([^>]+)>/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content)) !== null) {
    const typeMap: Record<string, 'table' | 'item' | 'article'> = {
      t: 'table',
      i: 'item',
      a: 'article',
    };
    const type = typeMap[match[1]];
    const slug = match[2].trim().toLowerCase();
    if (type && slug) {
      links.push({ type, slug, created_at: new Date().toISOString() });
    }
  }

  // deduplicate by (type, slug)
  const seen = new Set<string>();
  return links.filter((l) => {
    const key = `${l.type}:${l.slug}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
