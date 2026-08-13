'use client';

/**
 * AnimatedBentoGrid — wraps BentoGrid with FLIP (First-Left-Invert-Play)
 * animation. When items change position (e.g. on variant switch), each tile
 * smoothly slides from its old position to the new one using CSS transforms.
 *
 * The bevel/glow sweep only activates AFTER all tiles finish sliding.
 */
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { BentoGrid, type BentoGridProps } from './bento-grid';

export interface AnimatedBentoGridProps extends BentoGridProps {
  /** Called when the FLIP slide animation completes. Use to trigger beam/bevel. */
  onAnimationComplete?: () => void;
  /** Duration of the slide animation in ms. */
  animDuration?: number;
}

interface TileSnapshot {
  key: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export function AnimatedBentoGrid({
  children,
  onAnimationComplete,
  animDuration = 420,
  ...gridProps
}: AnimatedBentoGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevSnapshot = useRef<TileSnapshot[]>([]);
  const [renderKey, setRenderKey] = useState(0);

  // Increment renderKey on each render so BentoGrid re-packs
  // but tiles keep stable keys for FLIP tracking
  useEffect(() => {
    setRenderKey((k) => k + 1);
  }, []);

  const runFlip = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    // Find all tile wrappers with data-flip-key
    const tiles = Array.from(
      container.querySelectorAll<HTMLElement>('[data-flip-key]'),
    );

    if (tiles.length === 0) {
      prevSnapshot.current = [];
      return;
    }

    // Capture current (final) positions
    const containerRect = container.getBoundingClientRect();
    const currentSnapshot: TileSnapshot[] = tiles.map((tile) => {
      const rect = tile.getBoundingClientRect();
      return {
        key: tile.dataset.flipKey || '',
        x: rect.left - containerRect.left,
        y: rect.top - containerRect.top,
        w: rect.width,
        h: rect.height,
      };
    });

    const oldSnapshot = prevSnapshot.current;

    // First render — no animation, just store positions
    if (oldSnapshot.length === 0) {
      prevSnapshot.current = currentSnapshot;
      return;
    }

    // Build lookup of old positions by key
    const oldByKey = new Map<string, TileSnapshot>();
    oldSnapshot.forEach((s) => oldByKey.set(s.key, s));

    // Check if anything moved
    let anyMoved = false;
    for (const curr of currentSnapshot) {
      const old = oldByKey.get(curr.key);
      if (!old) {
        anyMoved = true;
        break;
      }
      if (
        Math.abs(old.x - curr.x) > 1 ||
        Math.abs(old.y - curr.y) > 1
      ) {
        anyMoved = true;
        break;
      }
    }
    if (!anyMoved && oldByKey.size === currentSnapshot.length) {
      return;
    }

    // FLIP: INVERT + PLAY
    for (const tile of tiles) {
      const key = tile.dataset.flipKey || '';
      const curr = currentSnapshot.find((s) => s.key === key);
      const old = oldByKey.get(key);

      if (!curr) continue;

      let dx: number;
      let dy: number;

      if (old) {
        dx = old.x - curr.x;
        dy = old.y - curr.y;
      } else {
        // New tile: slide from center
        dx = containerRect.width / 2 - curr.x - curr.w / 2;
        dy = containerRect.height / 2 - curr.y - curr.h / 2;
      }

      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;

      // Motion blur: stronger for longer slides, capped for subtlety
      const dist = Math.hypot(dx, dy);
      const blur = Math.min(6, dist / 28);

      // Set initial offset + blur
      tile.style.transform = `translate(${dx}px, ${dy}px)`;
      tile.style.filter = `blur(${blur}px)`;
      tile.style.transition = 'none';
    }

    // Force reflow
    void container.offsetHeight;

    // Animate to final position
    for (const tile of tiles) {
      tile.style.transition = `transform ${animDuration}ms cubic-bezier(0.22, 1, 0.36, 1), filter ${animDuration}ms cubic-bezier(0.22, 1, 0.36, 1)`;
      tile.style.transform = 'translate(0, 0)';
      tile.style.filter = 'blur(0px)';
    }

    // After animation completes
    setTimeout(() => {
      for (const tile of tiles) {
        tile.style.transition = '';
        tile.style.transform = '';
        tile.style.filter = '';
      }
      prevSnapshot.current = currentSnapshot;
      onAnimationComplete?.();
    }, animDuration + 30);

    prevSnapshot.current = currentSnapshot;
  }, [animDuration, onAnimationComplete]);

  // Run FLIP after each render
  useEffect(() => {
    const id = requestAnimationFrame(() => runFlip());
    return () => cancelAnimationFrame(id);
  }, [children, runFlip]);

  return (
    <div ref={containerRef} className="relative">
      <BentoGrid {...gridProps} trigger={renderKey}>
        {React.Children.map(children, (child, i) => {
          if (!React.isValidElement(child)) return child;
          // Clone to add data-flip-key for FLIP tracking
          const key =
            (child.key as string) ?? `bento-${i}`;
          return React.cloneElement(child as React.ReactElement<any>, {
            'data-flip-key': key,
            key,
          });
        })}
      </BentoGrid>
    </div>
  );
}
