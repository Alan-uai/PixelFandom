'use client';

import { useEffect, useState } from 'react';
import { Newspaper, Calendar, ExternalLink } from 'lucide-react';

export function NewsFeedBlock({ config, tenantId }: { config: Record<string, any>; tenantId?: string }) {
  const title = config.title || 'Notícias';
  const mode = config.mode || 'manual';
  const tag = config.tag || '';
  const maxItems = config.maxItems || 10;
  const manualItems = config.items || [];

  const [fetchedItems, setFetchedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mode !== 'tag' || !tag || !tenantId) {
      setFetchedItems([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/tenants/${tenantId}/articles-by-tag?tag=${encodeURIComponent(tag)}`)
      .then((res) => (res.ok ? res.json() : { articles: [] }))
      .then((data) => {
        if (cancelled) return;
        setFetchedItems(
          (data.articles || []).slice(0, maxItems).map((a: any) => ({
            title: a.title,
            excerpt: a.summary,
            date: a.updated_at ? new Date(a.updated_at).toLocaleDateString('pt-BR') : undefined,
            link: a.slug ? `/article/${a.slug}` : undefined,
            imageUrl: a.image_url,
          }))
        );
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [mode, tag, tenantId, maxItems]);

  const items = mode === 'tag' ? fetchedItems : manualItems;

  return (
    <div className="space-y-4">
      {title && <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--heading-font)' }}>{title}</h2>}
      {mode === 'tag' && tag && (
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          {tag}
        </div>
      )}
      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando notícias...</p>
        ) : items.length > 0 ? (
          items.slice(0, maxItems).map((item: any, i: number) => (
            <div key={i} className="rounded-lg border bg-card p-4 hover:border-primary/30 transition-colors">
              <div className="flex items-start gap-3">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt="" className="h-16 w-16 rounded object-cover shrink-0" />
                ) : (
                  <Newspaper className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  {item.link ? (
                    <a href={item.link} className="font-medium text-sm hover:text-primary transition-colors line-clamp-2">
                      {item.title}
                    </a>
                  ) : (
                    <p className="font-medium text-sm line-clamp-2">{item.title}</p>
                  )}
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
                    <a
                      href={item.link}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                    >
                      Ler mais
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            {mode === 'tag' ? 'Nenhuma notícia encontrada' : 'As notícias aparecerão aqui'}
          </p>
        )}
      </div>
    </div>
  );
}
