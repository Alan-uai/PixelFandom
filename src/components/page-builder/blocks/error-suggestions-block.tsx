'use client';

import { ArrowRight } from 'lucide-react';

export function ErrorSuggestionsBlock({ config }: { config: Record<string, unknown> }) {
  const title = (config.title as string) || 'Você pode estar procurando:';
  const items = (config.items as Array<{ title: string; slug: string }>) || [];

  if (items.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground py-4">
        {title && <p className="mb-2 font-medium">{title}</p>}
        <p>Nenhuma sugestão configurada</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {title && <h3 className="text-lg font-semibold text-center">{title}</h3>}
      <ul className="space-y-2 max-w-md mx-auto">
        {items.map((item, i) => (
          <li key={i}>
            <a
              href={item.slug || '#'}
              className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 hover:border-primary/50 transition-colors group"
            >
              <span className="text-sm font-medium">{item.title}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
