import { supabase } from '@/supabase';
import { searchAll, type SearchAllResult } from '@/lib/search';

export interface ToolContext {
  slug: string;
  tenantId: string | null;
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, unknown>;
      required?: string[];
    };
  };
}

export const TEXT_CHAT_TOOLS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'searchWiki',
      description: `Search ALL wiki + game data (weapons, armors, enemies, bosses, rings, potions, upgrades). Returns wiki articles and game_items with stats. This is the PRIMARY search tool — use it for finding specific items, enemies, or articles by name. Do NOT search with the user's full question; extract only key terms (e.g., "espada noturna" not "como obter a espada noturna").`,
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Extracted key search term (lowercase, hyphenated optional). NOT the full user question.' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getWikiInfo',
      description: 'Get wiki metadata: total article count, per-tag counts (tag_counts like { potions: 4, weapons: 30 }), and all tags. Use for answering "how many articles", "quantas poções existem", "what categories exist". NEVER invent counts — read the actual numbers from the response.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getWikiArticle',
      description: 'Get the full content of a wiki article by its slug. Also returns item_stats with raw attributes IF the article has structured game data. PREFER searchWiki for finding items — getWikiArticle is only for reading full article text after you have the slug.',
      parameters: {
        type: 'object',
        properties: {
          slug: { type: 'string', description: 'The article slug (e.g. "steel-sword", "goblin-king"). Use the slug returned by searchWiki.' },
        },
        required: ['slug'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'listWikiArticles',
      description: 'Browse articles by category using the optional "tag" parameter (e.g. "potions", "weapons", "armors", "rings", "enemies", "bosses", "upgrades"). Returns article titles, slugs, and summaries for browsing. For FINDING a specific item by name, use searchWiki instead — this tool only lists by tag.',
      parameters: {
        type: 'object',
        properties: {
          tag: { type: 'string', description: 'Optional: filter by tag/category (e.g. "potions", "weapons"). Without this, lists ALL articles.' },
        },
      },
    },
  },
];

async function getTenantBySlugOrId(slug: string, tenantId: string | null): Promise<{ id: string; name: string; slug: string; logo_url: string | null; description: string | null } | null> {
  if (tenantId) {
    const { data } = await supabase
      .from('tenants')
      .select('id, name, slug, logo_url, description')
      .eq('id', tenantId)
      .single();
    return data as { id: string; name: string; slug: string; logo_url: string | null; description: string | null } | null;
  }
  if (slug) {
    const { data } = await supabase
      .from('tenants')
      .select('id, name, slug, logo_url, description')
      .eq('slug', slug)
      .single();
    return data as { id: string; name: string; slug: string; logo_url: string | null; description: string | null } | null;
  }
  return null;
}

async function handleSearchWiki(args: { query: string }, ctx: ToolContext): Promise<SearchAllResult> {
  return searchAll(ctx.slug, args.query);
}

async function handleGetWikiInfo(_args: Record<string, never>, ctx: ToolContext): Promise<Record<string, unknown>> {
  const tenant = await getTenantBySlugOrId(ctx.slug, ctx.tenantId);
  if (!tenant) return { error: 'Tenant not found' };

  const [{ count: articleCount }, { data: rawTags }] = await Promise.all([
    supabase
      .from('wiki_articles')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenant.id),
    supabase
      .from('wiki_articles')
      .select('tags')
      .eq('tenant_id', tenant.id)
      .not('tags', 'is', null),
  ]);

  const tagCounts: Record<string, number> = {};
  for (const row of (rawTags || []) as Array<{ tags: string[] | null }>) {
    for (const tag of row.tags || []) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }

  const uniqueTags = [...new Set((rawTags || []).flatMap(r => (r as { tags: string[] | null }).tags || []))].sort();

  return {
    wiki: {
      name: tenant.name,
      slug: tenant.slug,
      logo_url: tenant.logo_url,
      description: tenant.description,
    },
    article_count: articleCount || 0,
    tags: uniqueTags,
    tag_counts: tagCounts,
  };
}

function parseContentToJson(content: string | null): Record<string, unknown> | null {
  if (!content) return null;
  try {
    const parsed = JSON.parse(content);
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

async function handleGetWikiArticle(args: { slug: string }, ctx: ToolContext): Promise<Record<string, unknown>> {
  const tenant = await getTenantBySlugOrId(ctx.slug, ctx.tenantId);
  if (!tenant) return { error: 'Tenant not found', article: null };

  const { data: wikiArticle } = await supabase
    .from('wiki_articles')
    .select('id, title, slug, summary, content, tags, updated_at')
    .eq('tenant_id', tenant.id)
    .eq('slug', args.slug)
    .single();

  if (wikiArticle) {
    const item_stats = parseContentToJson(wikiArticle.content);
    return { article: wikiArticle, item_stats };
  }

  const { data: byId } = await supabase
    .from('wiki_articles')
    .select('id, title, slug, summary, content, tags, updated_at')
    .eq('tenant_id', tenant.id)
    .eq('id', args.slug)
    .single();

  if (byId) {
    const item_stats = parseContentToJson(byId.content);
    return { article: byId, item_stats };
  }

  return { article: null, item_stats: null };
}

async function handleListWikiArticles(args: { tag?: string }, ctx: ToolContext): Promise<Record<string, unknown>> {
  const tenant = await getTenantBySlugOrId(ctx.slug, ctx.tenantId);
  if (!tenant) return { error: 'Tenant not found', articles: [] };

  let query = supabase
    .from('wiki_articles')
    .select('id, title, slug, summary, tags, updated_at')
    .eq('tenant_id', tenant.id);

  if (args.tag) {
    query = query.filter('tags', 'cs', `{${args.tag}}`);
  }

  const { data, error } = await query.order('title').limit(100);
  if (error) throw error;

  return { articles: data || [] };
}

export async function executeTextChatTool(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<unknown> {
  switch (name) {
    case 'searchWiki':
      return handleSearchWiki(args as { query: string }, ctx);
    case 'getWikiInfo':
      return handleGetWikiInfo(args as Record<string, never>, ctx);
    case 'getWikiArticle':
      return handleGetWikiArticle(args as { slug: string }, ctx);
    case 'listWikiArticles':
      return handleListWikiArticles(args as { tag?: string }, ctx);
    default:
      return { error: `Unknown tool: ${name}` };
  }
}
