'use client';

import Image from 'next/image';
import { IconRenderer } from '@/components/ui/icon-renderer';

/** Columns that hold an icon (colon-separated string, URL, or emoji). */
export const ICON_COLUMNS = ['icon_url', 'icon_id', 'icon'];

/** Columns that hold an image (URL). */
export const IMAGE_COLUMNS = ['image_url', 'image', 'cover_url', 'logo_url'];

/**
 * Canonical name resolution for items.
 * Checks name → title → item_name → code, returning the first truthy value.
 */
export function getItemName(item: Record<string, unknown>): string {
  return (item.name || item.title || item.item_name || item.code || '') as string;
}

/**
 * Canonical icon resolution for items.
 * Checks icon_url → icon_id → icon (IconRenderer/URL/emoji), then image
 * columns, returning a ReactNode or null.
 */
export function getItemIcon(
  item: Record<string, unknown>,
  size: 'sm' | 'md' | 'lg' = 'md',
): React.ReactNode {
  for (const col of ICON_COLUMNS) {
    const v = item[col];
    if (v) {
      if (typeof v === 'string' && v.includes(':')) return <IconRenderer icon={v} size={size} />;
      if (typeof v === 'string' && v.startsWith('http')) return <Image src={v} alt="" fill className="object-contain" />;
      if (typeof v === 'string') return <span className="text-lg">{v}</span>;
    }
  }
  for (const col of IMAGE_COLUMNS) {
    const v = item[col];
    if (v && typeof v === 'string') return <Image src={v} alt="" fill className="object-cover" />;
  }
  return null;
}

/** Responsive grid class for 1-5 columns (wiki listing context). */
const GRID_COLS_MAP: Record<number, string> = {
  1: 'grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-1',
  2: 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2',
  3: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3',
  4: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4',
  5: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
};

export function getGridColsClass(cols: number): string {
  return GRID_COLS_MAP[cols] || 'grid grid-cols-2';
}
