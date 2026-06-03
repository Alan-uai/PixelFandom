'use client';

import { useState, useCallback } from 'react';
import type { FloatingIslandConfig } from '@/components/page-builder/types';
import { FloatingIslandWrapper } from './floating-island-wrapper';

interface FloatingIslandsBarProps {
  islands: FloatingIslandConfig[];
  basePath?: string;
}

export function FloatingIslandsBar({ islands, basePath = '' }: FloatingIslandsBarProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleAutoExpand = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const enabled = islands.filter((i) => i.enabled);
  if (enabled.length === 0) return null;

  const getIslandByPosition = (pos: 'left' | 'center' | 'right') =>
    enabled.find((i) => i.position === pos) || null;

  const left = getIslandByPosition('left');
  const center = getIslandByPosition('center');
  const right = getIslandByPosition('right');

  const handleToggle = (id: string) => {
    setActiveId((prev) => (prev === id ? null : id));
  };

  const renderIsland = (island: FloatingIslandConfig | null) => {
    if (!island) return <div />;
    return (
      <FloatingIslandWrapper
        island={island}
        isExpanded={activeId === island.id}
        onToggle={() => handleToggle(island.id)}
        onAutoExpand={() => handleAutoExpand(island.id)}
        basePath={basePath}
      />
    );
  };

  return (
    <div className="border-b bg-muted/20">
      <div className="mx-auto max-w-6xl px-4 py-2">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
          <div className="sm:justify-self-start sm:w-full max-w-sm">
            {renderIsland(left)}
          </div>
          <div className="sm:justify-self-center sm:w-full max-w-sm">
            {renderIsland(center)}
          </div>
          <div className="sm:justify-self-end sm:w-full max-w-sm">
            {renderIsland(right)}
          </div>
        </div>
      </div>
    </div>
  );
}
