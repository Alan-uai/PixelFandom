'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Home, Menu, Search } from 'lucide-react';
import { useParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Tenant } from '@/supabase/client';

export default function WikiLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const params = useParams();
  const slug = params?.slug as string;
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/tenants?slug=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((data) => {
        setTenant(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

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
      <header className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm">
        <Link href={`/w/${slug}`} className="flex items-center gap-2 font-semibold shrink-0">
          {tenant.logo_url && (
            <img src={tenant.logo_url} alt="" className="h-6 w-6 rounded" />
          )}
          <span>{tenant.name}</span>
        </Link>
        <div className="flex-1" />
        <div className="relative max-w-sm flex-1 hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar na wiki..."
            className="pl-8 h-9 bg-muted"
          />
        </div>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </header>
      <div className="flex flex-1">
        <aside className="hidden w-64 shrink-0 border-r bg-muted/30 md:block">
          <nav className="flex flex-col gap-1 p-4">
            <Link
              href={`/w/${slug}`}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
            >
              <Home className="h-4 w-4" />
              Home
            </Link>
          </nav>
        </aside>
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
