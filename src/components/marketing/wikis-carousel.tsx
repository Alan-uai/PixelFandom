'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, BookOpen } from 'lucide-react';
import { playHoverSound } from '@/lib/feedback-sounds';
import { WikiCard } from '@/components/wiki/wiki-card';
import type { Tenant } from '@/supabase/client';

interface WikisCarouselProps {
  wikis: Tenant[];
  loading: boolean;
  error: string | null;
  voteData: Record<string, { upvotes: number; downvotes: number; score: number; user_vote: string | null }>;
  activeCategory: string | null;
}

const CARD_W = 300;

export default function WikisCarousel({ wikis, loading, error, voteData, activeCategory }: WikisCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);


  const filtered = activeCategory
    ? wikis.filter((w) => w.slug === activeCategory || w.name.toLowerCase().includes(activeCategory.toLowerCase()))
    : wikis;

  const categoryLabel = activeCategory
    ? activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1).replace(/-/g, ' ')
    : null;

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const sl = el.scrollLeft;
    const cw = el.clientWidth;
    setScrollLeft(sl);
    setContainerWidth(cw);
    setAtEnd(sl + cw >= el.scrollWidth - 2);
  }, []);

  const handleScroll = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(updateScrollState);
  }, [updateScrollState]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateScrollState);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [handleScroll, updateScrollState]);

  const getCardStyle = (index: number) => {
    if (!containerWidth) return { opacity: 1, scale: 1, zIndex: 1 };
    const cardCenter = index * CARD_W + CARD_W / 2;
    const containerCenter = containerWidth / 2 + scrollLeft;
    const dist = cardCenter - containerCenter;
    const norm = dist / (containerWidth * 0.6);
    const clamped = Math.max(-1, Math.min(1, norm));
    const absClamped = Math.abs(clamped);
    return {
      opacity: 1 - absClamped * 0.35,
      scale: 1 - absClamped * 0.1,
      zIndex: Math.round((1 - absClamped) * 100),
    };
  };

  return (
    <section id="wikis-carousel" className="relative w-full pt-0 pb-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold">
                Wikis em Destaque
              </h2>
              {categoryLabel && (
                <p className="text-sm text-muted-foreground mt-1">
                  Filtrando: <span className="text-primary font-medium">{categoryLabel}</span>
                </p>
              )}
            </div>

          </div>
        {loading ? (
          <div className="flex justify-center py-24">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 className="h-8 w-8 text-primary" />
            </motion.div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-6 py-8 text-destructive">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm">Erro ao carregar wikis: {error}</p>
          </div>
        ) : wikis.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border/40 px-6 py-16 text-muted-foreground">
            <BookOpen className="h-10 w-10" />
            <p className="text-sm">Nenhuma wiki encontrada</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border/40 px-6 py-16 text-muted-foreground">
            <BookOpen className="h-10 w-10" />
            <p className="text-sm">Nenhuma wiki nesta categoria</p>
          </div>
        ) : (
          <div className="relative">
            {/* Gradient fade edges */}
            <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-black/70 via-black/30 to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-black/70 via-black/30 to-transparent z-10 pointer-events-none" />

            {/* Scrollable track */}
            <div
              ref={scrollRef}
              className="flex gap-5 overflow-x-auto py-4 scroll-smooth snap-x snap-mandatory scrollbar-none"
              style={{ overscrollBehaviorX: 'contain' }}
            >
              {filtered.map((wiki, i) => {
                const s = getCardStyle(i);
                return (
                  <div
                    key={wiki.id}
                    className="snap-center shrink-0"
                  >
                    <motion.div
                      style={{
                        opacity: s.opacity,
                        scale: s.scale,
                        zIndex: s.zIndex,
                      }}
                      whileHover={{
                        scale: 1.05,
                        y: -8,
                        transition: { type: 'spring', stiffness: 300, damping: 18 },
                      }}
                      onMouseEnter={playHoverSound}
                      className="relative rounded-xl transition-shadow duration-300 hover:shadow-[0_0_24px_rgba(75,197,255,0.12)]"
                    >
                      <WikiCard wiki={wiki} voteData={voteData[wiki.id]} />
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
