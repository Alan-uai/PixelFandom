'use client';

import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type Badge = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  image_url?: string | null;
  category: string;
  rarity: number;
  rarity_color?: string | null;
  rarity_icon?: string | null;
  animation_url?: string | null;
  earned?: boolean;
  earned_at?: string | null;
};

type Props = {
  badge: Badge;
  size?: 'sm' | 'md' | 'lg';
};

type BadgeGridProps = {
  badges: Badge[];
  variant?: 'grid' | 'list';
};

const RARITY_LABELS = ['', 'Comum', 'Incomum', 'Raro', 'Épico', 'Lendário'];
const RARITY_TAILWIND: Record<number, string> = {
  1: 'bg-gray-500/20 border-gray-500/30',
  2: 'bg-green-500/20 border-green-500/30',
  3: 'bg-blue-500/20 border-blue-500/30',
  4: 'bg-purple-500/20 border-purple-500/30',
  5: 'bg-amber-500/20 border-amber-500/30',
};
const RARITY_HSL: Record<number, string> = {
  1: '0 0% 60%',
  2: '142 76% 36%',
  3: '217 91% 60%',
  4: '271 81% 56%',
  5: '38 92% 50%',
};

const sizes = {
  sm: 'h-8 w-8 text-sm',
  md: 'h-12 w-12 text-xl',
  lg: 'h-16 w-16 text-3xl',
};

function BadgeDisplay({ badge, size = 'md' }: Props) {
  const earned = badge.earned !== false;
  const hsl = badge.rarity_color || RARITY_HSL[badge.rarity];
  const tailwind = RARITY_TAILWIND[badge.rarity] || RARITY_TAILWIND[1];

  const content = (
    <div
      className={cn(
        'rounded-lg border-2 flex items-center justify-center transition-all relative',
        sizes[size],
        earned
          ? tailwind
          : 'bg-muted/30 border-muted opacity-40 grayscale',
        earned && 'hover:scale-110 cursor-default'
      )}
      style={earned && hsl ? {
        boxShadow: `0 0 10px hsl(${hsl} / 0.25)`,
        borderColor: `hsl(${hsl} / 0.6)`,
      } : undefined}
    >
      {badge.image_url ? (
        <img src={badge.image_url} alt={badge.name} className="h-full w-full object-cover rounded-lg" />
      ) : (
        <span className="relative leading-none">
          {badge.icon}
          {badge.rarity_icon && (
            <span className="absolute -top-1.5 -right-2 text-[9px]">{badge.rarity_icon}</span>
          )}
        </span>
      )}
    </div>
  );

  if (!earned && !badge.description) return content;

  const rarityLabel = RARITY_LABELS[badge.rarity] || 'Comum';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[220px]">
          <p className="font-semibold">{badge.name}</p>
          {badge.description && (
            <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>
          )}
          <p className="text-[10px] text-muted-foreground mt-1.5">{rarityLabel} · Raridade {badge.rarity}/5</p>
          {badge.earned_at ? (
            <p className="text-[10px] text-muted-foreground">
              Conquistado em {new Date(badge.earned_at).toLocaleDateString('pt-BR')}
            </p>
          ) : badge.earned !== undefined && !badge.earned ? (
            <p className="text-[10px] text-muted-foreground mt-1">🔒 Ainda não conquistado</p>
          ) : null}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function BadgeGrid({ badges, variant = 'grid' }: BadgeGridProps) {
  if (variant === 'list') {
    return (
      <div className="space-y-2">
        {badges.map((badge) => (
          <div key={badge.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
            <span className="text-lg">{badge.rarity_icon || badge.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{badge.name}</p>
              {badge.description && (
                <p className="text-xs text-muted-foreground truncate">{badge.description}</p>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground">{RARITY_LABELS[badge.rarity] || 'Comum'}</span>
            {badge.earned_at && (
              <span className="text-xs text-muted-foreground">
                {new Date(badge.earned_at).toLocaleDateString('pt-BR')}
              </span>
            )}
            <div className={cn('h-2 w-2 rounded-full', RARITY_TAILWIND[badge.rarity] || RARITY_TAILWIND[1])} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
      {badges.map((badge) => {
        const earned = badge.earned !== false;
        const hsl = badge.rarity_color || RARITY_HSL[badge.rarity];

        return (
          <TooltipProvider key={badge.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 bg-card cursor-default transition-all hover:scale-105',
                    earned ? '' : 'opacity-40 grayscale'
                  )}
                  style={earned && hsl ? {
                    boxShadow: `0 0 12px hsl(${hsl} / 0.3)`,
                    borderColor: `hsl(${hsl} / 0.5)`,
                  } : undefined}
                >
                  {badge.image_url ? (
                    <img src={badge.image_url} alt={badge.name} className="w-10 h-10 object-contain" />
                  ) : (
                    <span className="text-2xl relative leading-none">
                      {badge.icon}
                      {badge.rarity_icon && (
                        <span className="absolute -top-2 -right-2 text-xs">{badge.rarity_icon}</span>
                      )}
                    </span>
                  )}
                  <span className="text-[10px] text-center font-medium line-clamp-2">{badge.name}</span>
                  {badge.earned_at && (
                    <span className="text-[8px] text-muted-foreground">Conquistado</span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[200px]">
                <p className="text-sm font-medium">{badge.name}</p>
                {badge.description && (
                  <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>
                )}
                {badge.rarity > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {RARITY_LABELS[badge.rarity] || 'Comum'}
                  </p>
                )}
                {badge.earned_at ? (
                  <p className="text-xs text-muted-foreground mt-1">
                    Conquistado em {new Date(badge.earned_at).toLocaleDateString('pt-BR')}
                  </p>
                ) : badge.earned !== undefined && !badge.earned ? (
                  <p className="text-xs text-muted-foreground mt-1">🔒 Ainda não conquistado</p>
                ) : null}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
}

export { BadgeDisplay, BadgeGrid };
