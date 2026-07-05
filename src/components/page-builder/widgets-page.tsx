'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { PanelsTopLeft, Settings, Loader2, Check, Save, Globe } from 'lucide-react';
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

export function WidgetsPage({ tenantId, slug }: { tenantId: string; slug: string }) {
  const [activeTab, setActiveTab] = useState<'islands' | 'widgets'>('islands');
  const [selectedTypes, setSelectedTypes] = useState<Set<PageTypeId>>(new Set(['all']));
  const [floatingIslands, setFloatingIslands] = useState<FloatingIslandConfig[]>([]);
  const [slotFlow, setSlotFlow] = useState<SlotFlowId>('current');
  const [clipStyle, setClipStyle] = useState<ClipStyleId>('trapezoid');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const islandCache = useRef<Record<string, any>>({});

  const resolveTargetTypes = useCallback(() => {
    if (selectedTypes.has('all')) return ['landing', 'footer', '404'];
    return Array.from(selectedTypes);
  }, [selectedTypes]);

  const loadIslands = useCallback(async (type: string) => {
    if (islandCache.current[type]) {
      const cached = islandCache.current[type];
      setFloatingIslands(cached.islands || []);
      if (cached.slotFlow) setSlotFlow(cached.slotFlow);
      if (cached.clipStyle) setClipStyle(cached.clipStyle);
      return;
    }
    try {
      const res = await fetch(`/api/tenants/${tenantId}/page-layout?type=${type}`);
      const data = await res.json();
      const islands = data?.floatingIslands || [];
      islandCache.current[type] = { islands, slotFlow: data.slotFlow, clipStyle: data.clipStyle };
      setFloatingIslands(islands);
      if (data.slotFlow) setSlotFlow(data.slotFlow);
      if (data.clipStyle) setClipStyle(data.clipStyle);
    } catch {
      setFloatingIslands([]);
    }
  }, [tenantId]);

  useEffect(() => {
    islandCache.current = {};
    const targets = resolveTargetTypes();
    loadIslands(targets[0]);
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

  const handleSaveIslands = async () => {
    setSaving(true);
    setSaved(false);
    setSaveError(null);
    const targets = resolveTargetTypes();
    let allOk = true;
    for (const type of targets) {
      try {
        const res = await fetch(`/api/tenants/${tenantId}/page-layout?type=${type}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ floatingIslands, slotFlow, clipStyle }),
        });
        if (!res.ok) allOk = false;
      } catch {
        allOk = false;
      }
    }
    if (allOk) {
      islandCache.current = {};
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      setSaveError('Erro ao salvar ilhas flutuantes');
      setTimeout(() => setSaveError(null), 5000);
    }
    setSaving(false);
  };

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
            onSlotFlowChange={setSlotFlow}
            onClipStyleChange={setClipStyle}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-6">
          <WidgetsEditor tenantId={tenantId} slug={slug} />
        </div>
      )}

      {saveError && (
        <div className="fixed bottom-24 right-6 z-50 max-w-sm rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive shadow-lg backdrop-blur-sm">
          {saveError}
        </div>
      )}

      {activeTab === 'islands' && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={handleSaveIslands}
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
            {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar Ilhas'}
          </button>
        </div>
      )}
    </div>
  );
}
