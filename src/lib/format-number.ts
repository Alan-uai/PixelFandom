import { findSuffix, SCIENTIFIC_THRESHOLD } from '@/data/number-suffixes';

export function abbreviateNumber(n: number): string {
  if (!isFinite(n)) return String(n);
  const suffix = findSuffix(n);
  if (!suffix) return String(n);
  const v = n / Math.pow(10, suffix.exponent);
  return v.toFixed(2).replace(/\.?0+$/, '') + suffix.suffix;
}

export function formatNumber(n: number, useSuffix: boolean): string {
  if (!useSuffix) {
    if (Math.abs(n) >= SCIENTIFIC_THRESHOLD) {
      return n.toExponential(2);
    }
    return String(n);
  }
  return abbreviateNumber(n);
}
