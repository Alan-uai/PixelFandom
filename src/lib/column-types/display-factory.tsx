'use client';

import type { ReactNode } from 'react';
import { IconRenderer } from '@/components/ui/icon-renderer';
import { COLUMN_TYPES, type RenderType } from './registry';

export interface DisplayProps {
  value: unknown;
  column: string;
  renderType: string;
}

export function ColumnDisplay({ value, column, renderType }: DisplayProps): ReactNode {
  if (value === null || value === undefined || value === '') return null;

  const def = COLUMN_TYPES[renderType as RenderType];

  switch (renderType) {
    case 'image':
      return (
        <div className="rounded-lg overflow-hidden border bg-muted/30">
          <img src={String(value)} alt={column} className="w-full h-auto max-h-48 object-contain" loading="lazy" />
        </div>
      );

    case 'icon':
      if (String(value).includes(':')) {
        return <IconRenderer icon={String(value)} size="md" />;
      }
      return (
        <div className="rounded-lg overflow-hidden border bg-muted/30 w-12 h-12">
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
      return (
        <div className="flex items-center gap-0.5">
          {Array.from({ length: Math.min(rating, 10) }, (_, i) => (
            <span key={i} className="text-yellow-400 text-sm">★</span>
          ))}
          <span className="text-xs text-muted-foreground ml-1">{rating}/{def?.label?.includes('10') ? 10 : 5}</span>
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
        <span className={String(value) === 'true' ? 'text-green-500 font-medium' : 'text-red-500 font-medium'}>
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

    case 'slider':
      return (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(Number(value), 100)}%` }}
            />
          </div>
          <span className="text-xs font-mono text-muted-foreground">{String(value)}</span>
        </div>
      );

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
      let formatted = String(value);
      try { formatted = JSON.stringify(JSON.parse(String(value)), null, 2); } catch { /* not JSON */ }
      return (
        <pre className="text-xs font-mono bg-muted/30 rounded-lg p-2 overflow-x-auto max-h-32">{formatted}</pre>
      );
    }

    case 'toggle-group':
      return (
        <span className="inline-flex rounded-md bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium">
          {String(value)}
        </span>
      );

    case 'select':
    case 'text':
    default:
      return <span className="text-sm">{String(value)}</span>;
  }
}
