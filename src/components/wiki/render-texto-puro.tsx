'use client';

import { useMemo } from 'react';
import { micromark } from 'micromark';
import { gfmTable, gfmTableHtml } from 'micromark-extension-gfm-table';
import { processSlugLinks } from './streaming-accordion';

type Props = {
  content: string;
  isStreaming: boolean;
  tenantSlug?: string;
  onItemClick?: (table: string, slug: string) => void;
  onCompareClick?: (table: string, slug: string, column: string) => void;
};

export default function RenderTextoPuro({ content, isStreaming, tenantSlug }: Props) {
  const html = useMemo(() => {
    if (!content) return '';
    try {
      const withLinks = processSlugLinks(content, tenantSlug);
      return micromark(withLinks, { allowDangerousHtml: false, extensions: [gfmTable()], htmlExtensions: [gfmTableHtml()] });
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
