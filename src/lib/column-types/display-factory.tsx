'use client';

import type { ReactNode } from 'react';
import { IconRenderer } from '@/components/ui/icon-renderer';
import { formatNumber } from '@/lib/format-number';

import { ensureDetectorsRegistered, findBestDetector } from '@/lib/jsonb-detectors';
import { normalizeValue, humanizeLabel } from '@/lib/operator-symbols';

export interface DisplayProps {
  value: unknown;
  column: string;
  renderType: string;
}

export function ColumnDisplay({ value, column, renderType, useSuffix, opEnabled, maxValue, columnConfig }: DisplayProps & { useSuffix?: boolean; opEnabled?: boolean; maxValue?: number; columnConfig?: { jsonbKeyTypes?: Record<string, { type: string; suffix?: string }> } }): ReactNode {
  value = normalizeValue(value, useSuffix, opEnabled);
  if (value === null || value === undefined || value === '') return null;

  switch (renderType) {
    case 'image':
      return (
        <div className="rounded-lg overflow-hidden border bg-muted/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={String(value)} alt={column} className="w-full h-auto max-h-48 object-contain" loading="lazy" />
        </div>
      );

    case 'icon':
      if (String(value).includes(':')) {
        return <IconRenderer icon={String(value)} size="md" />;
      }
      return (
        <div className="rounded-lg overflow-hidden border bg-muted/30 w-12 h-12">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={String(value)} alt={column} className="w-full h-full object-contain" loading="lazy" />
        </div>
      );

    case 'icon-set':
    case 'color-palette': {
      let arr: string[] = [];
      try { arr = JSON.parse(String(value)); } catch { arr = [String(value)]; }
      if (!Array.isArray(arr)) arr = [String(value)];
      return (
        <div className="flex flex-wrap gap-1">
          {renderType === 'icon-set'
            ? arr.map((item, i) => <IconRenderer key={i} icon={item} size="sm" />)
            : arr.map((color, i) => (
                <div key={i} className="h-5 w-5 rounded border" style={{ backgroundColor: color }} />
              ))}
        </div>
      );
    }

    case 'rating': {
      const rating = parseInt(String(value)) || 0;
      const ratingMax = maxValue ?? 5;
      return (
        <div className="flex items-center gap-0.5">
          {Array.from({ length: Math.min(rating, ratingMax) }, (_, i) => (
            <span key={i} className="text-primary text-sm">★</span>
          ))}
          <span className="text-xs text-muted-foreground ml-1">{rating}/{ratingMax}</span>
        </div>
      );
    }

    case 'color':
      return (
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded border" style={{ backgroundColor: String(value) }} />
          <span className="text-xs font-mono text-muted-foreground">{String(value)}</span>
        </div>
      );

    case 'boolean':
      return (
        <span className={String(value) === 'true' ? 'text-emerald-500 font-medium' : 'text-red-500 font-medium'}>
          {String(value) === 'true' ? 'Sim' : 'Não'}
        </span>
      );

    case 'tags':
    case 'multi-select': {
      let arr: string[] = [];
      try { arr = JSON.parse(String(value)); } catch { arr = [String(value)]; }
      if (!Array.isArray(arr)) arr = [String(value)];
      return (
        <div className="flex flex-wrap gap-1">
          {arr.map((tag, i) => (
            <span key={i} className="inline-flex rounded-md bg-secondary px-2 py-0.5 text-xs font-medium">
              {tag}
            </span>
          ))}
        </div>
      );
    }

    case 'link':
      return (
        <a href={String(value)} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:text-primary/80 text-sm break-all">
          {String(value)}
        </a>
      );

    case 'video':
      return (
        <div className="rounded-lg overflow-hidden border bg-muted/30 aspect-video">
          <iframe
            src={String(value)}
            className="w-full h-full"
            allowFullScreen
            title={column}
            sandbox="allow-same-origin allow-scripts allow-presentation"
          />
        </div>
      );

    case 'audio':
      return <audio src={String(value)} controls className="w-full h-8" />;

    case 'slider': {
      const sliderMax = maxValue ?? 100;
      const pct = sliderMax > 0 ? (Number(value) / sliderMax) * 100 : 0;
      return (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
          <span className="text-xs font-mono text-muted-foreground">{String(value)}</span>
        </div>
      );
    }

    case 'duration':
      return <span className="font-mono text-sm">{String(value)}</span>;

    case 'emoji':
      return <span className="text-lg">{String(value)}</span>;

    case 'date':
    case 'time':
      return <span className="text-sm">{String(value)}</span>;

    case 'entity-link':
      return <span className="text-sm font-medium">{String(value)}</span>;

    case 'jsonb': {
      ensureDetectorsRegistered();
      const keyTypes = columnConfig?.jsonbKeyTypes;
      const parsed = typeof value === 'string' ? (() => { try { return JSON.parse(value); } catch { return value; } })() : value;
      const formatValue = (k: string, v: unknown): string => {
        if (typeof v === 'number') {
          const kt = keyTypes?.[k];
          if (useSuffix && kt?.suffix) return String(v) + ' ' + kt.suffix;
          return String(v);
        }
        if (typeof v === 'string') return humanizeLabel(v);
        if (typeof v === 'object') return JSON.stringify(v);
        return String(v ?? '—');
      };
      if (Array.isArray(parsed)) {
        if (parsed.length === 0) return <span className="text-xs text-muted-foreground italic">vazio</span>;
        if (parsed.every((i: unknown) => typeof i === 'object' && i !== null && !Array.isArray(i))) {
          return (
            <div className="flex flex-wrap gap-2">
              {parsed.map((obj: Record<string, unknown>, i: number) => {
                const d = findBestDetector(obj);
                return d ? (
                  <div key={i} className="min-w-[130px]">
                    {d.render({ value: obj, useSuffix })}
                  </div>
                ) : (
                  <div key={i} className="rounded-lg border bg-card p-2.5 text-xs space-y-1 min-w-[130px]">
                    {Object.entries(obj).map(([k, val]) => (
                      <div key={k} className="flex items-center gap-1.5">
                        <span className="font-medium text-foreground capitalize">{k.replace(/_/g, ' ')}:</span>
                        <span className="text-muted-foreground">{formatValue(k, val)}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          );
        }
        const strItems = parsed.map((i: unknown) => String(i));
        return (
          <div className="flex flex-wrap gap-1">
            {strItems.map((item: string, i: number) => (
              <span key={i} className="inline-flex rounded-md bg-secondary px-2 py-0.5 text-xs font-medium">{item}</span>
            ))}
          </div>
        );
      }
      if (typeof parsed === 'object' && parsed !== null) {
        const detector = findBestDetector(parsed);
        if (detector) return detector.render({ value: parsed, useSuffix });
        return (
          <div className="rounded-xl border bg-card p-3 text-xs space-y-1.5">
            {Object.entries(parsed as Record<string, unknown>).map(([k, val]) => (
              <div key={k} className="flex items-start gap-2">
                <span className="font-medium text-foreground shrink-0 min-w-[80px] capitalize">{k.replace(/_/g, ' ')}:</span>
                <span className="text-muted-foreground">{formatValue(k, val)}</span>
              </div>
            ))}
          </div>
        );
      }
      return <span className="text-sm">{String(parsed)}</span>;
    }

    case 'toggle-group':
      return (
        <span className="inline-flex rounded-md bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium">
          {String(value)}
        </span>
      );

    case 'auto': {
      if (value === null || value === undefined || value === '') return null;
      if (typeof value === 'boolean') {
        return (
          <span className={value ? 'text-emerald-500 font-medium' : 'text-red-500 font-medium'}>
            {value ? 'Sim' : 'Não'}
          </span>
        );
      }
      if (typeof value === 'number') {
        return <span className="font-mono">{formatNumber(value, useSuffix ?? true)}</span>;
      }
      if (typeof value === 'string') {
        if (value.length > 60 || value.includes('\n')) {
          return <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{value}</p>;
        }
        return <span className="text-sm text-foreground">{value}</span>;
      }
      if (Array.isArray(value)) {
        if (value.length === 0) return <span className="text-xs text-muted-foreground italic">vazio</span>;
        if (value.every((i: unknown) => typeof i === 'object' && i !== null && !Array.isArray(i))) {
          ensureDetectorsRegistered();
          return (
            <div className="flex flex-wrap gap-2">
              {value.map((obj: Record<string, unknown>, i: number) => {
                const d = findBestDetector(obj);
                return d ? (
                  <div key={i} className="min-w-[130px]">
                    {d.render({ value: obj, useSuffix })}
                  </div>
                ) : (
                  <div key={i} className="rounded-lg border bg-card p-2.5 text-xs space-y-1 min-w-[130px]">
                    {Object.entries(obj).map(([k, val]) => (
                      <div key={k} className="flex items-center gap-1.5">
                        <span className="font-medium text-foreground capitalize">{k.replace(/_/g, ' ')}:</span>
                        <span className="text-muted-foreground">{typeof val === 'string' ? humanizeLabel(val) : String(val ?? '—')}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          );
        }
        return (
          <div className="flex flex-wrap gap-1">
            {value.map((item: unknown, i: number) => (
              <span key={i} className="inline-flex rounded-md bg-secondary px-2 py-0.5 text-xs font-medium">{String(item)}</span>
            ))}
          </div>
        );
      }
      if (typeof value === 'object' && value !== null) {
        ensureDetectorsRegistered();
        const detector = findBestDetector(value);
        if (detector) return detector.render({ value, useSuffix });
        return (
          <div className="rounded-xl border bg-card p-3 text-xs space-y-1.5">
            {Object.entries(value as Record<string, unknown>).map(([k, val]) => {
              const innerDetector = typeof val === 'object' && val !== null && !Array.isArray(val) ? findBestDetector(val) : null;
              return (
                <div key={k} className="flex items-start gap-2">
                  <span className="font-medium text-foreground shrink-0 min-w-[80px] capitalize">{k.replace(/_/g, ' ')}:</span>
                  <span className="text-muted-foreground">
                      {innerDetector
                        ? innerDetector.render({ value: val, useSuffix })
                        : typeof val === 'object' ? JSON.stringify(val) : typeof val === 'string' ? humanizeLabel(val) : String(val ?? '—')
                    }
                  </span>
                </div>
              );
            })}
          </div>
        );
      }
      return <span className="text-sm">{String(value)}</span>;
    }

    case 'select':
    case 'text':
    default:
      return <span className="text-sm">{String(value)}</span>;
  }
}
