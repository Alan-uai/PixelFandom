'use client';

export function ButtonBlock({ config, preview }: { config: Record<string, unknown>; preview?: boolean }) {
  const text = (config.text as string) || 'Button';
  const url = config.url as string | undefined;
  const variant = (config.variant as string) || 'primary';
  const size = (config.size as string) || 'md';
  const fullWidth = config.fullWidth as boolean | undefined;

  const variantClass =
    variant === 'outline'
      ? 'border border-primary text-primary hover:bg-primary/10'
      : variant === 'ghost'
        ? 'hover:bg-muted text-foreground'
        : variant === 'secondary'
          ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          : 'bg-primary text-primary-foreground hover:bg-primary/90';

  const sizeClass =
    size === 'sm' ? 'px-3 py-1.5 text-xs' : size === 'lg' ? 'px-8 py-3 text-base' : 'px-5 py-2 text-sm';

  const classes = `inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${variantClass} ${sizeClass} ${fullWidth ? 'w-full' : ''}`;

  if (url) {
    return (
      <a href={url} className={classes}>
        {text}
      </a>
    );
  }

  return <button className={classes}>{text}</button>;
}
