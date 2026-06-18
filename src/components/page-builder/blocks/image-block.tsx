'use client';

import Image from 'next/image';
import { ImageIcon } from 'lucide-react';

const roundedMap: Record<string, string> = {
  none: 'rounded-none',
  sm: 'rounded',
  md: 'rounded-lg',
  full: 'rounded-full',
};

const shadowMap: Record<string, string> = {
  none: '',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
};

export function ImageBlock({ config }: { config: Record<string, unknown> }) {
  const src = config.src as string | undefined;
  const alt = (config.alt as string) || '';
  const caption = config.caption as string | undefined;
  const link = config.link as string | undefined;
  const rounded = (config.rounded as string) || 'md';
  const shadow = (config.shadow as string) || 'none';

  const img = (
    <div className={`overflow-hidden ${shadowMap[shadow] || ''}`}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          width={800}
          height={600}
          className={`w-full h-auto object-cover ${roundedMap[rounded] || 'rounded-lg'}`}
        />
      ) : (
        <div className={`flex items-center justify-center bg-muted h-48 ${roundedMap[rounded] || 'rounded-lg'}`}>
          <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-2">
      {link ? (
        <a href={link} target="_blank" rel="noopener noreferrer">
          {img}
        </a>
      ) : (
        img
      )}
      {caption && (
        <p className="text-sm text-center text-muted-foreground">{caption}</p>
      )}
    </div>
  );
}
