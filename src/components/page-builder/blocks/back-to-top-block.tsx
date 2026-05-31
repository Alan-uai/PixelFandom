'use client';

import { ArrowUp, ChevronUp } from 'lucide-react';

export function BackToTopBlock({ config }: { config: Record<string, unknown> }) {
  const variant = (config.variant as string) || 'chevron';
  const label = (config.label as string) || '';
  const position = (config.position as string) || 'center';

  const alignClass = position === 'center' ? 'text-center' : 'text-right';

  if (variant === 'text') {
    return (
      <div className={alignClass}>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronUp className="h-4 w-4" />
          {label || 'Voltar ao topo'}
        </button>
      </div>
    );
  }

  const Icon = variant === 'arrow' ? ArrowUp : ChevronUp;

  return (
    <div className={alignClass}>
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="inline-flex items-center justify-center h-9 w-9 rounded-full border bg-background text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
        title={label || 'Voltar ao topo'}
      >
        <Icon className="h-4 w-4" />
      </button>
    </div>
  );
}
