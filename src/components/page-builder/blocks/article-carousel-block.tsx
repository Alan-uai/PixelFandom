'use client';

import Image from 'next/image';
import { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, FileText, Calendar } from 'lucide-react';
import InfiniteCarousel from '@/components/ui/infinite-carousel';
import type { ArticleCarouselConfig } from '../types';
import { renderMarkdown } from '@/lib/content-utils';

const gridClasses: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
  6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
};

type ArticleItem = { title: string; slug: string; summary?: string; imageUrl?: string; date?: string };

function ArticleCard({ article }: { article: ArticleItem }) {
  return (
    <div className="rounded-lg border bg-card overflow-hidden hover:border-primary/30 transition-colors group">
      {article.imageUrl && (
        <div className="relative w-full aspect-video">
          <Image src={article.imageUrl} alt="" fill className="object-cover group-hover:scale-105 transition-transform" />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start gap-2">
          {!article.imageUrl && (
            <FileText className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          )}
          <div className="min-w-0">
            <span className="font-medium text-sm line-clamp-2">{article.title}</span>
            {article.summary && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 [&_*]:inline [&_br]:hidden" dangerouslySetInnerHTML={{ __html: renderMarkdown(article.summary) }} />
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
  );
}

export function ArticleCarouselBlock({ config }: { config: ArticleCarouselConfig; tenantId?: string }) {
  const title = config.title || 'Artigos';
  const articles = config.articles || [];
  const autoplay = config.autoplay ?? false;
  const interval = config.interval || 5000;
  const displayFormat = config.displayFormat || 'carousel';
  const columns = Math.min(Math.max(config.columns || 3, 1), 6);
  const tabsEnabled = config.tabsEnabled ?? false;
  const tabsSubFormat = config.tabsSubFormat || 'list';

  const fmt = tabsEnabled ? tabsSubFormat : displayFormat;
  const cols = Math.max(2, Math.min(5, columns));

  const [activeTag, setActiveTag] = useState<string | null>(null);

  const tags = [...new Set(articles.filter(a => a.summary).map(a => a.summary as string))];
  const filteredArticles = activeTag
    ? articles.filter(a => a.summary === activeTag)
    : articles;

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateButtons();
    el.addEventListener('scroll', updateButtons);
    return () => el.removeEventListener('scroll', updateButtons);
  }, [updateButtons]);

  useEffect(() => {
    if (!autoplay || filteredArticles.length === 0 || fmt !== 'carousel') return;
    const id = setInterval(() => {
      const el = scrollRef.current;
      if (!el) return;
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 8) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: el.clientWidth * 0.75, behavior: 'smooth' });
      }
    }, interval);
    return () => clearInterval(id);
  }, [autoplay, interval, filteredArticles.length, fmt]);

  if (articles.length === 0 && filteredArticles.length === 0) return null;

  const gridColsClass = (gridClasses[cols] || gridClasses[3]) + ' gap-3';

  return (
    <div className="space-y-4">
      {title && <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--heading-font)' }}>{title}</h2>}

      {tags.length > 1 && tabsEnabled ? (
        <div className="flex gap-1 mb-2 border-b border-border overflow-x-auto">
          <button
            onClick={() => setActiveTag(null)}
            className={`shrink-0 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
              !activeTag
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Todas
          </button>
          {tags.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`shrink-0 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                activeTag === tag
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      ) : tags.length > 1 && !tabsEnabled ? (
        <div className="flex flex-wrap gap-1.5 mb-2">
          <button
            onClick={() => setActiveTag(null)}
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs border transition-colors ${
              !activeTag
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'bg-card border-border/50 text-muted-foreground hover:border-muted-foreground/30'
            }`}
          >
            Todas
          </button>
          {tags.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs border transition-colors ${
                activeTag === tag
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'bg-card border-border/50 text-muted-foreground hover:border-muted-foreground/30'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      ) : null}

      {filteredArticles.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhum artigo encontrado.</p>
      ) : fmt === 'list' ? (
        <div className="space-y-2">
          {filteredArticles.map((article, i) => (
            <ArticleCard key={i} article={article} />
          ))}
        </div>
      ) : fmt === 'carousel_infinite' ? (
        <InfiniteCarousel
          items={filteredArticles}
          columnsCount={cols}
          gap={12}
          renderItem={(article: ArticleItem) => (
            <ArticleCard article={article} />
          )}
        />
      ) : fmt === 'carousel' ? (
        <div className="relative group">
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 rounded-full bg-background border shadow-md p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent"
              aria-label="Anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2 -mx-1 px-1"
          >
            {filteredArticles.map((article, i) => (
              <div
                key={i}
                className="min-w-[280px] max-w-[320px] snap-start shrink-0"
              >
                <ArticleCard article={article} />
              </div>
            ))}
          </div>
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 rounded-full bg-background border shadow-md p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent"
              aria-label="Próximo"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : (
        <div className={gridColsClass}>
          {filteredArticles.map((article: ArticleItem, i: number) => (
            <ArticleCard key={i} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
