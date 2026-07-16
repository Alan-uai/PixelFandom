'use client';

import { useEffect, useState, useRef, Suspense, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { PageBuilderEditor } from '@/components/page-builder/page-builder-editor';
import { WidgetsPage } from '@/components/page-builder/widgets-page';
import { Loader2, ArrowLeft, LayoutDashboard, Footprints, FileQuestion, Puzzle } from 'lucide-react';
import Link from 'next/link';
import { useCachedData } from '@/hooks/use-cached-data';
import { supabase } from '@/supabase';
import { useRegisterUnsavedChanges } from '@/components/unsaved-changes';

const PAGE_TYPES = [
  { id: 'landing', labelKey: 'landing', icon: LayoutDashboard },
  { id: 'footer', labelKey: 'footer', icon: Footprints },
  { id: '404', labelKey: 'not_found', icon: FileQuestion },
  { id: 'widgets', labelKey: 'widgets', icon: Puzzle },
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
  const t = useTranslations('pageBuilder');
  const pageType = (searchParams.get('type') as PageType) || 'landing';
  const [layout, setLayout] = useState<{ blocks: any[]; floatingIslands: any[]; slotFlow?: string; clipStyle?: string; singleIslandWidth?: number } | null>(null);
  const [loadedPageType, setLoadedPageType] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const saveBlocksRef = useRef<(() => Promise<void>) | null>(null);
  const saveWidgetsRef = useRef<(() => Promise<void>) | null>(null);

  const { data: tenant } = useCachedData<{ id: string }>(
    `tenant:${slug}`,
    async () => {
      const { data } = await supabase.from('tenants').select('id').eq('slug', slug).single();
      return data!;
    }
  );
  const tenantId = tenant?.id ?? null;

  const isWidgets = pageType === 'widgets';
  const cacheKey = !isWidgets && tenantId ? `page-layout:${tenantId}:${pageType}` : null;
  const { data: layoutData, loading, error: layoutError, updateCache } = useCachedData<{ blocks: any[]; floatingIslands: any[]; slotFlow?: string; clipStyle?: string; singleIslandWidth?: number }>(
    cacheKey,
    async () => {
      const res = await fetch(`/api/tenants/${tenantId}/page-layout?type=${pageType}`);
      if (!res.ok) {
        const text = await res.text().catch(() => 'Unknown error');
        throw new Error(`API error ${res.status}: ${text}`);
      }
      const json = await res.json();
      return { blocks: json?.blocks || [], floatingIslands: json?.floatingIslands || [], slotFlow: json?.slotFlow, clipStyle: json?.clipStyle };
    }
  );

  useEffect(() => {
    if (layoutData) {
      setLayout(layoutData);
      setLoadedPageType(pageType);
    }
  }, [layoutData, pageType]);

  const handleTypeChange = (type: string) => {
    router.push(`/dashboard/${slug}/page-builder?type=${type}`);
  };

  const handleSave = useCallback(async () => {
    if (saveBlocksRef.current) await saveBlocksRef.current();
    if (saveWidgetsRef.current) await saveWidgetsRef.current();
  }, []);

  const handleDiscard = useCallback(() => {
    window.location.reload();
  }, []);

  useRegisterUnsavedChanges({ isDirty, onSave: handleSave, onDiscard: handleDiscard });

  const registerBlocksSave = useCallback((fn: () => Promise<void>) => {
    saveBlocksRef.current = fn;
  }, []);

  const registerWidgetsSave = useCallback((fn: () => Promise<void>) => {
    saveWidgetsRef.current = fn;
  }, []);

  if (!tenantId) {
    return <p className="p-6 text-muted-foreground">{t('wiki_not_found')}</p>;
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
          <h1 className="text-sm font-medium">{t('title')}</h1>
          <p className="text-[10px] text-muted-foreground">
            {t('description')}
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
              {t('types.' + pt.labelKey)}
            </button>
          );
        })}
      </div>
      <div className="flex-1 overflow-hidden">
        {isWidgets ? (
          <WidgetsPage
            tenantId={tenantId}
            slug={slug}
            onRegisterSave={registerWidgetsSave}
            onDirtyChange={setIsDirty}
          />
        ) : layoutError ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-destructive text-sm">{t('layout_error', { message: layoutError.message })}</p>
          </div>
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
            pageType={pageType}
            onRegisterSave={registerBlocksSave}
            onDirtyChange={setIsDirty}
            onSaveSuccess={(data) => {
              updateCache({
                blocks: data.blocks,
                floatingIslands: layout?.floatingIslands || [],
                slotFlow: layout?.slotFlow,
                clipStyle: layout?.clipStyle,
                singleIslandWidth: layout?.singleIslandWidth,
              });
            }}
          />
        )}
      </div>
    </div>
  );
}
