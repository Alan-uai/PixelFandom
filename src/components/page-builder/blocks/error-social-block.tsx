'use client';

import { HeartHandshake, Share2, Twitter, MessageCircle } from 'lucide-react';

export function ErrorSocialBlock({ config }: { config: Record<string, unknown> }) {
  const title = (config.title as string) || 'Não vá ainda!';
  const message = (config.message as string) || 'Siga-nos nas redes sociais:';
  const showShare = config.showShare !== false;
  const showFollow = config.showFollow !== false;
  const layout = (config.layout as string) || 'row';

  return (
    <div className="rounded-xl border bg-card p-6 max-w-md mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <HeartHandshake className="h-5 w-5 text-primary" />
        <div>
          <h3 className="font-semibold text-sm">{title}</h3>
          {message && <p className="text-xs text-muted-foreground">{message}</p>}
        </div>
      </div>
      <div className={`flex ${layout === 'column' ? 'flex-col' : 'flex-row flex-wrap'} gap-2 justify-center`}>
        {showFollow && (
          <>
            <a href="#" className="inline-flex items-center gap-2 rounded-lg border bg-background px-4 py-2 text-xs font-medium hover:border-primary/50 transition-colors">
              <Twitter className="h-4 w-4 text-sky-400" />
              Siga no Twitter
            </a>
            <a href="#" className="inline-flex items-center gap-2 rounded-lg border bg-background px-4 py-2 text-xs font-medium hover:border-primary/50 transition-colors">
              <MessageCircle className="h-4 w-4 text-purple-400" />
              Entre no Discord
            </a>
          </>
        )}
        {showShare && (
          <a href="#" className="inline-flex items-center gap-2 rounded-lg border bg-background px-4 py-2 text-xs font-medium hover:border-primary/50 transition-colors">
            <Share2 className="h-4 w-4 text-muted-foreground" />
            Compartilhar
          </a>
        )}
      </div>
    </div>
  );
}
