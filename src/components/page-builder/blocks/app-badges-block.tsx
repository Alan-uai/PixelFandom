'use client';

import { Apple, Smartphone } from 'lucide-react';

export function AppBadgesBlock({ config }: { config: Record<string, unknown> }) {
  const showApple = config.showApple as boolean | undefined;
  const showGoogle = config.showGoogle as boolean | undefined;
  const appleUrl = (config.appleUrl as string) || '';
  const googleUrl = (config.googleUrl as string) || '';
  const align = (config.align as string) || 'center';

  const alignClass = align === 'left' ? 'justify-start' : align === 'right' ? 'justify-end' : 'justify-center';

  return (
    <div className={`flex flex-wrap gap-3 ${alignClass}`}>
      {showApple && (
        <a
          href={appleUrl || '#'}
          className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 transition-opacity"
        >
          <Apple className="h-4 w-4" />
          App Store
        </a>
      )}
      {showGoogle && (
        <a
          href={googleUrl || '#'}
          className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 transition-opacity"
        >
          <Smartphone className="h-4 w-4" />
          Google Play
        </a>
      )}
      {!showApple && !showGoogle && (
        <span className="text-sm text-muted-foreground">Configure os badges</span>
      )}
    </div>
  );
}
