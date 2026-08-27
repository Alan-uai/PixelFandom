import { supabase } from '@/supabase';
import type { ToolContext, ToolDefinition } from './text-chat-tools';
import { getGameSchema } from './game-schema';

// ── Tenant resolver (mirrors text-chat-tools.getTenantBySlugOrId) ──

async function resolveTenant(ctx: ToolContext) {
  if (ctx.tenantId) {
    const { data } = await supabase
      .from('tenants')
      .select('id, name, slug, logo_url, description, discord_url, theme, discord_config')
      .eq('id', ctx.tenantId)
      .single();
    if (data) return data;
  }
  if (ctx.slug) {
    const { data } = await supabase
      .from('tenants')
      .select('id, name, slug, logo_url, description, discord_url, theme, discord_config')
      .eq('slug', ctx.slug)
      .single();
    if (data) return data;
  }
  return null;
}

// ════════════════════════════════════════════════════════════════════
// 1. CONTEXTO DA PÁGINA ATUAL
// ════════════════════════════════════════════════════════════════════

const getWikiPageDef: ToolDefinition = {
  type: 'function',
  function: {
    name: 'getWikiPage',
    description: 'Read the full content (summary + body + tags) of a wiki article or item page by its slug. Use when the user references "this page", "esta página", or names an article you need to read in full. If no slug is given but the conversation has a current page, use getWikiPage with the current page slug.',
    parameters: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'Article/page slug (e.g. "steel-sword", "guia-iniciantes"). Omit to read the CURRENT page the user is viewing.' },
      },
    },
  },
};

async function handleGetWikiPage(args: { slug?: string }, ctx: ToolContext): Promise<Record<string, unknown>> {
  const tenant = await resolveTenant(ctx);
  if (!tenant) return { error: 'Tenant not found' };

  const targetSlug = args.slug || ctx.currentPageSlug;
  if (!targetSlug) return { error: 'Nenhum slug informado e não há página atual em contexto.' };

  const { data: article } = await supabase
    .from('wiki_articles')
    .select('id, title, slug, summary, content, tags, updated_at, image_url')
    .eq('tenant_id', tenant.id)
    .eq('slug', targetSlug)
    .single();

  if (article) {
    const body = typeof article.content === 'string' ? article.content.replace(/<[^>]+>/g, '') : '';
    return {
      isCurrentPage: targetSlug === ctx.currentPageSlug,
      page: {
        title: article.title,
        slug: article.slug,
        summary: article.summary,
        tags: article.tags,
        updated_at: article.updated_at,
        image_url: article.image_url,
        contentExcerpt: body.slice(0, 2500),
      },
    };
  }
  return { error: `Página "${targetSlug}" não encontrada nesta wiki.` };
}

// ════════════════════════════════════════════════════════════════════
// 2. CÓDIGOS / PROMO CODES
// ════════════════════════════════════════════════════════════════════

const listCodesDef: ToolDefinition = {
  type: 'function',
  function: {
    name: 'listCodes',
    description: 'List promo/gift codes for the game. By default returns ONLY active (not expired) codes. Use for "códigos", "codigos ativos", "promo codes", "what codes work". Each code has rewards, type, and active status.',
    parameters: {
      type: 'object',
      properties: {
        activeOnly: { type: 'boolean', description: 'If true (default) only valid, non-expired codes. If false, include expired too.' },
        codeType: { type: 'string', description: 'Optional filter by type (e.g. "gift", "event", "creator")' },
        limit: { type: 'number', description: 'Max codes to return (default 50)' },
      },
    },
  },
};

const getCodeDetailsDef: ToolDefinition = {
  type: 'function',
  function: {
    name: 'getCodeDetails',
    description: 'Get full details (rewards, type, active/expired status, verified date) for a specific code string.',
    parameters: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'The code string (case-insensitive)' },
      },
      required: ['code'],
    },
  },
};

async function handleListCodes(args: { activeOnly?: boolean; codeType?: string; limit?: number }, ctx: ToolContext): Promise<Record<string, unknown>> {
  const tenant = await resolveTenant(ctx);
  if (!tenant) return { error: 'Tenant not found', codes: [] };

  const activeOnly = args.activeOnly !== false;
  const limit = Math.min(args.limit ?? 50, 200);

  let query = supabase
    .from('codes')
    .select('code, rewards, reward_type, code_type, is_active, is_expired, verified_date, expired_date, image_url, updated_at')
    .eq('tenant_id', tenant.id);

  if (activeOnly) {
    query = query.eq('is_active', true).eq('is_expired', false);
  }
  if (args.codeType) {
    query = query.eq('code_type', args.codeType);
  }

  const { data, error } = await query.order('updated_at', { ascending: false }).limit(limit);
  if (error) return { error: error.message, codes: [] };

  return {
    activeOnly,
    total: (data || []).length,
    codes: (data || []).map((c: any) => ({
      code: c.code,
      rewards: c.rewards,
      reward_type: c.reward_type,
      code_type: c.code_type,
      is_active: c.is_active,
      is_expired: c.is_expired,
      verified_date: c.verified_date,
      expired_date: c.expired_date,
    })),
  };
}

async function handleGetCodeDetails(args: { code: string }, ctx: ToolContext): Promise<Record<string, unknown>> {
  const tenant = await resolveTenant(ctx);
  if (!tenant) return { error: 'Tenant not found' };

  const { data } = await supabase
    .from('codes')
    .select('code, rewards, reward_type, code_type, is_active, is_expired, verified_date, expired_date, image_url, updated_at')
    .eq('tenant_id', tenant.id)
    .ilike('code', args.code)
    .limit(1);

  if (!data || data.length === 0) return { error: `Código "${args.code}" não encontrado.` };
  const c = data[0];
  return {
    code: c.code,
    rewards: c.rewards,
    reward_type: c.reward_type,
    code_type: c.code_type,
    is_active: c.is_active,
    is_expired: c.is_expired,
    verified_date: c.verified_date,
    expired_date: c.expired_date,
    updated_at: c.updated_at,
  };
}

// ════════════════════════════════════════════════════════════════════
// 3. MAPA DE NAVEGAÇÃO / ESTRUTURA DE PÁGINAS (PAGE BUILDER)
// ════════════════════════════════════════════════════════════════════

const getWikiNavigationDef: ToolDefinition = {
  type: 'function',
  function: {
    name: 'getWikiNavigation',
    description: 'Get the wiki structure: main navigation (landing pages built with the page builder, their sections/blocks) and the article categories (tags). Use for "o que tem na wiki?", "mostre a home", "como navegar", "quais seções existem".',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
};

const getPageStructureDef: ToolDefinition = {
  type: 'function',
  function: {
    name: 'getPageStructure',
    description: 'Get the block/section structure of a wiki page built with the page builder (hero, featured lists, news feed, article grid, etc.). Use to describe what a page contains or to guide the user to a section.',
    parameters: {
      type: 'object',
      properties: {
        pageType: { type: 'string', description: 'Page type to inspect (e.g. "landing", "wiki", "dashboard"). Defaults to landing.' },
      },
    },
  },
};

function summarizeBlocks(blocks: any[]): any[] {
  return (blocks || []).map((b: any) => {
    const cfg = b?.config || {};
    return {
      type: b?.type || b?.blockType || 'unknown',
      title: cfg.title || cfg.heading || cfg.label || null,
      subtitle: cfg.subtitle || null,
      columns: cfg.columns || null,
      itemCount: Array.isArray(cfg.items) ? cfg.items.length : (Array.isArray(cfg.articles) ? cfg.articles.length : null),
    };
  });
}

async function handleGetWikiNavigation(_args: Record<string, never>, ctx: ToolContext): Promise<Record<string, unknown>> {
  const tenant = await resolveTenant(ctx);
  if (!tenant) return { error: 'Tenant not found' };

  const { data: pages } = await supabase
    .from('tenant_pages')
    .select('id, page_type, layout, published_layout')
    .eq('tenant_id', tenant.id);

  const pageSummaries = (pages || []).map((p: any) => {
    const layout = p.published_layout || p.layout;
    const blocks = Array.isArray(layout) ? layout : (layout?.blocks || []);
    return {
      page_type: p.page_type,
      sections: summarizeBlocks(blocks),
    };
  });

  const { data: rawTags } = await supabase
    .from('wiki_articles')
    .select('tags')
    .eq('tenant_id', tenant.id)
    .not('tags', 'is', null);

  const tagCounts: Record<string, number> = {};
  for (const row of (rawTags || []) as Array<{ tags: string[] | null }>) {
    for (const t of row.tags || []) tagCounts[t] = (tagCounts[t] || 0) + 1;
  }

  return {
    wiki_name: tenant.name,
    description: tenant.description,
    pages: pageSummaries,
    article_categories: tagCounts,
  };
}

async function handleGetPageStructure(args: { pageType?: string }, ctx: ToolContext): Promise<Record<string, unknown>> {
  const tenant = await resolveTenant(ctx);
  if (!tenant) return { error: 'Tenant not found' };

  const pageType = args.pageType || 'landing';

  const { data } = await supabase
    .from('tenant_pages')
    .select('id, page_type, layout, published_layout')
    .eq('tenant_id', tenant.id)
    .eq('page_type', pageType)
    .limit(1);

  if (!data || data.length === 0) return { error: `Nenhuma página do tipo "${pageType}" encontrada.` };

  const layout = data[0].published_layout || data[0].layout;
  const blocks = Array.isArray(layout) ? layout : (layout?.blocks || []);

  return {
    page_type: pageType,
    blockCount: blocks.length,
    sections: summarizeBlocks(blocks),
  };
}

// ════════════════════════════════════════════════════════════════════
// 4. CHANGELOG / ATIVIDADE RECENTE / EVENTOS
// ════════════════════════════════════════════════════════════════════

const getRecentActivityDef: ToolDefinition = {
  type: 'function',
  function: {
    name: 'getRecentActivity',
    description: 'Get the recent activity feed of the wiki (edits, new articles, new members, etc.) from the activity log. Use for "o que aconteceu", "atividade recente", "quem editou".',
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Max entries (default 15)' },
        days: { type: 'number', description: 'Days back (default 30). 0 = all time.' },
      },
    },
  },
};

const getChangelogDef: ToolDefinition = {
  type: 'function',
  function: {
    name: 'getChangelog',
    description: 'Get the article change history (version summaries) across the wiki. Use for "o que mudou", "changelog", "últimas atualizações de artigos".',
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Max entries (default 15)' },
      },
    },
  },
};

const getGameEventsDef: ToolDefinition = {
  type: 'function',
  function: {
    name: 'getGameEvents',
    description: 'Get current/upcoming in-game or community events configured for this wiki (from game_config category "events"). Use for "próximos eventos", "eventos ativos". Returns empty list if no events are configured.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
};

async function handleGetRecentActivity(args: { limit?: number; days?: number }, ctx: ToolContext): Promise<Record<string, unknown>> {
  const tenant = await resolveTenant(ctx);
  if (!tenant) return { error: 'Tenant not found', activity: [] };

  const limit = Math.min(args.limit ?? 15, 50);
  const days = args.days ?? 30;

  let query = supabase
    .from('activity_log')
    .select('type, description, link, actor_name, created_at')
    .eq('tenant_id', tenant.id);

  if (days > 0) {
    query = query.gte('created_at', new Date(Date.now() - days * 86400000).toISOString());
  }

  const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);
  if (error) return { error: error.message, activity: [] };
  return { days, total: (data || []).length, activity: data || [] };
}

async function handleGetChangelog(args: { limit?: number }, ctx: ToolContext): Promise<Record<string, unknown>> {
  const tenant = await resolveTenant(ctx);
  if (!tenant) return { error: 'Tenant not found', changes: [] };

  const limit = Math.min(args.limit ?? 15, 50);

  const { data, error } = await supabase
    .from('article_versions')
    .select('article_id, version_number, title, change_summary, created_at')
    .order('created_at', { ascending: false })
    .limit(limit * 3);

  if (error) return { error: error.message, changes: [] };

  const articleIds = [...new Set((data || []).map((v: any) => v.article_id))];
  const { data: articles } = await supabase
    .from('wiki_articles')
    .select('id, slug, title')
    .eq('tenant_id', tenant.id)
    .in('id', articleIds);
  const slugById = new Map((articles || []).map((a: any) => [a.id, { slug: a.slug, title: a.title }]));

  const seen = new Set<string>();
  const changes: any[] = [];
  for (const v of (data || [])) {
    if (seen.has(v.article_id)) continue;
    seen.add(v.article_id);
    const meta = slugById.get(v.article_id);
    changes.push({
      article_title: v.title || meta?.title,
      article_slug: meta?.slug,
      version: v.version_number,
      change_summary: v.change_summary,
      updated_at: v.created_at,
    });
    if (changes.length >= limit) break;
  }
  return { total: changes.length, changes };
}

async function handleGetGameEvents(_args: Record<string, never>, ctx: ToolContext): Promise<Record<string, unknown>> {
  const tenant = await resolveTenant(ctx);
  if (!tenant) return { error: 'Tenant not found', events: [] };

  const { data, error } = await supabase
    .from('game_config')
    .select('config_key, config_value, description')
    .eq('tenant_id', tenant.id)
    .eq('category', 'events')
    .limit(50);

  if (error) return { error: error.message, events: [] };
  return { total: (data || []).length, events: data || [] };
}

// ════════════════════════════════════════════════════════════════════
// 5. COMUNIDADE (MEMBROS, STAFF, DISCORD)
// ════════════════════════════════════════════════════════════════════

const getWikiCommunityDef: ToolDefinition = {
  type: 'function',
  function: {
    name: 'getWikiCommunity',
    description: 'Get community info for this wiki: total members, count by role, the staff (owners/admins) with names, and Discord link. Use for "quem cuida da wiki", "quantos membros", "como entro no discord", "quem são os admins".',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
};

const getDiscordInfoDef: ToolDefinition = {
  type: 'function',
  function: {
    name: 'getDiscordInfo',
    description: 'Get the wiki Discord invite link and guild info. Use for "discord", "servidor", "comunidade".',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
};

async function handleGetWikiCommunity(_args: Record<string, never>, ctx: ToolContext): Promise<Record<string, unknown>> {
  const tenant = await resolveTenant(ctx);
  if (!tenant) return { error: 'Tenant not found' };

  const { data: members } = await supabase
    .from('tenant_members')
    .select('user_id, role')
    .eq('tenant_id', tenant.id);

  const roleCounts: Record<string, number> = {};
  const staffUserIds: string[] = [];
  for (const m of (members || []) as Array<{ user_id: string; role: string }>) {
    roleCounts[m.role] = (roleCounts[m.role] || 0) + 1;
    if (m.role === 'owner' || m.role === 'admin' || m.role === 'editor') staffUserIds.push(m.user_id);
  }

  let staff: any[] = [];
  if (staffUserIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .in('id', staffUserIds.slice(0, 50));
    staff = (profiles || []).map((p: any) => ({
      name: p.display_name || p.username,
      username: p.username,
      role: (members || []).find((m) => m.user_id === p.id)?.role,
      avatar_url: p.avatar_url,
    }));
  }

  return {
    wiki_name: tenant.name,
    total_members: (members || []).length,
    role_counts: roleCounts,
    staff,
    discord_url: tenant.discord_url || null,
  };
}

async function handleGetDiscordInfo(_args: Record<string, never>, ctx: ToolContext): Promise<Record<string, unknown>> {
  const tenant = await resolveTenant(ctx);
  if (!tenant) return { error: 'Tenant not found' };

  const discordConfig = (tenant.discord_config as Record<string, unknown>) || {};
  return {
    discord_url: tenant.discord_url || null,
    discord_config: discordConfig,
    has_discord: !!tenant.discord_url,
  };
}

// ════════════════════════════════════════════════════════════════════
// 6. RELACIONAMENTOS ENTRE ARTIGOS
// ════════════════════════════════════════════════════════════════════

const getRelatedPagesDef: ToolDefinition = {
  type: 'function',
  function: {
    name: 'getRelatedPages',
    description: 'Find wiki pages related to a given article — based on shared tags and internal links found in the article body. Use for "páginas relacionadas", "veja também", "o que é parecido com isto". Defaults to the current page if no slug given.',
    parameters: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'Article slug. Omit to use the current page.' },
        limit: { type: 'number', description: 'Max related pages (default 8)' },
      },
    },
  },
};

async function handleGetRelatedPages(args: { slug?: string; limit?: number }, ctx: ToolContext): Promise<Record<string, unknown>> {
  const tenant = await resolveTenant(ctx);
  if (!tenant) return { error: 'Tenant not found', related: [] };

  const slug = args.slug || ctx.currentPageSlug;
  if (!slug) return { error: 'Nenhum slug informado e não há página atual.' };

  const limit = Math.min(args.limit ?? 8, 20);

  const { data: article } = await supabase
    .from('wiki_articles')
    .select('id, title, slug, tags, content')
    .eq('tenant_id', tenant.id)
    .eq('slug', slug)
    .single();
  if (!article) return { error: `Página "${slug}" não encontrada.` };

  const tags: string[] = article.tags || [];
  const linkedSlugs = new Set<string>();
  const body = typeof article.content === 'string' ? article.content : '';
  const slugMatches = body.match(/@([a-z0-9-]+)@/gi) || [];
  for (const m of slugMatches) {
    const s = m.replace(/@/g, '').trim();
    if (s && s !== slug) linkedSlugs.add(s);
  }

  const { data: all } = await supabase
    .from('wiki_articles')
    .select('id, title, slug, tags, summary')
    .eq('tenant_id', tenant.id)
    .neq('slug', slug);

  const scored = (all || []).map((p: any) => {
    const sharedTags = (p.tags || []).filter((t: string) => tags.includes(t)).length;
    const linked = linkedSlugs.has(p.slug) ? 1 : 0;
    return { ...p, score: sharedTags * 2 + linked };
  })
    .filter((p: any) => p.score > 0)
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, limit);

  return {
    source: { title: article.title, slug: article.slug, tags },
    related: scored.map((p: any) => ({
      title: p.title,
      slug: p.slug,
      summary: p.summary,
      shared_tags: (p.tags || []).filter((t: string) => tags.includes(t)),
      linked_inline: linkedSlugs.has(p.slug),
    })),
  };
}

// ════════════════════════════════════════════════════════════════════
// 7. HISTÓRICO DO USUÁRIO / RESPOSTAS SALVAS
// ════════════════════════════════════════════════════════════════════

const getUserChatHistoryDef: ToolDefinition = {
  type: 'function',
  function: {
    name: 'getUserChatHistory',
    description: 'Get the user\'s past chat sessions in this wiki (titles + last update). Use to recall context from previous conversations. Only works for logged-in users. Use for "nossas conversas anteriores", "do que falamos antes".',
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Max sessions (default 10)' },
      },
    },
  },
};

const getSavedAnswersDef: ToolDefinition = {
  type: 'function',
  function: {
    name: 'getSavedAnswers',
    description: 'Get answers the user previously saved (bookmarked Q&A) in this wiki. Use for "meus itens salvos", "respostas salvas", "o que eu guardei". Only for logged-in users.',
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Max saved answers (default 10)' },
      },
    },
  },
};

async function handleGetUserChatHistory(args: { limit?: number }, ctx: ToolContext): Promise<Record<string, unknown>> {
  if (!ctx.userId) return { error: 'Usuário não autenticado.', sessions: [] };
  const tenant = await resolveTenant(ctx);
  if (!tenant) return { error: 'Tenant not found', sessions: [] };

  const limit = Math.min(args.limit ?? 10, 25);

  const { data, error } = await supabase
    .from('chat_sessions')
    .select('id, title, updated_at, message_count')
    .eq('tenant_id', tenant.id)
    .eq('user_id', ctx.userId)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) return { error: error.message, sessions: [] };
  return { total: (data || []).length, sessions: data || [] };
}

async function handleGetSavedAnswers(args: { limit?: number }, ctx: ToolContext): Promise<Record<string, unknown>> {
  if (!ctx.userId) return { error: 'Usuário não autenticado.', saved: [] };

  const limit = Math.min(args.limit ?? 10, 25);

  let query = supabase
    .from('saved_answers')
    .select('id, question, answer, created_at')
    .eq('user_id', ctx.userId);
  if (ctx.tenantId) query = query.eq('tenant_id', ctx.tenantId);

  const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);
  if (error) return { error: error.message, saved: [] };
  return { total: (data || []).length, saved: data || [] };
}

// ════════════════════════════════════════════════════════════════════
// 8. FRESCROR DOS DADOS DE JOGO
// ════════════════════════════════════════════════════════════════════

const getGameDataFreshnessDef: ToolDefinition = {
  type: 'function',
  function: {
    name: 'getGameDataFreshness',
    description: 'Get the last-updated timestamp for each game data table, so you can tell the user how fresh the data is and warn if it may be outdated. Use for "está atualizado?", "quando foram atualizados os dados", "versão dos dados".',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
};

async function handleGetGameDataFreshness(_args: Record<string, never>, ctx: ToolContext): Promise<Record<string, unknown>> {
  const tenant = await resolveTenant(ctx);
  if (!tenant) return { error: 'Tenant not found', tables: [] };

  let schema: { tables: Array<{ table_name: string }> };
  try {
    schema = await getGameSchema();
  } catch {
    return { error: 'Não foi possível carregar o schema.', tables: [] };
  }

  const results = await Promise.all(
    schema.tables.map(async (t) => {
      const { data } = await supabase
        .from(t.table_name)
        .select('updated_at')
        .eq('tenant_id', tenant.id)
        .not('updated_at', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(1);
      const latest = (data && data[0]?.updated_at) || null;
      const { count } = await supabase
        .from(t.table_name)
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id);
      return { table: t.table_name, item_count: count || 0, last_updated: latest };
    }),
  );

  return { tables: results.sort((a, b) => (b.last_updated || '').localeCompare(a.last_updated || '')) };
}

// ════════════════════════════════════════════════════════════════════
// EXPORTS
// ════════════════════════════════════════════════════════════════════

export const WIKI_KNOWLEDGE_TOOL_DEFS: ToolDefinition[] = [
  getWikiPageDef,
  listCodesDef,
  getCodeDetailsDef,
  getWikiNavigationDef,
  getPageStructureDef,
  getRecentActivityDef,
  getChangelogDef,
  getGameEventsDef,
  getWikiCommunityDef,
  getDiscordInfoDef,
  getRelatedPagesDef,
  getUserChatHistoryDef,
  getSavedAnswersDef,
  getGameDataFreshnessDef,
];

export const WIKI_KNOWLEDGE_HANDLERS: Record<string, (args: any, ctx: ToolContext) => Promise<unknown>> = {
  getWikiPage: handleGetWikiPage,
  listCodes: handleListCodes,
  getCodeDetails: handleGetCodeDetails,
  getWikiNavigation: handleGetWikiNavigation,
  getPageStructure: handleGetPageStructure,
  getRecentActivity: handleGetRecentActivity,
  getChangelog: handleGetChangelog,
  getGameEvents: handleGetGameEvents,
  getWikiCommunity: handleGetWikiCommunity,
  getDiscordInfo: handleGetDiscordInfo,
  getRelatedPages: handleGetRelatedPages,
  getUserChatHistory: handleGetUserChatHistory,
  getSavedAnswers: handleGetSavedAnswers,
  getGameDataFreshness: handleGetGameDataFreshness,
};
