'use client';

import { createContext, useContext } from 'react';
import { interpolate, axisValueToRatio } from './scaling-engine';
import type { ScalingFormula, ScalingCurve, AxisOrientation } from './scaling-engine';

export interface ScalingInfo {
  enabled: boolean;
  copies: number;
  maxCopies: number;
  formula: ScalingFormula;
  /** Optional explicit axis for base/max ranges (e.g. level 1..100). */
  axisLabel?: string;
  axisMin?: number;
  axisMax?: number;
  defaultAxisValue?: number;
}

const ScalingContext = createContext<ScalingInfo>({
  enabled: false,
  copies: 0,
  maxCopies: 10000,
  formula: 'linear',
});

export function useScalingContext() {
  return useContext(ScalingContext);
}

export { ScalingContext };

// ── Base → Max (baseXmax) config ──────────────────────────────
// Carries the axis + slider settings for base/max ranges rendered inside cards.
export interface BaseXmaxConfig {
  enabled: boolean;
  axisLabel: string;
  axisMin: number;
  axisMax: number;
  step: number;
  defaultValue?: number;
  mode: 'continuous' | 'tiers';
  showPerCardSlider: boolean;
  /** Card-render mode: off (static), item (per-card), table (shared), ambos (both). */
  renderMode?: 'off' | 'item' | 'table' | 'ambos';
  /** Column whose value drives the base/max slider (e.g. level / Max Copies). */
  levelColumn?: string;
  /** Number of levels/tiers the [axisMin, axisMax] range is divided into. */
  tiers?: number;
  // ── Auto division-parameter model (new) ──────────────────────
  /** Division parameter: a column OR a jsonb sub-key ("col.key") holding a
   *  single numeric value (e.g. "Max Copies" = 12000). The system auto-detects
   *  numeric columns/keys and excludes anything containing "baseXmax". */
  paramColumn?: string;
  /** Auto base value (defaults to 2). */
  base?: number;
  /** Auto max value (defaults to 100). */
  max?: number;
  /** Whether to auto-pick the division parameter (numeric only, no base/max/tier). */
  auto?: boolean;
  /** When true, the base/max/step formula overrides are applied (issue #4/#5). */
  formulaEnabled?: boolean;
}

/** Default base/max/step for the auto division model. */
export const BASEXMAX_DEFAULT_BASE = 2;
export const BASEXMAX_DEFAULT_MAX = 100;
export const BASEXMAX_DEFAULT_STEP = 1;

/**
 * Resolves the numeric division parameter value from an item. Supports both a
 * plain column and a jsonb sub-key path ("colName.keyName").
 */
export function resolveBaseXmaxParam(
  item: Record<string, any> | undefined,
  paramColumn?: string,
): number | undefined {
  if (!item || !paramColumn) return undefined;
  let raw: unknown;
  if (paramColumn.includes('.')) {
    const [col, key] = paramColumn.split('.');
    const obj = item[col];
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      raw = (obj as Record<string, unknown>)[key];
    } else {
      raw = undefined;
    }
  } else {
    raw = item[paramColumn];
  }
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string' && raw.trim() !== '' && !isNaN(Number(raw))) {
    return Number(raw);
  }
  return undefined;
}

/**
 * Computes the displayed status for the auto division model.
 *
 * `copies` is the numerator (shared slider value, or per-card slider value).
 * `paramValue` is the item's single numeric division parameter (e.g. 12000
 * "Max Copies"). Result interpolates base→max as copies go 0→paramValue.
 *
 * Example: base 2, max 100, paramValue 12000 →
 *   copies 0   → 2
 *   copies 12000 → 100
 *
 * When `step` > 1 (issue #5), the result snaps to multiples of `step` above
 * the base (e.g. step 2 → 2, 4, 6, ...).
 */
export function computeBaseXmaxStatus(
  copies: number,
  paramValue: number | undefined,
  base?: number,
  max?: number,
  step?: number,
): number {
  const b = base ?? BASEXMAX_DEFAULT_BASE;
  const m = max ?? BASEXMAX_DEFAULT_MAX;
  const s = step && step > 1 ? step : BASEXMAX_DEFAULT_STEP;
  if (!paramValue || paramValue <= 0) return b;
  const ratio = Math.min(Math.max(copies / paramValue, 0), 1);
  let status = b + (m - b) * ratio;
  if (s > 1) {
    status = b + Math.round((status - b) / s) * s;
  }
  return status;
}

/**
 * Interpolates the displayed status for a given tier index across the
 * [axisMin, axisMax] axis split into `tiers` equal levels.
 *
 * tier 1 → axisMin (base), tier `tiers` → axisMax (max). Linear between.
 */
export function baseXmaxStatusAtTier(
  axisMin: number,
  axisMax: number,
  tiers: number,
  tier: number,
): number {
  const N = Math.max(1, Math.floor(tiers));
  if (N <= 1) return axisMax;
  const t = Math.min(Math.max(Math.round(tier), 1), N);
  return axisMin + ((t - 1) / (N - 1)) * (axisMax - axisMin);
}

export const DEFAULT_BASEXMAX: BaseXmaxConfig = {
  enabled: false,
  axisLabel: 'Nível',
  axisMin: 1,
  axisMax: 100,
  step: 1,
  mode: 'continuous',
  showPerCardSlider: false,
  renderMode: 'off',
};

export const BaseXmaxContext = createContext<BaseXmaxConfig | null>(null);

export function useBaseXmaxConfig(): BaseXmaxConfig | null {
  return useContext(BaseXmaxContext);
}

// ── Per-card / shared level (drives the base/max slider position) ──────────
export interface BaseXmaxLevel {
  /** Column whose value positions the per-card slider (legacy mode). */
  levelColumn?: string;
  /** Current level value for the per-card slider (legacy mode). */
  levelValue?: number;
  /** Shared slider value (the "copies" numerator) for the new model. */
  copies?: number;
  /** The item's division-parameter value (e.g. Max Copies = 12000). */
  paramValue?: number;
}

export const BaseXmaxLevelContext = createContext<BaseXmaxLevel | null>(null);

export function useBaseXmaxLevel(): BaseXmaxLevel | null {
  return useContext(BaseXmaxLevelContext);
}

export { BaseMaxValueNode } from '@/components/wiki/base-max-slider';

export interface ScaledValueProps {
  base: number;
  max: number;
  /** Override curve for this specific range. */
  curve?: ScalingCurve;
  /** Axis label override for this range. */
  axis?: string;
  orientation?: AxisOrientation;
  /** Explicit 0..1 ratio override (ignores the global copies slider). */
  ratio?: number;
  /** Explicit axis value (resolved via the context axis range when present). */
  axisValue?: number;
}

function resolveRatio(props: ScaledValueProps, ctx: ScalingInfo): number {
  if (props.ratio != null) return Math.min(Math.max(props.ratio, 0), 1);
  if (props.axisValue != null && ctx.axisMin != null && ctx.axisMax != null) {
    return axisValueToRatio(props.axisValue, ctx.axisMin, ctx.axisMax);
  }
  if (ctx.enabled) return Math.min(ctx.copies / ctx.maxCopies, 1);
  return 0;
}

export function ScaledValue(props: ScaledValueProps) {
  const ctx = useScalingContext();
  const curve: ScalingCurve = props.curve ?? ctx.formula;
  const current = resolveRatio(props, ctx);

  // When no scaling is active we show the raw base→max range.
  if (!ctx.enabled && props.ratio == null && props.axisValue == null) {
    return (
      <span className="font-mono text-sm font-medium text-foreground">
        {props.base} → {props.max}
      </span>
    );
  }

  const value = interpolate(props.base, props.max, current, curve);
  const pct = props.max > 0 ? (value / props.max) * 100 : 0;

  return (
    <span className="flex flex-col gap-0.5 w-full">
      <span className="flex items-center gap-1.5">
        <span className="font-mono text-sm font-bold text-foreground">
          {Math.round(value)}
        </span>
        <span className="text-xs text-muted-foreground">/ {props.max}</span>
      </span>
      <span className="h-1 w-full rounded-full bg-muted overflow-hidden">
        <span
          className="block h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </span>
    </span>
  );
}
