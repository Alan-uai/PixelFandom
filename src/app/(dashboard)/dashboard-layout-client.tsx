'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  MessageSquare,
} from 'lucide-react';
import { SliderTabs, SliderTabsList, SliderTabsTrigger } from '@/components/ui/slider-tabs';
import { UnsavedChangesProvider } from '@/components/unsaved-changes';

export default function DashboardLayoutClient({
  children,
  isZadminBypass,
}: Readonly<{
  children: React.ReactNode;
  isZadminBypass: boolean;
}>) {
  const pathname = usePathname();
  const router = useRouter();
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

  if (!user && !isZadminBypass) {
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
        { href: 'ai/feedback', label: 'Feedback', icon: MessageSquare },
        { href: 'discord', label: 'Discord', icon: Headphones },
        { href: 'editor', label: 'Conteúdo', icon: BookOpen },
        { href: 'importer', label: 'Importar', icon: Download },
        { href: 'page-builder', label: 'Página Inicial', icon: FileText },
      ]
    : canEdit
    ? [
        { href: 'editor', label: 'Conteúdo', icon: BookOpen },
        { href: 'importer', label: 'Importar/Exportar', icon: Download },
      ]
    : [];

  let activeValue = '';
  if (isWikiPage && navItems.length > 0) {
    const found = navItems.find(item => {
      const href = `/dashboard/${wikiSlug}/${item.href}`;
      return pathname === href;
    }) || navItems.find(item => {
      const href = `/dashboard/${wikiSlug}/${item.href}`;
      return pathname.startsWith(`${href}/`);
    });
    if (found) {
      activeValue = `/dashboard/${wikiSlug}/${found.href}`;
    } else {
      activeValue = `/dashboard/${wikiSlug}/${navItems[0].href}`;
    }
  }

  return (
    <UnsavedChangesProvider>
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

        <nav className="flex items-center gap-1 flex-1 min-w-0">
          {isWikiPage && navItems.length > 0 && (
            <SliderTabs defaultValue={activeValue} value={activeValue} onValueChange={(v) => router.push(v)}>
              <SliderTabsList className="border-0 bg-transparent backdrop-blur-none p-0 gap-0.5 w-full flex-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const href = `/dashboard/${wikiSlug}/${item.href}`;
                  return (
                    <SliderTabsTrigger
                      key={item.href}
                      value={href}
                      icon={Icon}
                      title={item.label}
                      className="flex-1 p-2 rounded-md justify-center"
                    />
                  );
                })}
              </SliderTabsList>
            </SliderTabs>
          )}

          {isWikiPage && (
            <>
              <div className="mx-1 h-5 w-px bg-border shrink-0" />
              <Link
                href={wikiCustomDomain ? `https://${wikiCustomDomain}` : `/w/${wikiSlug}`}
                target={wikiCustomDomain ? '_blank' : undefined}
                className="rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
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
    </UnsavedChangesProvider>
  );
}
