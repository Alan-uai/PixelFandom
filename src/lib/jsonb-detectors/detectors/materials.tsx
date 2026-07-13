import type { ReactNode } from 'react';
import type { ShapeDetector, DetectionContext } from '../types';

export const materialsDetector: ShapeDetector = {
  id: 'materials',
  label: 'Materials',
  detect({ value }: DetectionContext): number {
    if (typeof value !== 'object' || value === null) return 0;

    const keys = Array.isArray(value)
      ? value.length > 0 && typeof value[0] === 'object' ? Object.keys(value[0]) : []
      : Object.keys(value);

    const hasName = 'name' in (Array.isArray(value) && value.length > 0 ? value[0] : value);
    const hasAmount = 'amount' in (Array.isArray(value) && value.length > 0 ? value[0] : value) || 'count' in (Array.isArray(value) && value.length > 0 ? value[0] : value) || 'quantity' in (Array.isArray(value) && value.length > 0 ? value[0] : value);

    if (Array.isArray(value) && hasName && (hasAmount || keys.length <= 2)) return 0.85;
    if (typeof value === 'object' && !Array.isArray(value)) {
      const hasMatKeys = 'name' in value && ('amount' in value || 'count' in value || 'price' in value);
      if (hasMatKeys) return 0.8;
    }
    return 0;
  },
  render({ value }: DetectionContext, variant = 1): ReactNode {
    const items = Array.isArray(value) ? value : [value];
    const renderItem = (item: Record<string, unknown>, i: number) => {
      const name = String(item.name ?? item.item ?? item.material ?? '');
      const amountStr = String(item.amount ?? item.count ?? item.quantity ?? item.price ?? '');
      const amount = amountStr || undefined;

      if (variant === 2) {
        return (
          <div key={i} className="flex items-center gap-2 rounded-lg border bg-card p-2 text-xs">
            <span className="font-medium text-foreground">{name}</span>
            {amount && <span className="font-mono text-primary font-bold">x{amount}</span>}
          </div>
        );
      }
      if (variant === 3) {
        return (
          <div key={i} className="flex items-center gap-1.5 rounded-full border bg-muted/30 px-2.5 py-1 text-xs">
            <span className="text-foreground">{name}</span>
            {amount && <span className="font-mono text-primary font-bold">×{amount}</span>}
          </div>
        );
      }
      if (variant === 4) {
        return (
          <div key={i} className="flex items-center gap-2 rounded-xl border bg-card p-2.5 text-xs">
            <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-primary font-bold text-sm">
              {name[0]?.toUpperCase()}
            </div>
            <span className="font-medium text-foreground flex-1">{name}</span>
            {amount && <span className="font-mono font-bold text-primary text-sm">x{amount}</span>}
          </div>
        );
      }
      if (variant === 5) {
        return (
          <div key={i} className="flex items-center gap-2 rounded-lg border border-primary/20 bg-card p-2 text-xs">
            <span className="font-medium text-foreground">{name}</span>
            {amount && <span className="font-mono font-bold text-primary">×{amount}</span>}
          </div>
        );
      }
      return (
        <span key={i} className="inline-flex items-center gap-1 rounded-md bg-muted/50 px-2 py-0.5 text-xs">
          <span className="font-medium text-foreground">{name}</span>
          {amount && <span className="font-mono text-primary">x{amount}</span>}
        </span>
      );
    };

    if (variant >= 4) {
      return (
        <div className="flex flex-col gap-1.5">
          {items.map((item: Record<string, unknown>, i: number) => renderItem(item, i))}
        </div>
      );
    }
    return (
      <div className="flex flex-wrap gap-1.5">
        {items.map((item: Record<string, unknown>, i: number) => renderItem(item, i))}
      </div>
    );
  },
};
