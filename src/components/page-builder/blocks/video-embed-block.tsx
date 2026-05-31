'use client';

import { VideoIcon } from 'lucide-react';

const aspectRatios: Record<string, string> = {
  '16:9': '56.25%',
  '4:3': '75%',
  '1:1': '100%',
};

export function VideoEmbedBlock({ config }: { config: Record<string, unknown> }) {
  const title = (config.title as string) || '';
  const url = config.url as string | undefined;
  const aspectRatio = (config.aspectRatio as string) || '16:9';

  const paddingBottom = aspectRatios[aspectRatio] || '56.25%';

  return (
    <div className="space-y-3">
      {title && <h3 className="text-lg font-semibold">{title}</h3>}
      {url ? (
        <div className="relative w-full overflow-hidden rounded-lg bg-black/10" style={{ paddingBottom }}>
          <iframe
            src={url}
            title={title || 'Video embed'}
            className="absolute inset-0 h-full w-full"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="flex items-center justify-center bg-muted rounded-lg h-48">
          <VideoIcon className="h-10 w-10 text-muted-foreground/50" />
        </div>
      )}
    </div>
  );
}
