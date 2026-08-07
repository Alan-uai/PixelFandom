'use client';

/**
 * Unified, reusable bento-box layout used to arrange the fields/columns of an
 * item inside its card.
 *
 * - `masonry` (default): CSS multi-column flow. The number of columns is
 *   derived entirely from the container width and `columnWidth`, so there is
 *   NO hardcoded column count — it adapts to the wrapping card automatically.
 *   Each tile keeps its natural height (short cards take less space than tall
 *   ones) and the flow re-packs around it.
 * - `dense`/`bento`: CSS grid `repeat(auto-fit, minmax(columnWidth,1fr))` with
 *   `grid-auto-flow: dense`. Tiles keep their natural height but get pushed
 *   into every free gap, so short cards fill holes left by taller neighbours.
 *   The column count is derived from the container, so tiles of varying sizes
 *   pack tightly — no persistent column division and no leftover slots.
 * - `grid`: CSS grid `repeat(auto-fit, minmax(columnWidth,1fr))`. Tiles get
 *   equal width and pack row-wise, ideal for uniform stat cells.
 *
 * With a single child the bento collapses to a single full-width column.
 *
 * Tiles animate in with a staggered reveal whenever the grid mounts (or when
 * `trigger` changes), respecting the user's animation preferences.
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnimationsEnabled } from '@/lib/animation-prefs';

export type BentoMode = 'masonry' | 'dense' | 'grid';

export type BentoGridProps = {
  children: React.ReactNode;
  className?: string;
  /** Extra inline styles applied to the grid container (inherit/preserve-3d/perspective…). */
  style?: React.CSSProperties;
  /** How tiles are laid out. `masonry` keeps natural per-tile heights; `dense`/`bento` packs tiles into free gaps; `grid` uses uniform auto-fit cells. */
  mode?: BentoMode;
  /** Optional explicit count of tiles — collapses to one column for a single tile. */
  count?: number;
  /** Target column width in px. In masonry the browser derives the column count from it + container width. */
  columnWidth?: number;
  /** Vertical + horizontal gap between tiles, in px. */
  gap?: number;
  /** When only one tile exists, span the full width instead of a narrow single column. */
  singleFullWidth?: boolean;
  /** Increment to re-run the staggered reveal animation. */
  trigger?: number;
  /** Delay between each tile reveal, in seconds. */
  staggerDelay?: number;
};

/**
 * Animates a single tile into place. When animations are disabled (or reduced
 * motion is requested) the tile renders statically — no opacity/transform.
 */
function BentoTile({
  index,
  animsOn,
  staggerDelay,
  children,
  className,
  style,
}: {
  index: number;
  animsOn: boolean;
  staggerDelay: number;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  if (!animsOn) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{
        delay: index * staggerDelay,
        duration: 0.32,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Each direct child becomes a tile in the masonry flow. `break-inside-avoid`
 * keeps a tile intact instead of splitting it across columns, and `inline-block`
 * is required by the CSS multi-column spec so the tile packs on its own height.
 */
function masonryChildren(
  children: React.ReactNode,
  gap: number,
  animsOn: boolean,
  staggerDelay: number,
  trigger: number,
) {
  const arr = Array.isArray(children) ? children : [children];
  return arr.map((child, i) =>
    child == null ? null : (
      <BentoTile
        key={`${trigger}-${i}`}
        index={i}
        animsOn={animsOn}
        staggerDelay={staggerDelay}
        className="w-full break-inside-avoid"
        style={{ marginBottom: gap, display: 'inline-block', width: '100%' }}
      >
        {child}
      </BentoTile>
    ),
  );
}

export function BentoGrid({
  children,
  className = '',
  mode = 'masonry',
  count,
  columnWidth = 168,
  gap = 8,
  singleFullWidth = true,
  style,
  trigger = 0,
  staggerDelay = 0.07,
}: BentoGridProps) {
  const animsOn = useAnimationsEnabled();
  const arr = Array.isArray(children) ? children.filter(Boolean) : children ? [children] : [];
  const kids = count ?? arr.length;
  const solo = singleFullWidth && kids === 1 && kids > 0;

  const isDense = mode === 'dense';

  const gridStyle: React.CSSProperties = {
    columnWidth: mode === 'masonry' ? `${columnWidth}px` : undefined,
    columnGap: gap,
    ...(mode === 'grid'
      ? {
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fit, minmax(${columnWidth}px, 1fr))`,
          gap,
        }
      : isDense
        ? {
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fit, minmax(${columnWidth}px, 1fr))`,
            gridAutoFlow: 'dense',
            gridAutoRows: 'min-content',
            alignItems: 'start',
            gap,
          }
        : {}),
    ...style,
  };

  const tiles = (single: boolean) =>
    (Array.isArray(children) ? children : [children]).map(
      (child, i) =>
        child == null ? null : (
          <BentoTile
            key={`${trigger}-${i}`}
            index={i}
            animsOn={animsOn}
            staggerDelay={staggerDelay}
            className="min-w-0"
            style={single ? { flex: '1 1 auto' } : undefined}
          >
            {child}
          </BentoTile>
        ),
    );

  // Single child → single full-width column.
  if (solo) {
    return (
      <div className={`flex flex-col ${className}`} style={{ rowGap: gap, ...style }}>
        {tiles(true)}
      </div>
    );
  }

  return (
    <AnimatePresence>
      <div className={className} style={gridStyle}>
        {mode === 'masonry'
          ? masonryChildren(children, gap, animsOn, staggerDelay, trigger)
          : tiles(false)}
      </div>
    </AnimatePresence>
  );
}