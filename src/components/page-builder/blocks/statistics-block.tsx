'use client';

import { IconRenderer } from '@/components/ui/icon-renderer';

function renderIcon(item: any) {
  if (!item.icon) return null;
  if (typeof item.icon === 'string') {
    if (item.icon.includes(':')) {
      return <IconRenderer icon={item.icon} size="lg" />;
    }
    return <span className="mb-2 text-2xl block">{item.icon}</span>;
  }
  if (typeof item.icon === 'object' && item.icon?.icon) {
    return <IconRenderer icon={item.icon.icon} animation={item.icon.animation} size="lg" />;
  }
  return null;
}

export function StatisticsBlock({ config }: { config: Record<string, unknown> }) {
  const items = (config.items as Array<{
    label: string;
    value: string;
    prefix?: string;
    suffix?: string;
    icon?: any;
  }>) || [];
  const columns = (config.columns as 2 | 3 | 4) || 3;
  const animate = config.animate as boolean;

  const gridCols = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-3',
    4: 'sm:grid-cols-4',
  };

  return (
    <div>
      {items.length > 0 ? (
        <div className={`grid grid-cols-1 ${gridCols[columns]} gap-4`}>
          {items.map((item, i) => (
            <div
              key={i}
              className={`flex flex-col items-center justify-center rounded-lg border bg-card p-6 text-center ${
                animate ? 'transition-all duration-500 hover:scale-105' : ''
              }`}
            >
              {renderIcon(item)}
              <div className="text-3xl font-bold tracking-tight">
                {item.prefix && <span>{item.prefix}</span>}
                {item.value}
                {item.suffix && <span>{item.suffix}</span>}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center">
          Adicione estatísticas nas configurações
        </p>
      )}
    </div>
  );
}
