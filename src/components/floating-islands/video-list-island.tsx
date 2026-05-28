'use client';

import { Play } from 'lucide-react';

interface VideoListIslandProps {
  config: Record<string, unknown>;
}

interface VideoItem {
  title?: string;
  url?: string;
  thumbnail?: string;
}

export function VideoListIsland({ config }: VideoListIslandProps) {
  const items = (config.items as VideoItem[]) || [];

  if (items.length === 0) {
    return <p className="text-xs text-muted-foreground">Nenhum vídeo adicionado.</p>;
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <a
          key={index}
          href={item.url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-2 rounded-lg border border-border/50 bg-card p-2 hover:border-primary/30 transition-colors group"
        >
          {item.thumbnail ? (
            <div className="relative h-10 w-16 shrink-0 rounded overflow-hidden bg-muted">
              <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                <Play className="h-4 w-4 text-white" />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-10 w-16 shrink-0 rounded bg-muted">
              <Play className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          {item.title && (
            <p className="text-xs font-medium leading-tight pt-0.5 group-hover:text-primary transition-colors line-clamp-2">
              {item.title}
            </p>
          )}
        </a>
      ))}
    </div>
  );
}
