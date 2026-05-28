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

export function createWikiTools(ctx: ToolContext): FunctionCallTool[] {
  return [
    new FunctionCallTool(
      'searchWiki',
      `SEARCH all wiki + game data (weapons, armors, enemies, bosses, rings, potions, upgrades).
Search is run against EVERY text column across ALL tables for EVERY extracted term,
then results are merged and deduplicated. So "grasslands weapons" searches for
"grasslands" AND "weapons" separately — items matching both have highest rank.

RETURNS: { wiki: [...], collection: [...], game_items: [...] }

HOW TO SEARCH — CRITICAL:
- Do NOT search with the user\'s full question. Extract ONLY the key terms (item name, enemy name, boss name, etc).
- Example: user says "como obter a espada noturna" → search query must be "espada noturna" (the item name), NOT the full sentence.
- Example: user says "qual a fraqueza do goblin rei" → search query must be "goblin rei" NOT "qual a fraqueza do goblin rei".
- Example: user says "necro flash" → search WILL find "Necro Flask" because fuzzy/partial matching is enabled across all fields.
- The search engine now scans ALL tables + ALL text columns automatically with fuzzy matching (pg_trgm). So even partial/typo\'d queries work.

IMPORTANT — WHERE TO READ RESULTS:
- game_items[] is the PRIMARY data source. It contains ALL matching items from ALL tables
  (wiki_articles, weapons, armors, enemies, bosses, rings, potions, upgrades).
  Even wiki articles appear in game_items with source_type = "wiki_article".
- wiki[] is SUPPLEMENTARY — contains article text content for lore/guides/strategies.
  Most of the time you only need game_items[].
- collection[] is legacy and always empty.

- Source type tells you what it is: "wiki_article", "weapon", "armor", "enemy",
  "boss", "ring", "potion", "upgrade".
- If you find something in game_items with source_type = "wiki_article",
  you can also read its raw_data (parsed from the article content) for game stats.

NEVER HALLUCINATE:
- Read the ACTUAL numbers from "raw_data". If raw_data is null or a field is missing, say the info is NOT AVAILABLE — NEVER invent stats, damage, abilities, weaknesses, or any data.
- If a field exists, read its exact value. Do not calculate, estimate, or modify it.
- If search returns empty, say "não encontrei" / "not found". Do not describe a made-up item.
- Accuracy matters more than being helpful. A wrong stat is worse than saying "I don\'t know".`,

      {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'EXTRACTED key search term — use the URL-friendly slug format: lowercase, hyphenated, no spaces. Example: "void-armor" not "void armor". NOT the full user question.' },
        },
      },
      async (params: { query: string }) => {
        try {
          const data = await ctx.fetchWithSlug('/api/search', { q: params.query })
          return { result: { wiki: data.wiki ?? [], collection: data.collection ?? [], game_items: data.game_items ?? [] } }
        } catch (e) {
          return { result: { error: 'Search failed', wiki: [], collection: [], game_items: [] } }
        }
      },
      ['query']
    ),

    new FunctionCallTool(
      'getWikiInfo',
      'Get wiki metadata: total article count, per-tag counts (tag_counts: { potions: 4, weapons: 30 }), available collections/categories, and all tags. Use for answering "how many articles", "how many potions", "what categories exist". Never invent counts — read the actual numbers from the response.',
      {
        type: 'object',
        properties: {},
      },
      async () => {
        try {
          const data = await ctx.fetchWithSlug('/api/voice/wiki-info', {})
          return { result: data }
        } catch (e) {
          return { result: { error: 'Failed to get wiki info' } }
        }
      }
    ),

    new FunctionCallTool(
      'getWikiArticle',
      'Get the full content of a wiki article by its slug. Also returns item_stats with raw attributes (damage, abilities, crit, etc.) IF the article has structured game data. If item_stats is null, the article has no game stats — do not invent any. Read the article text content but never fabricate numbers. PREFER searchWiki over this tool for finding items — getWikiArticle is only for reading full article text after you have the slug.',
      {
        type: 'object',
        properties: {
          slug: { type: 'string', description: 'The article slug (e.g. "steel-sword", "goblin-king"). Use the slug returned by searchWiki.' },
        },
      },
      async (params: { slug: string }) => {
        try {
          const data = await ctx.fetchWithSlug('/api/voice/article', { article: params.slug })
          return { result: data }
        } catch (e) {
          return { result: { error: 'Article not found' } }
        }
      },
      ['slug']
    ),

    new FunctionCallTool(
      'navigateToHome',
      'Navigate to the wiki home page. Use when the user wants to "see everything", "show the wiki", "go home", or explore the wiki overview.',
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
      'Navigate to the PixelFandom Hub (main page listing all wikis). Use when the user asks to go back to the hub, see all wikis, or go to PixelFandom.',
      {
        type: 'object',
        properties: {},
      },
      async () => {
        ctx.navigate('https://pixelfandom.vercel.app/')
        return { result: { success: true, page: 'hub' } }
      }
    ),

    new FunctionCallTool(
      'navigateToPage',
      'Navigate to a specific article or item detail page in the wiki (e.g. "nightmare-blade", "goblin-king"). Use the slug returned by searchWiki or getWikiArticle.',
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
      'listWikiArticles',
      'Browse articles by category using the optional "tag" parameter (e.g. "potions", "weapons", "armors", "rings", "enemies", "bosses", "upgrades"). Returns article titles, slugs, and summaries for browsing. For FINDING a specific item by name, use searchWiki instead — this tool only lists by tag.',
      {
        type: 'object',
        properties: {
          tag: { type: 'string', description: 'Optional: filter by tag/category (e.g. "potions", "weapons", "armors", "rings", "enemies", "bosses", "upgrades"). Without this, lists ALL articles.' },
        },
      },
      async (params: { tag?: string }) => {
        try {
          const queryParams: Record<string, string> = {}
          if (params.tag) queryParams.tag = params.tag
          const data = await ctx.fetchWithSlug('/api/voice/articles', queryParams)
          return { result: data }
        } catch (e) {
          return { result: { error: 'Failed to list articles', articles: [] } }
        }
      }
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
      'help',
      'Show available commands and what the assistant can do.',
      {
        type: 'object',
        properties: {},
      },
      async () => {
        return {
          result: {
            message: `I can help you with:
- Search wiki articles AND game items with stats (damage, abilities, elements, etc.)
- Read full article content and item details with raw numbers
- List articles by category (potions, weapons, armors, etc.)
- Navigate to wiki pages and item pages
- Show wiki overview (categories with counts, tags, article count)
- Switch to another wiki
- Adjust volume, change voice, clear conversation`,
          },
        }
      }
    ),

    new FunctionCallTool(
      'adjustVolume',
      'Adjust the assistant voice volume. Use when the user wants to increase or decrease volume.',
      {
        type: 'object',
        properties: {
          level: { type: 'number', description: 'Volume level from 0 (mute) to 100 (maximum)' },
          reason: { type: 'string', description: 'Why the volume is being adjusted' },
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
            description: 'The voice name to switch to',
          },
        },
      },
      async (params: { name: VoiceName }) => {
        const valid = ['Puck', 'Kore', 'Charon', 'Fenrir', 'Aoede']
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
      'Clear the current conversation transcript.',
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
            description: 'The language code to switch to',
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
          message: { type: 'string', description: 'The notification message to display' },
          emoji: { type: 'string', description: 'Optional emoji for the notification' },
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
Use this when the user says goodbye, wants to hang up, or asks to end the conversation.
Examples: "tchau", "falou", "pode ir", "pode desligar", "até logo", "bye", "já era", "fechou", "é isso", "valeu", "obrigado por hoje", "nos vemos", "até mais", "see you", "goodbye", "adiós", "hasta luego", "chao".`,
      {
        type: 'object',
        properties: {},
      },
      async () => {
        ctx.onEndSession()
        return { result: { action: 'end_session', message: 'Sessão encerrada. Até logo!' } }
      }
    ),
  ]
}
