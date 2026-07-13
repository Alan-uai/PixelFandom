import type { ReactNode } from 'react';
import type { ShapeDetector, DetectionContext } from '../types';

export const definitionDetector: ShapeDetector = {
  id: 'definition',
  label: 'Definition',
  detect({ value }: DetectionContext): number {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return 0;
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);
    if (keys.length < 2 || keys.length > 6) return 0;

    const hasName = 'name' in obj || 'title' in obj || 'term' in obj || 'label' in obj || 'item' in obj;
    const hasDesc = 'description' in obj || 'desc' in obj || 'text' in obj || 'content' in obj || 'detail' in obj || 'summary' in obj;

    if (hasName && hasDesc) return 0.9;
    if (hasName && (obj.desc !== undefined || obj.text !== undefined)) return 0.8;
    if (hasName && Object.keys(obj).length === 2) return 0.7;
    return 0;
  },
  render({ value }: DetectionContext, variant = 1): ReactNode {
    const obj = value as Record<string, unknown>;
    const name = String(obj.name ?? obj.title ?? obj.term ?? obj.label ?? obj.item ?? '');
    const desc = String(obj.description ?? obj.desc ?? obj.text ?? obj.content ?? obj.detail ?? obj.summary ?? '');

    if (variant === 2) {
      return (
        <div className="rounded-lg border bg-card p-3 text-xs space-y-1">
          <span className="font-semibold text-foreground block">{name}</span>
          <span className="text-muted-foreground leading-relaxed block">{desc}</span>
        </div>
      );
    }
    if (variant === 3) {
      return (
        <div className="flex items-start gap-2 rounded-lg border bg-card p-2.5 text-xs">
          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0 text-sm">
            {name[0]?.toUpperCase()}
          </div>
          <div>
            <span className="font-semibold text-foreground block">{name}</span>
            <span className="text-muted-foreground leading-relaxed block">{desc}</span>
          </div>
        </div>
      );
    }
    if (variant === 4) {
      return (
        <div className="flex items-start gap-3 py-2 border-b border-border/40 last:border-0 text-xs">
          <span className="font-medium text-foreground min-w-[100px] shrink-0">{name}</span>
          <span className="text-muted-foreground">{desc}</span>
        </div>
      );
    }
    if (variant === 5) {
      return (
        <div className="rounded-xl border-l-2 border-primary bg-card p-3 text-xs">
          <span className="font-semibold text-foreground block mb-1">{name}</span>
          <span className="text-muted-foreground leading-relaxed block">{desc}</span>
        </div>
      );
    }
    return (
      <div className="rounded-lg border bg-card p-2.5 text-xs space-y-0.5">
        <span className="font-semibold text-foreground">{name}</span>
        <span className="text-muted-foreground block">{desc}</span>
      </div>
    );
  },
};
