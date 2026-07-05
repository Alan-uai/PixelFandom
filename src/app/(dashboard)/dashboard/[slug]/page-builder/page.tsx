'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { PageBuilderEditor } from '@/components/page-builder/page-builder-editor';
import { GameTablesBuilder } from '@/components/page-builder/game-tables-builder';
import { Loader2, ArrowLeft, LayoutDashboard, Footprints, FileQuestion, Database } from 'lucide-react';
import Link from 'next/link';
import { useCachedData } from '@/hooks/use-cached-data';
import { supabase } from '@/supabase';

const PAGE_TYPES = [
  { id: 'landing', label: 'Landing Page', icon: LayoutDashboard },
  { id: 'footer', label: 'Footer', icon: Footprints },
  { id: '404', label: 'Página 404', icon: FileQuestion },
  { id: 'game-tables', label: 'Tabelas', icon: Database },
] as const;

export type PageType = (typeof PAGE_TYPES)[number]['id'];

export default function PageBuilderPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <PageBuilderPageInner />
    </Suspense>
  );
}

function PageBuilderPageInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = params.slug as string;
  const pageType = (searchParams.get('type') as PageType) || 'landing';
  const [layout, setLayout] = useState<{ blocks: any[]; floatingIslands: any[]; slotFlow?: string; clipStyle?: string } | null>(null);
  const [loadedPageType, setLoadedPageType] = useState<string | null>(null);

  const { data: tenant } = useCachedData<{ id: string }>(
    `tenant:${slug}`,
    async () => {
      const { data } = await supabase.from('tenants').select('id').eq('slug', slug).single();
      return data!;
    }
  );
  const tenantId = tenant?.id ?? null;

  const isGameTables = pageType === 'game-tables';
  const cacheKey = !isGameTables && tenantId ? `page-layout:${tenantId}:${pageType}` : null;
  const { data: layoutData, loading } = useCachedData<{ blocks: any[]; floatingIslands: any[]; slotFlow?: string; clipStyle?: string }>(
    cacheKey,
    async () => {
      const res = await fetch(`/api/tenants/${tenantId}/page-layout?type=${pageType}`);
      const json = await res.json();
      return { blocks: json?.blocks || [], floatingIslands: json?.floatingIslands || [], slotFlow: json?.slotFlow, clipStyle: json?.clipStyle };
    }
  );

  useEffect(() => {
    if (!layoutData) return;
    setLayout(layoutData);
    setLoadedPageType(pageType);
  }, [layoutData, pageType]);

  const handleTypeChange = (type: string) => {
    router.push(`/dashboard/${slug}/page-builder?type=${type}`);
  };

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
        <div className="flex-1">
          <h1 className="text-sm font-medium">Editor de Páginas</h1>
          <p className="text-[10px] text-muted-foreground">
            Personalize as páginas da sua wiki
          </p>
        </div>
      </div>
      <div className="flex gap-1 border-b px-4 py-1.5 bg-muted/30 overflow-x-auto">
        {PAGE_TYPES.map((pt) => {
          const Icon = pt.icon;
          return (
            <button
              key={pt.id}
              type="button"
              onClick={() => handleTypeChange(pt.id)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors shrink-0 ${
                pageType === pt.id
                  ? 'bg-primary/10 text-primary border border-primary/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {pt.label}
            </button>
          );
        })}
      </div>
      <div className="flex-1 overflow-hidden">
        {isGameTables ? (
          <GameTablesBuilder tenantId={tenantId} slug={slug} />
        ) : loading || loadedPageType !== pageType ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <PageBuilderEditor
            key={pageType}
            tenantId={tenantId}
            slug={slug}
            initialLayout={layout ? { blocks: layout.blocks } : undefined}
            initialFloatingIslands={layout?.floatingIslands || undefined}
            initialSlotFlow={(layout?.slotFlow as any) || undefined}
            initialClipStyle={(layout?.clipStyle as any) || undefined}
            pageType={pageType}
          />
        )}
      </div>
    </div>
  );
}
