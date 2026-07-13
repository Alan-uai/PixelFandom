import type { ReactNode } from 'react';
import type { ShapeDetector, DetectionContext } from '../types';

function isColorStr(s: string): boolean {
  return s.startsWith('#') || s.startsWith('hsl') || s.startsWith('rgb') || /^[0-9a-fA-F]{6}$/.test(s) || /^[0-9a-fA-F]{3}$/.test(s);
}

export const colorSwatchDetector: ShapeDetector = {
  id: 'color-swatch',
  label: 'Color Swatch',
  detect({ value }: DetectionContext): number {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return 0;
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);
    if (keys.length < 1 || keys.length > 4) return 0;

    const colorKeys = ['color', 'hex', 'code', 'bg', 'background', 'swatch', 'value'];
    const hasColor = colorKeys.some(k => k in obj && typeof obj[k] === 'string' && isColorStr(String(obj[k])));
    if (!hasColor) return 0;

    const hasLabel = 'label' in obj || 'name' in obj || 'title' in obj;
    return hasLabel ? 0.9 : 0.8;
  },
  render({ value }: DetectionContext, variant = 1): ReactNode {
    const obj = value as Record<string, unknown>;
    const colorStr = String(obj.color ?? obj.hex ?? obj.code ?? obj.bg ?? obj.background ?? obj.swatch ?? obj.value ?? '');
    const color = colorStr.startsWith('#') ? colorStr : colorStr.startsWith('hsl') || colorStr.startsWith('rgb') ? colorStr : `#${colorStr}`;
    const label = String(obj.label ?? obj.name ?? obj.title ?? '');

    if (variant === 2) {
      return (
        <div className="flex items-center gap-2 rounded-lg border bg-card p-1.5 text-xs">
          <div className="h-6 w-6 rounded-md border" style={{ backgroundColor: color }} />
          <span className="font-mono text-[10px] text-muted-foreground">{colorStr}</span>
          {label && <span className="font-medium text-foreground">{label}</span>}
        </div>
      );
    }
    if (variant === 3) {
      return (
        <div className="flex items-center gap-2 text-xs">
          <div className="h-3 w-3 rounded-full border" style={{ backgroundColor: color }} />
          {label && <span className="font-medium text-foreground">{label}</span>}
          <span className="font-mono text-[10px] text-muted-foreground">{colorStr}</span>
        </div>
      );
    }
    if (variant === 4) {
      return (
        <div className="flex items-center gap-2 rounded-lg border bg-card p-2 text-xs">
          <div className="h-8 w-8 rounded-lg border shadow-inner" style={{ backgroundColor: color }} />
          <div className="flex flex-col">
            {label && <span className="font-medium text-foreground">{label}</span>}
            <span className="font-mono text-[10px] text-muted-foreground">{colorStr}</span>
          </div>
        </div>
      );
    }
    if (variant === 5) {
      const gradColors = colorStr.split(',').map(s => s.trim()).filter(Boolean);
      if (gradColors.length > 1) {
        return (
          <div className="flex items-center gap-2 rounded-xl border bg-card p-2 text-xs">
            <div className="h-8 w-16 rounded-lg border" style={{ background: `linear-gradient(90deg, ${gradColors.join(', ')})` }} />
            <span className="text-[10px] text-muted-foreground">{gradColors.length} cores</span>
          </div>
        );
      }
      return (
        <div className="flex items-center gap-3 rounded-xl border bg-card p-2.5 text-xs">
          <div className="h-10 w-10 rounded-xl border-2 shadow-sm" style={{ backgroundColor: color }} />
          <div className="flex flex-col">
            {label && <span className="font-semibold text-foreground">{label}</span>}
            <span className="font-mono text-[10px] text-muted-foreground">{colorStr}</span>
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 text-xs">
        <div className="h-4 w-4 rounded border" style={{ backgroundColor: color }} />
        {label && <span className="text-foreground">{label}</span>}
      </div>
    );
  },
};
