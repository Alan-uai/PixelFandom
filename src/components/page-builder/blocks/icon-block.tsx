'use client';

import { IconRenderer } from '@/components/ui/icon-renderer';
import type { IconDef } from '@/components/page-builder/types';

const sizeMap: Record<string, string> = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
};

const containerSizeMap: Record<string, string> = {
  sm: 'p-2',
  md: 'p-3',
  lg: 'p-4',
  xl: 'p-5',
};

const roundedMap: Record<string, string> = {
  none: 'rounded-none',
  sm: 'rounded',
  md: 'rounded-lg',
  full: 'rounded-full',
};

function resolveIcon(config: Record<string, unknown>): string {
  const icon = config.icon;
  if (!icon) return 'lucide:star';
  if (typeof icon === 'string') return icon;
  if (typeof icon === 'object' && icon !== null) {
    const obj = icon as IconDef;
    return obj.icon || 'lucide:star';
  }
  return 'lucide:star';
}

function resolveAnimation(config: Record<string, unknown>): 'none' | 'pulse' | 'spin' | 'bounce' | 'shake' | 'wiggle' | 'float' | 'glow' {
  const icon = config.icon;
  if (typeof icon === 'object' && icon !== null) {
    const anim = (icon as IconDef).animation;
    return anim || 'none';
  }
  return 'none';
}

export function IconBlock({ config }: { config: Record<string, unknown> }) {
  const size = (config.size as string) || 'md';
  const color = (config.color as string) || 'hsl(var(--primary))';
  const backgroundColor = config.backgroundColor as string | undefined;
  const rounded = (config.rounded as string) || 'md';
  const iconId = resolveIcon(config);
  const anim = resolveAnimation(config);

  return (
    <div className="flex items-center justify-center">
      <div
        className={`inline-flex items-center justify-center ${containerSizeMap[size] || 'p-3'} ${roundedMap[rounded] || 'rounded-lg'}`}
        style={{ backgroundColor: backgroundColor || 'hsl(var(--primary)/0.1)' }}
      >
        <IconRenderer
          icon={iconId}
          animation={anim}
          size={size === 'sm' ? 16 : size === 'md' ? 20 : size === 'lg' ? 28 : size === 'xl' ? 36 : 20}
          style={{ color }}
          className={sizeMap[size] || 'h-8 w-8'}
        />
      </div>
    </div>
  );
}
