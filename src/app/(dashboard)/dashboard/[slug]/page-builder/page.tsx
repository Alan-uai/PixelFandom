'use client';

import { useEffect, useState, useCallback, Suspense, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { PageBuilderEditor } from '@/components/page-builder/page-builder-editor';
import { Loader2, ArrowLeft, LayoutDashboard, Footprints, FileQuestion, Database, ChevronDown, Eye } from 'lucide-react';
import Link from 'next/link';
import { useCachedData } from '@/hooks/use-cached-data';
import { supabase } from '@/supabase';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import type { SlotFlowId, ClipStyleId } from '@/components/page-builder/types';

const PAGE_TYPES = [
  { id: 'landing', label: 'Landing Page', icon: LayoutDashboard },
  { id: 'footer', label: 'Footer', icon: Footprints },
  { id: '404', label: 'Página 404', icon: FileQuestion },
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
  const [tableCatalog, setTableCatalog] = useState<{ table_name: string; display_label: string }[]>([]);
  const catalogFetched = useRef(false);

  const { data: tenant } = useCachedData<{ id: string }>(
    `tenant:${slug}`,
    async () => {
      const { data } = await supabase.from('tenants').select('id').eq('slug', slug).single();
      return data!;
    }
  );
  const tenantId = tenant?.id ?? null;

  useEffect(() => {
    if (tenantId && !catalogFetched.current) {
      catalogFetched.current = true;
      supabase
        .from('tenant_game_tables')
        .select('table_name, display_label')
        .eq('tenant_id', tenantId)
        .order('created_at')
        .then(({ data }) => {
          if (data) setTableCatalog(data);
        });
    }
  }, [tenantId]);

  const cacheKey = tenantId ? `page-layout:${tenantId}:${pageType}` : null;
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
            Personalize a landing page, footer e página 404 da sua wiki
          </p>
        </div>
      </div>
      <div className="flex gap-1 border-b px-4 py-1.5 bg-muted/30">
        {PAGE_TYPES.map((pt) => {
          const Icon = pt.icon;
          return (
            <button
              key={pt.id}
              type="button"
              onClick={() => handleTypeChange(pt.id)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
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
        <div className="w-px bg-border mx-1" />
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent transition-colors"
            >
              <Database className="h-3.5 w-3.5" />
              Tabelas
              <ChevronDown className="h-3 w-3" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="z-50 min-w-[200px] rounded-lg border bg-card p-1 shadow-lg"
              sideOffset={4}
              align="start"
            >
              {tableCatalog.length === 0 ? (
                <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                  Nenhuma tabela encontrada
                </div>
              ) : (
                tableCatalog.map((t) => (
                  <DropdownMenu.Item key={t.table_name} asChild>
                    <a
                      href={`/dashboard/${slug}/editor?tab=${t.table_name}&view=viewer`}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-accent cursor-pointer outline-none"
                    >
                      <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                      {t.display_label}
                    </a>
                  </DropdownMenu.Item>
                ))
              )}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
      <div className="flex-1 overflow-hidden">
        {loading || loadedPageType !== pageType ? (
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
            initialSlotFlow={(layout?.slotFlow as SlotFlowId) || undefined}
            initialClipStyle={(layout?.clipStyle as ClipStyleId) || undefined}
            pageType={pageType}
          />
        )}
      </div>
    </div>
  );
}
