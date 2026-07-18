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
    case 'select':      return 'select';
    case 'toggle-group': return 'toggle-group';
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
    case 'duration':     return 'duration';
    case 'number':       return 'number';
    case 'emoji':        return 'emoji';
    case 'date':
    case 'time':        return 'date';
    case 'entity-link': return 'text';
    case 'jsonb':       return 'jsonb-structured';
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

export interface AllowedValue {
  value: string;
  label?: string;
  color?: string;
  icon?: string;
  imageUrl?: string;
  linkedEntity?: string;
  autoFill?: Record<string, string>;
}

export function ColumnDisplay({ value, column, renderType, useSuffix, opEnabled, maxValue, columnConfig, variant, labelColor, hideLabel, onCompareClick, plain }: DisplayProps & {
  useSuffix?: boolean;
  opEnabled?: boolean;
  maxValue?: number;
  columnConfig?: { jsonbKeyTypes?: Record<string, { type: string; suffix?: string }>; jsonbKeyColors?: Record<string, string>; valueColors?: Record<string, string>; allowedValues?: AllowedValue[] };
  variant?: number;
  labelColor?: string;
  hideLabel?: boolean;
  onCompareClick?: () => void;
  plain?: boolean;
}): ReactNode {
  const prepared = normalizeValue(value, useSuffix, opEnabled);
  if (prepared === null || prepared === undefined || prepared === '') return null;

  const tv = variant ?? 1;

  const jsonbKeyColors = columnConfig?.jsonbKeyColors;
  const valueColors = columnConfig?.valueColors;
  const allowedValues = columnConfig?.allowedValues;

  // jsonb: data extraction first (parse + key formatting), then delegate
  if (renderType === 'jsonb') {
    const parsed = parseIfJson(prepared);
    const dl = hideLabel ? '' : column;
    if (Array.isArray(parsed)) {
      return (
        <FormatVariantRenderer
          format="jsonb-structured"
          variant={tv}
          plain={plain}
          value={parsed}
          label={dl}
          useSuffix={useSuffix}
          labelColor={labelColor}
          jsonbKeyColors={jsonbKeyColors}
          maxValue={maxValue}
          onCompareClick={onCompareClick}
        />
      );
    }
    if (typeof parsed === 'object' && parsed !== null) {
      const formatted = applyKeyFormatting(parsed as Record<string, unknown>, columnConfig?.jsonbKeyTypes, useSuffix);
      return (
        <FormatVariantRenderer
          format="jsonb-structured"
          variant={tv}
          plain={plain}
          value={formatted}
          label={dl}
          useSuffix={useSuffix}
          labelColor={labelColor}
          jsonbKeyColors={jsonbKeyColors}
          maxValue={maxValue}
          onCompareClick={onCompareClick}
        />
      );
    }
    return <span className="text-sm">{String(parsed)}</span>;
  }

  // auto: data extraction with type detection, then delegate
  if (renderType === 'auto') {
    const displayLabel = hideLabel ? '' : column;
    if (typeof prepared === 'object' && prepared !== null) {
      return (
        <FormatVariantRenderer
          format="jsonb-structured"
          variant={tv}
          plain={plain}
          value={prepared}
          label={displayLabel}
          useSuffix={useSuffix}
          opEnabled={opEnabled}
          labelColor={labelColor}
          jsonbKeyColors={jsonbKeyColors}
          maxValue={maxValue}
          onCompareClick={onCompareClick}
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
        label={displayLabel}
        useSuffix={useSuffix}
        opEnabled={opEnabled}
        labelColor={labelColor}
        valueColors={valueColors}
        maxValue={maxValue}
      />
    );
  }

  // icon-set / color-palette / multi-select / tags: parse JSON arrays
  if (['icon-set', 'color-palette', 'multi-select', 'tags', 'select', 'toggle-group'].includes(renderType)) {
    const arr = parseIfJson(prepared);
    const dl = hideLabel ? '' : column;
    return (
      <FormatVariantRenderer
        format={renderTypeToFormat(renderType)}
        variant={tv}
        value={Array.isArray(arr) ? arr : prepared}
        label={dl}
        useSuffix={useSuffix}
        labelColor={labelColor}
        valueColors={valueColors}
        maxValue={maxValue}
        allowedValues={allowedValues}
      />
    );
  }

  // All other types: direct delegation
  const dl = hideLabel ? '' : column;
  return (
    <FormatVariantRenderer
      format={renderTypeToFormat(renderType)}
      variant={tv}
      value={prepared}
      label={dl}
      useSuffix={useSuffix}
      opEnabled={opEnabled}
      labelColor={labelColor}
      valueColors={valueColors}
      maxValue={maxValue}
      allowedValues={allowedValues}
      onCompareClick={onCompareClick}
    />
  );
}
