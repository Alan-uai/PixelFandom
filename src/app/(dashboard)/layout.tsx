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
  Headphones,
  PanelLeft,
  PanelLeftClose,
} from 'lucide-react';
import { LayoutGroup, motion } from 'framer-motion';
import { PageSubNavProvider, usePageSubNav } from '@/components/dashboard/page-subnav-context';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const { user, isLoading } = useUser();

  const wikiSlug = pathname.match(/^\/dashboard\/([^/]+)/)?.[1];
  const isWikiPage = !!(wikiSlug && wikiSlug !== 'new');
  const { canManage, canEdit } = useTenantRole(isWikiPage ? wikiSlug : undefined);

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

  const currentItem = isWikiPage
    ? navItems.find((item) => pathname === `/dashboard/${wikiSlug}/${item.href}`) ?? null
    : null;

  return (
    <PageSubNavProvider>
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 flex h-14 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-sm">
        <Link href="/" className="flex items-center gap-2 font-semibold shrink-0 text-sm">
          <LayoutDashboard className="h-4 w-4 text-primary" />
          PixelFandom
        </Link>

        <div className="mx-2 h-5 w-px bg-border" />

        <nav className="flex items-center gap-1">
          {isWikiPage ? (
            <LayoutGroup>
              {navItems.map((item) => {
                const Icon = item.icon;
                const href = `/dashboard/${wikiSlug}/${item.href}`;
                const isActive = pathname === href;
                return (
                  <div key={item.href}>
                    {isActive ? (
                      <motion.span
                        layoutId="active-dot"
                        className="rounded-md p-2 text-muted-foreground text-xs select-none block"
                        title={item.label}
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      >
                        ·
                      </motion.span>
                    ) : (
                      <Link
                        href={href}
                        className="rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors inline-block"
                        title={item.label}
                      >
                        <Icon className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                );
              })}
            </LayoutGroup>
          ) : (
            <>
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
            </>
          )}

          {isWikiPage && (
            <>
              <div className="mx-1 h-5 w-px bg-border" />
              <Link
                href={`/w/${wikiSlug}`}
                className="rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Ver Wiki"
              >
                <ExternalLink className="h-4 w-4" />
              </Link>
            </>
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

      <TitleStrip isWikiPage={isWikiPage} currentItem={currentItem} />

      <main className="flex-1 overflow-auto">
        {isWikiPage ? (
          children
        ) : (
          <div className="p-6 max-w-6xl mx-auto">
            {children}
          </div>
        )}
      </main>
    </div>
    </PageSubNavProvider>
  );
}

function TitleStrip({ isWikiPage, currentItem }: { isWikiPage: boolean; currentItem: { label: string; icon: any } | null }) {
  const { collapsed, toggle } = usePageSubNav();

  if (!isWikiPage || !currentItem) return null;

  return (
    <div className="flex items-center border-b bg-background/50">
      <button
        onClick={toggle}
        className="flex items-center justify-center w-12 h-7 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border-r shrink-0"
        title={collapsed ? 'Expandir seções' : 'Recolher seções'}
      >
        {collapsed ? <PanelLeft className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
      </button>
      <div className="flex-1 flex items-center justify-center pr-12">
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
          {currentItem.label}
        </span>
      </div>
    </div>
  );
}
