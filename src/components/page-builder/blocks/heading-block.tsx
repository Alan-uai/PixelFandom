'use client';

import { type ElementType } from 'react';

export function HeadingBlock({ config, preview: _preview }: { config: Record<string, unknown>; preview?: boolean }) {
  const content = (config.content as string) || 'Heading';
  const level = (config.level as string) || 'h2';
  const color = config.color as string | undefined;
  const align = (config.align as string) || 'left';

  const Tag = level as ElementType;

  const alignClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';

  const sizeMap: Record<string, string> = {
    h1: 'text-4xl font-bold tracking-tight',
    h2: 'text-3xl font-bold tracking-tight',
    h3: 'text-2xl font-semibold',
    h4: 'text-xl font-semibold',
    h5: 'text-lg font-medium',
    h6: 'text-base font-medium',
  };

  return (
    <Tag
      className={`${sizeMap[level] || sizeMap.h2} ${alignClass}`}
      style={color ? { color } : undefined}
    >
      {content}
    </Tag>
  );
}
