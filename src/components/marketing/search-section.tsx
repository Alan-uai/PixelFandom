'use client';

import { motion } from 'framer-motion';
import { useScrollReveal } from '@/components/marketing/use-scroll-reveal';
import { Search, X, BookOpen, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import type { Tenant } from '@/supabase/client';
import { playClickSound } from '@/lib/feedback-sounds';

interface SearchSectionProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchResults: Tenant[];
  searchLoading: boolean;
}

export default function SearchSection({
  searchQuery,
  onSearchChange,
  searchResults,
  searchLoading,
}: SearchSectionProps) {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.1 });

  return (
    <motion.section
      ref={ref}
      className="py-16 px-4 relative"
      initial={{ opacity: 0 }}
      animate={isVisible ? { opacity: 1 } : {}}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-2xl mx-auto text-center relative">
        <motion.div
          className="absolute -inset-4 rounded-2xl bg-primary/[0.02] border border-primary/5 backdrop-blur-3xl"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isVisible ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
        />
        <div className="relative">
          <motion.h2
            className="text-xl font-semibold mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            Encontre uma wiki
          </motion.h2>
          <motion.div
            className="relative"
            initial={{ opacity: 0, y: 10 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            <div className="relative group">
              <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-primary/20 via-primary/10 to-purple-500/20 opacity-0 group-focus-within:opacity-100 blur transition-opacity duration-500" />
              <div className="relative flex items-center">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Buscar wikis públicas por nome ou descrição..."
                  className="w-full h-14 rounded-xl border border-border/50 bg-background/60 backdrop-blur-xl pl-12 pr-12 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => { onSearchChange(''); playClickSound(); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {searchLoading && (
            <motion.div
              className="mt-4 flex justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </motion.div>
          )}

          {searchResults.length > 0 && (
            <motion.div
              className="mt-4 grid gap-2 text-left"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {searchResults.map((wiki, i) => (
                <motion.div
                  key={wiki.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    href={`/w/${wiki.slug}`}
                    onClick={playClickSound}
                    className="flex items-center gap-3 rounded-lg border border-border/40 p-3 hover:border-primary/30 hover:bg-primary/[0.02] transition-all group"
                  >
                    {wiki.logo_url ? (
                      <img src={wiki.logo_url} alt="" className="h-8 w-8 rounded object-cover" />
                    ) : (
                      <BookOpen className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{wiki.name}</p>
                      {wiki.description && (
                        <p className="text-xs text-muted-foreground truncate">{wiki.description}</p>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}

          {searchQuery && searchResults.length === 0 && !searchLoading && (
            <motion.p
              className="text-sm text-muted-foreground mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              Nenhuma wiki encontrada para &ldquo;{searchQuery}&rdquo;
            </motion.p>
          )}
        </div>
      </div>
    </motion.section>
  );
}
