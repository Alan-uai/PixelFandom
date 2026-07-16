'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { PanelsTopLeft, Settings, Globe } from 'lucide-react';
import { FloatingIslandsEditor } from './floating-islands-editor';
import { WidgetsEditor } from './widgets-editor';
import type { FloatingIslandConfig, SlotFlowId, ClipStyleId } from './types';

const PAGE_TYPE_OPTIONS = [
  { id: 'all', label: 'Todos' },
  { id: 'landing', label: 'Landing Page' },
  { id: 'footer', label: 'Footer' },
  { id: '404', label: 'Página 404' },
] as const;

type PageTypeId = (typeof PAGE_TYPE_OPTIONS)[number]['id'];

export function WidgetsPage({ tenantId, slug, onRegisterSave, onDirtyChange }: { tenantId: string; slug: string; onRegisterSave?: (fn: () => Promise<void>) => void; onDirtyChange?: (dirty: boolean) => void }) {
  const [activeTab, setActiveTab] = useState<'islands' | 'widgets'>('islands');
  const [selectedTypes, setSelectedTypes] = useState<Set<PageTypeId>>(new Set(['all']));
  const [floatingIslands, setFloatingIslands] = useState<FloatingIslandConfig[]>([]);
  const [slotFlow, setSlotFlow] = useState<SlotFlowId>('current');
  const [clipStyle, setClipStyle] = useState<ClipStyleId>('trapezoid');
  const [singleIslandWidth, setSingleIslandWidth] = useState<number | undefined>(undefined);
  const islandCache = useRef<Record<string, any>>({});
  const loadControllers = useRef<Record<string, AbortController>>({});
  const [widgetsSave, setWidgetsSave] = useState<(() => Promise<void>) | null>(null);
  const [widgetsDirty, setWidgetsDirty] = useState(false);
  const islandsSnapshot = useRef<string>('');

  const resolveTargetTypes = useCallback(() => {
    if (selectedTypes.has('all')) return ['landing', 'footer', '404'];
    return Array.from(selectedTypes);
  }, [selectedTypes]);

  const applyState = useCallback((type: string) => {
    const cached = islandCache.current[type];
    if (!cached) {
      setFloatingIslands([]);
      return;
    }
    setFloatingIslands(cached.islands || []);
    if (cached.slotFlow) setSlotFlow(cached.slotFlow);
    if (cached.clipStyle) setClipStyle(cached.clipStyle);
    setSingleIslandWidth(cached.singleIslandWidth ?? undefined);
  }, []);

  const loadIslands = useCallback(async (type: string, apply: boolean = true) => {
    loadControllers.current[type]?.abort();
    const controller = new AbortController();
    loadControllers.current[type] = controller;

    if (islandCache.current[type]) {
      if (apply) applyState(type);
      islandsSnapshot.current = JSON.stringify(islandCache.current[type]);
      return;
    }
    try {
      const res = await fetch(`/api/tenants/${tenantId}/page-layout?type=${type}`, { signal: controller.signal });
      const data = await res.json();
      const snapshot = { islands: data?.floatingIslands || [], slotFlow: data.slotFlow || 'current', clipStyle: data.clipStyle || 'trapezoid', singleIslandWidth: data.singleIslandWidth ?? undefined };
      islandCache.current[type] = snapshot;
      if (apply) applyState(type);
      islandsSnapshot.current = JSON.stringify(snapshot);
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      const defaultSnapshot = { islands: [], slotFlow: 'current' as const, clipStyle: 'trapezoid' as const, singleIslandWidth: undefined };
      islandCache.current[type] = defaultSnapshot;
      if (apply) {
        setFloatingIslands([]);
        islandsSnapshot.current = JSON.stringify(defaultSnapshot);
      }
    }
  }, [tenantId, applyState]);

  useEffect(() => {
    islandCache.current = {};
    const targets = resolveTargetTypes();
    targets.forEach((type, i) => loadIslands(type, i === 0));
  }, [tenantId, selectedTypes, loadIslands, resolveTargetTypes]);

  const toggleType = (id: PageTypeId) => {
    const next = new Set(selectedTypes);
    if (id === 'all') {
      if (next.has('all')) {
        next.clear();
        next.add('landing');
      } else {
        next.clear();
        next.add('all');
      }
    } else {
      next.delete('all');
      if (next.has(id)) next.delete(id);
      else next.add(id);
      if (next.size === 0) next.add('all');
    }
    setSelectedTypes(next);
  };

  const handleSaveIslands = useCallback(async () => {
    const targets = resolveTargetTypes();
    let allOk = true;
    for (const type of targets) {
      try {
        const res = await fetch(`/api/tenants/${tenantId}/page-layout?type=${type}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ floatingIslands, slotFlow, clipStyle, singleIslandWidth }),
        });
        if (!res.ok) allOk = false;
      } catch {
        allOk = false;
      }
    }
    if (!allOk) {
      throw new Error('Erro ao salvar ilhas flutuantes');
    }
    const snapshot = { islands: floatingIslands, slotFlow, clipStyle, singleIslandWidth };
    islandsSnapshot.current = JSON.stringify(snapshot);
    for (const type of targets) {
      islandCache.current[type] = snapshot;
    }
  }, [tenantId, floatingIslands, slotFlow, clipStyle, singleIslandWidth, resolveTargetTypes]);

  const handleSave = useCallback(async () => {
    await handleSaveIslands();
    await widgetsSave?.();
  }, [handleSaveIslands, widgetsSave]);

  useEffect(() => {
    onRegisterSave?.(handleSave);
  }, [onRegisterSave, handleSave]);

  useEffect(() => {
    const islandsDirty = islandsSnapshot.current
      ? JSON.stringify({ floatingIslands, slotFlow, clipStyle, singleIslandWidth }) !== islandsSnapshot.current
      : false;
    onDirtyChange?.(islandsDirty || widgetsDirty);
  }, [floatingIslands, slotFlow, clipStyle, singleIslandWidth, widgetsDirty, onDirtyChange]);

  return (
    <div className="flex flex-col h-full">
      {/* Sub-tab bar */}
      <div className="flex items-center border-b shrink-0 px-4 gap-1">
        <button
          onClick={() => setActiveTab('islands')}
          className={`flex items-center gap-2 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
            activeTab === 'islands'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <PanelsTopLeft className="h-3.5 w-3.5" />
          Ilhas Flutuantes
        </button>
        <button
          onClick={() => setActiveTab('widgets')}
          className={`flex items-center gap-2 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
            activeTab === 'widgets'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Settings className="h-3.5 w-3.5" />
          Widgets
        </button>
      </div>

      {activeTab === 'islands' ? (
        <div className="flex-1 overflow-y-auto p-6">
          {/* Page type multiselect */}
          <div className="mb-4 space-y-2">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Globe className="h-3 w-3" />
              Aplicar ilhas flutuantes para:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PAGE_TYPE_OPTIONS.map((opt) => {
                const isSelected = selectedTypes.has(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleType(opt.id)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                      isSelected
                        ? 'bg-primary/10 text-primary border border-primary/30'
                        : 'bg-muted text-muted-foreground border border-transparent hover:text-foreground'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
          <FloatingIslandsEditor
            islands={floatingIslands}
            onChange={setFloatingIslands}
            slotFlow={slotFlow}
            clipStyle={clipStyle}
            singleIslandWidth={singleIslandWidth}
            onSlotFlowChange={setSlotFlow}
            onClipStyleChange={setClipStyle}
            onSingleIslandWidthChange={setSingleIslandWidth}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-6">
          <WidgetsEditor tenantId={tenantId} slug={slug} onSaveReady={setWidgetsSave} onDirtyChange={setWidgetsDirty} />
        </div>
      )}
    </div>
  );
}
