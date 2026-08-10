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
 * - `dense`/`bento`: pure content-driven grid — no fixed column template. `grid-auto-flow: dense`
 *   packs tiles left-to-right in editor order while filling holes, and implicit tracks
 *   (`grid-auto-columns: max-content`, `grid-auto-rows: auto`) let each column size itself to
 *   what it holds, so narrow cards sit side by side and tall/wide content stretches across
 *   neighbouring space. The column count adapts to the container and content instead of
 *   locking into 2 fixed columns.
 * - `grid`: CSS grid `repeat(auto-fit, minmax(columnWidth,1fr))`. Tiles get
 *   equal width and pack row-wise, ideal for uniform stat cells.
 *
 * With a single child the bento collapses to a single full-width column.
 *
 * Tiles animate in with a staggered reveal only on the FIRST mount of the
 * grid. On later `trigger` re-runs the tiles render statically — the entry
 * animation during a variant swap is owned by the per-tile wrapper (Variant3D),
 * so a generic fade/rise on the whole grid would mask it.
 */
import React, { useState } from 'react';
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
 * Animates a single tile into place. Only the first mount of the grid runs the
 * staggered reveal; later `trigger` re-runs render statically so the per-tile
 * wrapper (Variant3D) owns the transition. When animations are disabled (or
 * reduced motion is requested) the tile renders statically too.
 */
function BentoTile({
  index,
  animated,
  staggerDelay,
  children,
  className,
  style,
}: {
  index: number;
  animated: boolean;
  staggerDelay: number;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  if (!animated) {
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
  animated: boolean,
  staggerDelay: number,
  trigger: number,
) {
  const arr = Array.isArray(children) ? children : [children];
  return arr.map((child, i) =>
    child == null ? null : (
      <BentoTile
        key={`${trigger}-${i}`}
        index={i}
        animated={animated}
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

  // Staggered reveal only while the grid has never been re-triggered (trigger
  // still at its initial value). Every subsequent re-trigger renders the tiles
  // statically so the per-tile wrapper (Variant3D) owns the variant entry.
  const [baseTrigger] = useState(trigger);
  const animated = animsOn && trigger === baseTrigger;

  const gridStyle: React.CSSProperties = {
    columnWidth: mode === 'masonry' ? `${columnWidth}px` : undefined,
    columnGap: gap,
    ...(mode === 'grid'
      ? {
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fit, minmax(${columnWidth}px, 1fr))`,
          gridAutoRows: 'minmax(min-content, 1fr)',
          gap,
        }
: isDense
          ? {
              display: 'grid',
              gridAutoFlow: 'dense',
              gridTemplateColumns: `repeat(auto-fill, minmax(${columnWidth}px, 1fr))`,
              gridAutoRows: 'auto',
              justifyItems: 'stretch',
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
            animated={animated}
            staggerDelay={staggerDelay}
            className="min-w-0 h-full"
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
          ? masonryChildren(children, gap, animated, staggerDelay, trigger)
          : tiles(false)}
      </div>
    </AnimatePresence>
  );
}