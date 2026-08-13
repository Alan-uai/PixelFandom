export type ScalingFormula = 'linear' | 'diminishing';

/**
 * Curve used to interpolate base→max. Always a closed enum of JS functions —
 * admins never provide an arbitrary formula string.
 */
export type ScalingCurve = 'linear' | 'diminishing' | 'exponential' | 'step';

export type AxisOrientation = 'up' | 'down';

export interface ScalingConfig {
  enabled: boolean;
  maxCopies: number;
  costPerCopy?: number;
  formula?: ScalingFormula;
}

export interface BaseMaxTier {
  label: string;
  /** Axis value at which this tier is reached (e.g. level, copy count, rarity index). */
  value: number;
  /** Optional explicit scaled result for this tier; falls back to interpolation. */
  result?: number;
}

/**
 * Canonical range shape stored inside JSONB. Stat names (the keys wrapping this
 * object) are free-form and may be any language; the role keys below are the
 * only reserved tokens and must stay in English (case-insensitive on ingest):
 *   base, max, curve, axis, orientation, tiers
 */
export interface BaseMaxValue {
  base: number;
  max: number;
  curve?: ScalingCurve;
  /** Axis label override for this specific range (e.g. "Nível", "Level"). */
  axis?: string;
  orientation?: AxisOrientation;
  tiers?: BaseMaxTier[];
}

export function calculateScaledValue(
  base: number,
  max: number,
  copies: number,
  maxCopies: number,
  formula: ScalingFormula = 'linear',
): number {
  const ratio = Math.min(copies / maxCopies, 1);
  switch (formula) {
    case 'diminishing':
      return base + (max - base) * (Math.log(1 + ratio * 9) / Math.log(10));
    case 'linear':
    default:
      return base + (max - base) * ratio;
  }
}

/**
 * Maps a ratio in [0,1] to the interpolation position for a given curve.
 */
export function curveRatio(ratio: number, curve: ScalingCurve = 'linear'): number {
  const t = Math.min(Math.max(ratio, 0), 1);
  switch (curve) {
    case 'diminishing':
      return Math.log(1 + t * 9) / Math.log(10);
    case 'exponential':
      // accelerating growth: small at start, large at end
      return t * t;
    case 'step':
      // snap to 5 discrete levels
      return Math.round(t * 4) / 4;
    case 'linear':
    default:
      return t;
  }
}

/**
 * Interpolates base→max at ratio t (0..1) using the given curve.
 */
export function interpolate(
  base: number,
  max: number,
  t: number,
  curve: ScalingCurve = 'linear',
): number {
  return base + (max - base) * curveRatio(t, curve);
}

/**
 * Converts an axis value (e.g. level 1..100) into a 0..1 ratio.
 */
export function axisValueToRatio(
  axisValue: number,
  axisMin: number,
  axisMax: number,
): number {
  if (axisMax === axisMin) return 0;
  return Math.min(Math.max((axisValue - axisMin) / (axisMax - axisMin), 0), 1);
}

/**
 * Resolves the displayed value for a base/max range given either a 0..1 ratio
 * or an explicit axis value within [axisMin, axisMax].
 */
export function resolveBaseMaxValue(
  v: BaseMaxValue,
  opts: { ratio?: number; axisValue?: number; axisMin?: number; axisMax?: number } = {},
): number {
  const curve = v.curve ?? 'linear';

  if (v.tiers && v.tiers.length > 0) {
    const target =
      opts.axisValue != null
        ? opts.axisValue
        : axisMinMaxToValue(opts, v);
    if (target != null) {
      const tier = nearestTier(v.tiers, target);
      if (tier) {
        if (tier.result != null) return tier.result;
        const t = axisValueToRatio(tier.value, tierRangeMin(v), tierRangeMax(v));
        return interpolate(v.base, v.max, t, curve);
      }
    }
  }

  let ratio = opts.ratio;
  if (ratio == null && opts.axisValue != null && opts.axisMin != null && opts.axisMax != null) {
    ratio = axisValueToRatio(opts.axisValue, opts.axisMin, opts.axisMax);
  }
  if (ratio == null) ratio = 0;
  return interpolate(v.base, v.max, ratio, curve);
}

function tierRangeMin(v: BaseMaxValue): number {
  return v.tiers && v.tiers.length ? Math.min(...v.tiers.map((t) => t.value)) : 0;
}
function tierRangeMax(v: BaseMaxValue): number {
  return v.tiers && v.tiers.length ? Math.max(...v.tiers.map((t) => t.value)) : 1;
}
function axisMinMaxToValue(
  opts: { axisValue?: number },
  _v: BaseMaxValue,
): number | undefined {
  return opts.axisValue;
}

function nearestTier(tiers: BaseMaxTier[], target: number): BaseMaxTier | undefined {
  let best: BaseMaxTier | undefined;
  let bestDist = Infinity;
  for (const tier of tiers) {
    const d = Math.abs(tier.value - target);
    if (d < bestDist) {
      bestDist = d;
      best = tier;
    }
  }
  return best;
}

const ROLE_KEYS = ['base', 'max', 'min', 'curve', 'axis', 'orientation', 'tiers'] as const;

/**
 * Case-insensitive detection of a base/max range object. Stat labels are
 * arbitrary, so only the reserved role keys are matched. Returns the canonical
 * shape (with normalized English role keys) or null.
 */
export function normalizeBaseMax(v: unknown): BaseMaxValue | null {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return null;
  const obj = v as Record<string, unknown>;

  // Find the base/max pair case-insensitively among reserved keys.
  let base: number | undefined;
  let max: number | undefined;
  let curve: ScalingCurve | undefined;
  let axis: string | undefined;
  let orientation: AxisOrientation | undefined;
  let tiers: BaseMaxTier[] | undefined;

  for (const [k, val] of Object.entries(obj)) {
    const lower = k.toLowerCase();
    if (lower === 'base') base = typeof val === 'number' ? val : undefined;
    else if (lower === 'max' || lower === 'maxtier') max = typeof val === 'number' ? val : undefined;
    else if (lower === 'min') {
      // treat `min` as base when base is not present
      if (base === undefined) base = typeof val === 'number' ? val : undefined;
    } else if (lower === 'curve') {
      if (val === 'linear' || val === 'diminishing' || val === 'exponential' || val === 'step') {
        curve = val;
      }
    } else if (lower === 'axis') axis = typeof val === 'string' ? val : undefined;
    else if (lower === 'orientation' || lower === 'direction') {
      if (val === 'up' || val === 'down') orientation = val;
    } else if (lower === 'tiers' && Array.isArray(val)) {
      tiers = val
        .filter((t) => t && typeof t === 'object')
        .map((t) => {
          const tt = t as Record<string, unknown>;
          return {
            label: String(tt.label ?? ''),
            value: typeof tt.value === 'number' ? tt.value : Number(tt.value) || 0,
            result: typeof tt.result === 'number' ? tt.result : undefined,
          } as BaseMaxTier;
        });
    }
  }

  if (base === undefined || max === undefined) return null;
  const result: BaseMaxValue = { base, max };
  if (curve) result.curve = curve;
  if (axis) result.axis = axis;
  if (orientation) result.orientation = orientation;
  if (tiers && tiers.length) result.tiers = tiers;
  return result;
}

export function hasBaseMaxShape(v: unknown): v is BaseMaxValue {
  return normalizeBaseMax(v) !== null;
}

/**
 * True when the object contains only reserved role keys (base/max/curve/...),
 * i.e. it is a pure range and not a group of sub-stats.
 */
export function isPureBaseMax(v: unknown): boolean {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return false;
  const obj = v as Record<string, unknown>;
  const keys = Object.keys(obj).map((k) => k.toLowerCase());
  return keys.every((k) => (ROLE_KEYS as readonly string[]).includes(k)) &&
    (keys.includes('base') || keys.includes('min')) &&
    (keys.includes('max') || keys.includes('maxtier'));
}

export function calcRemainingCost(copies: number, maxCopies: number, costPerCopy?: number): number {
  if (!costPerCopy) return 0;
  return Math.max(0, maxCopies - copies) * costPerCopy;
}
