'use client';

import Image from 'next/image';
import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/supabase';
import { FileText, Calendar, ArrowUp, MessageCircle, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import InfiniteCarousel from '@/components/ui/infinite-carousel';
import type { ArticleFeedConfig, ArticleSortBy } from '../types';
import { renderMarkdown } from '@/lib/content-utils';

const sortLabels: Record<ArticleSortBy, { label: string; icon: React.ElementType }> = {
  recent: { label: 'Recentes', icon: Calendar },
  most_voted: { label: 'Mais Votados', icon: ArrowUp },
  most_commented: { label: 'Mais Comentados', icon: MessageCircle },
  popular: { label: 'Populares', icon: TrendingUp },
};

type ArticleWithStats = {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  image_url?: string;
  updated_at?: string;
  score?: number;
  comment_count?: number;
};

const gridClasses: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
};

export function ArticleFeedBlock({ config, tenantId, basePath }: { config: ArticleFeedConfig; tenantId?: string; basePath?: string }) {
  const title = config.title || 'Artigos';
  const sortBy: ArticleSortBy = config.sortBy || 'recent';
  const tag = config.tag || '';
  const layout = config.layout || 'grid';
  const columns = Math.min(Math.max(config.columns || 3, 1), 4);
  const limit = config.count || 6;
  const showImages = config.showImages !== false;
  const showSummaries = config.showSummaries !== false;

  const cache = useRef<ArticleWithStats[] | null>(null);
  const [articles, setArticles] = useState<ArticleWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const SortIcon = sortLabels[sortBy]?.icon || Calendar;

  useEffect(() => {
    if (!tenantId) { setLoading(false); return; }
    if (cache.current) {
      setArticles(cache.current);
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        let query = supabase
          .from('wiki_articles')
          .select('id, title, slug, summary, image_url, updated_at')
          .eq('tenant_id', tenantId)
          .eq('status', 'published')
          .order('updated_at', { ascending: false });

        if (tag) {
          query = query.contains('tags', [tag]);
        }

        const { data: fetched, error } = await query.limit(50);

        if (cancelled || error || !fetched) return;

        let result: ArticleWithStats[] = fetched;

        if (sortBy === 'most_voted') {
          const ids = result.map((a) => a.id);
          const { data: voteData } = await supabase
            .from('votes')
            .select('target_id, vote_type')
            .in('target_id', ids)
            .eq('target_type', 'article');

          if (!cancelled && voteData) {
            const scoreMap: Record<string, number> = {};
            for (const v of voteData) {
              scoreMap[v.target_id] = (scoreMap[v.target_id] || 0) + (v.vote_type === 'up' ? 1 : -1);
            }
            for (const a of result) {
              a.score = scoreMap[a.id] || 0;
            }
            result.sort((a, b) => (b.score || 0) - (a.score || 0));
          }
        } else if (sortBy === 'most_commented') {
          const ids = result.map((a) => a.id);
          const { data: commentData } = await supabase
            .from('article_comments')
            .select('article_id')
            .in('article_id', ids);

          if (!cancelled && commentData) {
            const countMap: Record<string, number> = {};
            for (const c of commentData) {
              countMap[c.article_id] = (countMap[c.article_id] || 0) + 1;
            }
            for (const a of result) {
              a.comment_count = countMap[a.id] || 0;
            }
            result.sort((a, b) => (b.comment_count || 0) - (a.comment_count || 0));
          }
        } else if (sortBy === 'popular') {
          const ids = result.map((a) => a.id);
          const [voteRes, commentRes] = await Promise.all([
            supabase.from('votes').select('target_id, vote_type').in('target_id', ids).eq('target_type', 'article'),
            supabase.from('article_comments').select('article_id').in('article_id', ids),
          ]);

          if (!cancelled) {
            const scoreMap: Record<string, number> = {};
            if (voteRes.data) {
              for (const v of voteRes.data) {
                scoreMap[v.target_id] = (scoreMap[v.target_id] || 0) + (v.vote_type === 'up' ? 1 : -1);
              }
            }
            const commentMap: Record<string, number> = {};
            if (commentRes.data) {
              for (const c of commentRes.data) {
                commentMap[c.article_id] = (commentMap[c.article_id] || 0) + 1;
              }
            }
            for (const a of result) {
              const score = scoreMap[a.id] || 0;
              const comments = commentMap[a.id] || 0;
              a.score = score;
              a.comment_count = comments;
            }
            result.sort((a, b) => ((b.score || 0) * 2 + (b.comment_count || 0)) - ((a.score || 0) * 2 + (a.comment_count || 0)));
          }
        }

        const sliced = result.slice(0, limit);
        cache.current = sliced;
        setArticles(sliced);
      } catch {
        if (!cancelled) setArticles([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [tenantId, tag, sortBy, limit]);

  const cols = Math.max(2, Math.min(5, columns));
  const maxCarouselIndex = Math.max(0, articles.length - cols);
  const goNext = () => setCarouselIndex(prev => Math.min(prev + 1, maxCarouselIndex));
  const goPrev = () => setCarouselIndex(prev => Math.max(prev - 1, 0));
  const visibleArticles = layout === 'carousel'
    ? articles.slice(carouselIndex, carouselIndex + cols)
    : articles;

  const renderArticleCard = (article: ArticleWithStats, index: number) => {
    const href = basePath ? `${basePath}/${article.slug}` : `/w/${article.slug}`;
    return (
      <Link
        key={article.id || index}
        href={href}
        className="rounded-lg border bg-card overflow-hidden hover:border-primary/30 transition-colors group block"
      >
        {showImages && article.image_url && (
          <div className="relative w-full aspect-video overflow-hidden">
            <Image src={article.image_url} alt="" fill className="object-cover group-hover:scale-105 transition-transform" />
          </div>
        )}
        <div className="p-4">
          <div className="flex items-start gap-2">
            {(!showImages || !article.image_url) && (
              <FileText className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            )}
            <div className="min-w-0 flex-1">
              <span className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">{article.title}</span>
              {showSummaries && article.summary && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 [&_*]:inline [&_br]:hidden" dangerouslySetInnerHTML={{ __html: renderMarkdown(article.summary) }} />
              )}
              <div className="flex items-center gap-3 mt-1.5">
                {article.updated_at && (
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(article.updated_at).toLocaleDateString('pt-BR')}
                  </span>
                )}
                {article.score !== undefined && (
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <ArrowUp className="h-3 w-3" />
                    {article.score}
                  </span>
                )}
                {article.comment_count !== undefined && article.comment_count > 0 && (
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <MessageCircle className="h-3 w-3" />
                    {article.comment_count}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  };

  if (loading) {
    return (
      <section className="mb-12">
        {title && <h2 className="text-xl font-semibold mb-5">{title}</h2>}
        <div className={`grid gap-4 ${gridClasses[columns]}`}>
          {Array.from({ length: Math.min(columns, 3) }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card overflow-hidden animate-pulse">
              {showImages && <div className="w-full aspect-video bg-muted" />}
              <div className="p-4 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (articles.length === 0) return null;

  if (layout === 'list') {
    return (
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-5">
          {title && <h2 className="text-xl font-semibold">{title}</h2>}
          <SortIcon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          {articles.map((article, i) => {
            const href = basePath ? `${basePath}/${article.slug}` : `/w/${article.slug}`;
            return (
              <Link
                key={article.id || i}
                href={href}
                className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 hover:border-primary/30 hover:bg-muted/50 transition-all group"
              >
                {showImages && article.image_url ? (
                  <Image src={article.image_url} alt="" width={32} height={32} className="rounded object-cover shrink-0" />
                ) : (
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <span className="flex-1 font-medium text-sm group-hover:text-primary transition-colors truncate">
                  {article.title}
                </span>
                {article.updated_at && (
                  <span className="text-[11px] text-muted-foreground hidden sm:inline">
                    {new Date(article.updated_at).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </section>
    );
  }

  if (layout === 'carousel_infinite') {
    return (
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-5">
          {title && <h2 className="text-xl font-semibold">{title}</h2>}
          <SortIcon className="h-4 w-4 text-muted-foreground" />
        </div>
        <InfiniteCarousel
          items={articles}
          columnsCount={cols}
          gap={12}
          renderItem={(article: ArticleWithStats, index: number) => renderArticleCard(article, index)}
        />
      </section>
    );
  }

  if (layout === 'carousel') {
    return (
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-5">
          {title && <h2 className="text-xl font-semibold">{title}</h2>}
          <SortIcon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <div className={`grid gap-3 ${gridClasses[cols]}`}>
            {visibleArticles.map((article, i) => renderArticleCard(article, i))}
          </div>
          {articles.length > cols && (
            <div className="flex items-center justify-center gap-4 mt-4">
              <button
                onClick={goPrev}
                className="p-2 rounded-full border bg-card hover:bg-accent transition-colors"
                aria-label="Anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs text-muted-foreground">
                {carouselIndex + 1}–{Math.min(carouselIndex + cols, articles.length)} de {articles.length}
              </span>
              <button
                onClick={goNext}
                className="p-2 rounded-full border bg-card hover:bg-accent transition-colors"
                aria-label="Próximo"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="mb-12">
      <div className="flex items-center gap-2 mb-5">
        {title && <h2 className="text-xl font-semibold">{title}</h2>}
        <SortIcon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className={`grid gap-4 ${gridClasses[columns]}`}>
        {articles.map((article, i) => renderArticleCard(article, i))}
      </div>
    </section>
  );
}
