import type { FunctionCallTool } from './tools'
import { createWikiTools, type ToolContext } from './tools'
import { SYSTEM_PROMPT_XWIKI, GREETING_MESSAGES_XWIKI } from './systemPrompt'
import type { Command } from './commands'

export type AgentId = 'xwiki'

export interface AgentConfig {
  id: AgentId
  name: string
  emoji: string
  wakeWords: string[]
  systemPrompt: string
  greetingMessages: Record<string, string>
  commands: Command[]
  subtitle: Record<string, string>
  primaryColor: string
  primaryGradient: string
  defaultVoice: string
  chatLabel: string
  systemLabel: string
}

export function createAgentTools(ctx: ToolContext): FunctionCallTool[] {
  return createWikiTools(ctx)
}

export function getAgentCommands(): Command[] {
  return []
}

export const AGENTS: Record<AgentId, AgentConfig> = {
  xwiki: {
    id: 'xwiki',
    name: 'xWiki',
    emoji: '🧠',
    wakeWords: ['xwiki', 'wiki', 'assistente'],
    systemPrompt: SYSTEM_PROMPT_XWIKI,
    greetingMessages: GREETING_MESSAGES_XWIKI,
    commands: [],
    subtitle: {
      pt: 'Seu Assistente de Wiki',
      en: 'Your Wiki Assistant',
      es: 'Tu Asistente de Wiki',
    },
    primaryColor: 'primary',
    primaryGradient: 'from-primary/80 to-primary/40',
    defaultVoice: 'Kore',
    chatLabel: 'XWIKI',
    systemLabel: 'SISTEMA',
  },
}

export function getAgentPages(): never[] {
  return []
}
