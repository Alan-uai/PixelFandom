'use client';

import { MessageCircle } from 'lucide-react';

export function DiscordEmbedBlock({ config }: { config: Record<string, unknown> }) {
  const discordUrl = (config.discordUrl as string) || '';
  const title = (config.title as string) || 'Junte-se ao nosso Discord';
  const description = (config.description as string) || 'Participe da comunidade no Discord!';

  return (
    <div className="rounded-xl border bg-[#5865F2]/5 p-8 text-center space-y-4">
      <div className="mx-auto rounded-full bg-[#5865F2]/10 p-3 w-fit">
        <MessageCircle className="h-8 w-8 text-[#5865F2]" />
      </div>
      <div>
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
      {discordUrl && (
        <a
          href={discordUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-[#5865F2] px-6 py-3 text-sm font-medium text-white hover:bg-[#5865F2]/90 transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
          Entrar no Discord
        </a>
      )}
    </div>
  );
}
