'use client';

import { Newspaper, Calendar } from 'lucide-react';

export function NewsFeedBlock({ config }: { config: Record<string, unknown> }) {
  const title = (config.title as string) || 'Notícias';
  const items = (config.items as { title: string; date?: string; excerpt?: string; imageUrl?: string; link?: string }[]) || [];

  return (
    <div className="space-y-4">
      {title && <h2 className="text-2xl font-bold">{title}</h2>}
      <div className="space-y-3">
        {items.length > 0 ? (
          items.map((item, i) => (
            <div key={i} className="rounded-lg border bg-card p-4">
              <div className="flex items-start gap-3">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt="" className="h-14 w-14 rounded object-cover shrink-0" />
                ) : (
                  <Newspaper className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.title}</p>
                  {item.date && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3" />
                      {item.date}
                    </p>
                  )}
                  {item.excerpt && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.excerpt}</p>
                  )}
                  {item.link && (
                    <a href={item.link} className="text-xs text-primary hover:underline mt-1 inline-block">Ler mais</a>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">As notícias aparecerão aqui</p>
        )}
      </div>
    </div>
  );
}
