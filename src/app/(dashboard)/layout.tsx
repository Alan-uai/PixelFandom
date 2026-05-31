'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useUser, supabase } from '@/supabase';
import { useTenantRole } from '@/hooks/use-tenant-role';
import {
  LayoutDashboard,
  Settings,
  Globe,
  Users,
  Cpu,
  Loader2,
  BookOpen,
  ExternalLink,
  Headphones,
  Download,
  FileText,
} from 'lucide-react';
import { LayoutGroup, motion } from 'framer-motion';

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

  const [wikiCustomDomain, setWikiCustomDomain] = useState<string | null>(null);

  useEffect(() => {
    if (!wikiSlug) { setWikiCustomDomain(null); return; }
    supabase.from('tenants').select('custom_domain').eq('slug', wikiSlug).single()
      .then(({ data }) => setWikiCustomDomain(data?.custom_domain ?? null));
  }, [wikiSlug]);

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
        { href: 'editor', label: 'Conteúdo', icon: BookOpen },
        { href: 'importer', label: 'Importar', icon: Download },
        { href: 'page-builder', label: 'Página Inicial', icon: FileText },
      ]
    : canEdit
    ? [
        { href: 'editor', label: 'Conteúdo', icon: BookOpen },
        { href: 'importer', label: 'Importar', icon: Download },
      ]
    : [];

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <header className="sticky top-0 z-50 flex h-14 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-sm">
        <Link
          href="/"
          className="rounded-md p-2 text-primary hover:text-primary/80 hover:bg-muted transition-colors shrink-0"
          title="Página Inicial"
        >
          <LayoutDashboard className="h-4 w-4" />
        </Link>
        <span className="hidden sm:inline text-sm font-semibold shrink-0">PixelFandom</span>

        <div className="mx-2 h-5 w-px bg-border" />

        <nav className="flex items-center gap-1 overflow-x-auto scrollbar-none">
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
          ) : null}

          {isWikiPage && (
            <>
              <div className="mx-1 h-5 w-px bg-border" />
              <Link
                href={wikiCustomDomain ? `https://${wikiCustomDomain}` : `/w/${wikiSlug}`}
                target={wikiCustomDomain ? '_blank' : undefined}
                className="rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Ver Wiki"
              >
                <ExternalLink className="h-4 w-4" />
              </Link>
            </>
          )}
        </nav>

        <div className="flex-1" />
      </header>

      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        {isWikiPage ? (
          children
        ) : (
          <div className="p-6 max-w-6xl mx-auto">
            {children}
          </div>
        )}
      </main>
    </div>
  );
}

