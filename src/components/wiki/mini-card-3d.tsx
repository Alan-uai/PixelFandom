'use client';

import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export interface MiniCard3DProps {
  label?: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  color?: string;
  onClick?: () => void;
  className?: string;
  /** 3D depth intensity 0-1 */
  intensity?: number;
}

/**
 * Reusable 3D mini card with cursor-tracking tilt, glass surface and
 * follow-cursor radial glow. Used by variant 1 of all render types so
 * every stat inside an item card is rendered as a consistent mini card.
 */
export function MiniCard3D({ label, value, icon, color, onClick, className = '', intensity = 1 }: MiniCard3DProps) {
  const ref = useRef<HTMLDivElement>(null);

  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(my, [0, 1], [7 * intensity, -7 * intensity]), { stiffness: 200, damping: 18 });
  const rotateY = useSpring(useTransform(mx, [0, 1], [-9 * intensity, 9 * intensity]), { stiffness: 200, damping: 18 });

  const glowX = useTransform(mx, [0, 1], ['0%', '100%']);
  const glowY = useTransform(my, [0, 1], ['0%', '100%']);
  const glow = useTransform(
    [glowX, glowY],
    ([gx, gy]) => `radial-gradient(circle at ${gx} ${gy}, ${(color ? color : 'hsl(var(--primary))')} / 0.18, transparent 70%)`,
  );

  function handleMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width);
    my.set((e.clientY - rect.top) / rect.height);
  }
  function reset() {
    mx.set(0.5);
    my.set(0.5);
  }

  const accent = color || 'hsl(var(--primary))';

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={{
        rotateX,
        rotateY,
        perspective: '700px',
        transformStyle: 'preserve-3d',
        borderColor: `${accent}55`,
      }}
      className={`relative w-full overflow-hidden rounded-xl border bg-card/70 p-2.5 text-xs shadow-sm backdrop-blur-md transition-shadow ${
        onClick ? 'cursor-pointer hover:shadow-lg hover:shadow-primary/20' : 'cursor-default'
      } ${className}`}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: glow }}
      />
      <div className="relative flex flex-col gap-0.5" style={{ transform: 'translateZ(18px)' }}>
        {label && (
          <span
            className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: accent }}
          >
            {label}
          </span>
        )}
        <span className="flex items-center gap-1 font-medium text-foreground">
          {icon}
          {value}
        </span>
      </div>
    </motion.div>
  );
}

/**
 * Bento-box layout wrapper used to lay mini cards inside an item card.
 * Uses CSS multi-column so each card keeps its natural height and the
 * shorter cards do not stretch to match taller neighbours — unlike a
 * fixed 2-column grid. Cards break inside of themselves are avoided.
 */
/**
 * Bento-box layout wrapper used to lay mini cards inside an item card.
 *
 * Flexible bento behaviour (1–2 columns ONLY):
 *  - With a single card it spans the FULL column width (no forced 2-column
 *    track that would leave the card squished in the left half).
 *  - With 2+ cards it lays them out in at most 2 columns. We use a flex
 *    wrap with each card taking 1/2 width, so an uneven count still fills
 *    the row (e.g. 3 cards → 2 on top, 1 full-width below) and a lone card
 *    in a row stretches to full width.
 *  - When `singleFullWidth` is false (e.g. explicit 2-column grids) the old
 *    balanced `columns-2` behaviour is kept.
 */
export function MiniCardGrid({
  children,
  className = '',
  singleFullWidth = true,
  count,
}: {
  children: React.ReactNode;
  className?: string;
  singleFullWidth?: boolean;
  /** Optional explicit count of cards; used to skip the 2-col track for a single card. */
  count?: number;
}) {
  const kids = count ?? (Array.isArray(children) ? children.length : children ? 1 : 0);
  const solo = singleFullWidth && kids === 1;

  if (solo) {
    return (
      <div
        className={`flex flex-col gap-2 ${className}`}
        style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={`flex flex-wrap gap-2 ${className}`}
      style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
    >
      {wrapChildren(children)}
    </div>
  );
}

/**
 * Each direct child is wrapped so it takes 1/2 width on wider screens but
 * stretches to full width when it is the only item on its row. The
 * `min-w-0` keeps long content from overflowing the flex item.
 */
function wrapChildren(children: React.ReactNode) {
  const arr = Array.isArray(children) ? children : [children];
  return arr.map((child, i) =>
    child == null ? null : (
      <div key={i} className="min-w-0 flex-[1_1_48%] max-w-full">
        {child}
      </div>
    ),
  );
}
