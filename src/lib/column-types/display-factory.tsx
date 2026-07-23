'use client';

import type { ReactNode } from 'react';
import FormatVariantRenderer from '@/components/wiki/format-variant-renderer';
import { normalizeValue, humanizeLabel } from '@/lib/operator-symbols';
import type { DisplayFormat } from './format-compatibility';
import { IconRenderer } from '@/components/ui/icon-renderer';

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
    case 'popover':      return 'popover';
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

export function ColumnDisplay({ value, column, renderType, useSuffix, opEnabled, opFlipped, maxValue, columnConfig, variant, labelColor, valueColors, hideLabel, onCompareClick, plain, animTrigger }: DisplayProps & {
  useSuffix?: boolean;
  opEnabled?: boolean;
  opFlipped?: boolean;
  maxValue?: number;
  columnConfig?: { jsonbKeyTypes?: Record<string, { type: string; suffix?: string }>; jsonbKeyColors?: Record<string, string>; valueColors?: Record<string, string>; allowedValues?: AllowedValue[]; labelIcon?: string };
  variant?: number;
  labelColor?: string;
  valueColors?: Record<string, string>;
  hideLabel?: boolean;
  onCompareClick?: (subKey?: string) => void;
  plain?: boolean;
  animTrigger?: number;
}): ReactNode {
  const prepared = normalizeValue(value, useSuffix, opEnabled);
  if (prepared === null || prepared === undefined || prepared === '') return null;

  const tv = variant ?? 1;

  const jsonbKeyColors = columnConfig?.jsonbKeyColors;
  const resolvedValueColors = valueColors ?? columnConfig?.valueColors;
  const allowedValues = columnConfig?.allowedValues;

  /** Build the label ReactNode: icon + text when labelIcon is present. */
  function withLabelIcon(text: string): ReactNode {
    if (!columnConfig?.labelIcon) return text;
    return (
      <span className="flex items-center gap-1">
        <IconRenderer icon={columnConfig.labelIcon} size={12} />
        {text}
      </span>
    );
  }

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
          labelNode={withLabelIcon(dl)}
          animTrigger={animTrigger}
          useSuffix={useSuffix}
          opEnabled={opEnabled}
          opFlipped={opFlipped}
          labelColor={labelColor}
          jsonbKeyColors={jsonbKeyColors}
          maxValue={maxValue}
          onCompareClick={onCompareClick}
          column={column}
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
          labelNode={withLabelIcon(dl)}
          animTrigger={animTrigger}
          useSuffix={useSuffix}
          opEnabled={opEnabled}
          opFlipped={opFlipped}
          labelColor={labelColor}
          jsonbKeyColors={jsonbKeyColors}
          maxValue={maxValue}
          onCompareClick={onCompareClick}
          column={column}
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
          labelNode={withLabelIcon(displayLabel)}
          animTrigger={animTrigger}
          useSuffix={useSuffix}
          opEnabled={opEnabled}
          opFlipped={opFlipped}
          labelColor={labelColor}
          jsonbKeyColors={jsonbKeyColors}
          maxValue={maxValue}
          onCompareClick={onCompareClick}
          column={column}
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
        labelNode={withLabelIcon(displayLabel)}
        useSuffix={useSuffix}
        opEnabled={opEnabled}
        labelColor={labelColor}
        valueColors={resolvedValueColors}
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
        labelNode={withLabelIcon(dl)}
        useSuffix={useSuffix}
        labelColor={labelColor}
        valueColors={resolvedValueColors}
        maxValue={maxValue}
        allowedValues={allowedValues}
      />
    );
  }

  // All other types: direct delegation
  const dl = hideLabel ? '' : column;

  // Auto-detect JSON array/object stored as text string (e.g. popover_config
  // with empty/missing columnTypes). Parse and route as jsonb-structured to
  // avoid showing raw JSON text.
  const autoParsed = typeof prepared === 'string' ? parseIfJson(prepared) : prepared;
  if (Array.isArray(autoParsed) || (typeof autoParsed === 'object' && autoParsed !== null)) {
    return (
      <FormatVariantRenderer
        format="jsonb-structured"
        variant={tv}
        plain={plain}
        value={autoParsed}
        label={dl}
        labelNode={withLabelIcon(dl)}
        useSuffix={useSuffix}
        opEnabled={opEnabled}
        labelColor={labelColor}
        jsonbKeyColors={jsonbKeyColors}
        maxValue={maxValue}
        onCompareClick={onCompareClick}
        column={column}
      />
    );
  }

  return (
    <FormatVariantRenderer
      format={renderTypeToFormat(renderType)}
      variant={tv}
      value={prepared}
      label={dl}
      labelNode={withLabelIcon(dl)}
      useSuffix={useSuffix}
      opEnabled={opEnabled}
      labelColor={labelColor}
      valueColors={resolvedValueColors}
      maxValue={maxValue}
      allowedValues={allowedValues}
      onCompareClick={onCompareClick}
      column={column}
    />
  );
}
