'use client';

import type { IslandMedia } from '@/components/page-builder/types';

interface IslandMediaDisplayProps {
  media: IslandMedia;
}

export function IslandMediaDisplay({ media }: IslandMediaDisplayProps) {
  if (!media?.url) return null;

  const isVideo = media.type === 'video';
  const isImage = media.type === 'image' || media.type === 'gif';
  const isLink = media.type === 'link';

  return (
    <div className="rounded-lg overflow-hidden border border-border/50 bg-muted/30">
      {isImage && (
        <img
          src={media.url}
          alt=""
          className="w-full max-h-40 object-cover"
          loading="lazy"
        />
      )}
      {isVideo && (
        <video
          src={media.url}
          controls
          autoPlay
          muted
          loop
          playsInline
          className="w-full max-h-40"
        />
      )}
      {isLink && (
        <a
          href={media.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 text-xs text-primary hover:underline"
        >
          <span className="truncate">{media.url}</span>
          <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      )}
    </div>
  );
}
