'use client';

export function SpacerBlock({ config, preview: _preview }: { config: Record<string, unknown>; preview?: boolean }) {
  const height = (config.height as string) || 'md';

  const heightMap: Record<string, string> = {
    sm: 'h-4',
    md: 'h-8',
    lg: 'h-12',
    xl: 'h-16',
    '2xl': 'h-24',
  };

  return <div className={`${heightMap[height] || heightMap.md} w-full`} />;
}
