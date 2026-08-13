'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, BookOpen } from 'lucide-react';
import InfiniteMenu, { type MenuItem } from './InfiniteMenu';
import { WikiCard } from '@/components/wiki/wiki-card';
import type { Tenant } from '@/supabase/client';

interface WikisSphereProps {
  wikis: Tenant[];
  loading: boolean;
  error: string | null;
  activeCategory?: string | null;
  voteData?: Record<string, { upvotes: number; downvotes: number; score: number; user_vote: string | null }>;
}

function webgl2Supported(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!canvas.getContext('webgl2');
  } catch {
    return false;
  }
}

export default function WikisSphere({ wikis, loading, error, activeCategory, voteData }: WikisSphereProps) {
  const router = useRouter();
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    setHasWebGL(webgl2Supported());
  }, []);

  const filtered = useMemo(() => {
    if (!activeCategory) return wikis;
    return wikis.filter(
      w => w.slug === activeCategory || w.name.toLowerCase().includes(activeCategory.toLowerCase())
    );
  }, [wikis, activeCategory]);

  const categoryLabel = activeCategory
    ? activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1).replace(/-/g, ' ')
    : null;

  const items: MenuItem[] = useMemo(
    () =>
      filtered.map(wiki => ({
        id: wiki.id,
        image: wiki.logo_url || wiki.cover_image || '',
        link: `/w/${wiki.slug}`,
        title: wiki.name,
        description: wiki.description || '',
        banner: wiki.cover_image || undefined,
        gameUrl: wiki.game_url || undefined,
        discordUrl: wiki.discord_url || undefined,
        vote: voteData?.[wiki.id] ?? null
      })),
    [filtered, voteData]
  );

  const navigate = (link: string) => {
    if (link.startsWith('http')) {
      window.open(link, '_blank');
    } else {
      router.push(link);
    }
  };

  return (
    <section id="wikis-carousel" className="relative w-full pt-0 pb-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold">Wikis em Destaque</h2>
            {categoryLabel && (
              <p className="text-sm text-muted-foreground mt-1">
                Filtrando: <span className="text-primary font-medium">{categoryLabel}</span>
              </p>
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 py-4" role="status" aria-label="Carregando wikis">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl border border-border/40 bg-card/60 p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-muted" />
                    <div className="h-3 w-1/2 rounded bg-muted/70" />
                  </div>
                </div>
                <div className="h-3 w-full rounded bg-muted/60" />
                <div className="h-3 w-5/6 rounded bg-muted/60" />
              </div>
            ))}
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
        ) : hasWebGL ? (
          <div className="relative w-full" style={{ height: 'min(70vh, 640px)', minHeight: 480 }}>
            <p className="sr-only">Arraste para girar a esfera e clique para abrir uma wiki</p>
            <InfiniteMenu items={items} scale={1.0} onNavigate={navigate} />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 py-4">
            {filtered.map(wiki => (
              <WikiCard key={wiki.id} wiki={wiki} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
