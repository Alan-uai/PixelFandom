'use client';

import { Star } from 'lucide-react';

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

export function IconBlock({ config }: { config: Record<string, unknown> }) {
  const size = (config.size as string) || 'md';
  const color = (config.color as string) || 'hsl(var(--primary))';
  const backgroundColor = config.backgroundColor as string | undefined;
  const rounded = (config.rounded as string) || 'md';

  return (
    <div className="flex items-center justify-center">
      <div
        className={`inline-flex items-center justify-center ${containerSizeMap[size] || 'p-3'} ${roundedMap[rounded] || 'rounded-lg'}`}
        style={{ backgroundColor: backgroundColor || 'hsl(var(--primary)/0.1)' }}
      >
        <Star
          className={sizeMap[size] || 'h-8 w-8'}
          style={{ color }}
        />
      </div>
    </div>
  );
}
