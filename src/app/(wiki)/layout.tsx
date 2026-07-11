'use client';

import { useEffect, useState, useCallback, Suspense, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, usePathname } from 'next/navigation';
import { Loader2, Search, X, House, MessageCircle, Gamepad2, SunMoon, PanelLeft } from 'lucide-react';
import WikiSidebar from '@/components/wiki/wiki-sidebar';
import ChatWidget from '@/components/wiki/chat-widget';
import VoiceChat from '@/components/voice/voice-chat';
import FloatingVoiceOrb from '@/components/voice/floating-voice-orb';
import { WikiDataProvider, useWikiData } from '@/context/wiki-provider';
import { WikiSearchProvider, useWikiSearch } from '@/context/wiki-search-context';
import { useUserPreferences } from '@/context/user-preferences-context';
import { ThemeProvider } from '@/context/theme-context';
import HubLink from '@/components/hub-link';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { MAIN_DOMAIN } from '@/lib/constants';
import { useWikiPath } from '@/hooks/use-wiki-path';
import { PageRenderer } from '@/components/page-builder/renderer/page-renderer';
import type { TenantTheme } from '@/context/theme-context';
import type { WidgetChatConfig, WidgetVoiceConfig, FloatingIslandConfig, SlotFlowId, ClipStyleId } from '@/components/page-builder/types';
import { FloatingIslandsBar } from '@/components/floating-islands/floating-islands-bar';
import { getTableCatalog } from '@/lib/data-access';

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
  const { preferences, updatePreference } = useUserPreferences();

  const { basePath } = useWikiPath(slug);

  const tenant = data?.tenant || null;
  const tenantTheme = (tenant?.theme as TenantTheme) || {};
  const widgetTheme = (tenant?.theme as any)?.widgets || {};
  const chatWidgetConfig = widgetTheme.chat as WidgetChatConfig | undefined;
  const voiceWidgetConfig = widgetTheme.voice as WidgetVoiceConfig | undefined;
  const isHome = pathname === `/w/${slug}` || pathname === '/';
  const isChatPage = pathname === `/w/${slug}/chat` || pathname === '/chat';
  const isVoicePage = pathname === `/w/${slug}/ai` || pathname === '/voice';
  const hasSidebar = isChatPage;
  const showTitleStrip = !isVoicePage;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [errorIsExternal, setErrorIsExternal] = useState(false);
  const [footerLayout, setFooterLayout] = useState<any>(null);
  const footerCache = useRef<Record<string, any>>({});
  const [floatingIslands, setFloatingIslands] = useState<FloatingIslandConfig[]>([]);
  const [slotFlow, setSlotFlow] = useState<SlotFlowId>('current');
  const [clipStyle, setClipStyle] = useState<ClipStyleId>('trapezoid');
  const [singleIslandWidth, setSingleIslandWidth] = useState<number | undefined>(undefined);
  const islandsCache = useRef<Record<string, any>>({});
  const [gameTableNames, setGameTableNames] = useState<string[]>([]);

  useEffect(() => {
    if (!tenant?.id) return;
    if (footerCache.current[tenant.id] !== undefined) {
      setFooterLayout(footerCache.current[tenant.id]);
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);
    fetch(`/api/tenants/${tenant.id}/page-layout?type=footer`, { signal: controller.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error(`API error ${r.status}`);
        return r.json();
      })
      .then((data) => {
        const layout = data?.blocks?.length ? { blocks: data.blocks } : null;
        footerCache.current[tenant.id] = layout;
        setFooterLayout(layout);
      })
      .catch((e) => {
        if (e.name === 'AbortError') return;
        console.error('Footer layout fetch failed:', e);
        footerCache.current[tenant.id] = null;
      })
      .finally(() => clearTimeout(timeout));
  }, [tenant?.id]);

  useEffect(() => {
    if (!tenant?.id) return;
    if (islandsCache.current[tenant.id] !== undefined) {
      const cached = islandsCache.current[tenant.id];
      setFloatingIslands(cached.islands || cached);
      setSlotFlow(cached.slotFlow || 'current');
      setClipStyle(cached.clipStyle || 'trapezoid');
      setSingleIslandWidth(cached.singleIslandWidth ?? undefined);
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);
    fetch(`/api/tenants/${tenant.id}/page-layout?type=landing`, { signal: controller.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error(`API error ${r.status}`);
        return r.json();
      })
      .then((data) => {
        const islands = data?.floatingIslands?.length > 0 ? data.floatingIslands : [];
        islandsCache.current[tenant.id] = { islands, slotFlow: data.slotFlow, clipStyle: data.clipStyle, singleIslandWidth: data.singleIslandWidth ?? undefined };
        setFloatingIslands(islands);
        if (data.slotFlow) setSlotFlow(data.slotFlow);
        if (data.clipStyle) setClipStyle(data.clipStyle);
        setSingleIslandWidth(data.singleIslandWidth ?? undefined);
      })
      .catch((e) => {
        if (e.name === 'AbortError') return;
        console.error('Islands layout fetch failed:', e);
        islandsCache.current[tenant.id] = { islands: [] };
      })
      .finally(() => clearTimeout(timeout));
  }, [tenant?.id]);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const catalog = await getTableCatalog(slug, false);
        const names = catalog.map((t) => t.table_name);
        setGameTableNames(names);
      } catch {/* noop */}
    })();
  }, [slug]);

  // Only show footer on non-game-table pages
  const pathAfterSlug = pathname.replace(`/w/${slug}`, '').replace(/^\/+/, '');
  const pathParts = pathAfterSlug.split('/').filter(Boolean);
  const isGameTablePage = gameTableNames.length > 0 && pathParts.length >= 1 && gameTableNames.includes(pathParts[0]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      if (host !== MAIN_DOMAIN && host !== 'localhost' && host !== '127.0.0.1') {
        setErrorIsExternal(true);
      }
    }
  }, []);

  const faviconUrl = (tenant as any)?.favicon_url;

  useEffect(() => {
    const link = document.querySelector('link[rel="icon"][sizes="512x512"]')
      || document.querySelector('link[rel="icon"]')
      || document.querySelector('link[rel="shortcut icon"]');
    if (link) {
      link.setAttribute('href', faviconUrl || '/icon-512.png');
      if (faviconUrl) link.setAttribute('type', 'image/png');
    }
  }, [faviconUrl]);

  const handleModeChange = useCallback((mode: 'system' | 'light' | 'dark') => {
    updatePreference('theme_mode', mode);
  }, [updatePreference]);

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

  return (
    <ThemeProvider
      tenantTheme={tenantTheme}
      mode={preferences.theme_mode}
      onModeChange={handleModeChange}
    >
      <div className="flex min-h-screen flex-col" style={{ fontFamily: `var(--font-family, Inter, ui-sans-serif, system-ui, sans-serif)` }}>
        <header className="sticky top-0 z-50 flex h-14 items-center border-b bg-background/80 px-4 backdrop-blur-sm">
          <HubLink className="flex items-center gap-2 font-semibold shrink-0" isExternal={!!tenant?.custom_domain}>
            {tenant.logo_url && (
              <Image src={tenant.logo_url} alt="" width={24} height={24} className="h-6 w-6 rounded" />
            )}
            <span className="text-sm">{tenant.name}</span>
          </HubLink>

          <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-0.5">
            <Link
              href={basePath || '/'}
              className={`rounded-md p-2 transition-colors ${
                isHome
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
              title="Home"
            >
              <House className="h-4 w-4" />
            </Link>
            <button
              onClick={() => { window.location.href = `${basePath}/chat`; }}
              className={`rounded-md p-2 transition-colors ${
                isChatPage
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
              title="Assistente IA"
            >
              <MessageCircle className="h-4 w-4" />
            </button>
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

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => {
                const modes: Array<'system' | 'light' | 'dark'> = ['system', 'dark', 'light'];
                const idx = modes.indexOf(preferences.theme_mode);
                const next = modes[(idx + 1) % modes.length];
                handleModeChange(next);
              }}
              className="rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title={`Tema: ${preferences.theme_mode === 'system' ? 'Sistema' : preferences.theme_mode === 'dark' ? 'Escuro' : 'Claro'}`}
            >
              <SunMoon className="h-4 w-4" />
            </button>
            <NotificationBell />
          </div>
        </header>

        {floatingIslands.length > 0 && (
          <div className="sticky top-14 z-40">
            <FloatingIslandsBar islands={floatingIslands} slotFlow={slotFlow} clipStyle={clipStyle} singleIslandWidth={singleIslandWidth} basePath={basePath} />
          </div>
        )}

        {showTitleStrip && (
          <div className="flex items-center border-b bg-background/50">
            {isHome ? (
              <HomeTitleStrip />
            ) : hasSidebar ? (
              <div className="flex-1 flex items-center justify-center h-7 px-3">
                <button
                  onClick={() => setSidebarOpen((prev) => !prev)}
                  className="absolute left-3 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  title="Sidebar"
                >
                  <PanelLeft className={`h-3.5 w-3.5 transition-opacity ${sidebarOpen ? 'opacity-60' : 'opacity-100'}`} />
                </button>
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
                  Assistente IA
                </span>
              </div>
            ) : null}
          </div>
        )}

        <div className="flex flex-1" style={{
          fontSize: preferences.font_size === 'small' ? '0.875rem' : preferences.font_size === 'large' ? '1.125rem' : '1rem',
        }}>
          {isChatPage && (
            <>
              {sidebarOpen && (
                <div
                  className="fixed inset-0 z-40 bg-black/50"
                  onClick={() => setSidebarOpen(false)}
                />
              )}
              <div
                className={`fixed left-0 top-[5.25rem] z-50 h-[calc(100vh-5.25rem)] transition-transform duration-300 ease-in-out ${
                  sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
              >
                <Suspense fallback={<div className="w-64 h-full border-r bg-muted/30" />}>
                  <WikiSidebar tenantSlug={slug} onClose={() => setSidebarOpen(false)} />
                </Suspense>
              </div>
            </>
          )}
          <main className={`flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full ${preferences.density === 'compact' ? 'space-y-3' : 'space-y-6'}`}>
            {children}
          </main>
        </div>

        {footerLayout && !isGameTablePage && !isChatPage && !isVoicePage && (
          <footer className="border-t bg-background/80 px-4 py-6">
            <div className="max-w-5xl mx-auto">
              <PageRenderer layout={footerLayout} tenant={tenant} basePath={basePath} />
            </div>
          </footer>
        )}
        {tenant?.ai_enabled && <ChatWidget tenantSlug={slug} isChatPage={isChatPage} widgetConfig={chatWidgetConfig} />}

        <FloatingVoiceOrb tenantSlug={slug} aiConfig={tenant?.ai_config as Record<string, unknown>} discordUrl={(tenant as any)?.discord_url} gameUrl={(tenant as any)?.game_url} widgetConfig={voiceWidgetConfig} />
      </div>
    </ThemeProvider>
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
