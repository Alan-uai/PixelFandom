'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { Loader2, Search, X, House, MessageCircle, PanelLeft, PanelLeftClose, Gamepad2 } from 'lucide-react';
import WikiSidebar from '@/components/wiki/wiki-sidebar';
import ChatWidget from '@/components/wiki/chat-widget';
import VoiceChat from '@/components/voice/voice-chat';
import FloatingVoiceOrb from '@/components/voice/floating-voice-orb';
import { WikiDataProvider, useWikiData } from '@/context/wiki-provider';
import { WikiSearchProvider, useWikiSearch } from '@/context/wiki-search-context';
import HubLink from '@/components/hub-link';
import { MAIN_DOMAIN } from '@/lib/constants';

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
      <WikiSearchProvider>
        <WikiLayoutContent slug={slug}>{children}</WikiLayoutContent>
      </WikiSearchProvider>
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
  const pathname = usePathname();
  const { data, loading } = useWikiData();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const tenant = data?.tenant || null;
  const isHome = pathname === `/w/${slug}`;
  const isChatPage = pathname === `/w/${slug}/chat`;
  const isVoicePage = pathname === `/w/${slug}/voice`;
  const isArticle = !isHome && !isChatPage && !isVoicePage;
  const hasSidebar = isChatPage || isArticle;
  const showTitleStrip = !isVoicePage;

  const [redirecting, setRedirecting] = useState(false);
  const [errorIsExternal, setErrorIsExternal] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      if (host !== MAIN_DOMAIN && host !== 'localhost' && host !== '127.0.0.1') {
        setErrorIsExternal(true);
      }
    }
  }, []);

  useEffect(() => {
    if (!tenant?.custom_domain || typeof window === 'undefined') return;
    const currentHost = window.location.hostname;
    if (currentHost === tenant.custom_domain || currentHost === 'localhost' || currentHost === '127.0.0.1') return;
    setRedirecting(true);
    const subPath = pathname.replace(`/w/${slug}`, '') || '/';
    window.location.href = `https://${tenant.custom_domain}${subPath}${window.location.search}`;
  }, [tenant?.custom_domain, slug, pathname]);

  const toggleSidebar = () => setSidebarCollapsed((v) => !v);

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
        <HubLink className="mt-4 text-primary hover:underline" isExternal={errorIsExternal}>
          Voltar para o hub
        </HubLink>
      </div>
    );
  }

  if (redirecting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 flex h-14 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-sm">
        <HubLink className="flex items-center gap-2 font-semibold shrink-0" isExternal={!!tenant?.custom_domain}>
          {tenant.logo_url && (
            <img src={tenant.logo_url} alt="" className="h-6 w-6 rounded" />
          )}
          <span className="text-sm">{tenant.name}</span>
        </HubLink>

        <div className="mx-2 h-5 w-px bg-border" />

        <nav className="flex items-center gap-0.5">
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
          <VoiceChat tenantSlug={slug} isActive={isVoicePage} />

          {(tenant as any)?.discord_url && (
            <a
              href={(tenant as any).discord_url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Discord"
            >
              <MessageCircle className="h-4 w-4" />
            </a>
          )}

          {(tenant as any)?.game_url && (
            <a
              href={(tenant as any).game_url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Jogo"
            >
              <Gamepad2 className="h-4 w-4" />
            </a>
          )}
        </nav>

        <div className="flex-1" />
      </header>

      {showTitleStrip && (
        <div className="flex items-center border-b bg-background/50">
          {isHome ? (
            <HomeTitleStrip />
          ) : hasSidebar ? (
            <>
              <button
                onClick={toggleSidebar}
                className="flex items-center justify-center w-12 h-7 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border-r shrink-0"
                title={sidebarCollapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
              >
                {sidebarCollapsed ? <PanelLeft className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
              </button>
              <div className="flex-1 flex items-center justify-center pr-12">
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
                  {isChatPage ? 'Assistente IA' : 'Artigos'}
                </span>
              </div>
            </>
          ) : null}
        </div>
      )}

      <div className="flex flex-1">
        {hasSidebar && (
          <Suspense fallback={<div className={`shrink-0 border-r bg-muted/30 ${sidebarCollapsed ? 'w-12' : 'w-64'}`} />}>
            <WikiSidebar
              tenantSlug={slug}
              collapsed={sidebarCollapsed}
            />
          </Suspense>
        )}
        <main className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full">
          {children}
        </main>
      </div>
      {tenant?.ai_enabled && <ChatWidget tenantSlug={slug} isChatPage={isChatPage} />}
      <FloatingVoiceOrb tenantSlug={slug} aiConfig={tenant?.ai_config as Record<string, unknown>} discordUrl={(tenant as any)?.discord_url} gameUrl={(tenant as any)?.game_url} />
    </div>
  );
}

function HomeTitleStrip() {
  const { searchQuery, setSearchQuery } = useWikiSearch();

  return (
    <div className="flex items-center gap-2 px-3 flex-1 h-7">
      <Search className="h-3 w-3 text-muted-foreground shrink-0" />
      <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium shrink-0">
        Buscar na wiki
      </span>
      <input
        type="text"
        placeholder="Digite para filtrar..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="flex-1 bg-transparent border-none outline-none text-[10px] text-foreground placeholder:text-muted-foreground/50 min-w-0"
      />
      {searchQuery && (
        <button
          onClick={() => setSearchQuery('')}
          className="text-muted-foreground hover:text-foreground shrink-0"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
