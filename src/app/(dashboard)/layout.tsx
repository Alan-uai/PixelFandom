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
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Minhas Wikis', icon: LayoutDashboard },
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

  // Extract wiki slug from path if on a wiki-specific page
  const wikiSlug = pathname.match(/^\/dashboard\/([^/]+)/)?.[1];
  const isWikiPage = wikiSlug && wikiSlug !== 'new';

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 shrink-0 border-r bg-muted/30 flex flex-col">
        <div className="p-4 border-b">
          <Link href="/" className="text-lg font-bold">
            PixelFandom
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  pathname === item.href
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'hover:bg-muted'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}

          {isWikiPage && (
            <>
              <div className="pt-4 pb-2">
                <p className="px-3 text-xs font-medium text-muted-foreground uppercase">
                  Wiki
                </p>
              </div>
              {[
                { href: `/dashboard/${wikiSlug}/settings`, label: 'Configurações', icon: Settings },
                { href: `/dashboard/${wikiSlug}/domains`, label: 'Domínios', icon: Globe },
                { href: `/dashboard/${wikiSlug}/members`, label: 'Membros', icon: Users },
                { href: `/dashboard/${wikiSlug}/ai`, label: 'IA', icon: Cpu },
                { href: `/dashboard/${wikiSlug}/collections`, label: 'Coleções', icon: Columns3 },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                      pathname === item.href
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </>
          )}
        </nav>
        <div className="p-4 border-t">
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/">
              <LogOut className="h-4 w-4 mr-2" />
              Sair da dashboard
            </Link>
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
