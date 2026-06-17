import * as LucideIcons from 'lucide-react';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import React from 'react'

export const TABLE_ICONS = [
  'Sword', 'Shield', 'Skull', 'Crown', 'FlaskConical',
  'ArrowUp', 'Globe', 'Code', 'BookOpen', 'Package',
  'Wrench', 'CircleDot', 'Star', 'Bug', 'Crosshair',
  'Hash', 'Droplets', 'Zap', 'Gem', 'ScrollText',
  'Coins', 'Sparkles', 'Lightbulb', 'MessageCircle',
  'Pickaxe', 'Database', 'FileText', 'Settings',
  'Heart', 'Target', 'Flag', 'Map', 'Compass',
  'TreePine', 'Mountain', 'Cloud', 'Sun', 'Moon',
  'Fire', 'Snowflake', 'Wind', 'Anchor', 'Ship',
  'Castle', 'Home', 'Key', 'Lock', 'Unlock',
  'Eye', 'EyeOff', 'Bell', 'BellRing', 'Timer',
  'Clock', 'Calendar', 'Camera', 'Image', 'Music',
  'Radio', 'Headphones', 'Rocket', 'Plane', 'Car',
  'Trophy', 'Award', 'Medal', 'Siren', 'ShieldAlert',
  'User', 'Users', 'Group', 'Building', 'Store',
  'ShoppingCart', 'Banknote', 'Wallet', 'Percent',
  'BadgePlus', 'BadgeCheck', 'BadgeMinus', 'BadgeX',
  'Gamepad2', 'Joystick', 'Dices', 'Clover',
  'Rabbit', 'Turtle', 'Cat', 'Dog', 'Fish',
  'Ghost', 'Alien', 'Robot', 'Spider',
] as const;

export type TableIconName = (typeof TABLE_ICONS)[number];

export function resolveTableIcon(name?: string | null): React.ComponentType<{ className?: string }> {
  if (!name) return LucideIcons.Database;
  const icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name];
  return icon || LucideIcons.Database;
}

export function isCustomIcon(value?: string | null): value is string {
  return !!value && value.startsWith('http');
}

export function TableIconDisplay({ icon, className }: { icon?: string | null; className?: string }) {
  if (isCustomIcon(icon)) {
    return <img src={icon} className={cn('rounded object-cover', className)} />;
  }
  const Icon = useMemo(() => resolveTableIcon(icon), [icon]);
  return <Icon className={className} />;
}
