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
 * - `dense`: CSS grid with `grid-auto-flow: dense`. Items pack left-to-right
 *   filling gaps, sized by their content.
 * - `bento`: TRUE bento grid with bin-packing. Each child can declare its size
 *   via `data-bento-cols` and `data-bento-rows` attributes. A greedy
 *   first-fit-decreasing algorithm positions items like Tetris — no gaps,
 *   every row fully occupied.
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
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnimationsEnabled } from '@/lib/animation-prefs';

export type BentoMode = 'masonry' | 'dense' | 'bento' | 'grid';

export type BentoGridProps = {
  children: React.ReactNode;
  className?: string;
  /** Extra inline styles applied to the grid container (inherit/preserve-3d/perspective…). */
  style?: React.CSSProperties;
  /** How tiles are laid out. `masonry` keeps natural per-tile heights; `dense` packs into free gaps; `bento` uses bin-packing like Tetris; `grid` uses uniform auto-fit cells. */
  mode?: BentoMode;
  /** Optional explicit count of tiles — collapses to one column for a single tile. */
  count?: number;
  /** Target column width in px. In masonry the browser derives the column count from it + container width. In bento mode, this is the unit size for the packing grid. */
  columnWidth?: number;
  /** Vertical + horizontal gap between tiles, in px. */
  gap?: number;
  /** When only one tile exists, span the full width instead of a narrow single column. */
  singleFullWidth?: boolean;
  /** Increment to re-run the staggered reveal animation. */
  trigger?: number;
  /** Delay between each tile reveal, in seconds. */
  staggerDelay?: number;
  /** Number of columns for bento mode packing. Defaults to 4. */
  columns?: number;
};

/* ─── Bin-packing algorithm (greedy first-fit) ──────────────────────────── */

interface PackedItem {
  col: number;
  row: number;
  spanCols: number;
  spanRows: number;
}

/**
 * Greedy bin-packer. Scans the grid row-by-row, left-to-right, placing each
 * item at the first position where it fits without overlapping. Items must be
 * sorted by area descending (largest first) for best density.
 */
function packBento(
  sizes: { spanCols: number; spanRows: number }[],
  numCols: number,
): PackedItem[] {
  // Grid occupancy map: grid[row][col] = true if occupied
  const occupied: boolean[][] = [];
  const result: PackedItem[] = [];

  function isFree(r: number, c: number, sr: number, sc: number): boolean {
    for (let dr = 0; dr < sr; dr++) {
      for (let dc = 0; dc < sc; dc++) {
        const rr = r + dr;
        const cc = c + dc;
        if (rr < 0 || cc < 0 || cc >= numCols) return false;
        // Extend occupied map as needed
        while (occupied.length <= rr) occupied.push([]);
        while (occupied[rr].length <= cc) occupied[rr].push(false);
        if (occupied[rr][cc]) return false;
      }
    }
    return true;
  }

  function mark(r: number, c: number, sr: number, sc: number) {
    for (let dr = 0; dr < sr; dr++) {
      for (let dc = 0; dc < sc; dc++) {
        const rr = r + dr;
        const cc = c + dc;
        while (occupied.length <= rr) occupied.push([]);
        while (occupied[rr].length <= cc) occupied[rr].push(false);
        occupied[rr][cc] = true;
      }
    }
  }

  // Clamp items that are wider than the grid
  const clamped = sizes.map((s) => ({
    spanCols: Math.min(s.spanCols, numCols),
    spanRows: s.spanRows,
  }));

  for (const { spanCols, spanRows } of clamped) {
    let placed = false;
    // Scan rows from top, cols from left
    for (let r = 0; !placed; r++) {
      for (let c = 0; c <= numCols - spanCols; c++) {
        if (isFree(r, c, spanRows, spanCols)) {
          result.push({ col: c, row: r, spanCols, spanRows });
          mark(r, c, spanRows, spanCols);
          placed = true;
          break;
        }
      }
    }
  }

  return result;
}

/* ─── Tile wrapper (animation) ──────────────────────────────────────────── */

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

/* ─── Masonry children helper ───────────────────────────────────────────── */

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

/* ─── Bento children helper (bin-packed positions) ──────────────────────── */

function bentoChildren(
  children: React.ReactNode,
  numCols: number,
  gap: number,
  animated: boolean,
  staggerDelay: number,
  trigger: number,
) {
  const arr = Array.isArray(children) ? children : [children];

  // Extract sizes from data attributes on each child element
  const sizes = arr.map((child) => {
    if (child == null) return { spanCols: 1, spanRows: 1 };
    if (React.isValidElement(child)) {
      const el = child as React.ReactElement<{ 'data-bento-cols'?: string; 'data-bento-rows'?: string }>;
      const c = parseInt(el.props['data-bento-cols'] || '1', 10);
      const r = parseInt(el.props['data-bento-rows'] || '1', 10);
      return { spanCols: Math.max(1, c), spanRows: Math.max(1, r) };
    }
    return { spanCols: 1, spanRows: 1 };
  });

  // Sort indices by area descending for better packing density
  const indices = sizes.map((_, i) => i);
  indices.sort((a, b) => {
    const areaA = sizes[a].spanCols * sizes[a].spanRows;
    const areaB = sizes[b].spanCols * sizes[b].spanRows;
    return areaB - areaA;
  });

  // Reorder sizes to match sorted indices
  const sortedSizes = indices.map((i) => sizes[i]);

  // Pack
  const packed = packBento(sortedSizes, numCols);

  // Map packed positions back to original child order
  const positionMap = new Map<number, PackedItem>();
  indices.forEach((origIdx, packedIdx) => {
    positionMap.set(origIdx, packed[packedIdx]);
  });

  return arr.map((child, i) => {
    if (child == null) return null;
    const pos = positionMap.get(i);
    if (!pos) return null;

    const gridStyle: React.CSSProperties = {
      gridColumn: `${pos.col + 1} / span ${pos.spanCols}`,
      gridRow: `${pos.row + 1} / span ${pos.spanRows}`,
    };

    return (
      <BentoTile
        key={`${trigger}-${i}`}
        index={i}
        animated={animated}
        staggerDelay={staggerDelay}
        className="min-w-0 h-full"
        style={gridStyle}
      >
        {child}
      </BentoTile>
    );
  });
}

/* ─── Main component ────────────────────────────────────────────────────── */

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
  columns: columnsProp,
}: BentoGridProps) {
  const animsOn = useAnimationsEnabled();
  const arr = Array.isArray(children) ? children.filter(Boolean) : children ? [children] : [];
  const kids = count ?? arr.length;
  const solo = singleFullWidth && kids === 1 && kids > 0;

  const isDense = mode === 'dense';
  const isBento = mode === 'bento';

  // Staggered reveal only while the grid has never been re-triggered (trigger
  // still at its initial value). Every subsequent re-trigger renders the tiles
  // statically so the per-tile wrapper (Variant3D) owns the variant entry.
  const [baseTrigger] = useState(trigger);
  const animated = animsOn && trigger === baseTrigger;

  // Bento mode: compute grid template from packing results
  const bentoGrid = useMemo(() => {
    if (!isBento) return null;

    const numCols = columnsProp ?? 4;
    const arr = Array.isArray(children) ? children : [children];

    const sizes = arr.map((child) => {
      if (child == null) return { spanCols: 1, spanRows: 1 };
      if (React.isValidElement(child)) {
        const el = child as React.ReactElement<{ 'data-bento-cols'?: string; 'data-bento-rows'?: string }>;
        const c = parseInt(el.props['data-bento-cols'] || '1', 10);
        const r = parseInt(el.props['data-bento-rows'] || '1', 10);
        return { spanCols: Math.max(1, c), spanRows: Math.max(1, r) };
      }
      return { spanCols: 1, spanRows: 1 };
    });

    const indices = sizes.map((_, i) => i);
    indices.sort((a, b) => {
      const areaA = sizes[a].spanCols * sizes[a].spanRows;
      const areaB = sizes[b].spanCols * sizes[b].spanRows;
      return areaB - areaA;
    });

    const sortedSizes = indices.map((i) => sizes[i]);
    const packed = packBento(sortedSizes, numCols);

    const positionMap = new Map<number, PackedItem>();
    indices.forEach((origIdx, packedIdx) => {
      positionMap.set(origIdx, packed[packedIdx]);
    });

    // Calculate total rows needed
    let maxRow = 0;
    packed.forEach((p) => {
      const end = p.row + p.spanRows;
      if (end > maxRow) maxRow = end;
    });

    return { positionMap, numCols, totalRows: maxRow };
  }, [isBento, children, columnsProp]);

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
        : isBento && bentoGrid
          ? {
              display: 'grid',
              gridTemplateColumns: `repeat(${bentoGrid.numCols}, 1fr)`,
              gridAutoRows: 'auto',
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
          : isBento && bentoGrid
            ? bentoChildren(children, bentoGrid.numCols, gap, animated, staggerDelay, trigger)
            : tiles(false)}
      </div>
    </AnimatePresence>
  );
}
