'use client';

import { ImageIcon } from 'lucide-react';

export function MediaTextBlock({ config }: { config: Record<string, unknown> }) {
  const title = (config.title as string) || '';
  const content = (config.content as string) || '';
  const imageSrc = config.imageSrc as string | undefined;
  const imagePosition = (config.imagePosition as string) || 'left';
  const imageRatio = (config.imageRatio as string) || '50';
  const ctaText = config.ctaText as string | undefined;
  const ctaUrl = config.ctaUrl as string | undefined;

  const imageSide = (
    <div className="overflow-hidden rounded-lg">
      {imageSrc ? (
        <img src={imageSrc} alt={title || ''} className="w-full h-full object-cover" />
      ) : (
        <div className="flex items-center justify-center bg-muted h-full min-h-[200px]">
          <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
        </div>
      )}
    </div>
  );

  const textSide = (
    <div className="flex flex-col justify-center space-y-4">
      {title && <h3 className="text-2xl font-bold">{title}</h3>}
      {content && <p className="text-muted-foreground">{content}</p>}
      {ctaText && ctaUrl && (
        <a
          href={ctaUrl}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors w-fit"
        >
          {ctaText}
        </a>
      )}
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row gap-6 items-stretch">
      <div className="w-full md:w-[var(--image-width)]" style={{ '--image-width': `${imageRatio}%` } as React.CSSProperties}>
        {imagePosition === 'left' ? imageSide : textSide}
      </div>
      <div className="flex-1">
        {imagePosition === 'left' ? textSide : imageSide}
      </div>
    </div>
  );
}
