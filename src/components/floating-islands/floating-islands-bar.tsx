'use client';

import { useState, useCallback } from 'react';
import type { FloatingIslandConfig } from '@/components/page-builder/types';
import { FloatingIslandWrapper } from './floating-island-wrapper';

interface FloatingIslandsBarProps {
  islands: FloatingIslandConfig[];
  basePath?: string;
  className?: string;
}

const CLIP = 28;

function getClipPath(pos: 'left' | 'center' | 'right', alone: boolean): string {
  if (alone) return 'polygon(0 0, 100% 0, 100% 100%, 0 100%)';
  switch (pos) {
    case 'left':
      return `polygon(0 0, 100% 0, calc(100% - ${CLIP}px) 100%, 0 100%)`;
    case 'center':
      return `polygon(0 0, 100% 0, calc(100% - ${CLIP}px) 100%, ${CLIP}px 100%)`;
    case 'right':
      return `polygon(0 0, 100% 0, 100% 100%, ${CLIP}px 100%)`;
  }
}

function shouldAlone(enabled: FloatingIslandConfig[], pos: 'left' | 'center' | 'right'): boolean {
  const positions = new Set(enabled.map((i) => i.position));
  switch (pos) {
    case 'left':
      return !positions.has('center') && !positions.has('right');
    case 'center':
      return !positions.has('left') && !positions.has('right');
    case 'right':
      return !positions.has('left') && !positions.has('center');
  }
}

export function FloatingIslandsBar({ islands, basePath = '', className = '' }: FloatingIslandsBarProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleAutoExpand = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const enabled = islands.filter((i) => i.enabled);
  if (enabled.length === 0) return null;

  const getIslandByPosition = (pos: 'left' | 'center' | 'right') =>
    enabled.find((i) => i.position === pos) || null;

  const handleToggle = (id: string) => {
    setActiveId((prev) => (prev === id ? null : id));
  };

  const positions: Array<'left' | 'center' | 'right'> = ['left', 'center', 'right'];

  return (
    <div className={`bg-muted/20 ${className}`}>
      <div className="mx-auto max-w-6xl">
        <div className="flex items-stretch">
          {positions.map((pos) => {
            const island = getIslandByPosition(pos);
            return (
              <div
                key={pos}
                className="flex-1"
                style={{ clipPath: getClipPath(pos, !island || shouldAlone(enabled, pos)) }}
              >
                {island ? (
                  <FloatingIslandWrapper
                    island={island}
                    isExpanded={activeId === island.id}
                    onToggle={() => handleToggle(island.id)}
                    onAutoExpand={() => handleAutoExpand(island.id)}
                    basePath={basePath}
                  />
                ) : (
                  <div className="h-full" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
