import type { ReactNode } from 'react';
import type { ShapeDetector, DetectionContext } from '../types';
import { abbreviateNumber } from '@/lib/format-number';
import { humanizeLabel } from '@/lib/operator-symbols';

function hasKey(obj: Record<string, unknown>, keys: string[]): boolean {
  return keys.some(k => k in obj);
}

function fmtVal(v: unknown, useSuffix?: boolean): string {
  const n = Number(v);
  if (useSuffix && isFinite(n)) return abbreviateNumber(n);
  return String(v ?? '—');
}

const OP_CHARS = new Set(['×', '−', '+', '^']);

function isOpType(type: string): boolean {
  return type.length <= 2 && [...type].some(c => OP_CHARS.has(c));
}

function renderCompact(type: string, val: unknown, label: string, useSuffix?: boolean): ReactNode {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-sm font-medium text-foreground">
      <span className="text-primary font-bold">{type}{fmtVal(val, useSuffix)}</span>
      <span className="text-muted-foreground">{humanizeLabel(label)}</span>
    </span>
  );
}

export const statBlockDetector: ShapeDetector = {
  id: 'stat-block',
  label: 'Stat Block',
  detect({ value }: DetectionContext): number {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return 0;
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);
    if (keys.length < 2 || keys.length > 8) return 0;

    const hasStat = hasKey(obj, ['stat', 'name', 'label', 'title', 'key', 'attribute', 'stat_name']);
    const hasValue = hasKey(obj, ['value', 'amount', 'val', 'current', 'score', 'points', 'total', 'count']);
    const hasType = hasKey(obj, ['type', 'category', 'class', 'kind', 'group', 'subtype']);

    if (hasStat && hasValue) return 0.95;
    if (hasStat && hasType) return 0.85;
    if (hasValue && hasType) return 0.75;
    return 0;
  },
  render({ value, useSuffix }: DetectionContext, variant = 1): ReactNode {
    const obj = value as Record<string, unknown>;
    const label = String(obj.stat ?? obj.name ?? obj.label ?? obj.title ?? obj.key ?? '');
    const val = obj.value ?? obj.amount ?? obj.val ?? obj.current ?? obj.score ?? obj.points ?? obj.total ?? obj.count;
    const type = String(obj.type ?? obj.category ?? obj.class ?? obj.kind ?? obj.group ?? '');

    if (variant === 6) {
      return renderCompact(type, val, label, useSuffix);
    }

    if (variant === 2) {
      if (type && isOpType(type)) return renderCompact(type, val, label, useSuffix);
      return (
        <div className="flex items-center gap-2 rounded-lg border bg-card p-2.5 text-xs">
          {type && <span className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">{type}</span>}
          <span className="font-medium text-foreground">{humanizeLabel(label)}</span>
          <span className="text-sm font-bold text-primary ml-auto">{fmtVal(val, useSuffix)}</span>
        </div>
      );
    }

    if (variant === 3) {
      return (
        <div className="flex flex-col items-center justify-center rounded-xl border bg-card p-3 min-w-[80px]">
          {type && <span className="text-[10px] text-muted-foreground mb-0.5">{type}</span>}
          <span className="text-lg font-bold text-primary">{fmtVal(val, useSuffix)}</span>
          <span className="text-xs text-muted-foreground">{humanizeLabel(label)}</span>
        </div>
      );
    }

    if (variant === 4) {
      if (type && isOpType(type)) return renderCompact(type, val, label, useSuffix);
      return (
        <div className="flex items-center gap-2 rounded-full border bg-primary/5 px-3 py-1.5 text-xs">
          {type && <span className="text-muted-foreground italic">{type}</span>}
          <span className="font-medium text-foreground">{humanizeLabel(label)}</span>
          <span className="font-bold text-primary">{fmtVal(val, useSuffix)}</span>
        </div>
      );
    }

    if (variant === 5) {
      return (
        <div className="flex items-center gap-3 rounded-xl border bg-card p-3 text-xs">
          {type && <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">{type[0].toUpperCase()}</div>}
          <div className="flex flex-col">
            <span className="font-medium text-foreground">{humanizeLabel(label)}</span>
            {type && <span className="text-[10px] text-muted-foreground">{type}</span>}
          </div>
          <span className="text-lg font-bold text-primary ml-auto">{fmtVal(val, useSuffix)}</span>
        </div>
      );
    }

    // default (variant 1)
    if (type && isOpType(type)) return renderCompact(type, val, label, useSuffix);
    return (
      <div className="flex items-center gap-2 rounded-lg border bg-card p-2.5 text-xs">
        {type && <span className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">{type}</span>}
        <span className="font-medium text-foreground">{humanizeLabel(label)}</span>
        <span className="text-sm font-bold text-primary ml-auto">{fmtVal(val, useSuffix)}</span>
      </div>
    );
  },
};
