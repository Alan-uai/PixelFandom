'use client';

import { useCallback, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Timer, Video, Table2, List, Clock, Image as ImageIcon, ListOrdered } from 'lucide-react';
import type { FloatingIslandConfig } from '@/components/page-builder/types';
import { MultiTimerIsland } from './multi-timer-island';
import { QueueTimerIsland } from './queue-timer-island';
import { VideoListIsland } from './video-list-island';
import { CategoryTableIsland } from './category-table-island';
import { WikiListIsland } from './wiki-list-island';
import { CarouselIsland } from './carousel-island';
import { ListIsland } from './list-island';

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'multi-timer': Clock,
  'queue-timer': Timer,
  'video-list': Video,
  'category-table': Table2,
  'wiki-list': List,
  carousel: ImageIcon,
  list: ListOrdered,
};

interface FloatingIslandWrapperProps {
  island: FloatingIslandConfig;
  isExpanded: boolean;
  onToggle: () => void;
  onAutoExpand: () => void;
  basePath?: string;
}

export function FloatingIslandWrapper({ island, isExpanded, onToggle, onAutoExpand, basePath = '' }: FloatingIslandWrapperProps) {
  const Icon = TYPE_ICONS[island.type] || List;
  const autoCloseRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isExpandedRef = useRef(isExpanded);
  isExpandedRef.current = isExpanded;

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
        {Icon && <Icon className="h-3.5 w-3.5 text-primary shrink-0" />}
        <span className="flex-1 truncate">{island.title || island.type}</span>
        {isExpanded ? (
          <ChevronUp className="h-3 w-3 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
        )}
      </button>
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-border/50">
          {renderContent()}
        </div>
      )}
    </div>
  );
}
