'use client';

export function ParagraphBlock({ config, preview }: { config: Record<string, unknown>; preview?: boolean }) {
  const content = (config.content as string) || '';
  const size = (config.size as string) || 'md';
  const color = config.color as string | undefined;

  const sizeClass = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base';

  return (
    <p
      className={`${sizeClass} leading-relaxed`}
      style={color ? { color } : undefined}
    >
      {content}
    </p>
  );
}
