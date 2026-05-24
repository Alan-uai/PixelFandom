'use client';

import { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { Loader2, Search, X, House, MessageCircle, PanelLeft, PanelLeftClose } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import WikiSidebar from '@/components/wiki/wiki-sidebar';
import ChatWidget from '@/components/wiki/chat-widget';
import VoiceChat from '@/components/voice/voice-chat';
import FloatingVoiceOrb from '@/components/voice/floating-voice-orb';
import { WikiDataProvider, useWikiData } from '@/context/wiki-provider';

export default function WikiLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const params = useParams();
  const slug = params?.slug as string;

  if (!slug) return <>{children}</>;

  return (
    <WikiDataProvider slug={slug}>
      <WikiLayoutContent slug={slug}>{children}</WikiLayoutContent>
    </WikiDataProvider>
  );
}

function WikiLayoutContent({
  slug,
  children,
}: {
  slug: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data, loading } = useWikiData();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const tenant = data?.tenant || null;
  const isChatPage = pathname === `/w/${slug}/chat`;

  useEffect(() => {
    if (isChatPage) {
      setSidebarCollapsed(true);
    }
  }, [isChatPage]);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/w/${slug}?search=${encodeURIComponent(searchQuery.trim())}`);
    setSearchOpen(false);
    setSearchQuery('');
  }, [searchQuery, slug, router]);

  useEffect(() => {
    if (searchOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    if (searchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchExpanded]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <h1 className="text-2xl font-bold">Wiki não encontrada</h1>
        <p className="text-muted-foreground mt-2">A wiki que você procura não existe.</p>
        <Link href="/" className="mt-4 text-primary hover:underline">
          Voltar para o hub
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 flex h-14 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-sm">
        {/* Sidebar toggle */}
        <button
          className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors hidden md:flex"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          title={sidebarCollapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
        >
          {sidebarCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden rounded-md p-1.5 text-muted-foreground hover:text-foreground"
          onClick={() => setSearchOpen(!searchOpen)}
        >
          <PanelLeft className="h-5 w-5" />
        </button>

        {/* Wiki name → hub */}
        <Link href="/" className="flex items-center gap-2 font-semibold shrink-0">
          {tenant.logo_url && (
            <img src={tenant.logo_url} alt="" className="h-6 w-6 rounded" />
          )}
          <span className="text-sm">{tenant.name}</span>
        </Link>

        <div className="mx-2 h-5 w-px bg-border" />

        {/* Hero nav */}
        <nav className="flex items-center gap-1">
          <Link
            href={`/w/${slug}`}
            className={`rounded-md p-2 transition-colors ${
              pathname === `/w/${slug}`
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
            title="Home"
          >
            <House className="h-4 w-4" />
          </Link>
          <Link
            href={`/w/${slug}/chat`}
            className={`rounded-md p-2 transition-colors ${
              isChatPage
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
            title="Assistente IA"
          >
            <MessageCircle className="h-4 w-4" />
          </Link>
          <VoiceChat tenantSlug={slug} mode="header" />
        </nav>

        {searchExpanded ? (
          <form onSubmit={handleSearch} className="relative max-w-sm flex-1 hidden md:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Buscar... (Cmd+K)"
              className="pl-8 h-9 bg-muted"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onBlur={() => { if (!searchQuery) setSearchExpanded(false); }}
            />
          </form>
        ) : (
          <div className="flex-1" />
        )}

        {/* Search toggle */}
        <button
          onClick={() => setSearchExpanded(!searchExpanded)}
          className={`rounded-md p-2 transition-colors hidden md:flex ${
            searchExpanded
              ? 'text-primary bg-primary/10'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
          title="Buscar"
        >
          <Search className="h-4 w-4" />
        </button>
      </header>

      {/* Mobile search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm md:hidden">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <form onSubmit={handleSearch} className="flex-1 relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchRef}
                  placeholder="Buscar na wiki..."
                  className="pl-10 h-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>
              <Button variant="ghost" size="icon" onClick={() => setSearchOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1">
        <Suspense fallback={<div className={`shrink-0 border-r bg-muted/30 ${sidebarCollapsed ? 'w-12' : 'w-64'}`} />}>
          <WikiSidebar
            tenantSlug={slug}
            collapsed={sidebarCollapsed}
          />
        </Suspense>
        <main className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full">
          {children}
        </main>
      </div>
      {tenant?.ai_enabled && <ChatWidget tenantSlug={slug} isChatPage={isChatPage} />}
      <FloatingVoiceOrb tenantSlug={slug} />
    </div>
  );
}
