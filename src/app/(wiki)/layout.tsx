'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Loader2, Menu, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import WikiSidebar from '@/components/wiki/wiki-sidebar';
import type { Tenant } from '@/supabase/client';

export default function WikiLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

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
      <header className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm">
        <button
          className="md:hidden"
          onClick={() => setSearchOpen(!searchOpen)}
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link href={`/w/${slug}`} className="flex items-center gap-2 font-semibold shrink-0">
          {tenant.logo_url && (
            <img src={tenant.logo_url} alt="" className="h-6 w-6 rounded" />
          )}
          <span>{tenant.name}</span>
        </Link>

        <div className="flex-1" />

        <form onSubmit={handleSearch} className="relative max-w-sm flex-1 hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar... (Cmd+K)"
            className="pl-8 h-9 bg-muted"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
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
        <WikiSidebar tenantSlug={slug} tenantId={tenant.id} />
        <main className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
