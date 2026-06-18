'use client';

import Image from 'next/image';

export function HeroBlock({ config, preview: _preview }: { config: Record<string, unknown>; preview?: boolean }) {
  const title = (config.title as string) || 'Título';
  const subtitle = (config.subtitle as string) || '';
  const ctaText = (config.ctaText as string) || '';
  const ctaUrl = (config.ctaUrl as string) || '';
  const imageUrl = config.imageUrl as string;
  const bgColor = (config.backgroundColor as string) || '';

  return (
    <div
      className="relative flex flex-col items-center justify-center rounded-xl overflow-hidden text-center py-16 px-6"
      style={bgColor ? { backgroundColor: bgColor } : { background: 'linear-gradient(135deg, hsl(var(--primary)/0.1), hsl(var(--primary)/0.05))' }}
    >
      {imageUrl && (
        <div className="absolute inset-0">
          <Image src={imageUrl} alt="" fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/80" />
        </div>
      )}
      <div className="relative z-10 max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight" style={{ color: imageUrl ? '#fff' : undefined }}>
          {title}
        </h1>
        {subtitle && (
          <p className="mt-3 text-lg" style={{ color: imageUrl ? 'rgba(255,255,255,0.8)' : 'hsl(var(--muted-foreground))' }}>
            {subtitle}
          </p>
        )}
        {ctaText && (
          <a
            href={ctaUrl || '#'}
            className="inline-flex items-center gap-2 mt-6 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {ctaText}
          </a>
        )}
      </div>
    </div>
  );
}
