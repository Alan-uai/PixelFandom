import type { ReactNode } from 'react';
import { ExternalLink } from 'lucide-react';
import type { ShapeDetector, DetectionContext } from '../types';

export const linkDetector: ShapeDetector = {
  id: 'link',
  label: 'Link',
  detect({ value }: DetectionContext): number {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return 0;
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);
    if (keys.length < 1 || keys.length > 4) return 0;

    const hasUrl = 'url' in obj || 'href' in obj || 'link' in obj;
    if (!hasUrl) return 0;

    const url = String(obj.url ?? obj.href ?? obj.link ?? '');
    const isValid = url.startsWith('http://') || url.startsWith('https://');
    if (!isValid) return 0;

    const hasText = 'text' in obj || 'label' in obj || 'title' in obj || 'name' in obj;
    if (hasText) return 0.9;
    return 0.8;
  },
  render({ value }: DetectionContext, variant = 1): ReactNode {
    const obj = value as Record<string, unknown>;
    const url = String(obj.url ?? obj.href ?? obj.link ?? '');
    const text = String(obj.text ?? obj.label ?? obj.title ?? obj.name ?? url);

    if (variant === 2) {
      return (
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-md border border-primary/30 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/5 transition-colors">
          {text}
          <ExternalLink className="h-3 w-3" />
        </a>
      );
    }
    if (variant === 3) {
      return (
        <div className="rounded-lg border bg-card p-2.5 text-xs max-w-[250px]">
          <p className="text-[10px] text-muted-foreground truncate mb-0.5">{url}</p>
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">{text}</a>
        </div>
      );
    }
    if (variant === 4) {
      return (
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg border bg-card p-2 text-xs hover:bg-muted/30 transition-colors">
          <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center">
            <ExternalLink className="h-3 w-3 text-primary" />
          </div>
          <span className="font-medium text-foreground flex-1 truncate">{text}</span>
          <span className="text-[10px] text-muted-foreground">↗</span>
        </a>
      );
    }
    if (variant === 5) {
      return (
        <div className="rounded-xl border border-primary/20 bg-card p-3 text-xs">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Link</span>
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium block truncate">{text}</a>
        </div>
      );
    }
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
        {text}
        <ExternalLink className="h-3 w-3" />
      </a>
    );
  },
};
