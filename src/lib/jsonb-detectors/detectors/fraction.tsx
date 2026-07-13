import type { ReactNode } from 'react';
import type { ShapeDetector, DetectionContext } from '../types';

export const fractionDetector: ShapeDetector = {
  id: 'fraction',
  label: 'Fraction',
  detect({ value }: DetectionContext): number {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return 0;
    const obj = value as Record<string, unknown>;
    const hasNum = 'numerator' in obj;
    const hasDen = 'denominator' in obj;
    if (hasNum && hasDen) return 0.95;
    if (hasNum || hasDen) return 0.5;
    return 0;
  },
  render({ value }: DetectionContext, variant = 1): ReactNode {
    const obj = value as Record<string, unknown>;
    const num = obj.numerator ?? obj.num ?? obj.top ?? obj.over;
    const den = obj.denominator ?? obj.den ?? obj.bottom ?? obj.under;

    if (variant === 2) {
      return (
        <div className="flex items-center gap-1.5 font-mono text-sm">
          <span className="text-foreground">{String(num ?? '?')}</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-foreground">{String(den ?? '?')}</span>
          <span className="text-[10px] text-muted-foreground ml-1">frac</span>
        </div>
      );
    }
    if (variant === 3) {
      return (
        <div className="flex flex-col items-center leading-tight">
          <span className="text-xs font-mono text-foreground border-b border-muted-foreground/40 px-1">{String(num ?? '?')}</span>
          <span className="text-xs font-mono text-foreground px-1">{String(den ?? '?')}</span>
        </div>
      );
    }
    if (variant === 4) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border bg-card px-2 py-0.5 text-xs font-mono">
          {String(num ?? '?')}/{String(den ?? '?')}
        </span>
      );
    }
    if (variant === 5) {
      const pct = Number(num) && Number(den) ? ((Number(num) / Number(den)) * 100).toFixed(1) : null;
      return (
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono text-foreground">{String(num ?? '?')}/{String(den ?? '?')}</span>
          {pct && <span className="text-[10px] text-muted-foreground">({pct}%)</span>}
        </div>
      );
    }
    return (
      <span className="font-mono text-sm text-foreground">
        ({String(num ?? '?')}/{String(den ?? '?')})
      </span>
    );
  },
};
