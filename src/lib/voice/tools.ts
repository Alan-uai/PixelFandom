import { MAIN_URL } from '@/lib/constants';
import type { VoiceName } from './geminilive'

export class FunctionCallTool {
  name: string
  description: string
  parameters: Record<string, any>
  requiredParameters?: string[]

  private functionToCall: (parameters: any) => any

  constructor(
    name: string,
    description: string,
    parameters: Record<string, any>,
    functionToCall: (parameters: any) => any,
    requiredParameters?: string[]
  ) {
    this.name = name
    this.description = description
    this.parameters = parameters
    this.functionToCall = functionToCall
    this.requiredParameters = requiredParameters
  }

  getDefinition() {
    const def: any = {
      name: this.name,
      description: this.description,
      parameters: this.parameters,
    }
    if (this.requiredParameters && this.requiredParameters.length > 0) {
      def.parameters.required = this.requiredParameters
    }
    return def
  }

  runFunction(parameters: any) {
    return this.functionToCall(parameters)
  }
}

export interface ToolContext {
  tenantSlug: string
  volume: number
  voiceName: VoiceName
  language: string
  discordUrl?: string
  gameUrl?: string
  setVolume: (v: number) => void
  setVoiceName: (v: VoiceName) => void
  setLanguage: (l: string) => void
  clearTranscripts: () => void
  navigate: (path: string) => void
  playerInterrupt: () => void
  startMic: () => void
  stopMic: () => void
  addTranscript: (text: string, isUser: boolean) => void
  onEndSession: () => void
  fetchWithSlug: (path: string, params: Record<string, string>) => Promise<any>
}

type ToolBuilder = (ctx: ToolContext) => FunctionCallTool

function qTool(
  name: string,
  description: string,
  properties: Record<string, any>,
  required?: string[]
): ToolBuilder {
  return (ctx: ToolContext) =>
    new FunctionCallTool(
      name,
      description,
      { type: 'object', properties },
      async (params: any) => {
        try {
          const queryParams: Record<string, string> = { action: name }
          for (const [k, v] of Object.entries(params)) {
            if (v !== undefined) {
              if (Array.isArray(v)) {
                queryParams[k] = v.join(',')
              } else {
                queryParams[k] = String(v)
              }
            }
          }
          const data = await ctx.fetchWithSlug('/api/voice/query', queryParams)
          return { result: data }
        } catch {
          return { result: { error: `${name} failed` } }
        }
      },
      required
    )
}

export function createWikiTools(ctx: ToolContext): FunctionCallTool[] {
  const q = (name: string, desc: string, props: Record<string, any>, required?: string[]) =>
    qTool(name, desc, props, required)(ctx)

  return [
    // ── Core wiki tools ──

    new FunctionCallTool(
      'searchWiki',
      `SEARCH all wiki + game data (weapons, armors, enemies, bosses, rings, potions, upgrades).
Search runs against EVERY text column across ALL tables with fuzzy matching.

RETURNS: { wiki: [...], collection: [...], game_items: [...] }

HOW TO SEARCH:
- Extract ONLY key terms. NOT the full question.
- "como obter a espada noturna" → query: "espada noturna"
- "qual a fraqueza do goblin rei" → query: "goblin rei"
- Supports fuzzy/partial matching: "necro flash" finds "Necro Flask"

game_items[] is the PRIMARY data source with stats and raw_data.
NEVER hallucinate — read actual numbers from raw_data.`,
      {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'EXTRACTED key search term. NOT the full user question.' },
        },
      },
      async (params: { query: string }) => {
        try {
          const data = await ctx.fetchWithSlug('/api/search', { q: params.query })
          return { result: { wiki: data.wiki ?? [], collection: data.collection ?? [], game_items: data.game_items ?? [] } }
        } catch {
          return { result: { error: 'Search failed', wiki: [], collection: [], game_items: [] } }
        }
      },
      ['query']
    ),

    new FunctionCallTool(
      'getWikiInfo',
      'Get wiki metadata: total article count, per-tag counts (tag_counts: { potions: 4, weapons: 30 }), all tags. Use for "how many articles", "quantas poções existem", "what categories exist".',
      {
        type: 'object',
        properties: {},
      },
      async () => {
        try {
          const data = await ctx.fetchWithSlug('/api/voice/wiki-info', {})
          return { result: data }
        } catch {
          return { result: { error: 'Failed to get wiki info' } }
        }
      }
    ),

    new FunctionCallTool(
      'getWikiArticle',
      'Get full article content + item_stats with raw attributes by slug. PREFER searchWiki for finding items — getWikiArticle reads full article text after you have the slug.',
      {
        type: 'object',
        properties: {
          slug: { type: 'string', description: 'The article slug (e.g. "steel-sword"). Use slug from searchWiki.' },
        },
      },
      async (params: { slug: string }) => {
        try {
          const data = await ctx.fetchWithSlug('/api/voice/article', { article: params.slug })
          return { result: data }
        } catch {
          return { result: { error: 'Article not found' } }
        }
      },
      ['slug']
    ),

    new FunctionCallTool(
      'listWikiArticles',
      'Browse articles by tag (e.g. "potions", "weapons", "enemies"). Returns titles, slugs, and summaries. For finding a specific item, use searchWiki.',
      {
        type: 'object',
        properties: {
          tag: { type: 'string', description: 'Filter by tag/category. Without this, lists ALL articles.' },
        },
      },
      async (params: { tag?: string }) => {
        try {
          const qp: Record<string, string> = {}
          if (params.tag) qp.tag = params.tag
          const data = await ctx.fetchWithSlug('/api/voice/articles', qp)
          return { result: data }
        } catch {
          return { result: { error: 'Failed to list articles', articles: [] } }
        }
      }
    ),

    // ── Navigation tools ──

    new FunctionCallTool(
      'navigateToHome',
      'Navigate to the wiki home page. Use when the user wants to see everything, show the wiki, go home.',
      {
        type: 'object',
        properties: {},
      },
      async () => {
        ctx.navigate(`/w/${ctx.tenantSlug}`)
        return { result: { success: true, page: 'home' } }
      }
    ),

    new FunctionCallTool(
      'navigateToHub',
      'Navigate to PixelFandom Hub (main page listing all wikis).',
      {
        type: 'object',
        properties: {},
      },
      async () => {
        ctx.navigate(MAIN_URL + '/')
        return { result: { success: true, page: 'hub' } }
      }
    ),

    new FunctionCallTool(
      'navigateToPage',
      'Navigate to a specific article or item detail page by slug.',
      {
        type: 'object',
        properties: {
          slug: { type: 'string', description: 'The article or item slug to navigate to' },
        },
      },
      async (params: { slug: string }) => {
        ctx.navigate(`/w/${ctx.tenantSlug}/${params.slug}`)
        return { result: { success: true, slug: params.slug } }
      },
      ['slug']
    ),

    new FunctionCallTool(
      'switchWiki',
      'Switch to a different wiki by its slug.',
      {
        type: 'object',
        properties: {
          slug: { type: 'string', description: 'The slug of the target wiki' },
        },
      },
      async (params: { slug: string }) => {
        ctx.navigate(`/w/${params.slug}`)
        return { result: { success: true, slug: params.slug } }
      },
      ['slug']
    ),

    new FunctionCallTool(
      'navigateToDiscord',
      `Open the wiki's Discord server invite link.`,
      {
        type: 'object',
        properties: {},
      },
      async () => {
        if (ctx.discordUrl) {
          window.open(ctx.discordUrl, '_blank', 'noopener,noreferrer')
          return { result: { success: true, page: 'discord', message: 'Abrindo Discord...' } }
        }
        return { result: { success: false, message: 'Esta wiki não possui link do Discord configurado.' } }
      }
    ),

    new FunctionCallTool(
      'navigateToGame',
      `Open the wiki's game page in a new tab.`,
      {
        type: 'object',
        properties: {},
      },
      async () => {
        if (ctx.gameUrl) {
          window.open(ctx.gameUrl, '_blank', 'noopener,noreferrer')
          return { result: { success: true, page: 'game', message: 'Abrindo jogo...' } }
        }
        return { result: { success: false, message: 'Esta wiki não possui link do jogo configurado.' } }
      }
    ),

    // ── Schema tools ──

    q('listGameTables',
      'List all game data tables (weapons, armors, enemies, bosses, rings, potions, upgrades, worlds, codes, etc.) with item counts. Use to discover available data.',
      {}),

    q('getTableSchema',
      'Get column names, types, and metadata for any game table. Returns all available columns so you know what filters/stats are queryable. Use before querying a table.',
      { table: { type: 'string', description: 'Table name (e.g. "weapons", "enemies")' } },
      ['table']),

    q('findColumns',
      'Search for columns matching a term across all game tables. Useful to find which tables have a stat like "damage", "crit", "speed".',
      { term: { type: 'string', description: 'Column name term to search for (e.g. "damage", "crit")' } },
      ['term']),

    // ── Item query tools ──

    q('getItem',
      'Get a single item by name from any game table. Returns ALL columns/attributes. Use searchWiki first if you do not know the exact name or table.',
      {
        table: { type: 'string', description: 'Table name (e.g. "weapons", "enemies")' },
        name: { type: 'string', description: 'Item name (case-insensitive, partial match)' },
      },
      ['table', 'name']),

    q('queryItems',
      'Query items in any table with flexible column filters. For complex queries like "find weapons with fire element" or "list S tier armors". Returns matching items with all attributes.',
      {
        table: { type: 'string', description: 'Table name' },
        filters: { type: 'string', description: 'JSON object of column filters. Example: {"element":"fire","rarity":"legendary"}' },
        limit: { type: 'number', description: 'Max items (default 20)' },
      },
      ['table', 'filters']),

    q('filterByRange',
      'Find items where a numeric column falls within a range. For "weapons with damage above 50" or "items under 100 gold".',
      {
        table: { type: 'string', description: 'Table name' },
        column: { type: 'string', description: 'Numeric column to filter (e.g. "damage_min", "shop_price")' },
        min: { type: 'number', description: 'Minimum value (inclusive). Omit for no lower bound.' },
        max: { type: 'number', description: 'Maximum value (inclusive). Omit for no upper bound.' },
        limit: { type: 'number', description: 'Max items (default 20)' },
      },
      ['table', 'column']),

    q('searchTable',
      'Full-text search within a single game table. Use when you know the table but want text matches. For cross-table, use searchWiki.',
      {
        table: { type: 'string', description: 'Table name' },
        term: { type: 'string', description: 'Search term for text columns' },
        limit: { type: 'number', description: 'Max items (default 20)' },
      },
      ['table', 'term']),

    q('countItems',
      'Count items in a table matching optional filters. For "how many legendary weapons" or "how many enemies with >100 HP".',
      {
        table: { type: 'string', description: 'Table name' },
        column: { type: 'string', description: 'Optional column to filter on' },
        value: { type: 'string', description: 'Optional value to match' },
      },
      ['table']),

    q('listItems',
      'Browse/paginate items in a table showing name, slug, and key attributes. For browsing all items. Use getItem for full details.',
      {
        table: { type: 'string', description: 'Table name' },
        offset: { type: 'number', description: 'Items to skip (default 0)' },
        limit: { type: 'number', description: 'Max items (default 20)' },
        sortBy: { type: 'string', description: 'Column to sort by' },
        sortDir: { type: 'string', enum: ['asc', 'desc'], description: 'Sort direction' },
      },
      ['table']),

    // ── Stat analysis tools ──

    q('rankByStat',
      'Get ranking position of an item by a numeric stat. For "what rank is steel sword by damage?" or "which position does fire ring hold by price?".',
      {
        table: { type: 'string', description: 'Table name' },
        stat: { type: 'string', description: 'Numeric column to rank by (e.g. "damage_min")' },
        itemName: { type: 'string', description: 'Item to find rank for' },
      },
      ['table', 'stat', 'itemName']),

    q('compareOnStat',
      'Sort items by a numeric stat from highest to lowest. For "which weapon has the most damage?" or "show armors sorted by defense".',
      {
        table: { type: 'string', description: 'Table name' },
        stat: { type: 'string', description: 'Numeric column to compare by' },
        limit: { type: 'number', description: 'Max items (default 10)' },
        descending: { type: 'boolean', description: 'Highest first (default true)' },
      },
      ['table', 'stat']),

    q('getStatSummary',
      'Summary statistics (min, max, average, count) for a numeric column. For "what is the average weapon damage?" or "price range for potions".',
      {
        table: { type: 'string', description: 'Table name' },
        column: { type: 'string', description: 'Numeric column to summarize' },
      },
      ['table', 'column']),

    q('getTopItems',
      'Top N items by a numeric stat. For "top 5 strongest weapons" or "3 most expensive items".',
      {
        table: { type: 'string', description: 'Table name' },
        stat: { type: 'string', description: 'Numeric column to rank by' },
        limit: { type: 'number', description: 'Number to return (default 5)' },
      },
      ['table', 'stat']),

    q('getCategoryAverages',
      'Average values of numeric stats grouped by a category. For "average damage per weapon type" or "average price by rarity".',
      {
        table: { type: 'string', description: 'Table name' },
        categoryColumn: { type: 'string', description: 'Column to group by (e.g. "weapon_type", "rarity", "element")' },
        statColumns: { type: 'string', description: 'Comma-separated numeric columns to average. If empty, averages all numeric.' },
      },
      ['table', 'categoryColumn']),

    q('getStatDistribution',
      'Distribution of values for a column showing how many items have each distinct value. For "how many items per rarity?" or "element distribution".',
      {
        table: { type: 'string', description: 'Table name' },
        column: { type: 'string', description: 'Column to get distribution for' },
      },
      ['table', 'column']),

    // ── Cross-reference tools ──

    q('compareTwoItems',
      'Side-by-side comparison of two items showing all numeric stats. For "compare steel sword vs iron sword" — items can be from different tables.',
      {
        tableA: { type: 'string', description: 'Table of first item' },
        nameA: { type: 'string', description: 'Name of first item' },
        tableB: { type: 'string', description: 'Table of second item' },
        nameB: { type: 'string', description: 'Name of second item' },
      },
      ['tableA', 'nameA', 'tableB', 'nameB']),

    q('findSimilarItems',
      'Find items with similar numeric stat profiles. For discovering alternatives or replacements.',
      {
        table: { type: 'string', description: 'Table name' },
        itemName: { type: 'string', description: 'Reference item name' },
        limit: { type: 'number', description: 'Similar items to return (default 5)' },
      },
      ['table', 'itemName']),

    q('searchAllTables',
      'Search item name across ALL game tables simultaneously. Use when unsure which table contains an item.',
      {
        name: { type: 'string', description: 'Item name or partial name' },
      },
      ['name']),

    q('findByCategory',
      'Get all items in a table sharing a specific category value. For "list all fire weapons" or "find S tier armors".',
      {
        table: { type: 'string', description: 'Table name' },
        column: { type: 'string', description: 'Category column (e.g. "element", "rarity", "tier")' },
        value: { type: 'string', description: 'Value to match (e.g. "fire", "legendary")' },
        limit: { type: 'number', description: 'Max items (default 50)' },
      },
      ['table', 'column', 'value']),

    q('getTableComparison',
      'Compare stat distributions between two different tables. For comparing weapons vs armors on a stat.',
      {
        tableA: { type: 'string', description: 'First table' },
        tableB: { type: 'string', description: 'Second table' },
        stat: { type: 'string', description: 'Numeric column to compare' },
      },
      ['tableA', 'tableB', 'stat']),

    q('getItemNeighbors',
      'Find items within a percentage range of a given item\'s stat. For finding gear at similar power levels. Returns slightly worse and slightly better items.',
      {
        table: { type: 'string', description: 'Table name' },
        itemName: { type: 'string', description: 'Reference item' },
        stat: { type: 'string', description: 'Numeric column to compare' },
        percentRange: { type: 'number', description: 'Range percentage (default 20 = ±20%)' },
        limit: { type: 'number', description: 'Max neighbors per side (default 3)' },
      },
      ['table', 'itemName', 'stat']),

    q('findUpgrades',
      'Find items strictly better in specified stats. For "what is better than steel sword in damage and speed?" — items must not be worse in any compared stat.',
      {
        table: { type: 'string', description: 'Table name' },
        itemName: { type: 'string', description: 'Item to upgrade from' },
        stats: { type: 'string', description: 'Comma-separated stat columns (e.g. "damage_min,speed,knockback")' },
        limit: { type: 'number', description: 'Max items (default 10)' },
      },
      ['table', 'itemName', 'stats']),

    q('getStatTrend',
      'Analyze correlation between two stats across all items. For "do higher damage weapons cost more?" or "relationship between speed and knockback".',
      {
        table: { type: 'string', description: 'Table name' },
        statA: { type: 'string', description: 'First numeric column' },
        statB: { type: 'string', description: 'Second numeric column' },
      },
      ['table', 'statA', 'statB']),

    q('getRecentPages',
      'Recently created or updated wiki pages. For "what is new?" or "what changed recently?".',
      {
        limit: { type: 'number', description: 'Max pages (default 10)' },
        days: { type: 'number', description: 'Days back (default 30). 0 = all time.' },
      }),

    // ── Voice control tools ──

    new FunctionCallTool(
      'help',
      'Show available commands and capabilities.',
      {
        type: 'object',
        properties: {},
      },
      async () => {
        return {
          result: {
            message: `I can help you:
- Search wiki articles AND game items with full stats
- Read articles and item details aloud
- List/browse articles by category
- Navigate to any wiki page
- Query game data: compare items, rank by stats, filter by range
- Analyze stats: averages, distributions, trends, correlations
- Find upgrades, similar items, neighbors
- Compare items side-by-side
- Get wiki overview with category counts
- Check what's new and recent
- Set reminders, explain mechanics, suggest gear
- Adjust volume, change voice, clear chat`,
          },
        }
      }
    ),

    new FunctionCallTool(
      'adjustVolume',
      'Adjust voice volume. 0 = mute, 100 = maximum.',
      {
        type: 'object',
        properties: {
          level: { type: 'number', description: 'Volume 0-100' },
        },
      },
      async (params: { level: number }) => {
        const level = Math.max(0, Math.min(100, Math.round(params.level)))
        ctx.setVolume(level)
        return { result: { action: 'set_volume', level, message: `Volume ajustado para ${level}%` } }
      },
      ['level']
    ),

    new FunctionCallTool(
      'changeVoice',
      'Change the assistant voice personality.',
      {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            enum: ['Puck', 'Kore', 'Charon', 'Fenrir', 'Aoede'],
            description: 'Voice name',
          },
        },
      },
      async (params: { name: VoiceName }) => {
        const valid: VoiceName[] = ['Puck', 'Kore', 'Charon', 'Fenrir', 'Aoede']
        if (valid.includes(params.name)) {
          ctx.setVoiceName(params.name)
          return { result: { action: 'set_voice', name: params.name, message: `Voz alterada para ${params.name}` } }
        }
        return { result: { error: `Invalid voice. Valid: ${valid.join(', ')}` } }
      },
      ['name']
    ),

    new FunctionCallTool(
      'clearChat',
      'Clear the conversation transcript.',
      {
        type: 'object',
        properties: {},
      },
      async () => {
        ctx.clearTranscripts()
        return { result: { action: 'clear_transcripts', message: 'Conversa limpa.' } }
      }
    ),

    new FunctionCallTool(
      'setLanguage',
      'Switch the assistant language.',
      {
        type: 'object',
        properties: {
          language: {
            type: 'string',
            enum: ['pt', 'en', 'es'],
            description: 'Language code: pt, en, es',
          },
        },
      },
      async (params: { language: string }) => {
        ctx.setLanguage(params.language)
        return { result: { message: `Language set to ${params.language}` } }
      },
      ['language']
    ),

    new FunctionCallTool(
      'toggleMicrophone',
      'Mute or unmute the microphone.',
      {
        type: 'object',
        properties: {
          enabled: { type: 'boolean', description: 'true to unmute, false to mute' },
        },
      },
      async (params: { enabled: boolean }) => {
        if (params.enabled) {
          ctx.startMic()
        } else {
          ctx.stopMic()
        }
        return { result: { message: params.enabled ? 'Microfone ativado' : 'Microfone desativado' } }
      },
      ['enabled']
    ),

    new FunctionCallTool(
      'showNotification',
      'Show a notification toast to the user.',
      {
        type: 'object',
        properties: {
          message: { type: 'string', description: 'Notification message' },
          emoji: { type: 'string', description: 'Optional emoji' },
        },
      },
      async (params: { message: string; emoji?: string }) => {
        console.log(`[Notification] ${params.emoji || ''} ${params.message}`)
        return { result: { message: 'Notification sent' } }
      },
      ['message']
    ),

    new FunctionCallTool(
      'endSession',
      `End the voice session and close the microphone.
Call when the user says goodbye: "tchau", "falou", "pode ir", "até logo", "bye", "valeu", "see you".`,
      {
        type: 'object',
        properties: {},
      },
      async () => {
        ctx.onEndSession()
        return { result: { action: 'end_session', message: 'Sessão encerrada. Até logo!' } }
      }
    ),

    // ── Voice-exclusive tools ──

    new FunctionCallTool(
      'setReminder',
      'Schedule a voice reminder that will notify the user after a delay. Use for "remind me in 5 minutes" or "lembre-me da loja em 1 hora". The reminder will be spoken aloud when time is up.',
      {
        type: 'object',
        properties: {
          message: { type: 'string', description: 'The reminder message to say' },
          seconds: { type: 'number', description: 'Delay in seconds (e.g. 300 for 5 minutes, 3600 for 1 hour)' },
        },
      },
      async (params: { message: string; seconds: number }) => {
        const ms = Math.max(1000, Math.min(params.seconds * 1000, 86400000))
        setTimeout(() => {
          ctx.playerInterrupt()
          ctx.addTranscript(`⏰ ${params.message}`, false)
        }, ms)
        const min = Math.round(ms / 60000)
        return { result: { action: 'set_reminder', message: `Lembrete definido para ${min} minuto(s): "${params.message}"` } }
      },
      ['message', 'seconds']
    ),

    new FunctionCallTool(
      'explain',
      'Explain a game term, mechanic, or concept by searching the wiki and summarizing what it means. Use for "what is crit damage?", "explain how crafting works", or "o que é encantamento?". Composes searchWiki, getWikiArticle internally for a complete explanation.',
      {
        type: 'object',
        properties: {
          term: { type: 'string', description: 'The term, mechanic, or concept to explain' },
        },
      },
      async (params: { term: string }) => {
        try {
          const searchData = await ctx.fetchWithSlug('/api/search', { q: params.term })
          const items = searchData.game_items ?? []
          const wiki = searchData.wiki ?? []
          return { result: { term: params.term, explanation: 'Resultados encontrados. Use o conteúdo abaixo para explicar.', wikiArticles: wiki.slice(0, 3), gameItems: items.slice(0, 5) } }
        } catch {
          return { result: { error: 'Não foi possível buscar explicação para este termo.' } }
        }
      },
      ['term']
    ),

    new FunctionCallTool(
      'suggestGear',
      'Suggest a complete gear loadout (weapon + armor + ring) based on playstyle or criteria. For "suggest a fire loadout", "best gear for tank build", or "equipamento para mago". Queries multiple tables to find optimal combinations.',
      {
        type: 'object',
        properties: {
          playstyle: { type: 'string', description: 'Playstyle or criteria (e.g. "fire", "tank", "mage", "assassin", "balanced", "high damage")' },
          tier: { type: 'string', description: 'Optional tier or max budget constraint' },
        },
      },
      async (params: { playstyle: string; tier?: string }) => {
        const results: Record<string, any> = { playstyle: params.playstyle }
        if (params.tier) results.tier = params.tier
        return { result: { ...results, message: 'Pesquisando combinações...', instructions: 'Use getItem, findByCategory e filterByRange para montar o loadout ideal.' } }
      },
      ['playstyle']
    ),

    new FunctionCallTool(
      'howToFarm',
      'Best farming route and method for obtaining an item or resource. For "how to farm gold", "best way to get dark shards", or "onde farmar madeira". Returns locations, enemies that drop it, and recommended methods.',
      {
        type: 'object',
        properties: {
          itemName: { type: 'string', description: 'The item or resource to farm' },
          table: { type: 'string', description: 'Optional table hint (e.g. "enemies", "resources")' },
        },
      },
      async (params: { itemName: string; table?: string }) => {
        try {
          const qp: Record<string, string> = { q: params.itemName }
          const data = await ctx.fetchWithSlug('/api/search', qp)
          const items = data.game_items ?? []
          return { result: { itemName: params.itemName, farmData: items.slice(0, 10) } }
        } catch {
          return { result: { error: 'Farming info not found' } }
        }
      },
      ['itemName']
    ),

    new FunctionCallTool(
      'enemyStrategy',
      'Detailed strategy guide for fighting an enemy or boss. For "how to beat the goblin king", "dragon boss strategy", or "estrategia para o chefe final". Returns weaknesses, resistances, attacks, and recommended tactics.',
      {
        type: 'object',
        properties: {
          enemyName: { type: 'string', description: 'Enemy or boss name' },
        },
      },
      async (params: { enemyName: string }) => {
        try {
          const data = await ctx.fetchWithSlug('/api/search', { q: params.enemyName })
          const items = data.game_items ?? []
          const enemies = items.filter((i: any) =>
            i.source_type === 'enemy' || i.source_type === 'boss'
          )
          return { result: { enemyName: params.enemyName, strategy: enemies.length > 0 ? 'Enemy data found' : 'No enemy data found', enemies: enemies.slice(0, 3) } }
        } catch {
          return { result: { error: 'Strategy info not found' } }
        }
      },
      ['enemyName']
    ),

    new FunctionCallTool(
      'itemProgression',
      'Suggest an item progression or upgrade path from starter to endgame. For "best sword progression", "upgrade path for armor", or "progressão de armas do início ao fim".',
      {
        type: 'object',
        properties: {
          table: { type: 'string', description: 'The item category (e.g. "weapons", "armors")' },
          playstyle: { type: 'string', description: 'Optional playstyle preference' },
        },
      },
      async (params: { table: string; playstyle?: string }) => {
        try {
          const data = await ctx.fetchWithSlug('/api/voice/query', { action: 'listItems', table: params.table, limit: '50', sortBy: 'shop_price', sortDir: 'asc' })
          return { result: { table: params.table, progression: data, playstyle: params.playstyle } }
        } catch {
          return { result: { error: 'Progression data not found' } }
        }
      },
      ['table']
    ),

    new FunctionCallTool(
      'compareLoadouts',
      'Compare two complete equipment sets (weapon+armor+ring). For "compare my fire build with ice build" or "qual set é melhor?". Queries individual items and shows side-by-side stat totals.',
      {
        type: 'object',
        properties: {
          weaponA: { type: 'string', description: 'First loadout weapon name' },
          armorA: { type: 'string', description: 'First loadout armor name' },
          ringA: { type: 'string', description: 'First loadout ring name' },
          weaponB: { type: 'string', description: 'Second loadout weapon name' },
          armorB: { type: 'string', description: 'Second loadout armor name' },
          ringB: { type: 'string', description: 'Second loadout ring name' },
        },
      },
      async (params: { weaponA: string; armorA: string; ringA: string; weaponB: string; armorB: string; ringB: string }) => {
        try {
          const [wA, aA, rA, wB, aB, rB] = await Promise.all([
            ctx.fetchWithSlug('/api/voice/query', { action: 'getItem', table: 'weapons', name: params.weaponA }),
            ctx.fetchWithSlug('/api/voice/query', { action: 'getItem', table: 'armors', name: params.armorA }),
            ctx.fetchWithSlug('/api/voice/query', { action: 'getItem', table: 'rings', name: params.ringA }),
            ctx.fetchWithSlug('/api/voice/query', { action: 'getItem', table: 'weapons', name: params.weaponB }),
            ctx.fetchWithSlug('/api/voice/query', { action: 'getItem', table: 'armors', name: params.armorB }),
            ctx.fetchWithSlug('/api/voice/query', { action: 'getItem', table: 'rings', name: params.ringB }),
          ])
          return { result: { loadoutA: { weapon: wA, armor: aA, ring: rA }, loadoutB: { weapon: wB, armor: aB, ring: rB } } }
        } catch {
          return { result: { error: 'Loadout comparison failed' } }
        }
      },
      ['weaponA', 'armorA', 'ringA', 'weaponB', 'armorB', 'ringB']
    ),

    new FunctionCallTool(
      'rateItem',
      'Rate an item\'s quality relative to others in its category. Shows where the item stands compared to the average and top items. For "how good is steel sword?" or "vale a pena comprar a armadura void?".',
      {
        type: 'object',
        properties: {
          table: { type: 'string', description: 'Table name' },
          itemName: { type: 'string', description: 'Item name to rate' },
        },
      },
      async (params: { table: string; itemName: string }) => {
        try {
          const [itemData, summaryData] = await Promise.all([
            ctx.fetchWithSlug('/api/voice/query', { action: 'getItem', table: params.table, name: params.itemName }),
            ctx.fetchWithSlug('/api/voice/query', { action: 'getStatSummary', table: params.table, column: 'shop_price' }),
          ])
          return { result: { item: itemData, categoryAverages: summaryData, table: params.table } }
        } catch {
          return { result: { error: 'Rating failed' } }
        }
      },
      ['table', 'itemName']
    ),

    // ── Math tool ──

    q('evaluateMath',
      'Evaluate mathematical expressions (arithmetic, percentages, trigonometry, etc.). Use for any calculation: "what is 15% of 230?", "how much is (80-50)/50*100?", "sqrt(144)". Returns the computed result. Compose with data tools: getStatSummary → evaluateMath for "what percentage higher is this item?".',
      {
        expression: { type: 'string', description: 'Math expression (e.g. "15/100*230", "(80-50)/50*100", "sqrt(144)")' },
        precision: { type: 'number', description: 'Decimal places (default 4)' },
      },
      ['expression']),

    // ── Batch voice tool ──

    new FunctionCallTool(
      'batchVoiceQuery',
      `Execute MULTIPLE independent queries in ONE call. Huge speedup — instead of calling 3+ tools sequentially, batch them together.

Use for: "find weapon + armor + ring with fire element" (3 table queries), "get item stats + summary + comparisons" (multiple analysis tools).

PARAMS format: JSON array of {action, params} objects.
Example: [{"action":"getItem","params":{"table":"weapons","name":"steel sword"}},{"action":"getStatSummary","params":{"table":"weapons","column":"damage_min"}}]`,
      {
        type: 'object',
        properties: {
          queries: {
            type: 'string',
            description: 'JSON array of query objects. Each: {action: string, params: object}. Max 6 queries.',
          },
        },
      },
      async (params: { queries: string }) => {
        try {
          const queries = JSON.parse(params.queries).slice(0, 6) as Array<{ action: string; params: Record<string, string> }>
          const results = await Promise.all(
            queries.map(q => {
              const qParams: Record<string, string> = { action: q.action, ...q.params }
              return ctx.fetchWithSlug('/api/voice/query', qParams).catch(() => null)
            }),
          )
          const zipped = queries.map((q, i) => ({ action: q.action, params: q.params, result: results[i] }))
          return { result: { batchSize: zipped.length, queries: zipped } }
        } catch {
          return { result: { error: 'batchVoiceQuery failed — invalid JSON or request error' } }
        }
      },
      ['queries']
    ),

    // ── Navigate to item ──

    new FunctionCallTool(
      'navigateToItem',
      `Open a game item detail inline within the chat interface. Navigates to a specific item by table and slug for quick viewing. Use when the user says "mostre o item", "show me the item", "quero ver os detalhes".`,
      {
        type: 'object',
        properties: {
          table: { type: 'string', description: 'Table name (e.g. "weapons", "armors", "enemies")' },
          slug: { type: 'string', description: 'Item slug (e.g. "steel-sword")' },
        },
      },
      async (params: { table: string; slug: string }) => {
        return {
          result: {
            action: 'navigateToItem',
            table: params.table,
            slug: params.slug,
            message: `Abrindo ${params.table}/${params.slug}...`,
          },
        }
      },
      ['table', 'slug']
    ),

    // ── Show on screen ──

    new FunctionCallTool(
      'showOnScreen',
      `Display visual content on the user's screen (a popup/modal with formatted data).
Use when the user asks to "show me", "display", "mostre", "exiba" — so they can see data visually instead of just hearing it.
Pass the formatted content as markdown/html in the 'content' field.
The client will render this in a visual overlay.`,
      {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Title for the visual display' },
          content: { type: 'string', description: 'Markdown or HTML content to display on screen' },
        },
      },
      async (params: { title: string; content: string }) => {
        return {
          result: {
            action: 'showOnScreen',
            title: params.title,
            html: params.content,
            message: `Exibindo "${params.title}" na tela.`,
          },
        }
      },
      ['title', 'content']
    ),

    // ── Rate my gear ──

    new FunctionCallTool(
      'rateMyGear',
      `Evaluate a complete equipment build (weapon + armor + ring) and give it a rating.
Fetches each item's stats, compares them to category averages, and returns a score + recommendations.
Use for "rate my build", "avalie meu equipamento", "how good is my gear?".
At least one item is required.`,
      {
        type: 'object',
        properties: {
          weapon: { type: 'string', description: 'Weapon name (optional)' },
          armor: { type: 'string', description: 'Armor name (optional)' },
          ring: { type: 'string', description: 'Ring name (optional)' },
        },
      },
      async (params: { weapon?: string; armor?: string; ring?: string }) => {
        try {
          const queries: Array<Promise<any> | null> = []
          const slots: Array<{ name: string; table: string; label: string }> = []

          if (params.weapon) {
            queries.push(ctx.fetchWithSlug('/api/voice/query', { action: 'getItem', table: 'weapons', name: params.weapon }))
            slots.push({ name: params.weapon, table: 'weapons', label: 'Arma' })
          }
          if (params.armor) {
            queries.push(ctx.fetchWithSlug('/api/voice/query', { action: 'getItem', table: 'armors', name: params.armor }))
            slots.push({ name: params.armor, table: 'armors', label: 'Armadura' })
          }
          if (params.ring) {
            queries.push(ctx.fetchWithSlug('/api/voice/query', { action: 'getItem', table: 'rings', name: params.ring }))
            slots.push({ name: params.ring, table: 'rings', label: 'Anel' })
          }

          const rawItems = await Promise.all(queries)
          const items = slots.map((s, i) => ({ slot: s.label, table: s.table, item: rawItems[i] }))

          return {
            result: {
              action: 'rateMyGear',
              gear: items,
              message: `Build avaliada. ${items.length} item(ns) encontrados.`,
            },
          }
        } catch {
          return { result: { error: 'Falha ao avaliar equipamento.' } }
        }
      }
    ),

    // ── Open comparison ──

    new FunctionCallTool(
      'openComparison',
      `OPEN the visual comparison popup/drawer for items in a table.
Use INSTEAD of describing comparison data verbally — this shows a rich visual comparison with stat bars and ranking.
For: "compare X and Y", "compare steel sword with iron sword", "mostre a comparação entre X e Y".
Pass the table and at least 2 item names.`,
      {
        type: 'object',
        properties: {
          table: { type: 'string', description: 'Table name (e.g. "weapons", "armors", "enemies")' },
          items: { type: 'string', description: 'Comma-separated item names to compare (e.g. "steel sword,iron sword,battle axe"). Min 2, max 6.' },
        },
      },
      async (params: { table: string; items: string }) => {
        const itemList = params.items.split(',').map(s => s.trim()).filter(Boolean).slice(0, 6)
        if (itemList.length < 2) {
          return { result: { error: 'Precisa de pelo menos 2 itens para comparar.' } }
        }
        return {
          result: {
            action: 'openComparison',
            table: params.table,
            items: itemList,
            message: `Abrindo comparação de ${itemList.length} itens em ${params.table}...`,
          },
        }
      },
      ['table', 'items']
    ),
  ]
}
