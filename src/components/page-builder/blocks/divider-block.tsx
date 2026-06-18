'use client';

export function DividerBlock({ config, preview: _preview }: { config: Record<string, unknown>; preview?: boolean }) {
  const style = (config.style as string) || 'solid';
  const color = config.color as string | undefined;
  const thickness = (config.thickness as string) || 'sm';

  const borderStyle = style === 'dashed' ? 'border-dashed' : style === 'dotted' ? 'border-dotted' : 'border-solid';

  const thicknessClass =
    thickness === 'md' ? 'border-t-2' : thickness === 'lg' ? 'border-t-4' : 'border-t';

  return (
    <hr
      className={`my-4 w-full ${borderStyle} ${thicknessClass}`}
      style={color ? { borderColor: color } : { borderColor: 'hsl(var(--border))' }}
    />
  );
}
