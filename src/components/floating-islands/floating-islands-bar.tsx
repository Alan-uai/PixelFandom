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
  singleIslandWidth?: number;
  basePath?: string;
  className?: string;
}

export function FloatingIslandsBar({ islands, slotFlow = 'current', clipStyle = 'trapezoid', singleIslandWidth, basePath = '', className = '' }: FloatingIslandsBarProps) {
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

  if (enabled.length === 1) {
    const island = enabled[0];
    return (
      <div className={`bg-muted/20 ${className}`}>
        <div className="mx-auto max-w-6xl px-2">
          <div className="flex justify-center" style={{ width: singleIslandWidth ? `${singleIslandWidth}%` : 'auto', maxWidth: '100%' }}>
            <div className="flex-1">
              <FloatingIslandWrapper
                island={island}
                position="center"
                isExpanded={activeId === island.id}
                onToggle={() => handleToggle(island.id)}
                onAutoExpand={() => handleAutoExpand(island.id)}
                basePath={basePath}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const flowDef = getSlotFlowDef(slotFlow);

  const positions = flowDef.getSlots(enabled.length);
  const POS_ORDER: Record<string, number> = { left: 0, center: 1, right: 2 };
  const sorted = [...enabled].sort((a, b) => POS_ORDER[a.position] - POS_ORDER[b.position]);

  return (
    <div className={`bg-muted/20 ${className}`}>
      <div className="mx-auto max-w-6xl">
        <div className="flex items-stretch">
          {positions.map((pos, idx) => {
            const island = sorted[idx] || null;
            return (
              <div key={pos} className="relative flex-1">
                <div className="absolute inset-0 bg-card border" style={{ clipPath: getClipPath(clipStyle, pos) }} />
                <div className="relative">
                  {island ? (
                    <FloatingIslandWrapper
                      island={island}
                      position={pos}
                      isExpanded={activeId === island.id}
                      onToggle={() => handleToggle(island.id)}
                      onAutoExpand={() => handleAutoExpand(island.id)}
                      basePath={basePath}
                      cardBackground={false}
                    />
                  ) : (
                    <div className="h-full" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
