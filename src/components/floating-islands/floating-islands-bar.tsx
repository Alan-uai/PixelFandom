'use client';

import { useState, useCallback, useEffect } from 'react';
import type { FloatingIslandConfig, SlotFlowId, ClipStyleId } from '@/components/page-builder/types';
import { getSlotFlowDef } from '@/lib/floating-island-flows';
import { getClipPath } from '@/lib/floating-island-clips';
import { FloatingIslandWrapper } from './floating-island-wrapper';

interface FloatingIslandsBarProps {
  islands: FloatingIslandConfig[];
  slotFlow?: SlotFlowId;
  clipStyle?: ClipStyleId;
  basePath?: string;
  className?: string;
}

export function FloatingIslandsBar({ islands, slotFlow = 'current', clipStyle = 'trapezoid', basePath = '', className = '' }: FloatingIslandsBarProps) {
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

  const flowDef = getSlotFlowDef(slotFlow);

  const sorted = [...enabled];
  const positions = flowDef.getSlots(sorted.length);

  return (
    <div className={`bg-muted/20 ${className}`}>
      <div className="mx-auto max-w-6xl">
        <div className="flex items-stretch">
          {positions.map((pos, idx) => {
            const island = sorted[idx] || null;
            return (
              <div
                key={pos}
                className="flex-1"
                style={{ clipPath: getClipPath(clipStyle, pos) }}
              >
                {island ? (
                  <FloatingIslandWrapper
                    island={island}
                    position={pos}
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
