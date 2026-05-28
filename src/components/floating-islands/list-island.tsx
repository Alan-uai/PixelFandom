'use client';

import { ExternalLink } from 'lucide-react';

interface ListItem {
  text?: string;
  link?: string;
}

interface ListIslandProps {
  config: Record<string, unknown>;
}

const BULLET_MAP: Record<string, string> = {
  '•': '•',
  '♦': '♦',
  '★': '★',
  '♥': '♥',
  '×': '×',
  '∆': '∆',
};

export function ListIsland({ config }: ListIslandProps) {
  const style = (config.style as string) || 'standard';
  const bulletIcon = (config.bulletIcon as string) || '•';
  const items = (config.items as ListItem[]) || [];
  const bullet = BULLET_MAP[bulletIcon] || '•';

  if (items.length === 0) {
    return <p className="text-xs text-muted-foreground">Nenhum item na lista.</p>;
  }

  const renderItem = (item: ListItem, index: number) => {
    const content = item.link ? (
      <a
        href={item.link}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-xs text-primary hover:underline group"
      >
        <span className="truncate">{item.text || `Item ${index + 1}`}</span>
        <ExternalLink className="h-2.5 w-2.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
      </a>
    ) : (
      <span className="text-xs text-foreground">{item.text || `Item ${index + 1}`}</span>
    );

    return <li key={index}>{content}</li>;
  };

  if (style === 'numbered') {
    return (
      <ol className="space-y-1 list-decimal list-inside">
        {items.map((item, i) => renderItem(item, i))}
      </ol>
    );
  }

  if (style === 'topic') {
    return (
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="text-primary shrink-0 mt-0.5 text-xs">{bullet}</span>
            <div className="flex-1 min-w-0">
              {item.link ? (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline group inline-flex items-center gap-1"
                >
                  <span className="truncate">{item.text}</span>
                  <ExternalLink className="h-2.5 w-2.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ) : (
                <span className="text-xs text-foreground">{item.text}</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    );
  }

  // Standard
  return (
    <ul className="space-y-1">
      {items.map((item, i) => (
        <li key={i}>
          {item.link ? (
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline group inline-flex items-center gap-1"
            >
              <span className="truncate">{item.text}</span>
              <ExternalLink className="h-2.5 w-2.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          ) : (
            <span className="text-xs text-foreground">{item.text}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
