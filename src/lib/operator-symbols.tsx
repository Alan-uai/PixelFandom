import type { ReactNode } from 'react';
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

export function displayOpNum(num: string, useSuffix?: boolean): string {
  const n = Number(num);
  return useSuffix && isFinite(n) ? abbreviateNumber(n) : num;
}

export function formatOpValue(symbol: string, num: string, label: string, useSuffix?: boolean, flipped?: boolean): string {
  const op = `${symbol}${displayOpNum(num, useSuffix)}`;
  const lbl = humanizeLabel(label);
  return flipped ? `${op} ${lbl}` : `${lbl} ${op}`;
}

export function detectOpArray(value: unknown): boolean {
  if (!Array.isArray(value) || value.length === 0) return false;
  return value.every(item => {
    if (typeof item !== 'object' || item === null) return false;
    const entries = Object.entries(item as Record<string, unknown>);
    if (entries.length !== 1) return false;
    return typeof entries[0][1] === 'string' && hasOperatorPrefix(entries[0][1]);
  });
}

export function renderOpMiniCard(item: unknown, jsonbKeyColors?: Record<string, string>, useSuffix?: boolean, onCompareClick?: (subKey?: string) => void, column?: string, flipped?: boolean): ReactNode {
  const entry = Object.entries(item as Record<string, unknown>)[0];
  const [label, rawVal] = entry;
  const op = parseOperatorPrefix(String(rawVal))!;
  const displayNum = displayOpNum(op.number, useSuffix);
  const labelColor = jsonbKeyColors?.[label];
  const sub = column ? `${column}[].${label}` : undefined;
  const opPart = <span className="font-bold text-primary">{op.symbol}{displayNum}</span>;
  const labelPart = <span style={labelColor ? { color: labelColor } : {}} className="text-muted-foreground">{humanizeLabel(label)}</span>;

  return (
    <span
      onClick={sub ? () => onCompareClick?.(sub) : (onCompareClick ? () => onCompareClick() : undefined)}
      role={onCompareClick ? 'button' : undefined}
      tabIndex={onCompareClick ? 0 : undefined}
      className={`inline-flex items-center gap-1 rounded-md border bg-card px-2 py-1 text-xs font-mono transition-all ${onCompareClick ? 'cursor-pointer hover:shadow-md hover:border-primary/20' : 'cursor-default'}`}
      style={labelColor ? { borderColor: labelColor + '40' } : {}}
    >
      {flipped ? <>{opPart}{labelPart}</> : <>{labelPart}{opPart}</>}
    </span>
  );
}

export function renderOpMiniCards(value: unknown, jsonbKeyColors?: Record<string, string>, useSuffix?: boolean, onCompareClick?: (subKey?: string) => void, column?: string, flipped?: boolean): ReactNode {
  if (!Array.isArray(value)) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {value.map((item: unknown, i: number) => (
        <div key={i}>{renderOpMiniCard(item, jsonbKeyColors, useSuffix, onCompareClick, column, flipped)}</div>
      ))}
    </div>
  );
}

export function renderOpInline(value: unknown, jsonbKeyColors?: Record<string, string>, useSuffix?: boolean, flipped?: boolean): ReactNode {
  if (!Array.isArray(value)) return null;
  const parts: ReactNode[] = [];
  value.forEach((item: unknown, i: number) => {
    const entry = Object.entries(item as Record<string, unknown>)[0];
    const [label, rawVal] = entry;
    const op = parseOperatorPrefix(String(rawVal))!;
    const displayNum = displayOpNum(op.number, useSuffix);
    const labelColor = jsonbKeyColors?.[label];
    const opPart = <span className="font-bold text-primary font-mono">{op.symbol}{displayNum}</span>;
    const labelPart = <span style={labelColor ? { color: labelColor } : {}}>{humanizeLabel(label)}</span>;
    parts.push(
      <span key={i} style={labelColor ? { color: labelColor } : {}} className="inline-flex items-center gap-1">
        {flipped ? <>{opPart}{labelPart}</> : <>{labelPart}{opPart}</>}
      </span>
    );
  });
  return (
    <span className="text-xs text-foreground">
      {parts.map((p, i) => (
        <span key={i as unknown as string}>{i > 0 && <span className="text-muted-foreground/50 mx-1">,</span>}{p}</span>
      ))}
    </span>
  );
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
