'use client';

import { FileText } from 'lucide-react';

export function ArticleGridBlock({ config }: { config: Record<string, unknown> }) {
  const title = (config.title as string) || 'Artigos';
  const columns = (config.columns as number) || 3;
  const articles = (config.articles as { title: string; slug: string }[]) || [];

  return (
    <div className="space-y-6">
      {title && <h2 className="text-2xl font-bold">{title}</h2>}
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${Math.min(columns, 4)}, 1fr)` }}
      >
        {articles.length > 0 ? (
          articles.map((article, i) => (
            <div key={i} className="rounded-lg border bg-card p-4 hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-primary shrink-0" />
                <span className="font-medium text-sm truncate">{article.title}</span>
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
