import type { ReactNode } from 'react';
import { CalendarIcon } from 'lucide-react';
import type { ShapeDetector, DetectionContext } from '../types';

export const dateEventDetector: ShapeDetector = {
  id: 'date-event',
  label: 'Date Event',
  detect({ value }: DetectionContext): number {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return 0;
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);
    if (keys.length < 1 || keys.length > 5) return 0;

    const dateKeys = ['date', 'time', 'timestamp', 'datetime', 'when', 'start', 'end', 'created', 'updated'];
    const hasDate = dateKeys.some(k => k in obj && typeof obj[k] === 'string');
    if (!hasDate) return 0;

    const dateVal = obj.date ?? obj.time ?? obj.timestamp ?? obj.datetime ?? obj.when ?? obj.start ?? obj.end ?? obj.created ?? obj.updated;
    if (typeof dateVal !== 'string') return 0;
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return 0;

    const hasEvent = 'event' in obj || 'label' in obj || 'title' in obj || 'name' in obj || 'description' in obj;
    return hasEvent ? 0.9 : 0.7;
  },
  render({ value }: DetectionContext, variant = 1): ReactNode {
    const obj = value as Record<string, unknown>;
    const dateVal = String(obj.date ?? obj.time ?? obj.timestamp ?? obj.datetime ?? obj.when ?? obj.start ?? obj.end ?? obj.created ?? obj.updated ?? '');
    const d = new Date(dateVal);
    const valid = !isNaN(d.getTime());
    const event = String(obj.event ?? obj.label ?? obj.title ?? obj.name ?? obj.description ?? '');

    if (variant === 2) {
      return (
        <div className="flex items-center gap-2 text-xs">
          <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
          {valid && <span className="text-foreground">{d.toLocaleDateString('pt-BR')}</span>}
          {event && <span className="text-muted-foreground">— {event}</span>}
        </div>
      );
    }
    if (variant === 3) {
      if (!valid) return <span className="text-xs text-muted-foreground">{dateVal}</span>;
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffDays = Math.floor(diffMs / 86400000);
      const relative = diffDays < 1 ? 'hoje' : diffDays === 1 ? 'ontem' : diffDays < 7 ? `há ${diffDays} dias` : diffDays < 30 ? `há ${Math.floor(diffDays / 7)} semanas` : diffDays < 365 ? `há ${Math.floor(diffDays / 30)} meses` : `há ${Math.floor(diffDays / 365)} anos`;
      return (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-foreground font-medium">{relative}</span>
          <span className="text-[10px] text-muted-foreground">({d.toLocaleDateString('pt-BR')})</span>
          {event && <span className="text-muted-foreground">— {event}</span>}
        </div>
      );
    }
    if (variant === 4) {
      return (
        <div className="flex items-center gap-2 rounded-lg border bg-card p-2 text-xs">
          <div className="flex flex-col items-center justify-center h-8 w-8 rounded bg-primary/10 text-primary">
            <span className="text-[10px] font-bold leading-tight">{valid ? d.getDate() : '?'}</span>
            <span className="text-[8px] uppercase leading-tight">{valid ? d.toLocaleDateString('pt-BR', { month: 'short' }) : ''}</span>
          </div>
          {event && <span className="font-medium text-foreground">{event}</span>}
          <span className="text-[10px] text-muted-foreground ml-auto">{valid ? d.toLocaleDateString('pt-BR') : dateVal}</span>
        </div>
      );
    }
    if (variant === 5) {
      return (
        <div className="rounded-xl border bg-card p-3 text-xs">
          <div className="flex items-center gap-2 mb-1">
            <CalendarIcon className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">{event || 'Data'}</span>
          </div>
          <span className="text-muted-foreground">
            {valid ? d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : dateVal}
          </span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 text-xs">
        <CalendarIcon className="h-3 w-3 text-muted-foreground" />
        <span className="text-foreground">{valid ? d.toLocaleDateString('pt-BR') : dateVal}</span>
        {event && <span className="text-muted-foreground">({event})</span>}
      </div>
    );
  },
};
