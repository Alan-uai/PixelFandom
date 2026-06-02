'use client';

import { useState, useEffect } from 'react';
import { sanitizeHtml } from '@/lib/sanitize';

export function RichTextBlock({ config }: { config: Record<string, unknown> }) {
  const title = (config.title as string) || '';
  const [html, setHtml] = useState('');

  useEffect(() => {
    sanitizeHtml((config.html as string) || '<p>Adicione conteúdo de texto rico aqui.</p>')
      .then(setHtml)
      .catch(() => setHtml((config.html as string) || ''));
  }, [config.html]);

  return (
    <div className="space-y-4">
      {title && <h2 className="text-2xl font-bold">{title}</h2>}
      <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
