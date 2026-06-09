'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ArrowRight, Loader2, Hash } from 'lucide-react';
import Link from 'next/link';
import { playHoverSound, playClickSound } from '@/lib/feedback-sounds';
import SearchInput from '@/components/ui/search-input';
import type { Tenant } from '@/supabase/client';

interface SearchSectionProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchResults: Tenant[];
  searchLoading: boolean;
  categories: { slug: string; name: string }[];
  activeCategory: string | null;
  onCategoryChange: (slug: string | null) => void;
}

export default function SearchSection({
  searchQuery,
  onSearchChange,
  searchResults,
  searchLoading,
  categories,
  activeCategory,
  onCategoryChange,
}: SearchSectionProps) {
  return (
    <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <div className="max-w-2xl mx-auto text-center relative">
        <div className="absolute -inset-4 rounded-2xl bg-primary/[0.02] border border-primary/5 backdrop-blur-3xl" />
        <div className="relative">
          <h2 className="font-display text-3xl sm:text-4xl mb-3">
            Encontre sua wiki
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            Busque por nome, slug ou descrição
          </p>

          <SearchInput
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Buscar wikis públicas..."
            loading={searchLoading}
            showFilter={false}
            onClear={playClickSound}
          />

          {/* Chips Filters */}
          <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            <button
              onClick={() => { onCategoryChange(null); playClickSound(); }}
              onMouseEnter={playHoverSound}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === null
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-white/5 border border-border hover:border-primary/50'
              }`}
            >
              <Hash className="h-3.5 w-3.5" />
              Todas
            </button>
            {categories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => {
                  onCategoryChange(activeCategory === cat.slug ? null : cat.slug);
                  playClickSound();
                }}
                onMouseEnter={playHoverSound}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat.slug
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-white/5 border border-border hover:border-primary/50'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Search Results */}
          <AnimatePresence mode="wait">
            {searchLoading && (
              <motion.div
                key="loading"
                className="mt-8 flex justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </motion.div>
            )}

            {!searchLoading && searchResults.length > 0 && (
              <motion.div
                key="results"
                className="mt-8 grid gap-3 text-left"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {searchResults.map((wiki, i) => (
                  <motion.div
                    key={wiki.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      href={`/w/${wiki.slug}`}
                      onClick={playClickSound}
                      onMouseEnter={playHoverSound}
                      className="flex items-center gap-4 rounded-lg border border-border/40 p-4 hover:border-primary/30 hover:bg-primary/[0.03] hover:scale-[1.01] transition-all group"
                    >
                      {wiki.logo_url ? (
                        <img src={wiki.logo_url} alt="" className="h-10 w-10 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <BookOpen className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{wiki.name}</p>
                        {wiki.description && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{wiki.description}</p>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {!searchLoading && searchQuery && searchResults.length === 0 && (
              <motion.p
                key="empty"
                className="text-sm text-muted-foreground mt-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Nenhuma wiki encontrada para &ldquo;{searchQuery}&rdquo;
              </motion.p>
            )}

            {!searchLoading && !searchQuery && searchResults.length === 0 && (
              <motion.p
                key="initial"
                className="text-sm text-muted-foreground mt-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Digite algo acima para começar a buscar
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
