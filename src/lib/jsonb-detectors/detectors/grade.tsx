import type { ReactNode } from 'react';
import { Star } from 'lucide-react';
import { formatNumber } from '@/lib/format-number';
import type { ShapeDetector, DetectionContext } from '../types';

const TIER_COLORS: Record<string, string> = {
  s: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
  a: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
  b: 'text-blue-500 bg-blue-500/10 border-blue-500/30',
  c: 'text-purple-500 bg-purple-500/10 border-purple-500/30',
  d: 'text-muted-foreground bg-muted/30 border-border',
  f: 'text-red-500 bg-red-500/10 border-red-500/30',
};

function getTierColor(tier: string): string {
  return TIER_COLORS[tier.toLowerCase()] || 'text-primary bg-primary/10 border-primary/30';
}

export const gradeDetector: ShapeDetector = {
  id: 'grade',
  label: 'Grade/Tier',
  detect({ value }: DetectionContext): number {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return 0;
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);
    if (keys.length < 1 || keys.length > 5) return 0;

    const gradeKeys = ['grade', 'rank', 'tier', 'level', 'class', 'rating'];
    const hasGrade = gradeKeys.some(k => k in obj && typeof obj[k] === 'string');
    if (!hasGrade) return 0;

    const grade = String(obj.grade ?? obj.rank ?? obj.tier ?? obj.level ?? obj.class ?? obj.rating ?? '');
    return grade.length <= 5 ? 0.85 : 0.5;
  },
  render({ value, useSuffix }: DetectionContext, variant = 1): ReactNode {
    const obj = value as Record<string, unknown>;
    const grade = String(obj.grade ?? obj.rank ?? obj.tier ?? obj.level ?? obj.class ?? obj.rating ?? '');
    const label = String(obj.label ?? obj.name ?? obj.title ?? '');
    const score = obj.score ? Number(obj.score) : undefined;
    const colorClass = getTierColor(grade);

    if (variant === 2) {
      return (
        <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${colorClass}`}>
          <span>{grade.toUpperCase()}</span>
          {label && <span className="font-normal text-muted-foreground">{label}</span>}
        </div>
      );
    }
    if (variant === 3) {
      return (
        <div className="flex items-center gap-2 rounded-lg border bg-card p-2 text-xs">
          <div className={`flex items-center justify-center h-8 w-8 rounded-lg font-bold ${colorClass}`}>
            {grade.toUpperCase()}
          </div>
          <div className="flex flex-col">
            {label && <span className="font-medium text-foreground">{label}</span>}
            {score != null && <span className="text-[10px] text-muted-foreground">Score: {formatNumber(score, !!useSuffix)}</span>}
          </div>
        </div>
      );
    }
    if (variant === 4) {
      return (
        <div className="flex items-center gap-2 text-xs">
          {score != null && (
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-3 w-3 ${i < score ? 'text-primary fill-primary' : 'text-muted-foreground/30'}`} />
              ))}
            </div>
          )}
          <span className={`font-bold ${colorClass.split(' ')[0]}`}>{grade.toUpperCase()}</span>
        </div>
      );
    }
    if (variant === 5) {
      return (
        <div className={`rounded-xl border-2 bg-card p-3 flex items-center gap-3 ${colorClass}`}>
          <div className={`flex items-center justify-center h-12 w-12 rounded-xl font-bold text-xl ${colorClass}`}>
            {grade.toUpperCase()}
          </div>
          <div className="flex flex-col">
            {label && <span className="font-semibold text-foreground">{label}</span>}
            {score != null && (
              <div className="flex gap-0.5 mt-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-3 w-3 ${i < score ? 'text-primary fill-primary' : 'text-muted-foreground/30'}`} />
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-bold ${colorClass}`}>
        {grade.toUpperCase()}
      </span>
    );
  },
};
