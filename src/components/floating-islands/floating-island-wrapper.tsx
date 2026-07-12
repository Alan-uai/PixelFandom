'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { FloatingIslandConfig, ClipStyleId, FloatingIslandPosition } from '@/components/page-builder/types';
import { getClipPath } from '@/lib/floating-island-clips';
import { MultiTimerIsland } from './multi-timer-island';
import { QueueTimerIsland } from './queue-timer-island';
import { VideoListIsland } from './video-list-island';
import { CategoryTableIsland } from './category-table-island';
import { WikiListIsland } from './wiki-list-island';
import { CarouselIsland } from './carousel-island';
import { ListIsland } from './list-island';
import { CountdownDisplay } from './countdown-display';

function getCronFirstTarget(island: FloatingIslandConfig): string | null {
  if (island.type === 'multi-timer') {
    const events = (island.config.events || []) as Array<{ targetDate: string }>;
    if (events.length > 0) return events[0].targetDate;
  }
  if (island.type === 'queue-timer') {
    const items = (island.config.items || []) as Array<{ time: string }>;
    if (items.length > 0) {
      const sorted = [...items].sort((a, b) => a.time.localeCompare(b.time));
      const now = Date.now();
      const next = sorted.find((item) => {
        const [h, m] = item.time.split(':').map(Number);
        const d = new Date(); d.setHours(h, m, 0, 0);
        return d.getTime() > now;
      }) || sorted[0];
      const [h, m] = next.time.split(':').map(Number);
      const d = new Date(); d.setHours(h, m, 0, 0);
      if (d.getTime() <= now) d.setDate(d.getDate() + 1);
      return d.toISOString();
    }
  }
  return null;
}

interface FloatingIslandWrapperProps {
  island: FloatingIslandConfig;
  position?: FloatingIslandPosition;
  clipStyle?: ClipStyleId;
  isExpanded: boolean;
  onToggle: () => void;
  onAutoExpand: () => void;
  basePath?: string;
}

export function FloatingIslandWrapper({ island, position, clipStyle, isExpanded, onToggle, onAutoExpand, basePath = '' }: FloatingIslandWrapperProps) {
  const autoCloseRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isExpandedRef = useRef(isExpanded);
  useEffect(() => { isExpandedRef.current = isExpanded; }, [isExpanded]);

  const cronFirst = !!(island.config.cronFirst);
  const cronTarget = cronFirst ? getCronFirstTarget(island) : null;

  const handleEventTrigger = useCallback(() => {
    onAutoExpand();
    if (autoCloseRef.current) clearTimeout(autoCloseRef.current);
    autoCloseRef.current = setTimeout(() => {
      if (isExpandedRef.current) onToggle();
      autoCloseRef.current = null;
    }, 30000);
  }, [onAutoExpand, onToggle]);

  useEffect(() => {
    return () => {
      if (autoCloseRef.current) clearTimeout(autoCloseRef.current);
    };
  }, []);

  const renderContent = () => {
    switch (island.type) {
      case 'multi-timer':
        return <MultiTimerIsland config={island.config} onEventTrigger={handleEventTrigger} />;
      case 'queue-timer':
        return <QueueTimerIsland config={island.config} onEventTrigger={handleEventTrigger} />;
      case 'video-list':
        return <VideoListIsland config={island.config} />;
      case 'category-table':
        return <CategoryTableIsland config={island.config} />;
      case 'wiki-list':
        return <WikiListIsland config={island.config} basePath={basePath} />;
      case 'carousel':
        return <CarouselIsland config={island.config} />;
      case 'list':
        return <ListIsland config={island.config} />;
      default:
        return null;
    }
  };

  const isCenter = position === 'center';
  const clipPathValue = clipStyle && position ? getClipPath(clipStyle, position) : undefined;
  const contentHeightRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative">
      {/* Decorative clip-path background */}
      {clipPathValue && (
        <div
          className="absolute inset-0 border bg-card pointer-events-none"
          style={{ clipPath: clipPathValue, borderRadius: 0 }}
        />
      )}
      {/* Content layer */}
      <div className="relative z-[1]">
        <div className="border bg-card">
          <button
            onClick={onToggle}
            className={`flex w-full items-center gap-2 px-4 py-2 text-xs font-medium hover:bg-muted/50 transition-colors ${
              isCenter ? 'justify-center' : 'text-left'
            }`}
          >
            {cronFirst && cronTarget ? (
              <span className="flex-1">
                <CountdownDisplay targetDate={cronTarget} compact />
              </span>
            ) : (
              <span className="flex-1 truncate">{island.title || island.type}</span>
            )}
          </button>
        </div>
        {isExpanded && (
          <div
            ref={contentHeightRef}
            className="absolute top-full left-0 right-0 z-50 border border-t-0 bg-card px-4 pb-4 pt-2 shadow-lg"
            style={{ maxHeight: '70vh', overflowY: 'auto' }}
          >
            {cronFirst && cronTarget && (
              <p className="text-xs font-medium mb-2 truncate">{island.title || island.type}</p>
            )}
            {renderContent()}
          </div>
        )}
      </div>
    </div>
  );
}
