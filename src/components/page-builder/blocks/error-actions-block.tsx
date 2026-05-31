'use client';

import { Home, ArrowLeft, Mail } from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  home: Home,
  back: ArrowLeft,
  mail: Mail,
};

export function ErrorActionsBlock({ config }: { config: Record<string, unknown> }) {
  const buttons = (config.buttons as Array<{ label: string; url: string; variant: string; icon?: string }>) || [];
  const layout = (config.layout as string) || 'row';
  const size = (config.size as string) || 'md';

  const sizeMap: Record<string, string> = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3 text-base',
  };

  if (buttons.length === 0) return null;

  return (
    <div
      className={`flex ${layout === 'column' ? 'flex-col' : 'flex-row flex-wrap'} items-center justify-center gap-3`}
    >
      {buttons.map((btn, i) => {
        const Icon = btn.icon ? iconMap[btn.icon] : null;
        return (
          <a
            key={i}
            href={btn.url || '#'}
            className={`inline-flex items-center gap-2 rounded-lg font-medium transition-all hover:scale-105 ${sizeMap[size] || 'px-5 py-2.5 text-sm'} ${
              btn.variant === 'outline'
                ? 'border border-border bg-background hover:border-primary/50'
                : btn.variant === 'ghost'
                  ? 'text-muted-foreground hover:text-foreground'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {btn.label}
          </a>
        );
      })}
    </div>
  );
}
