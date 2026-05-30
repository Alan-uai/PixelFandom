'use client';

import { FileText, Calendar } from 'lucide-react';

export function ArticleGridBlock({ config }: { config: Record<string, unknown> }) {
  const title = (config.title as string) || 'Artigos';
  const columns = (config.columns as number) || 3;
  const showImage = config.showImage !== false;
  const showSummary = config.showSummary !== false;
  const showDate = config.showDate !== false;
  const articles = (config.articles as { title: string; slug: string; imageUrl?: string; summary?: string; date?: string }[]) || [];

  return (
    <div className="space-y-6">
      {title && <h2 className="text-2xl font-bold">{title}</h2>}
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${Math.min(columns, 4)}, 1fr)` }}
      >
        {articles.length > 0 ? (
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
            {config.preview ? 'Artigos aparecerão aqui' : 'Nenhum artigo selecionado'}
          </p>
        )}
      </div>
    </div>
  );
}
