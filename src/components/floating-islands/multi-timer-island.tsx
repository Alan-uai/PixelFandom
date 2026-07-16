'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { IslandMedia } from '@/components/page-builder/types';
import { IslandMediaDisplay } from './island-media-display';
import { CountdownDisplay, getRemaining } from './countdown-display';

interface TimerEvent {
  name: string;
  targetDate: string;
  displayDuration: number;
}

interface MultiTimerConfig {
  events?: TimerEvent[];
  displayFormat?: 'parallel' | 'carousel' | 'list';
  media?: IslandMedia | null;
}

interface MultiTimerIslandProps {
  config: Record<string, unknown>;
  onEventTrigger?: () => void;
}

export function MultiTimerIsland({ config, onEventTrigger }: MultiTimerIslandProps) {
  const cfg = config as MultiTimerConfig;
  const events = useMemo(() => cfg.events || [], [cfg.events]);
  const displayFormat = cfg.displayFormat || 'parallel';
  const media = cfg.media || null;

  const [eventIndex, setEventIndex] = useState(0);
  const [rotationTimer, setRotationTimer] = useState(0);
  const [triggered, setTriggered] = useState(false);
  const triggeredRef = useRef(false);
  const eventIndexRef = useRef(eventIndex);
  const onEventTriggerRef = useRef(onEventTrigger);
  useEffect(() => { eventIndexRef.current = eventIndex; }, [eventIndex]);
  useEffect(() => { onEventTriggerRef.current = onEventTrigger; }, [onEventTrigger]);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const current = events[eventIndex];
  const [remaining, setRemaining] = useState(() =>
    current ? getRemaining(current.targetDate) : { days: 0, hours: 0, minutes: 0, seconds: 0, expired: false }
  );

  // 1s tick: update countdowns + check trigger
  useEffect(() => {
    if (events.length === 0) return;
    const id = setInterval(() => {
      const idx = eventIndexRef.current;
      const rem = getRemaining(events[idx]?.targetDate || '');
      setRemaining(rem);

      if (rem.expired && !triggeredRef.current) {
        triggeredRef.current = true;
        setTriggered(true);
        onEventTriggerRef.current?.();
        setTimeout(() => {
          triggeredRef.current = false;
          setTriggered(false);
        }, 60000);
      }

      setRotationTimer((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [events]);

  // Rotation logic (parallel mode only)
  useEffect(() => {
    if (displayFormat !== 'parallel' || events.length < 2) return;
    const dur = current?.displayDuration || 10;
    if (rotationTimer >= dur) {
      setRotationTimer(0);
      setEventIndex((prev) => (prev + 1) % events.length);
    }
  }, [rotationTimer, displayFormat, events.length, current?.displayDuration]);

  // Update remaining when event index changes
  useEffect(() => {
    if (current) setRemaining(getRemaining(current.targetDate));
  }, [eventIndex, current]);

  const showMedia = media && (media.displayMode === 'always' || triggered);

  if (events.length === 0) {
    return <p className="text-xs text-muted-foreground">Nenhum evento configurado.</p>;
  }

  // ── List display ──
  if (displayFormat === 'list') {
    return (
      <div className="space-y-2 max-h-52 overflow-y-auto">
        {events.map((ev: TimerEvent, i: number) => {
          const rem = getRemaining(ev.targetDate);
          const isActive = i === eventIndex;
          return (
            <div key={i} className={`rounded-lg border p-2 transition-colors ${isActive ? 'border-primary/40 bg-primary/5' : 'border-border/50'}`}>
              <p className="text-xs font-medium truncate mb-1">{ev.name}</p>
              {rem.expired ? (
                <p className="text-[10px] font-semibold text-destructive">REALIZADO</p>
              ) : (
                <CountdownDisplay targetDate={ev.targetDate} compact />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // ── Carousel display ──
  if (displayFormat === 'carousel') {
    const slide = events[carouselIndex];
    if (!slide) return null;


    return (
      <div className="space-y-2">
        {showMedia && media && <IslandMediaDisplay media={media} />}
        <div className="relative overflow-hidden rounded-lg border border-border/50 bg-muted/20 p-3 min-h-[80px] flex flex-col items-center justify-center">
          <p className="text-xs font-medium text-center mb-2 truncate max-w-full">{slide.name}</p>
          <CountdownDisplay targetDate={slide.targetDate} />
          {events.length > 1 && (
            <>
              <button onClick={() => setCarouselIndex((p) => (p - 1 + events.length) % events.length)}
                className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1 text-muted-foreground hover:text-foreground shadow-sm">
                <ChevronLeft className="h-3 w-3" />
              </button>
              <button onClick={() => setCarouselIndex((p) => (p + 1) % events.length)}
                className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1 text-muted-foreground hover:text-foreground shadow-sm">
                <ChevronRight className="h-3 w-3" />
              </button>
            </>
          )}
        </div>
        {events.length > 1 && (
          <div className="flex items-center justify-center gap-1.5">
            {events.map((_: unknown, i: number) => (
              <button key={i} onClick={() => setCarouselIndex(i)}
                className={`rounded-full transition-all ${i === carouselIndex ? 'h-2 w-4 bg-primary' : 'h-2 w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'}`}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Parallel display (default) ──
  if (!current) return null;
  const nextEvent = events.length > 1 ? events[(eventIndex + 1) % events.length] : null;

  return (
    <div className="space-y-2">
      {showMedia && media && <IslandMediaDisplay media={media} />}
      <p className="text-xs font-medium text-center truncate">{current.name}</p>
      <CountdownDisplay targetDate={current.targetDate} />
      {events.length > 1 && (
        <>
          <div className="flex items-center justify-center gap-1.5 pt-1">
            {events.map((_: unknown, i: number) => (
              <div key={i} className={`h-1 rounded-full transition-all ${i === eventIndex ? 'w-3 bg-primary' : 'w-1 bg-muted-foreground/30'}`} />
            ))}
          </div>
          {nextEvent && !remaining.expired && (
            <p className="text-[10px] text-muted-foreground text-center">Próximo: {nextEvent.name}</p>
          )}
        </>
      )}
    </div>
  );
}
