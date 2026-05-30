'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import type { BlockConfig, BlockType } from './types';
import { HeroBlock } from './blocks/hero-block';
import { ArticleGridBlock } from './blocks/article-grid-block';
import { FeaturedListBlock } from './blocks/featured-list-block';
import { DiscordEmbedBlock } from './blocks/discord-embed-block';
import { NewsFeedBlock } from './blocks/news-feed-block';
import { ImageGalleryBlock } from './blocks/image-gallery-block';
import { RankingTableBlock } from './blocks/ranking-table-block';
import { RichTextBlock } from './blocks/rich-text-block';

function BlockRenderer({ block, tenantId }: { block: BlockConfig; tenantId?: string }) {
  switch (block.type) {
    case 'hero': return <HeroBlock config={block.config} />;
    case 'article-grid': return <ArticleGridBlock config={block.config} tenantId={tenantId} />;
    case 'featured-list': return <FeaturedListBlock config={block.config} />;
    case 'discord-embed': return <DiscordEmbedBlock config={block.config} />;
    case 'news-feed': return <NewsFeedBlock config={block.config} />;
    case 'image-gallery': return <ImageGalleryBlock config={block.config} />;
    case 'ranking-table': return <RankingTableBlock config={block.config} />;
    case 'rich-text': return <RichTextBlock config={block.config} />;
    default: return <div className="p-4 text-sm text-muted-foreground">Bloco desconhecido: {block.type}</div>;
  }
}

function SortableBlock({
  block,
  isSelected,
  onSelect,
  onDelete,
  tenantId,
}: {
  block: BlockConfig;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  tenantId?: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id, data: { type: block.type, isNew: false } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-xl border-2 transition-colors ${isSelected ? 'border-primary' : 'border-transparent hover:border-muted-foreground/30'}`}
      onClick={onSelect}
    >
      <div className="absolute -top-3 left-2 z-10 flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        <button
          {...attributes}
          {...listeners}
          className="rounded-md bg-background border px-1.5 py-1 text-muted-foreground hover:text-foreground cursor-grab touch-none"
        >
          <GripVertical className="h-3 w-3" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="rounded-md bg-background border px-1.5 py-1 text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
      <div className="p-4">
        <BlockRenderer block={block} tenantId={tenantId} />
      </div>
    </div>
  );
}

export function PagePreview({
  blocks,
  selectedId,
  onSelect,
  onDelete,
  tenantId,
  mobilePreview,
}: {
  blocks: BlockConfig[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  tenantId?: string;
  mobilePreview?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: 'page-drop-zone' });

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-h-[400px] p-6 space-y-6 overflow-y-auto ${isOver ? 'bg-primary/5' : ''} ${mobilePreview ? 'max-w-sm mx-auto border-x-4 border-border' : ''}`}
    >
      <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
        {blocks.length > 0 ? (
          blocks.map((block) => (
            <SortableBlock
              key={block.id}
              block={block}
              tenantId={tenantId}
              isSelected={selectedId === block.id}
              onSelect={() => onSelect(block.id)}
              onDelete={() => onDelete(block.id)}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border-2 border-dashed border-muted-foreground/25">
            <p className="text-sm text-muted-foreground">Arraste blocos da barra lateral para começar</p>
          </div>
        )}
      </SortableContext>
    </div>
  );
}
