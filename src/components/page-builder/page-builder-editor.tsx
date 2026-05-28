'use client';

import { useState, useCallback, useEffect } from 'react';
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
import { Save, Loader2, Check, Plus, X, PanelRightOpen, PanelRightClose } from 'lucide-react';
import type { BlockConfig, BlockType, PageLayout } from './types';

interface PageBuilderEditorProps {
  tenantSlug: string;
  initialLayout?: PageLayout;
}

export function PageBuilderEditor({ tenantSlug, initialLayout }: PageBuilderEditorProps) {
  const [blocks, setBlocks] = useState<BlockConfig[]>(initialLayout?.blocks || []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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

      const overIndex = blocks.findIndex((b) => b.id === over.id);
      if (overIndex >= 0) {
        setBlocks((prev) => [...prev.slice(0, overIndex + 1), newBlock, ...prev.slice(overIndex + 1)]);
      } else {
        setBlocks((prev) => [...prev, newBlock]);
      }
      setSelectedId(newBlock.id);
      return;
    }

    if (active.id !== over.id) {
      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      const newIndex = blocks.findIndex((b) => b.id === over.id);
      if (oldIndex >= 0 && newIndex >= 0) {
        setBlocks((prev) => arrayMove(prev, oldIndex, newIndex));
      }
    }
  }, [blocks]);

  const handleUpdateBlock = useCallback((updated: BlockConfig) => {
    setBlocks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  }, []);

  const handleDeleteBlock = useCallback((id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    if (selectedId === id) setSelectedId(null);
  }, [selectedId]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/page-layout`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocks }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error('Save layout error:', err);
    }
    setSaving(false);
  };

  const [showMobileToolbar, setShowMobileToolbar] = useState(false);
  const [showMobileConfig, setShowMobileConfig] = useState(false);

  return (
    <div className="flex h-full relative">
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

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <PagePreview
          blocks={blocks}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onDelete={handleDeleteBlock}
        />

        <DragOverlay>
          {activeId && (
            <div className="rounded-lg border bg-card px-4 py-3 shadow-lg text-sm">
              Adicionar bloco...
            </div>
          )}
        </DragOverlay>
      </DndContext>

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

      {blocks.length > 0 && (
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
      )}
    </div>
  );
}
