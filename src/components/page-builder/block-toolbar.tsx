'use client';

import { useDraggable } from '@dnd-kit/core';
import type { BlockType, BlockDefinition } from './types';
import { Image, LayoutList, Star, MessageCircle, Newspaper, LayoutGrid, Trophy, Type } from 'lucide-react';

const BLOCK_DEFINITIONS: BlockDefinition[] = [
  { type: 'hero', label: 'Hero', icon: Image, defaultConfig: { title: 'Título Hero', subtitle: 'Subtítulo', ctaText: 'Começar', ctaUrl: '', backgroundColor: '' }, description: 'Título grande com CTA' },
  { type: 'article-grid', label: 'Grid Artigos', icon: LayoutGrid, defaultConfig: { title: 'Artigos', columns: 3, articles: [] }, description: 'Grade de artigos' },
  { type: 'featured-list', label: 'Lista Destaques', icon: Star, defaultConfig: { title: 'Destaques', items: [] }, description: 'Itens em destaque' },
  { type: 'discord-embed', label: 'Discord', icon: MessageCircle, defaultConfig: { discordUrl: '', title: 'Junte-se ao Discord', description: 'Participe da comunidade!' }, description: 'Embed do Discord' },
  { type: 'news-feed', label: 'Notícias', icon: Newspaper, defaultConfig: { title: 'Notícias', items: [] }, description: 'Feed de notícias' },
  { type: 'image-gallery', label: 'Galeria', icon: Image, defaultConfig: { title: 'Galeria', images: [] }, description: 'Galeria de imagens' },
  { type: 'ranking-table', label: 'Ranking', icon: Trophy, defaultConfig: { title: 'Ranking', headers: ['#', 'Item', 'Valor'], rows: [] }, description: 'Tabela de rankings' },
  { type: 'rich-text', label: 'Texto Rico', icon: Type, defaultConfig: { title: '', html: '<p>Conteúdo aqui</p>' }, description: 'Bloco de texto' },
];

function DraggableBlock({ def }: { def: BlockDefinition }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `new-${def.type}`, data: { type: def.type, isNew: true } });
  const Icon = def.icon;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm cursor-grab hover:border-primary/50 transition-colors ${isDragging ? 'opacity-50' : ''}`}
    >
      <Icon className="h-4 w-4 text-primary" />
      <span>{def.label}</span>
    </div>
  );
}

export function BlockToolbar() {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1 mb-2">Blocos</p>
      <div className="space-y-1">
        {BLOCK_DEFINITIONS.map((def) => (
          <DraggableBlock key={def.type} def={def} />
        ))}
      </div>
    </div>
  );
}

export { BLOCK_DEFINITIONS };
