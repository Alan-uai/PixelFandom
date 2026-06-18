'use client';

export function ListBlock({ config, preview: _preview }: { config: Record<string, unknown>; preview?: boolean }) {
  const items = (config.items as string[]) || [];
  const ordered = config.ordered as boolean | undefined;
  const style = (config.style as string) || (ordered ? 'decimal' : 'disc');

  const Tag = ordered ? 'ol' : 'ul';

  const styleClass =
    style === 'circle'
      ? 'list-circle'
      : style === 'square'
        ? 'list-square'
        : style === 'decimal'
          ? 'list-decimal'
          : style === 'roman'
            ? 'list-upper-roman'
            : 'list-disc';

  if (items.length === 0) return null;

  return (
    <Tag className={`${styleClass} pl-6 space-y-1 text-foreground`}>
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </Tag>
  );
}
