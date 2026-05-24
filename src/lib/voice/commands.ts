export type Command = {
  name: string;
  aliases: string[];
  description: string;
  usage: string;
  handler: (args: string, context: CommandContext) => CommandResult | Promise<CommandResult>;
};

export type CommandContext = {
  tenantSlug: string;
  navigate: (path: string) => void;
  search: (query: string) => Promise<void>;
  setVolume?: (level: number) => void;
};

export type CommandResult = {
  message: string;
  action?: 'navigate' | 'search' | 'clear' | 'volume';
  payload?: string;
};

const commands: Command[] = [
  {
    name: 'ajuda',
    aliases: ['help', 'comandos', 'commands'],
    description: 'Mostra a lista de comandos disponíveis',
    usage: '/ajuda',
    handler: async () => ({
      message: `Comandos disponíveis:
/ajuda - Mostra esta mensagem
/limpar - Limpa a conversa
/buscar <termo> - Busca na wiki
/pagina <slug> - Navega para um artigo
/wiki <slug> - Troca para outra wiki
/artigos - Lista todos os artigos
/volume <0-100> - Ajusta o volume`,
    }),
  },
  {
    name: 'limpar',
    aliases: ['clear', 'clean'],
    description: 'Limpa a conversa atual',
    usage: '/limpar',
    handler: async () => ({
      message: 'Conversa limpa.',
      action: 'clear',
    }),
  },
  {
    name: 'buscar',
    aliases: ['search', 'procurar', 'find'],
    description: 'Busca conteúdo na wiki',
    usage: '/buscar <termo>',
    handler: async (args, context) => {
      if (!args) return { message: 'Uso: /buscar <termo>' };
      await context.search(args);
      return {
        message: `Buscando por "${args}"...`,
        action: 'search',
        payload: args,
      };
    },
  },
  {
    name: 'pagina',
    aliases: ['page', 'artigo', 'article', 'ir'],
    description: 'Navega para um artigo específico',
    usage: '/pagina <slug>',
    handler: async (args, context) => {
      if (!args) return { message: 'Uso: /pagina <slug>' };
      context.navigate(`/w/${context.tenantSlug}/${args}`);
      return {
        message: `Navegando para ${args}...`,
        action: 'navigate',
        payload: args,
      };
    },
  },
  {
    name: 'wiki',
    aliases: ['trocar', 'switch'],
    description: 'Troca para outra wiki',
    usage: '/wiki <slug>',
    handler: async (args, context) => {
      if (!args) return { message: 'Uso: /wiki <slug>' };
      context.navigate(`/w/${args}`);
      return {
        message: `Trocando para wiki "${args}"...`,
        action: 'navigate',
        payload: args,
      };
    },
  },
  {
    name: 'artigos',
    aliases: ['articles', 'lista', 'list'],
    description: 'Lista todos os artigos da wiki',
    usage: '/artigos',
    handler: async (_args, context) => {
      try {
        const res = await fetch(`/api/voice/articles?slug=${encodeURIComponent(context.tenantSlug)}`);
        const data = await res.json();
        if (data.articles?.length) {
          const list = data.articles.map((a: any) => `- ${a.title} (/${a.slug || a.id})`).join('\n');
          return { message: `Artigos disponíveis:\n${list}` };
        }
        return { message: 'Nenhum artigo encontrado.' };
      } catch {
        return { message: 'Erro ao listar artigos.' };
      }
    },
  },
  {
    name: 'volume',
    aliases: ['vol'],
    description: 'Ajusta o volume da voz (0-100)',
    usage: '/volume <0-100>',
    handler: async (args, context) => {
      const level = parseInt(args);
      if (isNaN(level) || level < 0 || level > 100) {
        return { message: 'Uso: /volume <0-100>' };
      }
      context.setVolume?.(level);
      return { message: `Volume ajustado para ${level}.`, action: 'volume', payload: String(level) };
    },
  },
];

export function detectCommand(text: string): { command: Command; args: string } | null {
  const match = text.match(/^\/(\w+)(?:\s+(.*))?$/);
  if (!match) return null;

  const input = match[1].toLowerCase();
  const args = (match[2] || '').trim();

  for (const cmd of commands) {
    if (cmd.name === input || cmd.aliases.includes(input)) {
      return { command: cmd, args };
    }
  }

  return null;
}

export function getCommandList(): Command[] {
  return commands;
}
