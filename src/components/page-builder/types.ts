import type { LucideIcon } from 'lucide-react';

export type BlockType =
  | 'hero'
  | 'article-grid'
  | 'featured-list'
  | 'discord-embed'
  | 'news-feed'
  | 'image-gallery'
  | 'ranking-table'
  | 'rich-text';

export interface BlockConfig {
  id: string;
  type: BlockType;
  config: Record<string, unknown>;
}

export interface PageLayout {
  blocks: BlockConfig[];
}

export interface BlockDefinition {
  type: BlockType;
  label: string;
  icon: LucideIcon;
  defaultConfig: Record<string, unknown>;
  description: string;
}

// ── Floating Islands ──

export type FloatingIslandType = 'multi-timer' | 'queue-timer' | 'video-list' | 'category-table' | 'wiki-list' | 'carousel' | 'list';

export type FloatingIslandPosition = 'left' | 'center' | 'right';

export interface IslandMedia {
  type: 'image' | 'gif' | 'video' | 'link';
  url: string;
  /** always: exibe sempre que a ilha está aberta | on-trigger: exibe só no disparo do evento */
  displayMode: 'always' | 'on-trigger';
}

export interface FloatingIslandConfig {
  id: string;
  position: FloatingIslandPosition;
  type: FloatingIslandType;
  title: string;
  enabled: boolean;
  config: Record<string, unknown>;
}

export interface FloatingIslandLayout {
  floatingIslands: FloatingIslandConfig[];
}
