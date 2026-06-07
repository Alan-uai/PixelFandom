'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ArrowRight,
  BookOpen,
  Cpu,
  Globe,
  Users,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Search,
  X,
} from 'lucide-react';
import type { Tenant } from '@/supabase/client';
import { WikiCard } from '@/components/wiki/wiki-card';

export default function Home() {
  const [wikis, setWikis] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Tenant[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [voteData, setVoteData] = useState<Record<string, { upvotes: number; downvotes: number; score: number; user_vote: string | null }>>({});
  const cache = useRef<{ wikis?: Tenant[]; voteData?: any }>({});

  useEffect(() => {
    if (cache.current.wikis) {
      setWikis(cache.current.wikis);
      setLoading(false);
      return;
    }
    supabase
      .from('tenants')
      .select('*')
      .eq('is_public', true)
      .order('name')
      .then(({ data, error: err }) => {
        if (err) {
          setError(err.message);
        } else if (data) {
          setWikis(data);
          cache.current.wikis = data;
          fetchVoteData(data.map((w) => w.id));
        }
        setLoading(false);
      });
  }, []);

  const fetchVoteData = async (ids: string[]) => {
    if (ids.length === 0) return;
    const res = await fetch(`/api/tenants/vote/batch?ids=${ids.join(',')}`);
    if (res.ok) {
      const data = await res.json();
      cache.current.voteData = data;
      setVoteData(data);
    }
  };

  // Debounced wiki search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/wikis/search?q=${encodeURIComponent(searchQuery)}&limit=10`);
        if (res.ok) setSearchResults(await res.json());
      } catch {} finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center py-20 md:py-28 text-center px-4">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
          Sua wiki,{' '}
          <span className="text-primary">do seu jeito</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mb-8">
          Crie wikis para seus jogos, comunidades, projetos ou qualquer assunto.
          Com assistente IA, domínio personalizado e integração com Discord.
        </p>
        <div className="flex gap-4">
          <Button size="lg" asChild>
            <Link href="/dashboard/new">
              Criar Wiki Grátis
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/about">
              Saiba Mais
            </Link>
          </Button>
        </div>
      </section>

      {/* Search Public Wikis */}
      <section className="py-10 px-4 border-t">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-xl font-semibold mb-2">Encontre uma wiki</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar wikis públicas por nome ou descrição..."
              className="w-full h-12 rounded-xl border bg-background pl-10 pr-4 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {searchResults.length > 0 && (
            <div className="mt-4 grid gap-2 text-left">
              {searchResults.map((wiki) => (
                <Link
                  key={wiki.id}
                  href={`/w/${wiki.slug}`}
                  className="flex items-center gap-3 rounded-lg border p-3 hover:border-primary/30 hover:bg-muted/50 transition-all"
                >
                  {wiki.logo_url ? (
                    <img src={wiki.logo_url} alt="" className="h-8 w-8 rounded" />
                  ) : (
                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{wiki.name}</p>
                    {wiki.description && (
                      <p className="text-xs text-muted-foreground truncate">{wiki.description}</p>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </Link>
              ))}
            </div>
          )}
          {searchQuery && searchResults.length === 0 && !searchLoading && (
            <p className="text-sm text-muted-foreground mt-4">Nenhuma wiki encontrada para &ldquo;{searchQuery}&rdquo;</p>
          )}
        </div>
      </section>

      {/* Public Wikis — Carrossel Horizontal */}
      <section className="py-16 px-4 border-t">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold">Wikis Públicas</h2>
              <p className="text-muted-foreground mt-1">
                Explore wikis criadas pela comunidade.
              </p>
            </div>
            {wikis.length > 3 && (
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    document
                      .getElementById('wiki-carousel')
                      ?.scrollBy({ left: -320, behavior: 'smooth' })
                  }
                  className="h-10 w-10 rounded-full border flex items-center justify-center hover:bg-muted transition-colors"
                  aria-label="Anterior"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() =>
                    document
                      .getElementById('wiki-carousel')
                      ?.scrollBy({ left: 320, behavior: 'smooth' })
                  }
                  className="h-10 w-10 rounded-full border flex items-center justify-center hover:bg-muted transition-colors"
                  aria-label="Próximo"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : error ? (
            <Card className="text-center py-8">
              <CardContent className="flex items-center justify-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <p>Erro ao carregar wikis: {error}</p>
              </CardContent>
            </Card>
          ) : wikis.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <p className="text-muted-foreground">
                  Nenhuma wiki pública ainda. Seja o primeiro a criar!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div
              id="wiki-carousel"
              className="flex gap-4 overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {wikis.map((wiki) => (
                <WikiCard
                  key={wiki.id}
                  wiki={wiki}
                  voteData={voteData[wiki.id]}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 border-t">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">
            Tudo que você precisa
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f) => {
              const card = (
                <Card key={f.title} className={f.href ? 'cursor-pointer hover:bg-muted/50 transition-colors' : ''}>
                  <CardHeader>
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                      <f.icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">{f.title}</CardTitle>
                    <CardDescription>{f.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
              return f.href ? <Link key={f.title} href={f.href}>{card}</Link> : card;
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 border-t text-center">
        <h2 className="text-3xl font-bold mb-4">
          Pronto para criar sua wiki?
        </h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Leva menos de um minuto. Sem cartão de crédito.
        </p>
        <Button size="lg" asChild>
          <Link href="/dashboard/new">
            Criar Wiki Grátis
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} PixelFandom</p>
          <div className="flex gap-6">
            <Link href="/about" className="hover:text-foreground">Sobre</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

type FeatureItem = {
  icon: typeof BookOpen;
  title: string;
  description: string;
  href?: string;
};

const features: FeatureItem[] = [
  {
    icon: BookOpen,
    title: 'Editor Poderoso',
    description: 'Editor rich text com TipTap, markdown e upload de imagens.',
  },
  {
    icon: Cpu,
    title: 'Assistente IA',
    description: 'IA configurável por wiki que responde sobre seu conteúdo.',
  },
  {
    icon: Users,
    title: 'Equipe e Permissões',
    description: 'Controle de acesso por roles: owner, admin, editor, viewer.',
  },
  {
    icon: Globe,
    title: 'Domínio Próprio',
    description: 'Use seu próprio domínio ou um subdomínio personalizado.',
  },
  {
    icon: BookOpen,
    title: 'Coleções Customizadas',
    description: 'Dados estruturados com schemas flexíveis por coleção.',
  },
  {
    icon: BookOpen,
    title: 'Integração Discord',
    description: 'Bot do Discord para buscar e criar páginas da wiki.',
  },
];
