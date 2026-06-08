'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { IslandMedia } from '@/components/page-builder/types';
import { IslandMediaDisplay } from './island-media-display';
import { CountdownDisplay, getRemaining } from './countdown-display';

interface QueueItem {
  name: string;
  time: string; // HH:MM
}

interface QueueTimerConfig {
  items?: QueueItem[];
  displayFormat?: 'sequential' | 'carousel' | 'list';
  media?: IslandMedia | null;
}

interface QueueTimerIslandProps {
  config: Record<string, unknown>;
  onEventTrigger?: () => void;
}

function getNextTargetTime(time: string): Date {
  const [h, m] = time.split(':').map(Number);
  const now = new Date();
  const candidate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
  if (candidate.getTime() <= now.getTime()) {
    candidate.setDate(candidate.getDate() + 1);
  }
  return candidate;
}

export function QueueTimerIsland({ config, onEventTrigger }: QueueTimerIslandProps) {
  const cfg = config as QueueTimerConfig;
  const items = cfg.items || [];
  const displayFormat = cfg.displayFormat || 'sequential';
  const media = cfg.media || null;

  const [currentIdx, setCurrentIdx] = useState(0);
  const [nextTime, setNextTime] = useState<Date | null>(null);
  const [remaining, setRemaining] = useState(() => getRemaining(new Date()));
  const [triggered, setTriggered] = useState(false);
  const triggeredRef = useRef(false);
  const [carouselIdx, setCarouselIdx] = useState(0);

  // Init: find next item
  useEffect(() => {
    if (items.length === 0) return;
    const sorted = [...items].sort((a, b) => a.time.localeCompare(b.time));
    const now = Date.now();
    let found = 0;
    for (let i = 0; i < sorted.length; i++) {
      const t = getNextTargetTime(sorted[i].time);
      if (t.getTime() > now) { found = i; break; }
    }
    setCurrentIdx(found);
    const t = getNextTargetTime(sorted[found].time);
    setNextTime(t);
    setRemaining(getRemaining(t));
  }, [items]);

  // 1s tick
  useEffect(() => {
    if (!nextTime || items.length === 0) return;
    const id = setInterval(() => {
      const rem = getRemaining(nextTime);
      setRemaining(rem);
      if (rem.expired && !triggeredRef.current) {
        triggeredRef.current = true;
        setTriggered(true);
        onEventTrigger?.();
        setTimeout(() => { triggeredRef.current = false; setTriggered(false); }, 60000);
        const nextIdx = (currentIdx + 1) % items.length;
        setCurrentIdx(nextIdx);
        const t = getNextTargetTime(items[nextIdx].time);
        setNextTime(t);
        setRemaining(getRemaining(t));
      }
    }, 1000);
    return () => clearInterval(id);
  }, [nextTime, items, currentIdx, onEventTrigger]);

  const showMedia = media && (media.displayMode === 'always' || triggered);

  if (items.length === 0) {
    return <p className="text-xs text-muted-foreground">Nenhum item configurado.</p>;
  }

  const currentItem = items[currentIdx];
  const nextItem = items[(currentIdx + 1) % items.length];

  // ── Carousel display ──
  if (displayFormat === 'carousel') {
    const slide = items[carouselIdx];
    if (!slide) return null;
    const slideTarget = getNextTargetTime(slide.time);
    const slideRem = getRemaining(slideTarget);

    return (
      <div className="space-y-2">
        {showMedia && media && <IslandMediaDisplay media={media} />}
        <div className="relative overflow-hidden rounded-lg border border-border/50 bg-muted/20 p-3 min-h-[80px] flex flex-col items-center justify-center">
          <p className="text-xs font-medium text-center mb-1 truncate max-w-full">{slide.name}</p>
          <p className="text-[10px] text-muted-foreground mb-2">{slide.time}</p>
          {slide === currentItem ? (
            <CountdownDisplay targetDate={slideTarget} />
          ) : (
            <p className="text-[10px] text-muted-foreground">{slideRem.expired ? 'REALIZADO' : 'Aguardando'}</p>
          )}
          {items.length > 1 && (
            <>
              <button onClick={() => setCarouselIdx((p) => (p - 1 + items.length) % items.length)}
                className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1 text-muted-foreground hover:text-foreground shadow-sm">
                <ChevronLeft className="h-3 w-3" />
              </button>
              <button onClick={() => setCarouselIdx((p) => (p + 1) % items.length)}
                className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1 text-muted-foreground hover:text-foreground shadow-sm">
                <ChevronRight className="h-3 w-3" />
              </button>
            </>
          )}
        </div>
        {items.length > 1 && (
          <div className="flex items-center justify-center gap-1.5">
            {items.map((_, i) => (
              <button key={i} onClick={() => setCarouselIdx(i)}
                className={`rounded-full transition-all ${i === carouselIdx ? 'h-2 w-4 bg-primary' : 'h-2 w-2 bg-muted-foreground/30'}`}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── List display ──
  if (displayFormat === 'list') {
    return (
      <div className="space-y-1.5 max-h-52 overflow-y-auto">
        {items.map((item, i) => {
          const isNext = i === currentIdx;
          const target = getNextTargetTime(item.time);
          const isToday = target.getDate() === new Date().getDate();
          const rem = isToday && !isNext ? null : getRemaining(target);
          return (
            <div key={i} className={`rounded-lg border px-2 py-1.5 transition-colors ${isNext ? 'border-primary/40 bg-primary/5' : 'border-border/30'}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium truncate">{item.name}</span>
                <span className="text-[10px] text-muted-foreground shrink-0">{item.time}</span>
              </div>
              {isNext && rem && <CountdownDisplay targetDate={target} compact />}
            </div>
          );
        })}
      </div>
    );
  }

  // ── Sequential display (default) ──
  return (
    <div className="space-y-2">
      {showMedia && media && <IslandMediaDisplay media={media} />}
      <p className="text-xs font-medium text-center truncate">{currentItem?.name}</p>
      <p className="text-[10px] text-muted-foreground text-center">{currentItem?.time}</p>
      {nextTime && <CountdownDisplay targetDate={nextTime} />}
      <p className="text-[10px] text-muted-foreground text-center">
        Próximo: {nextItem?.name} ({nextItem?.time})
      </p>
    </div>
  );
}
