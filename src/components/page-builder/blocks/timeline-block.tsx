'use client';

import { Circle } from 'lucide-react';
import { IconRenderer } from '@/components/ui/icon-renderer';

function resolveIcon(itemIcon: any) {
  if (!itemIcon) return null;
  if (typeof itemIcon === 'string') {
    if (itemIcon.includes(':')) {
      return <IconRenderer icon={itemIcon} size="sm" />;
    }
    return <span className="text-xs">{itemIcon}</span>;
  }
  if (typeof itemIcon === 'object' && itemIcon?.icon) {
    return <IconRenderer icon={itemIcon.icon} animation={itemIcon.animation} size="sm" />;
  }
  return null;
}

export function TimelineBlock({ config }: { config: Record<string, unknown> }) {
  const items = (config.items as Array<{
    title: string;
    date?: string;
    content?: string;
    icon?: any;
  }>) || [];

  return (
    <div className="relative">
      {items.length > 0 ? (
        <div className="space-y-0">
          {items.map((item, i) => (
            <div key={i} className="relative flex gap-4 pb-8 last:pb-0">
              <div className="flex flex-col items-center">
                <div className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full border bg-card">
                  {resolveIcon(item.icon) || (
                    <Circle className="h-2.5 w-2.5 fill-primary text-primary" />
                  )}
                </div>
                {i < items.length - 1 && (
                  <div className="mt-1 w-px flex-1 bg-border" />
                )}
              </div>
              <div className="flex-1 pt-0.5 min-w-0">
                {item.date && (
                  <p className="text-xs text-muted-foreground">{item.date}</p>
                )}
                <h3 className="text-sm font-semibold mt-0.5">{item.title}</h3>
                {item.content && (
                  <p className="mt-1 text-sm text-muted-foreground">{item.content}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center">
          Adicione itens na timeline nas configurações
        </p>
      )}
    </div>
  );
}
