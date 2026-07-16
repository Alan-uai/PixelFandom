'use client';

import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';

interface CarouselItem {
  imageUrl?: string;
  videoUrl?: string;
  text?: string;
  link?: string;
}

interface CarouselIslandProps {
  config: Record<string, unknown>;
}

export function CarouselIsland({ config }: CarouselIslandProps) {
  const direction = (config.direction as string) || 'horizontal';
  const items = (config.items as CarouselItem[]) || [];
  const autoPlay = config.autoPlay as boolean;
  const interval = (config.interval as number) || 5;

  const [current, setCurrent] = useState(0);

  const isHorizontal = direction === 'horizontal';

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % items.length);
  }, [items.length]);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + items.length) % items.length);
  }, [items.length]);

  // Auto-play
  useEffect(() => {
    if (!autoPlay || items.length < 2) return;
    const id = setInterval(next, interval * 1000);
    return () => clearInterval(id);
  }, [autoPlay, interval, items.length, next]);

  if (items.length === 0) {
    return <p className="text-xs text-muted-foreground">Nenhum item no carrossel.</p>;
  }

  const item = items[current];
  const hasMedia = item?.imageUrl || item?.videoUrl;
  const hasText = !!item?.text;

  return (
    <div className="space-y-2">
      {/* Carousel viewport */}
      <div className="relative overflow-hidden rounded-lg border border-border/50 bg-muted/20">
        {/* Slide content */}
        <div className="min-h-0">
          {hasMedia && (
            <div className="relative">
              {item.imageUrl && (
                <div className="relative w-full max-h-36">
                  <Image
                    src={item.imageUrl}
                    alt=""
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              {item.videoUrl && (
                <video
                  src={item.videoUrl}
                  controls
                  autoPlay
                  muted
                  playsInline
                  className="w-full max-h-36"
                />
              )}
            </div>
          )}

          {hasText && (
            <div className={`${hasMedia ? 'p-2' : 'p-3'}`}>
              {item.link ? (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-primary hover:underline block"
                >
                  {item.text}
                </a>
              ) : (
                <p className="text-xs text-foreground">{item.text}</p>
              )}
            </div>
          )}
        </div>

        {/* Arrows */}
        {items.length > 1 && (
          <>
            <button
              onClick={prev}
              className={`absolute rounded-full bg-background/80 p-1 text-muted-foreground hover:text-foreground hover:bg-background transition-colors shadow-sm ${
                isHorizontal ? 'left-1 top-1/2 -translate-y-1/2' : 'top-1 left-1/2 -translate-x-1/2'
              }`}
            >
              {isHorizontal ? <ChevronLeft className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
            </button>
            <button
              onClick={next}
              className={`absolute rounded-full bg-background/80 p-1 text-muted-foreground hover:text-foreground hover:bg-background transition-colors shadow-sm ${
                isHorizontal ? 'right-1 top-1/2 -translate-y-1/2' : 'bottom-1 left-1/2 -translate-x-1/2'
              }`}
            >
              {isHorizontal ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </>
        )}
      </div>

      {/* Dots */}
      {items.length > 1 && (
        <div className="flex items-center justify-center gap-1.5">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all ${
                i === current
                  ? 'h-2 w-4 bg-primary'
                  : 'h-2 w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
