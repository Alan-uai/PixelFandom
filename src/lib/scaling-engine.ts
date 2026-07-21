export type ScalingFormula = 'linear' | 'diminishing';

export interface ScalingConfig {
  enabled: boolean;
  maxCopies: number;
  costPerCopy?: number;
  formula?: ScalingFormula;
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

export function hasBaseMaxShape(v: unknown): v is { base: number; max: number } {
  if (typeof v !== 'object' || v === null) return false;
  const obj = v as Record<string, unknown>;
  return typeof obj.base === 'number' && typeof obj.max === 'number';
}

export function calcRemainingCost(copies: number, maxCopies: number, costPerCopy?: number): number {
  if (!costPerCopy) return 0;
  return Math.max(0, maxCopies - copies) * costPerCopy;
}
