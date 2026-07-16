'use client';

import type { ReactNode } from 'react';
import FormatVariantRenderer from '@/components/wiki/format-variant-renderer';
import { normalizeValue, humanizeLabel } from '@/lib/operator-symbols';
import type { DisplayFormat } from './format-compatibility';

export interface DisplayProps {
  value: unknown;
  column: string;
  renderType: string;
}

function renderTypeToFormat(rt: string): DisplayFormat {
  switch (rt) {
    case 'image':       return 'image';
    case 'icon':        return 'icon';
    case 'icon-set':    return 'icon-set';
    case 'color-palette': return 'color-palette';
    case 'rating':      return 'rating';
    case 'color':       return 'color';
    case 'boolean':     return 'boolean';
    case 'tags':
    case 'multi-select': return 'multi-select';
    case 'link':        return 'link';
    case 'video':       return 'video';
    case 'audio':       return 'audio';
    case 'slider':      return 'progress';
    case 'duration':    return 'duration';
    case 'emoji':       return 'emoji';
    case 'date':
    case 'time':        return 'date';
    case 'entity-link': return 'text';
    case 'jsonb':       return 'jsonb-structured';
    case 'toggle-group': return 'badge';
    default:            return 'text';
  }
}

function parseIfJson(v: unknown): unknown {
  if (typeof v !== 'string') return v;
  try { return JSON.parse(v); } catch { return v; }
}

function applyKeyFormatting(
  obj: Record<string, unknown>,
  keyTypes?: Record<string, { type: string; suffix?: string }>,
  useSuffix?: boolean,
): Record<string, unknown> {
  if (!keyTypes) return obj;
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const kt = keyTypes[k];
    if (kt?.suffix && useSuffix && typeof v === 'number') {
      result[k] = String(v) + ' ' + kt.suffix;
    } else if (kt?.type === 'text' && typeof v === 'string') {
      result[k] = humanizeLabel(v);
    } else {
      result[k] = v;
    }
  }
  return result;
}

export function ColumnDisplay({ value, column, renderType, useSuffix, opEnabled, maxValue: _maxValue, columnConfig, variant, labelColor }: DisplayProps & {
  useSuffix?: boolean;
  opEnabled?: boolean;
  maxValue?: number;
  columnConfig?: { jsonbKeyTypes?: Record<string, { type: string; suffix?: string }>; jsonbKeyColors?: Record<string, string>; valueColors?: Record<string, string> };
  variant?: number;
  labelColor?: string;
}): ReactNode {
  const prepared = normalizeValue(value, useSuffix, opEnabled);
  if (prepared === null || prepared === undefined || prepared === '') return null;

  const tv = variant ?? 1;

  const jsonbKeyColors = columnConfig?.jsonbKeyColors;
  const valueColors = columnConfig?.valueColors;

  // jsonb: data extraction first (parse + key formatting), then delegate
  if (renderType === 'jsonb') {
    const parsed = parseIfJson(prepared);
    if (Array.isArray(parsed)) {
      return (
        <FormatVariantRenderer
          format="jsonb-structured"
          variant={tv}
          value={parsed}
          label={column}
          useSuffix={useSuffix}
          labelColor={labelColor}
          jsonbKeyColors={jsonbKeyColors}
        />
      );
    }
    if (typeof parsed === 'object' && parsed !== null) {
      const formatted = applyKeyFormatting(parsed as Record<string, unknown>, columnConfig?.jsonbKeyTypes, useSuffix);
      return (
        <FormatVariantRenderer
          format="jsonb-structured"
          variant={tv}
          value={formatted}
          label={column}
          useSuffix={useSuffix}
          labelColor={labelColor}
          jsonbKeyColors={jsonbKeyColors}
        />
      );
    }
    return <span className="text-sm">{String(parsed)}</span>;
  }

  // auto: data extraction with type detection, then delegate
  if (renderType === 'auto') {
    if (typeof prepared === 'object' && prepared !== null) {
      return (
        <FormatVariantRenderer
          format="jsonb-structured"
          variant={tv}
          value={prepared}
          label={column}
          useSuffix={useSuffix}
          opEnabled={opEnabled}
          labelColor={labelColor}
          jsonbKeyColors={jsonbKeyColors}
        />
      );
    }
    const format: DisplayFormat =
      typeof prepared === 'boolean' ? 'boolean' :
      typeof prepared === 'number' ? 'text' :
      'text';
    return (
      <FormatVariantRenderer
        format={format}
        variant={tv}
        value={prepared}
        label={column}
        useSuffix={useSuffix}
        opEnabled={opEnabled}
        labelColor={labelColor}
        valueColors={valueColors}
      />
    );
  }

  // icon-set / color-palette / multi-select / tags: parse JSON arrays
  if (['icon-set', 'color-palette', 'multi-select', 'tags'].includes(renderType)) {
    const arr = parseIfJson(prepared);
    return (
      <FormatVariantRenderer
        format={renderTypeToFormat(renderType)}
        variant={tv}
        value={Array.isArray(arr) ? arr : prepared}
        label={column}
        useSuffix={useSuffix}
        labelColor={labelColor}
        valueColors={valueColors}
      />
    );
  }

  // All other types: direct delegation
  return (
    <FormatVariantRenderer
      format={renderTypeToFormat(renderType)}
      variant={tv}
      value={prepared}
      label={column}
      useSuffix={useSuffix}
      opEnabled={opEnabled}
      labelColor={labelColor}
      valueColors={valueColors}
    />
  );
}
