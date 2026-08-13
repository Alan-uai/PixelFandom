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
  levelColumn?: string;
  levelValue?: number;
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
