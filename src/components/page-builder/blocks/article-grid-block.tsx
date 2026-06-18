'use client';

import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import { FileText, Calendar } from 'lucide-react';

const gridClasses: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
};

export function ArticleGridBlock({ config, tenantId }: { config: Record<string, any>; tenantId?: string }) {
  const title = config.title || 'Artigos';
  const columns = Math.min(Math.max(config.columns || 3, 1), 4);
  const mode = config.mode || 'manual';
  const tag = config.tag || '';
  const showImages = config.showImages !== false;
  const showSummaries = config.showSummaries !== false;
  const manualArticles = config.articles || [];

  const [fetchedArticles, setFetchedArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const cacheRef = useRef<{ key: string; items: any[] } | null>(null);

  useEffect(() => {
    if (mode !== 'tag' || !tag || !tenantId) {
      setFetchedArticles([]);
      return;
    }
    const cacheKey = `${tenantId}:${tag}`;
    if (cacheRef.current && cacheRef.current.key === cacheKey) {
      setFetchedArticles(cacheRef.current.items);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/tenants/${tenantId}/articles-by-tag?tag=${encodeURIComponent(tag)}`)
      .then((res) => (res.ok ? res.json() : { articles: [] }))
      .then((data) => {
        if (cancelled) return;
        const items = (data.articles || []).map((a: any) => ({
          title: a.title,
          slug: a.slug,
          imageUrl: a.image_url,
          summary: a.summary,
          date: a.updated_at ? new Date(a.updated_at).toLocaleDateString('pt-BR') : undefined,
        }));
        cacheRef.current = { key: cacheKey, items };
        setFetchedArticles(items);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [mode, tag, tenantId]);

  const articles = mode === 'tag' ? fetchedArticles : manualArticles;

  return (
    <div className="space-y-6">
      {title && <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--heading-font)' }}>{title}</h2>}
      {mode === 'tag' && tag && (
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          {tag}
        </div>
      )}
      <div className={`grid gap-4 ${gridClasses[columns] || 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
        {loading ? (
          <p className="text-sm text-muted-foreground col-span-full">Carregando artigos...</p>
        ) : articles.length > 0 ? (
          articles.map((article: any, i: number) => (
            <div key={i} className="rounded-lg border bg-card overflow-hidden hover:border-primary/30 transition-colors">
              {showImages && article.imageUrl && (
                <div className="relative w-full aspect-video">
                  <Image src={article.imageUrl} alt="" fill className="object-cover" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start gap-2">
                  {(!showImages || !article.imageUrl) && (
                    <FileText className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <span className="font-medium text-sm line-clamp-2">{article.title}</span>
                    {showSummaries && article.summary && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{article.summary}</p>
                    )}
                    {article.date && (
                      <p className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3" />
                        {article.date}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground col-span-full">
            {mode === 'tag' ? `Nenhum artigo encontrado para "${tag}"` : 'Nenhum artigo selecionado'}
          </p>
        )}
      </div>
    </div>
  );
}
