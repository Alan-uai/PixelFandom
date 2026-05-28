'use client';

import { ChevronDown, ChevronUp, Timer, Video, Table2, List } from 'lucide-react';
import type { FloatingIslandConfig } from '@/components/page-builder/types';
import { RaidTimerIsland } from './raid-timer-island';
import { VideoListIsland } from './video-list-island';
import { CategoryTableIsland } from './category-table-island';
import { WikiListIsland } from './wiki-list-island';

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'raid-timer': Timer,
  'video-list': Video,
  'category-table': Table2,
  'wiki-list': List,
};

interface FloatingIslandWrapperProps {
  island: FloatingIslandConfig;
  isExpanded: boolean;
  onToggle: () => void;
  basePath?: string;
}

export function FloatingIslandWrapper({ island, isExpanded, onToggle, basePath = '' }: FloatingIslandWrapperProps) {
  const Icon = TYPE_ICONS[island.type] || List;

  const renderContent = () => {
    switch (island.type) {
      case 'raid-timer':
        return <RaidTimerIsland config={island.config} />;
      case 'video-list':
        return <VideoListIsland config={island.config} />;
      case 'category-table':
        return <CategoryTableIsland config={island.config} />;
      case 'wiki-list':
        return <WikiListIsland config={island.config} basePath={basePath} />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`rounded-lg border bg-card transition-all ${
        isExpanded ? 'shadow-md' : 'shadow-sm hover:shadow-md'
      }`}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium hover:bg-muted/50 transition-colors rounded-t-lg"
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
        <div className="px-3 pb-3 pt-1 border-t border-border/50">
          {renderContent()}
        </div>
      )}
    </div>
  );
}
