'use client';

import { memo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import type { BlockConfig } from './types';
import { BlockRenderer } from './block-renderer';

const SortableBlock = memo(function SortableBlock({
  block,
  isSelected,
  onSelect,
  onDelete,
  tenantId,
}: {
  block: BlockConfig;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  tenantId?: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
    data: { type: block.type, isNew: false },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isContainer = block.type === 'section';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-xl border-2 transition-colors ${isSelected ? 'border-primary' : 'border-transparent hover:border-muted-foreground/30'} ${isContainer ? 'bg-muted/10' : ''}`}
      onClick={onSelect}
    >
      <div className="absolute -top-3 left-2 z-10 flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        <button
          {...attributes}
          {...listeners}
          className="rounded-md bg-background border px-1.5 py-1 text-muted-foreground hover:text-foreground cursor-grab touch-none"
        >
          <GripVertical className="h-3 w-3" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="rounded-md bg-background border px-1.5 py-1 text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-3 w-3" />
        </button>
        {isContainer && (
          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {(block.children?.length || 0)} blocos
          </span>
        )}
      </div>
      <div className={`p-4 ${isContainer ? 'p-2' : ''}`}>
        <BlockRenderer block={block} tenantId={tenantId} preview />
      </div>
    </div>
  );
});

export function PagePreview({
  blocks,
  selectedId,
  onSelect,
  onDelete,
  tenantId,
  mobilePreview,
}: {
  blocks: BlockConfig[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  tenantId?: string;
  mobilePreview?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: 'page-drop-zone' });

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-h-[400px] p-6 space-y-6 overflow-y-auto ${isOver ? 'bg-primary/5' : ''} ${mobilePreview ? 'max-w-sm mx-auto border-x-4 border-border' : ''}`}
    >
      <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
        {blocks.length > 0 ? (
          blocks.map((block) => (
            <SortableBlock
              key={block.id}
              block={block}
              tenantId={tenantId}
              isSelected={selectedId === block.id}
              onSelect={() => onSelect(block.id)}
              onDelete={() => onDelete(block.id)}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border-2 border-dashed border-muted-foreground/25">
            <p className="text-sm text-muted-foreground">Arraste blocos da barra lateral para começar</p>
            <p className="text-xs text-muted-foreground mt-1">ou clique em + para adicionar</p>
          </div>
        )}
      </SortableContext>
    </div>
  );
}
