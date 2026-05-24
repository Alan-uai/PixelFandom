export type CommandHandler = (args: string) => void;

export interface Command {
  name: string;
  aliases: string[];
  description: Record<string, string>;
  handler?: CommandHandler;
}

export const COMMANDS: Command[] = [
  {
    name: 'help',
    aliases: ['ajuda', 'ayuda'],
    description: {
      pt: 'Mostra todos os comandos disponíveis',
      en: 'Show all available commands',
      es: 'Muestra todos los comandos disponibles',
    },
  },
  {
    name: 'clear',
    aliases: ['limpar', 'limpiar'],
    description: {
      pt: 'Limpa a conversa atual',
      en: 'Clear the current conversation',
      es: 'Limpiar la conversación actual',
    },
  },
  {
    name: 'search',
    aliases: ['buscar', 'procurar', 'find'],
    description: {
      pt: 'Busca conteúdo na wiki',
      en: 'Search wiki content',
      es: 'Buscar contenido en la wiki',
    },
  },
  {
    name: 'page',
    aliases: ['pagina', 'página', 'abrir'],
    description: {
      pt: 'Navega para uma página específica',
      en: 'Navigate to a specific page',
      es: 'Navegar a una página específica',
    },
  },
  {
    name: 'wiki',
    aliases: ['mudar', 'switch'],
    description: {
      pt: 'Muda para outra wiki',
      en: 'Switch to another wiki',
      es: 'Cambiar a otra wiki',
    },
  },
  {
    name: 'articles',
    aliases: ['artigos', 'lista', 'list'],
    description: {
      pt: 'Lista todos os artigos da wiki',
      en: 'List all wiki articles',
      es: 'Listar todos los artículos de la wiki',
    },
  },
  {
    name: 'volume',
    aliases: ['vol', 'som', 'sound', 'audio'],
    description: {
      pt: 'Ajusta o volume da voz (1-100)',
      en: 'Adjust voice volume (1-100)',
      es: 'Ajustar el volumen de la voz (1-100)',
    },
  },
  {
    name: 'voice',
    aliases: ['voz', 'vocal'],
    description: {
      pt: 'Muda a voz do assistente (Puck, Kore, Charon, Fenrir, Aoede)',
      en: 'Change assistant voice (Puck, Kore, Charon, Fenrir, Aoede)',
      es: 'Cambiar la voz del asistente (Puck, Kore, Charon, Fenrir, Aoede)',
    },
  },
];

export function detectCommand(text: string): { command: Command; args: string } | null {
  const trimmed = text.trim().toLowerCase();

  for (const cmd of COMMANDS) {
    const allNames = [cmd.name, ...cmd.aliases];
    for (const name of allNames) {
      const pattern = new RegExp(`^/(${name})(\\s+(.*))?$`, 'i');
      const match = trimmed.match(pattern);
      if (match) {
        return { command: cmd, args: match[3] || '' };
      }
    }
  }

  return null;
}

export function getHelpText(lang = 'pt'): string {
  const langKey = lang in (COMMANDS[0]?.description || {}) ? lang : 'pt';
  const lines = COMMANDS.map((cmd) => {
    const desc =
      cmd.description[langKey as keyof typeof cmd.description] ||
      cmd.description['pt'];
    const aliases = cmd.aliases
      .slice(0, 3)
      .map((a) => `/${a}`)
      .join(', ');
    return `  **/${cmd.name}**${aliases ? ` (${aliases})` : ''} — ${desc}`;
  });
  return lines.join('\n');
}
