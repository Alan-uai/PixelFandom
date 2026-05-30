'use client';

import { cn } from '@/lib/utils';

type Badge = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  image_url?: string | null;
  category: string;
  rarity: number;
  earned?: boolean;
  earned_at?: string | null;
};

type Props = {
  badge: Badge;
  size?: 'sm' | 'md' | 'lg';
};

const rarityColors: Record<number, string> = {
  1: 'bg-gray-500/20 border-gray-500/30',
  2: 'bg-green-500/20 border-green-500/30',
  3: 'bg-blue-500/20 border-blue-500/30',
  4: 'bg-purple-500/20 border-purple-500/30',
  5: 'bg-amber-500/20 border-amber-500/30',
};

const rarityGlows: Record<number, string> = {
  1: '',
  2: 'shadow-green-500/20',
  3: 'shadow-blue-500/20',
  4: 'shadow-purple-500/20',
  5: 'shadow-amber-500/20 shadow-lg',
};

const sizes = {
  sm: 'h-8 w-8 text-sm',
  md: 'h-12 w-12 text-xl',
  lg: 'h-16 w-16 text-3xl',
};

export function BadgeDisplay({ badge, size = 'md' }: Props) {
  const rarityLabel = ['Comum', 'Incomum', 'Raro', 'Épico', 'Lendário'][badge.rarity - 1] || 'Comum';

  return (
    <div
      className={cn(
        'rounded-lg border flex items-center justify-center transition-all relative group',
        sizes[size],
        badge.earned !== false
          ? `${rarityColors[badge.rarity] || rarityColors[1]} ${rarityGlows[badge.rarity] || ''}`
          : 'bg-muted/30 border-muted opacity-40 grayscale',
        badge.earned && 'hover:scale-110 cursor-default'
      )}
    >
      {badge.image_url ? (
        <img src={badge.image_url} alt={badge.name} className="h-full w-full object-cover rounded-lg" />
      ) : (
        <span>{badge.icon}</span>
      )}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
        <div className="bg-popover border rounded-lg px-3 py-2 shadow-xl text-xs whitespace-nowrap">
          <p className="font-semibold">{badge.name}</p>
          <p className="text-muted-foreground mt-0.5 max-w-[180px] whitespace-normal">{badge.description}</p>
          <p className="text-[10px] text-muted-foreground mt-1">{rarityLabel} · Raridade {badge.rarity}/5</p>
        </div>
      </div>
    </div>
  );
}
