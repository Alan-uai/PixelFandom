export const OPERATOR_SYMBOLS: Record<string, string> = {
  multiplier: '×',
  minus: '−',
  double: '×2',
  triple: '×3',
  add: '+',
  exponent: '^',
  'numerator+denominator': '(n/d)',
};

export function normalizeOperatorText(text: string): string {
  const lower = text.toLowerCase().trim();
  if (OPERATOR_SYMBOLS[lower]) return OPERATOR_SYMBOLS[lower];
  const frac = lower.match(/^(\d+(?:\.\d+)?)\s*[+/]\s*(\d+(?:\.\d+)?)$/);
  if (frac) return `(${frac[1]}/${frac[2]})`;
  return text;
}
