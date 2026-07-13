const SUFFIX_MULTIPLIERS: Record<string, number> = {
  K: 1e3,
  k: 1e3,
  M: 1e6,
  B: 1e9,
  T: 1e12,
  Q: 1e15,
};

export function parseSmartNumber(s: string): number | null {
  const trimmed = s.trim();

  if (trimmed === '') return null;

  const num = Number(trimmed);
  if (!isNaN(num) && trimmed === String(num)) return num;

  const sciMatch = trimmed.match(/^[+-]?\d+(\.\d+)?[eE][+-]?\d+$/);
  if (sciMatch) {
    const v = Number(trimmed);
    if (!isNaN(v)) return v;
  }

  const suffixMatch = trimmed.match(/^[+-]?\d+(\.\d+)?([kKMBTQ])([a-zA-Z]*)$/);
  if (suffixMatch) {
    const base = Number(suffixMatch[1]);
    const suffix = suffixMatch[2];
    const multiplier = SUFFIX_MULTIPLIERS[suffix];
    if (multiplier) return base * multiplier;
  }

  return null;
}

export function smartCompare(a: string, b: string): number {
  const numA = parseSmartNumber(a);
  const numB = parseSmartNumber(b);

  if (numA !== null && numB !== null) {
    if (numA < numB) return -1;
    if (numA > numB) return 1;
    return 0;
  }

  if (numA !== null) return -1;
  if (numB !== null) return 1;

  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}
