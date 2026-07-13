'use client';

import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { BlockType, BlockDefinition } from './types';
import { BLOCK_REGISTRY, CATEGORIES, FOOTER_BLOCK_TYPES, ERROR_BLOCK_TYPES } from '@/lib/block-registry';
import { Search } from 'lucide-react';

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
      className="flex items-center gap-1.5 rounded-md border bg-card px-2 py-1.5 text-xs cursor-grab hover:border-primary/50 hover:bg-accent transition-colors touch-none whitespace-nowrap shrink-0"
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
      <span className="truncate max-w-[100px]">{def.label}</span>
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
    <div className="flex items-center gap-3 px-4 py-1.5 overflow-x-auto">
      <div className="relative shrink-0 w-32">
        <Search className="absolute left-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border bg-background pl-6 pr-2 py-1 text-xs outline-none focus:border-primary"
        />
      </div>

      {!search && (
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => setActiveCategory(null)}
            className={`rounded-md px-2 py-1 text-[10px] font-medium transition-colors whitespace-nowrap ${!activeCategory ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
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
                className={`rounded-md px-2 py-1 text-[10px] font-medium transition-colors whitespace-nowrap ${activeCategory === cat.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex gap-1.5 overflow-x-auto">
        {filtered.length > 0 ? (
          filtered.map((def) => <DraggableBlock key={def.type} def={def} />)
        ) : (
          <p className="text-xs text-muted-foreground whitespace-nowrap py-1">Nenhum bloco encontrado</p>
        )}
      </div>
    </div>
  );
}

export { BLOCK_REGISTRY };
