'use client';

import { useEffect, useState } from 'react';
import { FileText, Calendar } from 'lucide-react';

export function ArticleGridBlock({ config, tenantId }: { config: Record<string, unknown>; tenantId?: string }) {
  const title = (config.title as string) || 'Artigos';
  const columns = (config.columns as number) || 3;
  const showImage = config.showImage !== false;
  const showSummary = config.showSummary !== false;
  const showDate = config.showDate !== false;
  const tag = (config.tag as string) || '';
  const manualArticles = (config.articles as { title: string; slug: string; imageUrl?: string; summary?: string; date?: string }[]) || [];
  const preview = config.preview as boolean;

  const [dynamicArticles, setDynamicArticles] = useState<typeof manualArticles>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tag || !tenantId || preview) return;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/tenants/${tenantId}/articles-by-tag?tag=${encodeURIComponent(tag)}`);
        if (res.ok) {
          const data = await res.json();
          setDynamicArticles((data.articles || []).map((a: any) => ({
            title: a.title,
            slug: a.slug,
            imageUrl: a.image_url,
            summary: a.summary,
            date: a.updated_at ? new Date(a.updated_at).toLocaleDateString('pt-BR') : undefined,
          })));
        }
      } catch {}
      setLoading(false);
    })();
  }, [tag, tenantId, preview]);

  const articles = tag ? dynamicArticles : manualArticles;

  return (
    <div className="space-y-6">
      {title && <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--heading-font)' }}>{title}</h2>}
      {tag && (
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          Filtro: {tag}
        </div>
      )}
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${Math.min(columns, 4)}, 1fr)` }}
      >
        {loading ? (
          <p className="text-sm text-muted-foreground col-span-full">Carregando artigos...</p>
        ) : articles.length > 0 ? (
          articles.map((article, i) => (
            <div key={i} className="rounded-lg border bg-card overflow-hidden hover:border-primary/30 transition-colors">
              {showImage && article.imageUrl && (
                <img src={article.imageUrl} alt="" className="w-full aspect-video object-cover" />
              )}
              <div className="p-4">
                <div className="flex items-start gap-2">
                  {(!showImage || !article.imageUrl) && (
                    <FileText className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <span className="font-medium text-sm line-clamp-2">{article.title}</span>
                    {showSummary && article.summary && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{article.summary}</p>
                    )}
                    {showDate && article.date && (
                      <p className="text-[10px] text-muted-foreground mt-1">{article.date}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground col-span-full">
            {preview ? 'Artigos aparecerão aqui' : tag ? `Nenhum artigo encontrado para "${tag}"` : 'Nenhum artigo selecionado'}
          </p>
        )}
      </div>
    </div>
  );
}
