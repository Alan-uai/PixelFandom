'use client';

import { useState, useCallback } from 'react';
import { DndContext, useDraggable, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import type { CardPosition, CardPositions } from './types';

const DEFAULT_POSITIONS: CardPositions = {
  follow: { edge: 'top', offsetPct: 95 },
  vote: { edge: 'bottom', offsetPct: 95 },
};

type Props = {
  value: CardPositions;
  onChange: (value: CardPositions) => void;
};

function DraggableSymbol({
  id,
  label,
  edge,
  offsetPct,
  isDragging,
}: {
  id: string;
  label: string;
  edge: string;
  offsetPct: number;
  isDragging: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });

  const edgePositions: Record<string, { top: string; left: string }> = {
    top: { top: '-10px', left: `${offsetPct}%` },
    bottom: { top: 'calc(100% - 10px)', left: `${offsetPct}%` },
    left: { top: `${offsetPct}%`, left: '-10px' },
    right: { top: `${offsetPct}%`, left: 'calc(100% - 10px)' },
  };

  const pos = edgePositions[edge] || edgePositions.top;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        'absolute z-30 flex items-center justify-center w-8 h-6 rounded text-xs font-bold cursor-grab active:cursor-grabbing select-none transition-shadow',
        isDragging ? 'shadow-lg ring-2 ring-primary scale-110' : 'shadow-sm',
        id === 'follow-drag'
          ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
          : 'bg-primary/20 border border-primary/40 text-primary'
      )}
      style={{
        top: pos.top,
        left: pos.left,
        transform: transform
          ? `translate(-50%, -50%) translate(${transform.x}px, ${transform.y}px)`
          : 'translate(-50%, -50%)',
      }}
    >
      {label}
    </div>
  );
}

function snapToEdge(x: number, y: number, size: number): CardPosition {
  const half = size / 2;

  if (y < half) {
    return { edge: 'top', offsetPct: Math.round((x / size) * 100) };
  }
  if (y > size - half) {
    return { edge: 'bottom', offsetPct: Math.round((x / size) * 100) };
  }
  if (x < half) {
    return { edge: 'left', offsetPct: Math.round((y / size) * 100) };
  }
  return { edge: 'right', offsetPct: Math.round((y / size) * 100) };
}

export function CardPositionEditor({ value, onChange }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const follow = value?.follow || DEFAULT_POSITIONS.follow;
  const vote = value?.vote || DEFAULT_POSITIONS.vote;

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      const { active, delta } = event;
      const id = String(active.id);

      if (delta.x === 0 && delta.y === 0) return;

      const SQUARE_SIZE = 256;
      const centerX = SQUARE_SIZE / 2;
      const centerY = SQUARE_SIZE / 2;
      const current = id === 'follow-drag' ? follow : vote;
      const edgeOffsets: Record<string, { x: number; y: number }> = {
        top: { x: (current.offsetPct / 100) * SQUARE_SIZE, y: 0 },
        bottom: { x: (current.offsetPct / 100) * SQUARE_SIZE, y: SQUARE_SIZE },
        left: { x: 0, y: (current.offsetPct / 100) * SQUARE_SIZE },
        right: { x: SQUARE_SIZE, y: (current.offsetPct / 100) * SQUARE_SIZE },
      };
      const start = edgeOffsets[current.edge] || edgeOffsets.top;
      const newX = Math.max(0, Math.min(SQUARE_SIZE, start.x + delta.x));
      const newY = Math.max(0, Math.min(SQUARE_SIZE, start.y + delta.y));
      const snapped = snapToEdge(newX, newY, SQUARE_SIZE);

      if (id === 'follow-drag') {
        onChange({ ...value || DEFAULT_POSITIONS, follow: snapped });
      } else {
        onChange({ ...value || DEFAULT_POSITIONS, vote: snapped });
      }
    },
    [value, onChange, follow, vote]
  );

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col items-center gap-4">
        <div
          className="relative w-64 h-64 rounded-xl border-2 border-dashed border-muted-foreground/40 bg-card/50"
          style={{ touchAction: 'none' }}
        >
          <DraggableSymbol
            id="follow-drag"
            label="★"
            edge={follow.edge}
            offsetPct={follow.offsetPct}
            isDragging={activeId === 'follow-drag'}
          />
          <DraggableSymbol
            id="vote-drag"
            label="▲▼"
            edge={vote.edge}
            offsetPct={vote.offsetPct}
            isDragging={activeId === 'vote-drag'}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Arraste ★ e ▲▼ para reposicionar ao redor da borda do card
        </p>
      </div>
    </DndContext>
  );
}
