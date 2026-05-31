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

export interface HeroConfig extends Record<string, unknown> {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaUrl?: string;
  imageUrl?: string;
  backgroundColor?: string;
}

export interface ArticleGridConfig extends Record<string, unknown> {
  title?: string;
  columns?: number;
  articles?: Array<{ title: string; slug: string; summary?: string; date?: string }>;
  tag?: string;
}

export interface FeaturedListConfig extends Record<string, unknown> {
  title?: string;
  items?: Array<{ label: string; description?: string; icon?: string; imageUrl?: string }>;
}

export interface DiscordEmbedConfig extends Record<string, unknown> {
  discordUrl?: string;
  title?: string;
  description?: string;
}

export interface NewsFeedConfig extends Record<string, unknown> {
  title?: string;
  items?: Array<{ title: string; date?: string; excerpt?: string; link?: string; imageUrl?: string }>;
}

export interface ImageGalleryConfig extends Record<string, unknown> {
  title?: string;
  images?: Array<{ src: string; alt?: string }>;
}

export interface RankingTableConfig extends Record<string, unknown> {
  title?: string;
  headers?: string[];
  rows?: string[][];
}

export interface RichTextConfig extends Record<string, unknown> {
  title?: string;
  html?: string;
}

export type BlockConfigMap = {
  'hero': HeroConfig;
  'article-grid': ArticleGridConfig;
  'featured-list': FeaturedListConfig;
  'discord-embed': DiscordEmbedConfig;
  'news-feed': NewsFeedConfig;
  'image-gallery': ImageGalleryConfig;
  'ranking-table': RankingTableConfig;
  'rich-text': RichTextConfig;
};

export interface BlockConfig<T extends BlockType = BlockType> {
  id: string;
  type: T;
  config: BlockConfigMap[T];
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
