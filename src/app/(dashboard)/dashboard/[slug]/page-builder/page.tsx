'use client';

import { useEffect, useState, useRef, Suspense, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { PageBuilderEditor } from '@/components/page-builder/page-builder-editor';
import { WidgetsPage } from '@/components/page-builder/widgets-page';
import { Loader2, ArrowLeft, LayoutDashboard, Footprints, FileQuestion, Puzzle, Save, Check } from 'lucide-react';
import Link from 'next/link';
import { useCachedData } from '@/hooks/use-cached-data';
import { supabase } from '@/supabase';

const PAGE_TYPES = [
  { id: 'landing', label: 'Landing Page', icon: LayoutDashboard },
  { id: 'footer', label: 'Footer', icon: Footprints },
  { id: '404', label: 'Página 404', icon: FileQuestion },
  { id: 'widgets', label: 'Widgets', icon: Puzzle },
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
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const saveHandlerRef = useRef<(() => Promise<void>) | null>(null);

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

  const handleSave = async () => {
    if (!saveHandlerRef.current) return;
    setSaving(true);
    setSaved(false);
    setSaveError(null);
    try {
      await saveHandlerRef.current();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setSaveError(e?.message || 'Erro ao salvar');
      setTimeout(() => setSaveError(null), 5000);
    }
    setSaving(false);
  };

  const registerSave = useCallback((fn: () => Promise<void>) => {
    saveHandlerRef.current = fn;
  }, []);

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
        {isWidgets ? (
          <WidgetsPage tenantId={tenantId} slug={slug} onRegisterSave={registerSave} />
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
            onRegisterSave={registerSave}
          />
        )}
      </div>

      {saveError && (
        <div className="fixed bottom-24 right-6 z-50 max-w-sm rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive shadow-lg backdrop-blur-sm">
          {saveError}
        </div>
      )}

      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <Check className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar'}
        </button>
      </div>
    </div>
  );
}
