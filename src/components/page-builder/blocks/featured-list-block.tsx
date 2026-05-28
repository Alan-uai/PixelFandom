'use client';

import { Star } from 'lucide-react';

export function FeaturedListBlock({ config }: { config: Record<string, unknown> }) {
  const title = (config.title as string) || 'Destaques';
  const items = (config.items as { label: string; description?: string }[]) || [];

  return (
    <div className="space-y-4">
      {title && <h2 className="text-2xl font-bold">{title}</h2>}
      <div className="space-y-3">
        {items.length > 0 ? (
          items.map((item, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border bg-card p-4">
              <Star className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">{item.label}</p>
                {item.description && (
                  <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Adicione itens em destaque nas configurações</p>
        )}
      </div>
    </div>
  );
}
