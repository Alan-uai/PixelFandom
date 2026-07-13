import type { ReactNode } from 'react';
import { IconRenderer } from '@/components/ui/icon-renderer';
import type { ShapeDetector, DetectionContext } from '../types';

export const iconBadgeDetector: ShapeDetector = {
  id: 'icon-badge',
  label: 'Icon Badge',
  detect({ value }: DetectionContext): number {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return 0;
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);
    if (keys.length < 1 || keys.length > 4) return 0;

    const hasIcon = 'icon' in obj && typeof obj.icon === 'string';
    if (!hasIcon) return 0;

    const hasLabel = 'label' in obj || 'name' in obj || 'text' in obj || 'title' in obj;
    if (hasLabel) return 0.9;
    return 0.7;
  },
  render({ value }: DetectionContext, variant = 1): ReactNode {
    const obj = value as Record<string, unknown>;
    const icon = String(obj.icon ?? '');
    const label = String(obj.label ?? obj.name ?? obj.text ?? obj.title ?? '');

    if (variant === 2) {
      return (
        <div className="inline-flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 text-xs">
          {icon.includes(':') ? <IconRenderer icon={icon} size="sm" /> : <span className="text-sm">{icon}</span>}
          {label && <span className="font-medium text-foreground">{label}</span>}
        </div>
      );
    }
    if (variant === 3) {
      return (
        <div className="flex items-center gap-2 rounded-lg border bg-card p-2 text-xs">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-muted">
            {icon.includes(':') ? <IconRenderer icon={icon} size="sm" /> : <span className="text-lg">{icon}</span>}
          </div>
          {label && <span className="font-medium text-foreground">{label}</span>}
        </div>
      );
    }
    if (variant === 4) {
      return (
        <div className="flex flex-col items-center gap-1 p-2">
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted">
            {icon.includes(':') ? <IconRenderer icon={icon} size="md" /> : <span className="text-xl">{icon}</span>}
          </div>
          {label && <span className="text-[10px] text-muted-foreground">{label}</span>}
        </div>
      );
    }
    if (variant === 5) {
      return (
        <div className="flex items-center gap-3 rounded-xl border bg-card p-3 text-xs">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10">
            {icon.includes(':') ? <IconRenderer icon={icon} size="md" /> : <span className="text-xl">{icon}</span>}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-foreground">{label}</span>
          </div>
        </div>
      );
    }
    return (
      <div className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-1 text-xs">
        {icon.includes(':') ? <IconRenderer icon={icon} size="sm" /> : <span className="text-sm">{icon}</span>}
        {label && <span className="font-medium text-primary">{label}</span>}
      </div>
    );
  },
};
