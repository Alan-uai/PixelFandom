'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/supabase';
import { useTenantRole } from '@/hooks/use-tenant-role';
import {
  LayoutDashboard,
  Plus,
  Settings,
  Globe,
  Users,
  Cpu,
  LogOut,
  Loader2,
  BookOpen,
  ExternalLink,
  PanelLeft,
  PanelLeftClose,
  Headphones,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { DashboardHero } from '@/components/dashboard/dashboard-hero';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const { user, isLoading } = useUser();

  const wikiSlug = pathname.match(/^\/dashboard\/([^/]+)/)?.[1];
  const isWikiPage = wikiSlug && wikiSlug !== 'new';
  const { canManage, canEdit } = useTenantRole(isWikiPage ? wikiSlug : undefined);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('dashboard-sidebar-collapsed');
      if (stored === 'true') setSidebarCollapsed(true);
    } catch {}
  }, []);

  const toggleSidebar = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    try {
      localStorage.setItem('dashboard-sidebar-collapsed', String(next));
    } catch {}
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <h1 className="text-2xl font-bold">Acesso Restrito</h1>
        <p className="text-muted-foreground mt-2">
          Faça login para acessar o dashboard.
        </p>
        <Link href="/" className="mt-4 text-primary hover:underline">
          Voltar
        </Link>
      </div>
    );
  }

  const navItems = canManage
    ? [
        { href: 'settings', label: 'Configurações', icon: Settings },
        { href: 'domains', label: 'Domínios', icon: Globe },
        { href: 'members', label: 'Membros', icon: Users },
        { href: 'ai', label: 'IA', icon: Cpu },
        { href: 'discord', label: 'Discord', icon: Headphones },
        { href: 'editor/new', label: 'Novo Artigo', icon: BookOpen },
      ]
    : canEdit
    ? [
        { href: 'editor/new', label: 'Novo Artigo', icon: BookOpen },
      ]
    : [];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 flex h-14 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-sm">
        <Link href="/" className="flex items-center gap-2 font-semibold shrink-0 text-sm">
          <LayoutDashboard className="h-4 w-4 text-primary" />
          PixelFandom
        </Link>

        <div className="mx-2 h-5 w-px bg-border" />

        <nav className="flex items-center gap-1">
          <Link
            href="/dashboard"
            className={`rounded-md p-2 transition-colors ${
              pathname === '/dashboard'
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
            title="Minhas Wikis"
          >
            <LayoutDashboard className="h-4 w-4" />
          </Link>
          <Link
            href="/dashboard/new"
            className={`rounded-md p-2 transition-colors ${
              pathname === '/dashboard/new'
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
            title="Nova Wiki"
          >
            <Plus className="h-4 w-4" />
          </Link>
          {isWikiPage && (
            <Link
              href={`/w/${wikiSlug}`}
              className="rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Ver Wiki"
            >
              <ExternalLink className="h-4 w-4" />
            </Link>
          )}
        </nav>

        <div className="flex-1" />

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground hidden sm:inline truncate max-w-[120px]">
            {user.email || user.id.slice(0, 12)}
          </span>
          <Link
            href="/"
            className="rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <div className="flex flex-1">
        {isWikiPage && (
          <aside
            className={`${
              sidebarCollapsed ? 'w-12' : 'w-56'
            } shrink-0 border-r bg-muted/30 flex flex-col transition-all duration-200`}
          >
            <div className="flex items-center gap-1 p-3">
              {!sidebarCollapsed && (
                <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider truncate flex-1">
                  {wikiSlug}
                </p>
              )}
              <button
                onClick={toggleSidebar}
                className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title={sidebarCollapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
              >
                {sidebarCollapsed ? (
                  <PanelLeft className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const href = `/dashboard/${wikiSlug}/${item.href}`;
                return (
                  <Link
                    key={item.href}
                    href={href}
                    title={sidebarCollapsed ? item.label : undefined}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                      pathname === href
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!sidebarCollapsed && item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        )}

        <main className="flex-1 overflow-auto">
          <div className="p-6 max-w-6xl mx-auto">
            {isWikiPage && (
              <DashboardHero wikiSlug={wikiSlug} items={navItems} currentPath={pathname} />
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
