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
      className={`relative overflow-hidden rounded-xl border bg-card/70 p-2.5 text-xs shadow-sm backdrop-blur-md transition-shadow ${
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
export function MiniCardGrid({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`columns-2 gap-2 [column-fill:_balance] [&>*]:mb-2 [&>*]:break-inside-avoid ${className}`}
      style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
    >
      {children}
    </div>
  );
}
