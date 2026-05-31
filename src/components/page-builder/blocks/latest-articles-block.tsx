'use client';

import { useEffect, useState } from 'react';
import { FileText, Calendar } from 'lucide-react';

const demoArticles = [
  { title: 'Introdução ao Next.js 15', slug: 'intro-nextjs-15', summary: 'Conheça as novidades da nova versão do framework React.', date: '15 maio 2026', imageUrl: '' },
  { title: 'Guia de TypeScript Avançado', slug: 'typescript-avancado', summary: 'Tipos condicionais, mapped types e utility types.', date: '12 maio 2026', imageUrl: '' },
  { title: 'Design Systems com Tailwind', slug: 'design-systems-tailwind', summary: 'Como criar um design system escalável.', date: '10 maio 2026', imageUrl: '' },
  { title: 'Autenticação com Supabase', slug: 'auth-supabase', summary: 'Implemente autenticação segura em minutos.', date: '8 maio 2026', imageUrl: '' },
  { title: 'Otimização de Performance Web', slug: 'performance-web', summary: 'Técnicas para melhorar o desempenho da sua aplicação.', date: '5 maio 2026', imageUrl: '' },
  { title: 'Integração Contínua com GitHub Actions', slug: 'ci-github-actions', summary: 'Automatize seus deploys e testes.', date: '3 maio 2026', imageUrl: '' },
];

const gridClasses: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
};

export function LatestArticlesBlock({ config, tenantId }: { config: Record<string, any>; tenantId?: string }) {
  const title = config.title || 'Últimos Artigos';
  const count = config.count || 6;
  const columns = Math.min(Math.max(config.columns || 3, 1), 4);
  const showImages = config.showImages !== false;
  const showSummaries = config.showSummaries !== false;
  const tag = config.tag || '';

  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const url = tag && tenantId
      ? `/api/tenants/${tenantId}/articles-by-tag?tag=${encodeURIComponent(tag)}&limit=${count}`
      : null;

    if (url) {
      fetch(url)
        .then((res) => (res.ok ? res.json() : { articles: [] }))
        .then((data) => {
          if (cancelled) return;
          setArticles(
            (data.articles || []).slice(0, count).map((a: any) => ({
              title: a.title,
              slug: a.slug,
              imageUrl: a.image_url,
              summary: a.summary,
              date: a.updated_at ? new Date(a.updated_at).toLocaleDateString('pt-BR') : undefined,
            }))
          );
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    } else {
      setArticles(demoArticles.slice(0, count));
      setLoading(false);
    }

    return () => { cancelled = true; };
  }, [tag, tenantId, count]);

  return (
    <div className="space-y-6">
      {title && <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--heading-font)' }}>{title}</h2>}
      <div className={`grid gap-4 ${gridClasses[columns] || 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
        {loading ? (
          <p className="text-sm text-muted-foreground col-span-full">Carregando artigos...</p>
        ) : articles.length > 0 ? (
          articles.map((article: any, i: number) => (
            <div key={i} className="rounded-lg border bg-card overflow-hidden hover:border-primary/30 transition-colors">
              {showImages && article.imageUrl && (
                <img src={article.imageUrl} alt="" className="w-full aspect-video object-cover" />
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
          <p className="text-sm text-muted-foreground col-span-full">Nenhum artigo encontrado</p>
        )}
      </div>
    </div>
  );
}
