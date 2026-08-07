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
 * - `grid`: CSS grid `repeat(auto-fit, minmax(columnWidth,1fr))`. Tiles get
 *   equal width and pack row-wise, ideal for uniform stat cells.
 *
 * With a single child the bento collapses to a single full-width column.
 */
import React from 'react';

export type BentoMode = 'masonry' | 'grid';

export type BentoGridProps = {
  children: React.ReactNode;
  className?: string;
  /** Extra inline styles applied to the grid container (inherit/preserve-3d/perspective…). */
  style?: React.CSSProperties;
  /** How tiles are laid out. `masonry` keeps natural per-tile heights; `grid` uses uniform auto-fit cells. */
  mode?: BentoMode;
  /** Optional explicit count of tiles — collapses to one column for a single tile. */
  count?: number;
  /** Target column width in px. In masonry the browser derives the column count from it + container width. */
  columnWidth?: number;
  /** Vertical + horizontal gap between tiles, in px. */
  gap?: number;
  /** When only one tile exists, span the full width instead of a narrow single column. */
  singleFullWidth?: boolean;
};

/**
 * Each direct child becomes a tile in the masonry flow. `break-inside-avoid`
 * keeps a tile intact instead of splitting it across columns, and `inline-block`
 * is required by the CSS multi-column spec so the tile packs on its own height.
 */
function masonryChildren(children: React.ReactNode, gap = 8) {
  const arr = Array.isArray(children) ? children : [children];
  return arr.map((child, i) =>
    child == null ? null : (
      <div
        key={i}
        className="w-full break-inside-avoid"
        style={{ marginBottom: gap, display: 'inline-block', width: '100%' }}
      >
        {child}
      </div>
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
}: BentoGridProps) {
  const arr = Array.isArray(children) ? children.filter(Boolean) : children ? [children] : [];
  const kids = count ?? arr.length;
  const solo = singleFullWidth && kids === 1 && kids > 0;

  if (solo) {
    return (
      <div className={`flex flex-col ${className}`} style={{ rowGap: gap, ...style }}>
        {children}
      </div>
    );
  }

  if (mode === 'grid') {
    return (
      <div
        className={className}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fit, minmax(${columnWidth}px, 1fr))`,
          gap,
          ...style,
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        columnWidth: `${columnWidth}px`,
        columnGap: gap,
        ...style,
      }}
    >
      {masonryChildren(children, gap)}
    </div>
  );
}