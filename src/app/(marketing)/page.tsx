'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
} from 'lucide-react';
import type { Tenant } from '@/supabase/client';

export default function Home() {
  const [wikis, setWikis] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
        }
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center py-20 md:py-28 text-center px-4">
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

      {/* Features */}
      <section className="py-16 px-4 border-t">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">
            Tudo que você precisa
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f) => (
              <Card key={f.title}>
                <CardHeader>
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">{f.title}</CardTitle>
                  <CardDescription>{f.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
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
                <Link
                  key={wiki.id}
                  href={`/w/${wiki.slug}`}
                  className="snap-start shrink-0 w-[280px]"
                >
                  <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        {wiki.logo_url && (
                          <img src={wiki.logo_url} alt="" className="h-5 w-5 rounded" />
                        )}
                        {wiki.name}
                      </CardTitle>
                      {wiki.description && (
                        <CardDescription className="line-clamp-2">
                          {wiki.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Globe className="h-3 w-3 mr-1" />
                        /w/{wiki.slug}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
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

const features = [
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
