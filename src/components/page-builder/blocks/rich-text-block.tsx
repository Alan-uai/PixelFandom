'use client';

import { useMemo } from 'react';
import { sanitizeHtml } from '@/lib/sanitize';

export function RichTextBlock({ config }: { config: Record<string, unknown> }) {
  const title = (config.title as string) || '';

  const html = useMemo(
    () => sanitizeHtml((config.html as string) || '<p>Adicione conteúdo de texto rico aqui.</p>'),
    [config.html]
  );

  return (
    <div className="space-y-4">
      {title && <h2 className="text-2xl font-bold">{title}</h2>}
      <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
