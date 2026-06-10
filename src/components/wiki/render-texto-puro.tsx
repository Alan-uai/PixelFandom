'use client';

import { useMemo } from 'react';
import { micromark } from 'micromark';
import { gfmTable, gfmTableHtml } from 'micromark-extension-gfm-table';
import { processWikiLinks } from './streaming-accordion';

type Props = {
  content: string;
  isStreaming: boolean;
  tenantSlug?: string;
  onItemClick?: (table: string, slug: string) => void;
  onCompareClick?: (table: string, slug: string, column: string) => void;
};

function processItemLinks(html: string, tenantSlug?: string, onItemClick?: (table: string, slug: string) => void, onCompareClick?: (table: string, slug: string, column: string) => void): string {
  if (!html) return html;
  let result = html;
  result = result.replace(
    /\[\[item:([^\/]+)\/([^\|]+)\|([^\]]+)\]\]/g,
    (_, table, slug, text) => {
      const dataAttr = `data-item-table="${table}" data-item-slug="${slug}"`;
      return `<a href="#" ${dataAttr} class="inline-flex items-center gap-0.5 text-primary underline decoration-primary/30 hover:decoration-primary transition-all cursor-pointer" onclick="event.preventDefault(); window.__onItemClick?.('${table}', '${slug}')">${text}<svg class="h-3 w-3 inline-block ml-0.5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></a>`;
    }
  );
  result = result.replace(
    /\[\[compare:([^\/]+)\/([^\/]+)\/([^\|]+)\|([^\]]+)\]\]/g,
    (_, table, slug, column, text) => {
      return `<a href="#" class="inline-flex items-center gap-0.5 text-amber-400 underline decoration-amber-400/30 hover:decoration-amber-400 transition-all cursor-pointer" onclick="event.preventDefault(); window.__onCompareClick?.('${table}', '${slug}', '${column}')">${text}<svg class="h-3 w-3 inline-block ml-0.5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5M8 3H3v5M12 20v-8M3 16l2 2 2-2M15 16l2 2 2-2"/></svg></a>`;
    }
  );
  return result;
}

export default function RenderTextoPuro({ content, isStreaming, tenantSlug }: Props) {
  const html = useMemo(() => {
    if (!content) return '';
    try {
      const withLinks = processWikiLinks(content, tenantSlug);
      const rawHtml = micromark(withLinks, { allowDangerousHtml: false, extensions: [gfmTable()], htmlExtensions: [gfmTableHtml()] });
      return processItemLinks(rawHtml);
    } catch {
      return `<p>${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`;
    }
  }, [content, tenantSlug]);

  return (
    <div className="prose prose-invert prose-sm max-w-none prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-headings:text-foreground">
      {content ? (
        <div dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <span className="text-muted-foreground italic">Processando...</span>
      )}
      {isStreaming && <span className="inline-block animate-pulse text-primary ml-0.5">▍</span>}
    </div>
  );
}
