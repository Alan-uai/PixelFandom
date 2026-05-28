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
