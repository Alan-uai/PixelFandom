import { abbreviateNumber } from '@/lib/format-number';

export const OPERATOR_SYMBOLS: Record<string, string> = {
  multiplier: '×',
  minus: '−',
  double: '×2',
  triple: '×3',
  add: '+',
  exponent: '^',
  'numerator+denominator': 'n/d',
};

function formatFracNum(n: string, useSuffix?: boolean): string {
  const v = Number(n);
  if (useSuffix && isFinite(v)) return abbreviateNumber(v);
  return n;
}

const OP_PREFIX_RE = /^([xX×÷+^/*])\s*(\d+(?:\.\d+)?)\s*$/;

export interface OperatorPrefixResult {
  symbol: string;
  number: string;
}

export function parseOperatorPrefix(text: string): OperatorPrefixResult | null {
  const m = String(text).trim().match(OP_PREFIX_RE);
  if (!m) return null;
  return { symbol: m[1], number: m[2] };
}

export function hasOperatorPrefix(text: string): boolean {
  return parseOperatorPrefix(text) !== null;
}

export function formatOpValue(symbol: string, num: string, label: string, useSuffix?: boolean): string {
  const n = Number(num);
  const displayNum = useSuffix && isFinite(n) ? abbreviateNumber(n) : num;
  return `${symbol}${displayNum} ${humanizeLabel(label)}`;
}

export function normalizeOperatorText(text: string, useSuffix?: boolean): string {
  const lower = text.toLowerCase().trim();
  if (OPERATOR_SYMBOLS[lower]) return OPERATOR_SYMBOLS[lower];
  const frac = lower.match(/^(\d+(?:\.\d+)?)\s*[+/]\s*(\d+(?:\.\d+)?)$/);
  if (frac) return `${formatFracNum(frac[1], useSuffix)}/${formatFracNum(frac[2], useSuffix)}`;
  return text;
}

function walkValue(v: unknown, useSuffix?: boolean): unknown {
  if (typeof v === 'string') return normalizeOperatorText(v, useSuffix);
  if (Array.isArray(v)) return v.map(i => walkValue(i, useSuffix));
  if (v !== null && typeof v === 'object') {
    const obj: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      obj[k] = walkValue(val, useSuffix);
    }
    return obj;
  }
  return v;
}

export function humanizeLabel(text: string): string {
  return text.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
}

export function normalizeValue(value: unknown, useSuffix?: boolean, opEnabled?: boolean): unknown {
  if (!opEnabled) return value;
  return walkValue(value, useSuffix);
}
