'use client';

import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { BlockType, BlockDefinition } from './types';
import { BLOCK_REGISTRY, CATEGORIES, FOOTER_BLOCK_TYPES, ERROR_BLOCK_TYPES, getBlocksByCategory } from '@/lib/block-registry';
import { Search, type LucideIcon } from 'lucide-react';

function DraggableBlock({ def }: { def: BlockDefinition }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `new-${def.type}`,
    data: { type: def.type, isNew: true },
  });
  const Icon = def.icon;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm cursor-grab hover:border-primary/50 transition-colors touch-none"
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <Icon className="h-4 w-4 text-primary shrink-0" />
      <span className="truncate">{def.label}</span>
      <span className="ml-auto text-[10px] text-muted-foreground">{def.category}</span>
    </div>
  );
}

export function BlockToolbar({ pageType }: { pageType?: string }) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const is404 = pageType === '404';

  const filtered = BLOCK_REGISTRY.filter((b) => {
    if (b.type === 'column' || b.type === 'template-part') return false;

    if (is404) {
      if (!ERROR_BLOCK_TYPES.includes(b.type as BlockType)) return false;
    } else if (pageType === 'footer') {
      if (!FOOTER_BLOCK_TYPES.includes(b.type as BlockType)) return false;
    } else {
      if (b.category === 'error') return false;
    }

    if (search) return b.label.toLowerCase().includes(search.toLowerCase());
    if (activeCategory) return b.category === activeCategory;
    return true;
  });

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar blocos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border bg-background pl-7 pr-2 py-1.5 text-xs outline-none focus:border-primary"
        />
      </div>

      {!search && (
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setActiveCategory(null)}
            className={`rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${!activeCategory ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
          >
            Todos
          </button>
          {CATEGORIES.map((cat) => {
            if (is404 && cat.id === 'footer') return null;
            if (is404 && cat.id === 'dynamic') return null;
            if (!is404 && cat.id === 'error') return null;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                className={`rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${activeCategory === cat.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      )}

      <div className="space-y-1">
        {filtered.length > 0 ? (
          filtered.map((def) => <DraggableBlock key={def.type} def={def} />)
        ) : (
          <p className="text-xs text-muted-foreground text-center py-4">Nenhum bloco encontrado</p>
        )}
      </div>
    </div>
  );
}

export { BLOCK_REGISTRY };
