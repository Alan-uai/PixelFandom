import type { ReactNode } from 'react';
import type { ShapeDetector, DetectionContext } from '../types';

export const percentageDetector: ShapeDetector = {
  id: 'percentage',
  label: 'Percentage',
  detect({ value }: DetectionContext): number {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return 0;
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);
    if (keys.length < 1 || keys.length > 4) return 0;

    const pctKeys = ['percent', 'pct', 'percentage', 'ratio'];
    const hasPct = pctKeys.some(k => k in obj) || ('value' in obj && 'percentage' in obj);
    if (!hasPct) return 0;

    const val = obj.percent ?? obj.pct ?? obj.percentage ?? obj.value ?? obj.ratio;
    const num = typeof val === 'string' ? parseFloat(val.replace(/[%]/g, '')) : Number(val);
    if (isNaN(num)) return 0;

    const hasLabel = 'label' in obj || 'name' in obj || 'title' in obj || 'of' in obj;
    if (num >= 0 && num <= 100) {
      return hasLabel ? 0.9 : 0.8;
    }
    return 0.5;
  },
  render({ value }: DetectionContext, variant = 1): ReactNode {
    const obj = value as Record<string, unknown>;
    const rawVal = obj.percent ?? obj.pct ?? obj.percentage ?? obj.value ?? obj.ratio;
    const num = typeof rawVal === 'string' ? parseFloat(rawVal.replace(/[%]/g, '')) : Number(rawVal);
    const pct = Math.min(100, Math.max(0, isNaN(num) ? 0 : num));
    const label = String(obj.label ?? obj.name ?? obj.title ?? '');
    const of = obj.of ? String(obj.of) : '';

    if (variant === 2) {
      return (
        <div className="flex items-center gap-2 text-xs">
          <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400" style={{ width: `${pct}%` }} />
          </div>
          <span className="font-mono font-medium text-emerald-500">{pct}%</span>
        </div>
      );
    }
    if (variant === 3) {
      return (
        <div className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium">
          <span className="text-foreground">{pct}%</span>
          {label && <span className="text-muted-foreground font-normal">{label}</span>}
          {of && <span className="text-muted-foreground font-normal">de {of}</span>}
        </div>
      );
    }
    if (variant === 4) {
      const segments = 10;
      const filled = Math.round((pct / 100) * segments);
      return (
        <div className="flex items-center gap-2 text-xs">
          <div className="flex gap-0.5">
            {Array.from({ length: segments }).map((_, i) => (
              <div key={i} className={`h-2 w-1.5 rounded-sm ${i < filled ? 'bg-emerald-500' : 'bg-muted'}`} />
            ))}
          </div>
          <span className="font-mono text-muted-foreground">{pct}%</span>
        </div>
      );
    }
    if (variant === 5) {
      return (
        <div className="rounded-xl border bg-card p-3 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-foreground">{label || 'Porcentagem'}</span>
            <span className="text-lg font-bold text-emerald-500">{pct}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400" style={{ width: `${pct}%` }} />
          </div>
        </div>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500">
        {pct}%
      </span>
    );
  },
};
