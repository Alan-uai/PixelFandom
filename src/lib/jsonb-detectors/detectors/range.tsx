import type { ReactNode } from 'react';
import { formatNumber } from '@/lib/format-number';
import type { ShapeDetector, DetectionContext } from '../types';

export const rangeDetector: ShapeDetector = {
  id: 'range',
  label: 'Range',
  detect({ value }: DetectionContext): number {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return 0;
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);
    if (keys.length < 2 || keys.length > 5) return 0;

    const hasMin = 'min' in obj || 'minimum' in obj || 'from' in obj;
    const hasMax = 'max' in obj || 'maximum' in obj || 'to' in obj;
    const valMin = Number(obj.min ?? obj.minimum ?? obj.from);
    const valMax = Number(obj.max ?? obj.maximum ?? obj.to);
    const bothNumeric = !isNaN(valMin) && !isNaN(valMax);

    if (hasMin && hasMax && bothNumeric) return 0.95;
    if ((hasMin || hasMax) && bothNumeric) return 0.6;
    return 0;
  },
  render({ value, useSuffix }: DetectionContext, variant = 1): ReactNode {
    const obj = value as Record<string, unknown>;
    const min = Number(obj.min ?? obj.minimum ?? obj.from);
    const max = Number(obj.max ?? obj.maximum ?? obj.to);
    const current = Number(obj.current ?? obj.now ?? obj.value ?? min);
    const pct = max > min ? Math.min(100, Math.max(0, ((current - min) / (max - min)) * 100)) : 50;

    if (variant === 2) {
      return (
        <div className="flex items-center gap-2 text-xs">
          <span className="font-mono text-muted-foreground">{formatNumber(min, !!useSuffix)}</span>
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden max-w-[120px]">
            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
          <span className="font-mono text-muted-foreground">{formatNumber(max, !!useSuffix)}</span>
          <span className="font-bold text-primary ml-1">({formatNumber(current, !!useSuffix)})</span>
        </div>
      );
    }
    if (variant === 3) {
      return (
        <div className="flex items-center gap-2 text-xs rounded-lg border bg-card p-2">
          <span className="text-muted-foreground shrink-0">Range:</span>
          <span className="font-mono font-bold">{formatNumber(min, !!useSuffix)}</span>
          <span className="text-muted-foreground">→</span>
          <span className="font-mono font-bold">{formatNumber(max, !!useSuffix)}</span>
          {current !== min && current !== max && (
            <span className="text-[10px] text-primary ml-1">atual: {formatNumber(current, !!useSuffix)}</span>
          )}
        </div>
      );
    }
    if (variant === 4) {
      const segments = 5;
      const filled = Math.round((pct / 100) * segments);
      return (
        <div className="flex items-center gap-1.5 text-xs">
          <span className="font-mono text-muted-foreground text-[10px]">{formatNumber(min, !!useSuffix)}</span>
          <div className="flex gap-0.5">
            {Array.from({ length: segments }).map((_, i) => (
              <div key={i} className={`h-3 w-2 rounded-sm ${i < filled ? 'bg-primary' : 'bg-muted'}`} />
            ))}
          </div>
          <span className="font-mono text-muted-foreground text-[10px]">{formatNumber(max, !!useSuffix)}</span>
        </div>
      );
    }
    if (variant === 5) {
      return (
        <div className="flex flex-col gap-1 text-xs rounded-xl border bg-card p-3 min-w-[150px]">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{formatNumber(min, !!useSuffix)}</span>
            <span>{formatNumber(max, !!useSuffix)}</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary" style={{ width: `${pct}%` }} />
          </div>
          <div className="text-center text-xs font-medium text-foreground">
            {formatNumber(current, !!useSuffix)} / {formatNumber(max, !!useSuffix)}
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 text-xs">
        <span className="font-mono text-muted-foreground">{formatNumber(min, !!useSuffix)}</span>
        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden max-w-[100px]">
          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
        <span className="font-mono text-muted-foreground">{formatNumber(max, !!useSuffix)}</span>
      </div>
    );
  },
};
