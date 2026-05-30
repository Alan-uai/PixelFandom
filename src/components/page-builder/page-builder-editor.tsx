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
import { BlockToolbar, BLOCK_DEFINITIONS } from './block-toolbar';
import { BlockConfigPanel } from './block-config-panel';
import { PagePreview } from './page-preview';
import { FloatingIslandsEditor } from './floating-islands-editor';
import { Save, Loader2, Check, Plus, X, PanelRightOpen, PanelRightClose, LayoutList, Undo2, Redo2, Smartphone } from 'lucide-react';
import type { BlockConfig, BlockType, PageLayout, FloatingIslandConfig } from './types';

const MAX_HISTORY = 50;

interface PageBuilderEditorProps {
  tenantId: string;
  initialLayout?: PageLayout;
  initialFloatingIslands?: FloatingIslandConfig[];
  pageType?: string;
}

export function PageBuilderEditor({ tenantId, initialLayout, initialFloatingIslands, pageType = 'landing' }: PageBuilderEditorProps) {
  const [blocks, setBlocks] = useState<BlockConfig[]>(initialLayout?.blocks || []);
  const [floatingIslands, setFloatingIslands] = useState<FloatingIslandConfig[]>(initialFloatingIslands || []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'blocks' | 'islands'>('blocks');
  const [mobilePreview, setMobilePreview] = useState(false);

  // undo/redo history
  const [history, setHistory] = useState<BlockConfig[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const pushHistory = useCallback((nextBlocks: BlockConfig[]) => {
    setHistory((prev) => {
      const trimmed = prev.slice(0, historyIndex + 1);
      const updated = [...trimmed, nextBlocks];
      if (updated.length > MAX_HISTORY) updated.shift();
      return updated;
    });
    setHistoryIndex((prev) => Math.min(prev + 1, MAX_HISTORY - 1));
  }, [historyIndex]);

  // push initial state
  useEffect(() => {
    if (history.length === 0 && blocks.length > 0) {
      setHistory([blocks]);
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
    useSensor(KeyboardSensor)
  );

  const selectedBlock = blocks.find((b) => b.id === selectedId) || null;

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
      const def = BLOCK_DEFINITIONS.find((b) => b.type === type);
      if (!def) return;

      const newBlock: BlockConfig = {
        id: nanoid(),
        type,
        config: { ...def.defaultConfig },
      };

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
        const next = arrayMove(blocks, oldIndex, newIndex);
        updateBlocks(next);
      }
    }
  }, [blocks, updateBlocks, pushHistory]);

  const handleUpdateBlock = useCallback((updated: BlockConfig) => {
    setBlocks((prev) => {
      const next = prev.map((b) => (b.id === updated.id ? updated : b));
      pushHistory(next);
      return next;
    });
  }, [pushHistory]);

  const handleDeleteBlock = useCallback((id: string) => {
    setBlocks((prev) => {
      const next = prev.filter((b) => b.id !== id);
      pushHistory(next);
      return next;
    });
    if (selectedId === id) setSelectedId(null);
  }, [selectedId, pushHistory]);

  const handleUndo = useCallback(() => {
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    setBlocks(history[newIndex]);
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    setBlocks(history[newIndex]);
  }, [historyIndex, history]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch(`/api/tenants/${tenantId}/page-layout?type=${pageType}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocks, floatingIslands }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        console.error('Save layout failed:', res.status, await res.text().catch(() => ''));
      }
    } catch (err) {
      console.error('Save layout error:', err);
    }
    setSaving(false);
  };

  const [showMobileToolbar, setShowMobileToolbar] = useState(false);
  const [showMobileConfig, setShowMobileConfig] = useState(false);

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
        {pageType === 'landing' && (
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

        <div className="flex-1" />

        {activeTab === 'blocks' && (
          <div className="flex items-center gap-1">
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Desfazer"
            >
              <Undo2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Refazer"
            >
              <Redo2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setMobilePreview((v) => !v)}
              className={`rounded-md p-1.5 transition-colors ${mobilePreview ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
              title="Preview mobile"
            >
              <Smartphone className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Blocks tab */}
      {activeTab === 'blocks' ? (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex flex-1 relative">
            {/* Desktop toolbar */}
            <div className="hidden md:block w-48 shrink-0 border-r bg-muted/30 p-3 overflow-y-auto">
              <BlockToolbar />
            </div>

            {/* Mobile toolbar toggle */}
            <div className="md:hidden fixed bottom-20 left-4 z-50">
              <button
                onClick={() => setShowMobileToolbar((v) => !v)}
                className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-lg"
              >
                {showMobileToolbar ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              </button>
            </div>

            {/* Mobile toolbar panel */}
            {showMobileToolbar && (
              <div className="md:hidden fixed inset-x-0 bottom-0 z-40 max-h-[50vh] rounded-t-xl border bg-background shadow-2xl p-4 overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Adicionar Bloco</span>
                  <button onClick={() => setShowMobileToolbar(false)}>
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <BlockToolbar />
              </div>
            )}

            <PagePreview
              blocks={blocks}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onDelete={handleDeleteBlock}
              tenantId={tenantId}
              mobilePreview={mobilePreview}
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
                {/* Desktop config panel */}
                <div className="hidden md:block">
                  <BlockConfigPanel
                    block={selectedBlock}
                    onUpdate={handleUpdateBlock}
                    onClose={() => setSelectedId(null)}
                  />
                </div>

                {/* Mobile config toggle */}
                <button
                  onClick={() => setShowMobileConfig(true)}
                  className="md:hidden fixed bottom-20 right-4 z-50 flex items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-lg"
                >
                  <PanelRightOpen className="h-5 w-5" />
                </button>

                {/* Mobile config panel overlay */}
                {showMobileConfig && (
                  <div className="md:hidden fixed inset-0 z-50 flex">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setShowMobileConfig(false)} />
                    <div className="relative ml-auto w-80 max-w-[85vw] h-full bg-background border-l shadow-2xl overflow-y-auto">
                      <BlockConfigPanel
                        block={selectedBlock}
                        onUpdate={handleUpdateBlock}
                        onClose={() => { setShowMobileConfig(false); setSelectedId(null); }}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </DndContext>
      ) : (
        /* Islands tab */
        <div className="flex-1 overflow-y-auto p-6">
          <FloatingIslandsEditor islands={floatingIslands} onChange={setFloatingIslands} />
        </div>
      )}

      {/* Save button (always visible) */}
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
          {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar Layout'}
        </button>
      </div>
    </div>
  );
}
