'use client';

import { motion } from 'framer-motion';
import { useScrollReveal } from '@/components/marketing/use-scroll-reveal';
import { ChevronLeft, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { WikiCard } from '@/components/wiki/wiki-card';
import type { Tenant } from '@/supabase/client';

interface WikisCarouselProps {
  wikis: Tenant[];
  loading: boolean;
  error: string | null;
  voteData: Record<string, { upvotes: number; downvotes: number; score: number; user_vote: string | null }>;
}

export default function WikisCarousel({ wikis, loading, error, voteData }: WikisCarouselProps) {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.05 });

  const scroll = (dir: 'left' | 'right') => {
    const el = document.getElementById('wiki-carousel');
    if (el) el.scrollBy({ left: dir === 'left' ? -340 : 340, behavior: 'smooth' });
  };

  return (
    <motion.section
      ref={ref}
      className="py-20 px-4 relative"
      initial={{ opacity: 0 }}
      animate={isVisible ? { opacity: 1 } : {}}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="flex items-center justify-between mb-10"
          initial={{ opacity: 0, y: 15 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div>
            <h2 className="text-2xl font-bold">Wikis Públicas</h2>
            <p className="text-muted-foreground mt-1">
              Explore wikis criadas pela comunidade.
            </p>
          </div>
          {wikis.length > 3 && (
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => scroll('left')}
                className="h-10 w-10 rounded-full border border-border/50 flex items-center justify-center hover:bg-muted/50 hover:border-primary/30 transition-colors"
                aria-label="Anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => scroll('right')}
                className="h-10 w-10 rounded-full border border-border/50 flex items-center justify-center hover:bg-muted/50 hover:border-primary/30 transition-colors"
                aria-label="Próximo"
              >
                <ChevronRight className="h-5 w-5" />
              </motion.button>
            </div>
          )}
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-16">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 className="h-6 w-6 text-primary" />
            </motion.div>
          </div>
        ) : error ? (
          <Card className="text-center py-8 bg-destructive/5 border-destructive/20">
            <CardContent className="flex items-center justify-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p>Erro ao carregar wikis: {error}</p>
            </CardContent>
          </Card>
        ) : wikis.length === 0 ? (
          <Card className="text-center py-12 border-dashed border-border/40">
            <CardContent>
              <p className="text-muted-foreground">Nenhuma wiki pública ainda. Seja o primeiro a criar!</p>
            </CardContent>
          </Card>
        ) : (
          <motion.div
            className="relative"
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
            <div
              id="wiki-carousel"
              className="flex gap-5 overflow-x-auto py-2 px-1 scroll-smooth snap-x snap-mandatory scrollbar-none"
            >
              {wikis.map((wiki, i) => (
                <motion.div
                  key={wiki.id}
                  className="snap-start shrink-0"
                  initial={{ opacity: 0, y: 20 }}
                  animate={isVisible ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.15 + i * 0.04 }}
                >
                  <motion.div
                    whileHover={{ y: -4 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <WikiCard wiki={wiki} voteData={voteData[wiki.id]} />
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}
