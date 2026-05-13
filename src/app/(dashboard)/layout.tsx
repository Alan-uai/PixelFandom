'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/supabase';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Plus,
  Settings,
  Globe,
  Users,
  Cpu,
  Columns3,
  LogOut,
  Loader2,
  BookOpen,
} from 'lucide-react';

const wikiNavItems = [
  { href: 'settings', label: 'Configurações', icon: Settings },
  { href: 'domains', label: 'Domínios', icon: Globe },
  { href: 'members', label: 'Membros', icon: Users },
  { href: 'ai', label: 'IA', icon: Cpu },
  { href: 'collections', label: 'Coleções', icon: Columns3 },
  { href: 'editor/new', label: 'Novo Artigo', icon: BookOpen },
];

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const { user, isLoading } = useUser();

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

  const wikiSlug = pathname.match(/^\/dashboard\/([^/]+)/)?.[1];
  const isWikiPage = wikiSlug && wikiSlug !== 'new';

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 shrink-0 border-r bg-muted/30 flex flex-col">
        <div className="p-4 border-b">
          <Link href="/dashboard" className="flex items-center gap-2 text-lg font-bold">
            <LayoutDashboard className="h-5 w-5 text-primary" />
            PixelFandom
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
              pathname === '/dashboard'
                ? 'bg-primary/10 text-primary font-medium'
                : 'hover:bg-muted text-muted-foreground'
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            Minhas Wikis
          </Link>

          <Link
            href="/dashboard/new"
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
              pathname === '/dashboard/new'
                ? 'bg-primary/10 text-primary font-medium'
                : 'hover:bg-muted text-muted-foreground'
            }`}
          >
            <Plus className="h-4 w-4" />
            Nova Wiki
          </Link>

          {isWikiPage && (
            <>
              <div className="pt-4 pb-1">
                <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {wikiSlug}
                </p>
              </div>
              {wikiNavItems.map((item) => {
                const Icon = item.icon;
                const href = `/dashboard/${wikiSlug}/${item.href}`;
                return (
                  <Link
                    key={item.href}
                    href={href}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                      pathname === href
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
              <div className="pt-2">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={`/w/${wikiSlug}`}>
                    <Globe className="h-3.5 w-3.5 mr-1.5" />
                    Ver Wiki
                  </Link>
                </Button>
              </div>
            </>
          )}
        </nav>

        <div className="p-3 border-t space-y-1">
          <div className="px-3 py-2 text-xs text-muted-foreground truncate">
            {user.email || user.id.slice(0, 12)}
          </div>
          <Link
            href="/"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Link>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
