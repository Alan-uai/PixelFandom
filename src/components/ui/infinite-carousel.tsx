'use client';

import { useRef, useState, useMemo, useEffect, useCallback } from 'react';

type Props<T> = {
  items: T[];
  columnsCount?: number;
  gap?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
};

export default function InfiniteCarousel<T>({
  items,
  columnsCount = 2,
  gap = 12,
  renderItem,
}: Props<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [virtualOffset, setVirtualOffset] = useState(0);
  const [containerWidth, setContainerWidth] = useState(800);
  const ds = useRef({ isDragging: false, startX: 0, startOffset: 0, velocity: 0, lastTime: 0, lastX: 0 });
  const momentumRaf = useRef(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setContainerWidth(el.clientWidth);
    const ro = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    setVirtualOffset(0);
  }, [items.length]);

  const cols = Math.max(2, Math.min(5, columnsCount));
  const cardWidth = (containerWidth - (cols - 1) * gap) / cols;
  const slotWidth = cardWidth + gap;

  const visibleItems = useMemo(() => {
    if (items.length === 0) return [];
    const absStart = Math.floor(virtualOffset / slotWidth);
    const count = Math.ceil(containerWidth / slotWidth) + 2;
    const result: { item: T; absSlot: number }[] = [];
    for (let i = 0; i < count; i++) {
      const absSlot = absStart + i;
      const itemIndex = ((absSlot % items.length) + items.length) % items.length;
      result.push({ item: items[itemIndex], absSlot });
    }
    return result;
  }, [items, virtualOffset, slotWidth, containerWidth]);

  const offsetInSlot = virtualOffset - Math.floor(virtualOffset / slotWidth) * slotWidth;

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const d = ds.current;
    d.isDragging = true;
    d.startX = e.clientX;
    d.startOffset = virtualOffset;
    d.lastX = e.clientX;
    d.lastTime = performance.now();
    d.velocity = 0;
    cancelAnimationFrame(momentumRaf.current);
    momentumRaf.current = 0;
  }, [virtualOffset]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const d = ds.current;
    if (!d.isDragging) return;
    const now = performance.now();
    const dt = now - d.lastTime;
    const dx = e.clientX - d.lastX;
    if (dt > 0) {
      d.velocity = (dx / dt) * 0.4 + d.velocity * 0.6;
    }
    d.lastX = e.clientX;
    d.lastTime = now;
    setVirtualOffset(d.startOffset - (e.clientX - d.startX));
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const d = ds.current;
    if (!d.isDragging) return;
    d.isDragging = false;
    if (Math.abs(e.clientX - d.startX) < 5) return;
    if (Math.abs(d.velocity) > 0.3) {
      const animate = () => {
        d.velocity *= 0.97;
        setVirtualOffset(prev => prev + d.velocity * 16);
        if (Math.abs(d.velocity) > 0.5) {
          momentumRaf.current = requestAnimationFrame(animate);
        }
      };
      momentumRaf.current = requestAnimationFrame(animate);
    }
  }, []);

  if (items.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden select-none"
      style={{ touchAction: 'pan-y' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="flex" style={{ gap: `${gap}px`, transform: `translateX(${-offsetInSlot}px)` }}>
        {visibleItems.map(({ item, absSlot }) => (
          <div key={absSlot} className="shrink-0" style={{ width: cardWidth }}>
            {renderItem(item, absSlot)}
          </div>
        ))}
      </div>
    </div>
  );
}
