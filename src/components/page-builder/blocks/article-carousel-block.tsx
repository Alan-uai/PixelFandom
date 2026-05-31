'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react';

export function ArticleCarouselBlock({ config, tenantId }: { config: Record<string, any>; tenantId?: string }) {
  const title = config.title || 'Artigos';
  const articles = config.articles || [];
  const autoplay = config.autoplay ?? false;
  const interval = config.interval || 5000;
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
    if (!autoplay || articles.length === 0) return;
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
  }, [autoplay, interval, articles.length]);

  return (
    <div className="space-y-4">
      {title && <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--heading-font)' }}>{title}</h2>}
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
          {articles.length > 0 ? (
            articles.map((article: any, i: number) => (
              <div
                key={i}
                className="min-w-[280px] max-w-[320px] snap-start rounded-lg border bg-card overflow-hidden shrink-0 hover:border-primary/30 transition-colors"
              >
                {article.imageUrl && (
                  <img src={article.imageUrl} alt="" className="w-full aspect-video object-cover" />
                )}
                <div className="p-4">
                  <div className="flex items-start gap-2">
                    {!article.imageUrl && (
                      <FileText className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <span className="font-medium text-sm line-clamp-2">{article.title}</span>
                      {article.summary && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{article.summary}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground py-12 w-full text-center">Nenhum artigo no carrossel</p>
          )}
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
    </div>
  );
}
