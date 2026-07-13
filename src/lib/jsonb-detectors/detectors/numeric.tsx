import type { ReactNode } from 'react';
import { formatNumber } from '@/lib/format-number';
import type { ShapeDetector, DetectionContext } from '../types';

export const numericDetector: ShapeDetector = {
  id: 'numeric',
  label: 'Numeric',
  detect({ value }: DetectionContext): number {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return 0;
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);
    if (keys.length < 1 || keys.length > 4) return 0;

    const numKeys = ['count', 'amount', 'quantity', 'total', 'number', 'num', 'size', 'length', 'width', 'height', 'weight', 'level'];
    const hasNum = numKeys.some(k => k in obj);
    if (!hasNum) return 0;

    const numVal = obj.count ?? obj.amount ?? obj.quantity ?? obj.total ?? obj.number ?? obj.num;
    if (typeof numVal !== 'number' && (typeof numVal !== 'string' || isNaN(Number(numVal)))) return 0;

    const hasLabel = 'label' in obj || 'name' in obj || 'text' in obj || 'title' in obj || 'of' in obj;
    return hasLabel ? 0.8 : 0.6;
  },
  render({ value }: DetectionContext, variant = 1): ReactNode {
    const obj = value as Record<string, unknown>;
    const numVal = obj.count ?? obj.amount ?? obj.quantity ?? obj.total ?? obj.number ?? obj.num ?? obj.size ?? obj.length ?? obj.height ?? obj.weight ?? obj.level;
    const num = typeof numVal === 'number' ? numVal : Number(numVal);
    const label = String(obj.label ?? obj.name ?? obj.text ?? obj.title ?? '');
    const of = obj.of ? String(obj.of) : '';
    const unit = String(obj.unit ?? obj.units ?? '');

    if (variant === 2) {
      return (
        <div className="flex items-center gap-2 rounded-lg border bg-card p-2 text-xs">
          {label && <span className="text-muted-foreground">{label}</span>}
          <span className="font-bold text-foreground text-sm">{formatNumber(num, true)}</span>
          {unit && <span className="text-[10px] text-muted-foreground">{unit}</span>}
        </div>
      );
    }
    if (variant === 3) {
      return (
        <div className="flex flex-col items-center rounded-xl border bg-card p-3 min-w-[70px]">
          <span className="text-lg font-bold text-primary">{formatNumber(num, true)}</span>
          {label && <span className="text-[10px] text-muted-foreground">{label}</span>}
          {unit && <span className="text-[10px] text-muted-foreground">{unit}</span>}
        </div>
      );
    }
    if (variant === 4) {
      return (
        <div className="flex items-center gap-1.5 rounded-full border bg-primary/5 px-3 py-1.5 text-xs font-medium">
          {label && <span className="text-muted-foreground">{label}:</span>}
          <span className="font-bold text-foreground">{formatNumber(num, true)}</span>
          {unit && <span className="text-[10px] text-muted-foreground">{unit}</span>}
        </div>
      );
    }
    if (variant === 5) {
      return (
        <div className="flex items-center gap-3 rounded-xl border bg-card p-3 text-xs">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
            {label ? label[0].toUpperCase() : '#'}
          </div>
          <div className="flex flex-col">
            {label && <span className="font-medium text-foreground">{label}</span>}
            <span className="text-sm font-bold text-primary">{formatNumber(num, true)}</span>
            {of && <span className="text-[10px] text-muted-foreground">de {of}</span>}
          </div>
        </div>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
        {label && <span className="text-muted-foreground">{label} </span>}
        <span className="font-bold">{formatNumber(num, true)}</span>
        {unit && <span className="text-muted-foreground">{unit}</span>}
      </span>
    );
  },
};
