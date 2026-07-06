import { z } from 'zod';
import { COLUMN_TYPES, type RenderType } from './registry';

export const ColumnRenderTypeSchema = z.enum([
  'text', 'link', 'tags', 'entity-link', 'jsonb',
  'integer', 'bigint', 'real', 'double', 'numeric',
  'rating', 'slider', 'duration', 'boolean',
  'image', 'file', 'icon', 'video', 'audio',
  'select', 'multi-select', 'toggle-group',
  'color', 'color-palette', 'emoji', 'icon-set',
  'date', 'time',
]);

export const ColumnTypeMapSchema = z.record(
  z.string().regex(/^[a-z][a-z0-9_]*$/, 'Invalid column name'),
  ColumnRenderTypeSchema,
);

export type ColumnTypeMap = z.infer<typeof ColumnTypeMapSchema>;

export interface SaveValidation {
  ok: boolean;
  error?: string;
}

export function validateColumnValue(renderType: string, rawValue: string): SaveValidation {
  const def = COLUMN_TYPES[renderType as RenderType];
  if (!def) return { ok: true };

  const err = def.validateValue(rawValue);
  if (err) return { ok: false, error: err };

  return { ok: true };
}

export function sanitizeColumnValue(renderType: string, rawValue: string): string {
  const def = COLUMN_TYPES[renderType as RenderType];
  if (!def) return rawValue.slice(0, 10000);
  return def.sanitize(rawValue);
}

export function parseRenderType(raw: unknown): string | null {
  const result = ColumnRenderTypeSchema.safeParse(raw);
  return result.success ? result.data : null;
}
