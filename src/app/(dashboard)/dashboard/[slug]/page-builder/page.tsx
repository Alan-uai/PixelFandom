'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PageBuilderEditor } from '@/components/page-builder/page-builder-editor';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PageBuilderPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [layout, setLayout] = useState<{ blocks: any[]; floatingIslands: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [tenantId, setTenantId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { supabase } = await import('@/supabase');

      const { data: tenant } = await supabase
        .from('tenants')
        .select('id, theme')
        .eq('slug', slug)
        .single();

      if (!tenant) {
        setLoading(false);
        return;
      }

      setTenantId(tenant.id);

      // Try tenant_pages first, then fallback to theme.landing_layout
      const res = await fetch(`/api/tenants/${tenant.id}/page-layout`);
      const data = await res.json();
      setLayout({ blocks: data?.blocks || [], floatingIslands: data?.floatingIslands || [] });
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tenantId) {
    return <p className="p-6 text-muted-foreground">Wiki não encontrada.</p>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 border-b px-4 py-2 shrink-0">
        <Link
          href={`/dashboard/${slug}/settings`}
          className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-sm font-medium">Editor de Página Inicial</h1>
          <p className="text-[10px] text-muted-foreground">
            Personalize a landing page e as ilhas flutuantes da sua wiki
          </p>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <PageBuilderEditor
          tenantSlug={slug}
          initialLayout={layout ? { blocks: layout.blocks } : undefined}
          initialFloatingIslands={layout?.floatingIslands || undefined}
        />
      </div>
    </div>
  );
}
