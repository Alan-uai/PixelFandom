'use client';

import { useState, useCallback, useEffect } from 'react';
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

export function FloatingIslandsBar({ islands, basePath = '', className = '' }: FloatingIslandsBarProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(id);
  }, []);

  const handleAutoExpand = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const isExpired = (i: FloatingIslandConfig) => {
    if (!i.endsAt) return false;
    return new Date(i.endsAt).getTime() <= now;
  };

  const enabled = islands.filter((i) => i.enabled && !isExpired(i));

  const handleToggle = (id: string) => {
    setActiveId((prev) => (prev === id ? null : id));
  };

  if (enabled.length === 0) return null;

  const sorted = [...enabled];
  const count = sorted.length;

  const slot = (index: number): 'left' | 'center' | 'right' => {
    if (count === 1) return 'center';
    if (count === 2) return index === 0 ? 'left' : 'right';
    return ['left', 'center', 'right'][index] as 'left' | 'center' | 'right';
  };

  const positions: Array<'left' | 'center' | 'right'> = count === 1
    ? ['center']
    : count === 2
    ? ['left', 'right']
    : ['left', 'center', 'right'];

  return (
    <div className={`bg-muted/20 ${className}`}>
      <div className="mx-auto max-w-6xl">
        <div className="flex items-stretch">
          {positions.map((pos, idx) => {
            const island = sorted[idx] || null;
            const alone = count === 1;
            return (
              <div
                key={pos}
                className="flex-1"
                style={{ clipPath: getClipPath(pos, alone && pos === 'center') }}
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
