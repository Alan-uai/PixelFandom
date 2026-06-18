'use client';

import Image from 'next/image';
import { Star } from 'lucide-react';
import { IconRenderer } from '@/components/ui/icon-renderer';

function renderIcon(item: any) {
  if (item.imageUrl) {
    return <Image src={item.imageUrl} alt="" width={40} height={40} className="rounded object-cover shrink-0" />;
  }
  if (item.icon) {
    if (typeof item.icon === 'string') {
      if (item.icon.includes(':')) {
        return <IconRenderer icon={item.icon} size="md" />;
      }
      return <span className="text-xl shrink-0 leading-none">{item.icon}</span>;
    }
    if (typeof item.icon === 'object' && item.icon?.icon) {
      return <IconRenderer icon={item.icon.icon} animation={item.icon.animation} size="md" />;
    }
  }
  return <Star className="h-5 w-5 text-primary shrink-0" />;
}

export function FeaturedListBlock({ config }: { config: Record<string, any>; tenantId?: string }) {
  const title = config.title || 'Destaques';
  const layout = config.layout || 'list';
  const items = config.items || [];

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        {title && <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--heading-font)' }}>{title}</h2>}
        <p className="text-sm text-muted-foreground">Adicione itens em destaque nas configurações</p>
      </div>
    );
  }

  if (layout === 'grid') {
    return (
      <div className="space-y-4">
        {title && <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--heading-font)' }}>{title}</h2>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((item: any, i: number) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border bg-card p-4">
              {renderIcon(item)}
              <div className="min-w-0">
                <p className="font-medium text-sm">{item.label}</p>
                {item.description && (
                  <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (layout === 'cards') {
    return (
      <div className="space-y-4">
        {title && <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--heading-font)' }}>{title}</h2>}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item: any, i: number) => (
            <div key={i} className="rounded-lg border bg-card p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center gap-3">
              {item.imageUrl ? (
                <Image src={item.imageUrl} alt="" width={48} height={48} className="rounded-full object-cover" />
              ) : item.icon ? (
                <div className="rounded-full bg-primary/10 p-2.5">
                  {typeof item.icon === 'string' && item.icon.includes(':') ? (
                    <IconRenderer icon={item.icon} size="md" />
                  ) : typeof item.icon === 'object' && item.icon?.icon ? (
                    <IconRenderer icon={item.icon.icon} animation={item.icon.animation} size="md" />
                  ) : (
                    <span className="text-2xl">{item.icon}</span>
                  )}
                </div>
              ) : (
                <div className="rounded-full bg-primary/10 p-2.5">
                  <Star className="h-5 w-5 text-primary" />
                </div>
              )}
              <div>
                <p className="font-medium text-sm">{item.label}</p>
                {item.description && (
                  <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {title && <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--heading-font)' }}>{title}</h2>}
      <div className="space-y-3">
        {items.map((item: any, i: number) => (
          <div key={i} className="flex items-start gap-3 rounded-lg border bg-card p-4">
            {renderIcon(item)}
            <div className="min-w-0">
              <p className="font-medium text-sm">{item.label}</p>
              {item.description && (
                <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
