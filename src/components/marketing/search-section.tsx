'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, BookOpen, ArrowRight, Loader2, Hash } from 'lucide-react';
import Link from 'next/link';
import { useScrollReveal } from '@/components/marketing/use-scroll-reveal';
import { playHoverSound, playClickSound, playRevealSound } from '@/lib/feedback-sounds';
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

function SearchShape({ focused }: { focused: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;

    const draw = () => {
      time += 0.02;
      const w = canvas!.width;
      const h = canvas!.height;
      ctx!.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const R = focused ? 50 : 30;
      const r = focused ? 18 : 12;
      const alpha = focused ? 0.12 : 0.05;

      const segments = 20;
      const tubeSegments = 8;

      for (let i = 0; i < segments; i++) {
        const theta1 = (i / segments) * Math.PI * 2 + time;
        const theta2 = ((i + 1) / segments) * Math.PI * 2 + time;
        for (let j = 0; j < tubeSegments; j++) {
          const phi1 = (j / tubeSegments) * Math.PI * 2;
          const phi2 = ((j + 1) / tubeSegments) * Math.PI * 2;

          const pts = [
            {
              x: (R + r * Math.cos(phi1)) * Math.cos(theta1),
              y: (R + r * Math.cos(phi1)) * Math.sin(theta1),
              z: r * Math.sin(phi1),
            },
            {
              x: (R + r * Math.cos(phi2)) * Math.cos(theta1),
              y: (R + r * Math.cos(phi2)) * Math.sin(theta1),
              z: r * Math.sin(phi2),
            },
            {
              x: (R + r * Math.cos(phi2)) * Math.cos(theta2),
              y: (R + r * Math.cos(phi2)) * Math.sin(theta2),
              z: r * Math.sin(phi2),
            },
            {
              x: (R + r * Math.cos(phi1)) * Math.cos(theta2),
              y: (R + r * Math.cos(phi1)) * Math.sin(theta2),
              z: r * Math.sin(phi1),
            },
          ];

          const zAvg = (pts[0].z + pts[1].z + pts[2].z + pts[3].z) / 4;
          const a = alpha * (0.3 + ((zAvg + R) / (R * 2)) * 0.7);

          ctx!.beginPath();
          ctx!.moveTo(cx + pts[0].x, cy + pts[0].y * 0.5);
          ctx!.lineTo(cx + pts[1].x, cy + pts[1].y * 0.5);
          ctx!.lineTo(cx + pts[2].x, cy + pts[2].y * 0.5);
          ctx!.lineTo(cx + pts[3].x, cy + pts[3].y * 0.5);
          ctx!.closePath();
          ctx!.strokeStyle = `rgba(75, 197, 255, ${a})`;
          ctx!.lineWidth = 1;
          ctx!.stroke();
        }
      }

      animId = requestAnimationFrame(draw);
    };

    canvas.width = 200;
    canvas.height = 120;
    draw();

    return () => cancelAnimationFrame(animId);
  }, [focused]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      style={{ width: 200, height: 120 }}
    />
  );
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
  const { ref, isVisible } = useScrollReveal({ threshold: 0.1 });
  const [focused, setFocused] = useState(false);

  return (
    <motion.section
      ref={ref}
      className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24"
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
          onAnimationComplete={() => playRevealSound()}
        />
        <div className="relative">
          <motion.h2
            className="font-display text-3xl sm:text-4xl mb-3"
            initial={{ opacity: 0, y: 10 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            Encontre sua wiki
          </motion.h2>
          <motion.p
            className="text-sm text-muted-foreground mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            Busque por nome, slug ou descrição
          </motion.p>

          {/* Search Input */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            <div className="relative group" onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}>
              {/* 3D reactive shape */}
              <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
                <SearchShape focused={focused} />
              </div>

              <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-primary/20 via-primary/10 to-purple-500/20 opacity-0 group-focus-within:opacity-100 blur transition-opacity duration-500" />
              <div className="relative flex items-center bg-white/[0.02] border border-primary/20 backdrop-blur-3xl rounded-xl focus-within:animate-border-glow-rotate">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Buscar wikis públicas..."
                  className="w-full h-14 rounded-xl bg-transparent pl-12 pr-14 text-sm outline-none transition-all"
                />
                {searchLoading ? (
                  <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-primary" />
                ) : searchQuery ? (
                  <button
                    onClick={() => { onSearchChange(''); playClickSound(); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                ) : null}
              </div>
            </div>
          </motion.div>

          {/* Chips Filters */}
          <motion.div
            className="mt-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin"
            initial={{ opacity: 0, y: 8 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
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
          </motion.div>

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
    </motion.section>
  );
}
