'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { FloatingIslandConfig } from '@/components/page-builder/types';
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
  isExpanded: boolean;
  onToggle: () => void;
  onAutoExpand: () => void;
  basePath?: string;
}

export function FloatingIslandWrapper({ island, isExpanded, onToggle, onAutoExpand, basePath = '' }: FloatingIslandWrapperProps) {
  const autoCloseRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isExpandedRef = useRef(isExpanded);
  isExpandedRef.current = isExpanded;

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

  return (
    <div
      className={`border bg-card transition-all ${
        isExpanded ? 'shadow-md' : 'shadow-sm hover:shadow-md'
      }`}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs font-medium hover:bg-muted/50 transition-colors"
      >
        {cronFirst && cronTarget ? (
          <span className="flex-1">
            <CountdownDisplay targetDate={cronTarget} compact />
          </span>
        ) : (
          <span className="flex-1 truncate">{island.title || island.type}</span>
        )}
      </button>
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-border/50">
          {cronFirst && cronTarget && (
            <p className="text-xs font-medium mb-2 truncate">{island.title || island.type}</p>
          )}
          {renderContent()}
        </div>
      )}
    </div>
  );
}
