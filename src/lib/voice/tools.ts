import type { VoiceName } from './geminilive'

// ─── Base Tool Class ─────────────────────────────────────────

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

// ─── Tool Callbacks Context ──────────────────────────────────

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
  fetchWithSlug: (path: string, params: Record<string, string>) => Promise<any>
}

// ─── Wiki Tools ──────────────────────────────────────────────

export function createWikiTools(ctx: ToolContext): FunctionCallTool[] {
  return [
    new FunctionCallTool(
      'searchWikiContent',
      'Search wiki articles semantically for relevant content. Returns titles, summaries, and slugs.',
      {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'The search query to find relevant wiki content' },
        },
      },
      async (params: { query: string }) => {
        try {
          const data = await ctx.fetchWithSlug('/api/voice/search', { q: params.query })
          return { result: data }
        } catch (e) {
          return { result: { error: 'Search failed', results: [] } }
        }
      },
      ['query']
    ),

    new FunctionCallTool(
      'getWikiArticle',
      'Get the full content of a specific wiki article by its slug or title.',
      {
        type: 'object',
        properties: {
          slug: { type: 'string', description: 'The slug or URL-friendly identifier of the article' },
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
      'navigateToPage',
      'Navigate to a specific page or article in the wiki.',
      {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'The path to navigate to (e.g. "articles/my-article")' },
        },
      },
      async (params: { path: string }) => {
        ctx.navigate(`/w/${ctx.tenantSlug}/${params.path}`)
        return { result: { success: true, path: params.path } }
      },
      ['path']
    ),

    new FunctionCallTool(
      'listWikiArticles',
      'List all available articles in the current wiki.',
      {
        type: 'object',
        properties: {},
      },
      async () => {
        try {
          const data = await ctx.fetchWithSlug('/api/voice/articles', {})
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
- Search wiki articles
- Read article contents
- Navigate between pages
- List all articles
- Switch to another wiki
- Adjust volume
- Change voice
- Clear conversation`,
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
  ]
}
