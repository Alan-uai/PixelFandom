import type { ReactNode } from 'react';
import type { ShapeDetector, DetectionContext } from '../types';

export const probabilityDetector: ShapeDetector = {
  id: 'probability',
  label: 'Probability',
  detect({ value }: DetectionContext): number {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return 0;
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);
    if (keys.length < 1 || keys.length > 4) return 0;

    const hasChance = 'chance' in obj || 'probability' in obj || 'rate' in obj || 'drop_rate' in obj || 'odds' in obj || 'percent' in obj || 'pct' in obj || 'likelihood' in obj;
    if (!hasChance) return 0;

    const val = obj.chance ?? obj.probability ?? obj.rate ?? obj.drop_rate ?? obj.odds ?? obj.percent ?? obj.pct ?? obj.likelihood;
    const num = typeof val === 'string' ? parseFloat(val.replace(/[%]/g, '')) : Number(val);
    if (isNaN(num)) return 0;

    return 0.85;
  },
  render({ value }: DetectionContext, variant = 1): ReactNode {
    const obj = value as Record<string, unknown>;
    const rawVal = obj.chance ?? obj.probability ?? obj.rate ?? obj.drop_rate ?? obj.odds ?? obj.percent ?? obj.pct ?? obj.likelihood;
    const num = typeof rawVal === 'string' ? parseFloat(rawVal.replace(/[%]/g, '')) : Number(rawVal);
    const pct = isNaN(num) ? 0 : Math.min(100, Math.max(0, num));
    const label = obj.of ? String(obj.of) : obj.label ? String(obj.label) : '';

    const colorClass = pct >= 75 ? 'text-emerald-500' : pct >= 40 ? 'text-amber-500' : pct >= 15 ? 'text-orange-500' : 'text-red-500';
    const bgClass = pct >= 75 ? 'bg-emerald-500/10' : pct >= 40 ? 'bg-amber-500/10' : pct >= 15 ? 'bg-orange-500/10' : 'bg-red-500/10';

    if (variant === 2) {
      return (
        <div className={`inline-flex items-center gap-1.5 rounded-full ${bgClass} border px-2.5 py-1 text-xs font-medium ${colorClass}`}>
          <span>{pct}%</span>
          {label && <span className="text-muted-foreground font-normal">{label}</span>}
        </div>
      );
    }
    if (variant === 3) {
      return (
        <div className="flex items-center gap-2 text-xs">
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden max-w-[100px]">
            <div className={`h-full rounded-full ${colorClass.replace('text', 'bg')}`} style={{ width: `${pct}%` }} />
          </div>
          <span className={`font-mono font-bold ${colorClass}`}>{pct}%</span>
        </div>
      );
    }
    if (variant === 4) {
      return (
        <div className="flex items-center gap-2 rounded-lg border bg-card p-2 text-xs">
          <div className="relative h-8 w-8">
            <svg className="h-8 w-8 -rotate-90" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" fill="none" stroke="hsl(var(--muted))" strokeWidth="2" />
              <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"
                strokeDasharray={`${2 * Math.PI * 10}`} strokeDashoffset={`${2 * Math.PI * 10 * (1 - pct / 100)}`}
                strokeLinecap="round" className={colorClass.replace('text', 'text')} />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold">{pct}%</span>
          </div>
          {label && <span className="text-muted-foreground">{label}</span>}
        </div>
      );
    }
    if (variant === 5) {
      return (
        <div className={`rounded-lg border ${bgClass} ${colorClass} p-2.5 text-xs space-y-1`}>
          <div className="flex items-center justify-between">
            <span className="font-medium">{label || 'Chance'}</span>
            <span className="font-bold text-sm">{pct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
            <div className={`h-full rounded-full ${colorClass.replace('text', 'bg')}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1 rounded-md ${bgClass} px-2 py-0.5 text-xs font-medium ${colorClass}`}>
        {pct}%
      </span>
    );
  },
};
