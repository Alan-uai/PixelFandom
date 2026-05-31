'use client';

import { ImageOff } from 'lucide-react';

const roundedMap: Record<string, string> = {
  none: 'rounded-none',
  sm: 'rounded',
  md: 'rounded-xl',
  lg: 'rounded-2xl',
  full: 'rounded-full',
};

export function ErrorImageBlock({ config }: { config: Record<string, unknown> }) {
  const src = config.src as string | undefined;
  const alt = (config.alt as string) || 'Ilustração 404';
  const overlay = config.overlay === true;
  const overlayText = (config.overlayText as string) || '';
  const rounded = (config.rounded as string) || 'md';

  return (
    <div className="flex justify-center py-4">
      <div className={`relative overflow-hidden ${roundedMap[rounded] || 'rounded-xl'} max-w-lg w-full`}>
        {src ? (
          <img src={src} alt={alt} className="w-full h-auto object-cover" />
        ) : (
          <div className="flex items-center justify-center bg-muted h-64">
            <ImageOff className="h-16 w-16 text-muted-foreground/50" />
          </div>
        )}
        {overlay && overlayText && (
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent flex items-end p-6">
            <span className="text-2xl font-bold">{overlayText}</span>
          </div>
        )}
      </div>
    </div>
  );
}
