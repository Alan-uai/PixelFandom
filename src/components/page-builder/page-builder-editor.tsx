'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { nanoid } from 'nanoid';
import { BlockToolbar } from './block-toolbar';
import { BlockConfigPanel } from './block-config-panel';
import { PagePreview } from './page-preview';
import { FloatingIslandsEditor } from './floating-islands-editor';
import { WidgetsEditor } from './widgets-editor';
import {
  Save, Loader2, Check, Plus, X, PanelRightOpen,
  LayoutList, Undo2, Redo2, Smartphone, BookTemplate, Settings2,
} from 'lucide-react';
import type { BlockConfig, BlockType, PageLayout, FloatingIslandConfig, SlotFlowId, ClipStyleId } from './types';
import { BLOCK_REGISTRY } from '@/lib/block-registry';
import { TemplateLibrary } from './template-library';

const MAX_HISTORY = 50;

interface PageBuilderEditorProps {
  tenantId: string;
  slug?: string;
  initialLayout?: PageLayout;
  initialFloatingIslands?: FloatingIslandConfig[];
  initialSlotFlow?: SlotFlowId;
  initialClipStyle?: ClipStyleId;
  pageType?: string;
}

function createBlock(type: BlockType): BlockConfig {
  const def = BLOCK_REGISTRY.find((b) => b.type === type);
  const config = def ? { ...def.defaultConfig } : {};

  const block: BlockConfig = {
    id: nanoid(),
    type,
    config,
  };

  if (type === 'section') {
    block.children = Array.from({ length: config.columns as number || 1 }).map((_, _i) => ({
      id: nanoid(),
      type: 'column' as BlockType,
      config: { width: `${100 / ((config.columns as number) || 1)}%`, verticalAlign: 'top' },
      children: [],
    }));
  }

  return block;
}

export function PageBuilderEditor({
  tenantId, slug, initialLayout, initialFloatingIslands, initialSlotFlow, initialClipStyle, pageType = 'landing',
}: PageBuilderEditorProps) {
  const [blocks, setBlocks] = useState<BlockConfig[]>(initialLayout?.blocks || []);
  const [floatingIslands, setFloatingIslands] = useState<FloatingIslandConfig[]>(initialFloatingIslands || []);
  const [slotFlow, setSlotFlow] = useState<SlotFlowId>(initialSlotFlow || 'current');
  const [clipStyle, setClipStyle] = useState<ClipStyleId>(initialClipStyle || 'trapezoid');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'blocks' | 'islands' | 'widgets'>('blocks');
  const [mobilePreview, setMobilePreview] = useState(false);
  const [showMobileToolbar, setShowMobileToolbar] = useState(false);
  const [showMobileConfig, setShowMobileConfig] = useState(false);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);

  const [history, setHistory] = useState<BlockConfig[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const historyIndexRef = useRef(historyIndex);

  useEffect(() => { historyIndexRef.current = historyIndex; }, [historyIndex]);

  const pushHistory = useCallback((nextBlocks: BlockConfig[]) => {
    setHistory((prev) => {
      const trimmed = prev.slice(0, historyIndexRef.current + 1);
      const updated = [...trimmed, JSON.parse(JSON.stringify(nextBlocks))];
      if (updated.length > MAX_HISTORY) updated.shift();
      return updated;
    });
    setHistoryIndex((prev) => Math.min(prev + 1, MAX_HISTORY - 1));
  }, []);

  useEffect(() => {
    if (history.length === 0 && blocks.length > 0) {
      setHistory([JSON.parse(JSON.stringify(blocks))]);
      setHistoryIndex(0);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateBlocks = useCallback((next: BlockConfig[]) => {
    setBlocks(next);
    pushHistory(next);
  }, [pushHistory]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const selectedBlock = findBlock(blocks, selectedId);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeData = event.active.data.current;

    if (activeData?.isNew) {
      const type = activeData.type as BlockType;
      const newBlock = createBlock(type);

      setBlocks((prev) => {
        const overIndex = prev.findIndex((b) => b.id === over.id);
        const next = overIndex >= 0
          ? [...prev.slice(0, overIndex + 1), newBlock, ...prev.slice(overIndex + 1)]
          : [...prev, newBlock];
        pushHistory(next);
        return next;
      });
      setSelectedId(newBlock.id);
      return;
    }

    if (active.id !== over.id) {
      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      const newIndex = blocks.findIndex((b) => b.id === over.id);
      if (oldIndex >= 0 && newIndex >= 0) {
        updateBlocks(arrayMove(blocks, oldIndex, newIndex));
      }
    }
  }, [blocks, updateBlocks, pushHistory]);

  const handleUpdateBlock = useCallback((updated: BlockConfig) => {
    setBlocks((prev) => {
      const next = replaceBlock(prev, updated);
      pushHistory(next);
      return next;
    });
  }, [pushHistory]);

  const handleDeleteBlock = useCallback((id: string) => {
    setBlocks((prev) => {
      const next = removeBlock(prev, id);
      pushHistory(next);
      return next;
    });
    if (selectedId === id) setSelectedId(null);
  }, [selectedId, pushHistory]);

  const handleUndo = useCallback(() => {
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    setBlocks(JSON.parse(JSON.stringify(history[newIndex])));
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    setBlocks(JSON.parse(JSON.stringify(history[newIndex])));
  }, [historyIndex, history]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setSaveError(null);
    try {
      const res = await fetch(`/api/tenants/${tenantId}/page-layout?type=${pageType}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocks, floatingIslands, slotFlow, clipStyle }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const body = await res.json().catch(() => null);
        const msg = body?.error || `Erro ao salvar (${res.status})`;
        setSaveError(msg);
        setTimeout(() => setSaveError(null), 5000);
      }
    } catch (_err) {
      setSaveError('Erro de rede ao salvar layout');
      setTimeout(() => setSaveError(null), 5000);
    }
    setSaving(false);
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex items-center border-b shrink-0 px-4">
        <button
          onClick={() => setActiveTab('blocks')}
          className={`flex items-center gap-2 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
            activeTab === 'blocks'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <LayoutList className="h-3.5 w-3.5" />
          Blocos
        </button>
        {(pageType === 'landing' || pageType === '404') && (
          <button
            onClick={() => setActiveTab('islands')}
            className={`flex items-center gap-2 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'islands'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <PanelRightOpen className="h-3.5 w-3.5" />
            Ilhas Flutuantes
          </button>
        )}
        <button
          onClick={() => setActiveTab('widgets')}
          className={`flex items-center gap-2 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
            activeTab === 'widgets'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Settings2 className="h-3.5 w-3.5" />
          Widgets
        </button>

        <div className="flex-1" />

        <div className="flex items-center gap-1">
          <button onClick={() => setShowTemplateLibrary(true)}
            className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Biblioteca de Templates"
          >
            <BookTemplate className="h-3.5 w-3.5" />
          </button>
          {activeTab === 'blocks' && (
            <>
              <button onClick={handleUndo} disabled={!canUndo}
                className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Desfazer"
              >
                <Undo2 className="h-3.5 w-3.5" />
              </button>
              <button onClick={handleRedo} disabled={!canRedo}
                className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Refazer"
              >
                <Redo2 className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setMobilePreview((v) => !v)}
                className={`rounded-md p-1.5 transition-colors ${mobilePreview ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                title="Preview mobile"
              >
                <Smartphone className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Blocks tab */}
      {activeTab === 'blocks' ? (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex flex-1 relative">
            {/* Desktop toolbar */}
            <div className="hidden md:block w-48 shrink-0 border-r bg-muted/30 p-3 overflow-y-auto">
              <BlockToolbar pageType={pageType} />
            </div>

            {/* Mobile toolbar toggle */}
            <div className="md:hidden fixed bottom-20 left-4 z-50">
              <button onClick={() => setShowMobileToolbar((v) => !v)}
                className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-lg"
              >
                {showMobileToolbar ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              </button>
            </div>

            {showMobileToolbar && (
              <div className="md:hidden fixed inset-x-0 bottom-0 z-40 max-h-[50vh] rounded-t-xl border bg-background shadow-2xl p-4 overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Adicionar Bloco</span>
                  <button onClick={() => setShowMobileToolbar(false)}><X className="h-4 w-4" /></button>
                </div>
                <BlockToolbar pageType={pageType} />
              </div>
            )}

            <PagePreview
              blocks={blocks} selectedId={selectedId} onSelect={setSelectedId}
              onDelete={handleDeleteBlock} tenantId={tenantId} mobilePreview={mobilePreview}
            />

            <DragOverlay>
              {activeId && (
                <div className="rounded-lg border bg-card px-4 py-3 shadow-lg text-sm">
                  Adicionar bloco...
                </div>
              )}
            </DragOverlay>

            {selectedBlock && (
              <>
                <div className="hidden md:block">
                  <BlockConfigPanel block={selectedBlock} onUpdate={handleUpdateBlock} onClose={() => setSelectedId(null)} tenantId={slug} />
                </div>
                <button onClick={() => setShowMobileConfig(true)}
                  className="md:hidden fixed bottom-20 right-4 z-50 flex items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-lg"
                >
                  <PanelRightOpen className="h-5 w-5" />
                </button>
                {showMobileConfig && (
                  <div className="md:hidden fixed inset-0 z-50 flex">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setShowMobileConfig(false)} />
                    <div className="relative ml-auto w-80 max-w-[85vw] h-full bg-background border-l shadow-2xl overflow-y-auto">
                      <BlockConfigPanel block={selectedBlock} onUpdate={handleUpdateBlock}
                        onClose={() => { setShowMobileConfig(false); setSelectedId(null); }}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </DndContext>
      ) : activeTab === 'islands' ? (
        <div className="flex-1 overflow-y-auto p-6">
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
          <WidgetsEditor tenantId={tenantId} slug={slug || tenantId} />
        </div>
      )}

      {showTemplateLibrary && (
        <TemplateLibrary
          tenantId={tenantId}
          onApply={(templateBlocks) => {
            setBlocks(templateBlocks);
            pushHistory(templateBlocks);
          }}
          onClose={() => setShowTemplateLibrary(false)}
        />
      )}

      {showSaveTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowSaveTemplate(false)} />
          <div className="relative w-full max-w-md bg-background rounded-xl border shadow-2xl p-6">
            <h3 className="text-sm font-medium mb-4">Salvar como Template</h3>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Nome do template"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-primary mb-4"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowSaveTemplate(false)}
                className="rounded-md px-4 py-2 text-xs font-medium bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancelar
              </button>
              <button onClick={async () => {
                if (!templateName.trim()) return;
                try {
                  await fetch(`/api/tenants/${tenantId}/templates`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: templateName, blocks }),
                  });
                } catch (e) {
                  console.error('Save template error:', e);
                }
                setShowSaveTemplate(false);
                setTemplateName('');
              }}
                className="rounded-md px-4 py-2 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error toast */}
      {saveError && (
        <div className="fixed bottom-24 right-6 z-50 max-w-sm rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive shadow-lg backdrop-blur-sm">
          {saveError}
        </div>
      )}

      {/* Save buttons */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
        <button onClick={() => setShowSaveTemplate(true)}
          className="flex items-center gap-2 rounded-full border bg-background px-4 py-3 text-sm font-medium text-foreground shadow-lg hover:bg-muted transition-colors"
        >
          <BookTemplate className="h-4 w-4" />
          Salvar Template
        </button>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar Layout'}
        </button>
      </div>
    </div>
  );
}

// Tree helpers
function findBlock(blocks: BlockConfig[], id: string | null): BlockConfig | null {
  if (!id) return null;
  for (const b of blocks) {
    if (b.id === id) return b;
    if (b.children) {
      const found = findBlock(b.children, id);
      if (found) return found;
    }
  }
  return null;
}

function replaceBlock(blocks: BlockConfig[], updated: BlockConfig): BlockConfig[] {
  return blocks.map((b) => {
    if (b.id === updated.id) return updated;
    if (b.children) return { ...b, children: replaceBlock(b.children, updated) };
    return b;
  });
}

function removeBlock(blocks: BlockConfig[], id: string): BlockConfig[] {
  return blocks.filter((b) => {
    if (b.id === id) return false;
    if (b.children) b.children = removeBlock(b.children, id);
    return true;
  });
}
