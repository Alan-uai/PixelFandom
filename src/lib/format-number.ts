export function abbreviateNumber(n: number): string {
  if (Math.abs(n) >= 1_000_000_000_000) {
    const v = n / 1_000_000_000_000;
    return v.toFixed(2).replace(/\.?0+$/, '') + 'T';
  }
  if (Math.abs(n) >= 1_000_000_000) {
    const v = n / 1_000_000_000;
    return v.toFixed(2).replace(/\.?0+$/, '') + 'B';
  }
  if (Math.abs(n) >= 1_000_000) {
    const v = n / 1_000_000;
    return v.toFixed(2).replace(/\.?0+$/, '') + 'M';
  }
  if (Math.abs(n) >= 1_000) {
    const v = n / 1_000;
    return v.toFixed(2).replace(/\.?0+$/, '') + 'K';
  }
  return String(n);
}
