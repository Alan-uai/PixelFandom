'use client';

import { useMemo } from 'react';
import { micromark } from 'micromark';

type WikiContentProps = {
  content: string | null;
  className?: string;
};

export function WikiContent({ content, className = '' }: WikiContentProps) {
  const html = useMemo(() => {
    if (!content) return null;

    const trimmed = content.trim();

    // Detect TipTap JSON
    if (trimmed.startsWith('{"type":"doc"') || trimmed.startsWith('{ "type": "doc"') || trimmed.startsWith('{"type":"doc')) {
      return renderTipTapJSON(trimmed);
    }

    // Detect raw JSON (non-TipTap) — from seed collection items
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === 'object') {
          return renderRawJson(parsed);
        }
      } catch {
        // not JSON, fall through
      }
    }

    // Default: render as markdown
    try {
      return micromark(content, { allowDangerousHtml: true });
    } catch {
      return `<p>${escapeHtml(content)}</p>`;
    }
  }, [content]);

  if (!html) {
    return <p className="text-muted-foreground">Esta página ainda não tem conteúdo.</p>;
  }

  return (
    <div
      className={`prose prose-invert max-w-none prose-headings:scroll-mt-20 prose-a:text-primary prose-img:rounded-lg prose-pre:bg-muted prose-pre:border ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function renderTipTapJSON(json: string): string {
  try {
    const doc = JSON.parse(json);
    return renderProseMirrorNode(doc);
  } catch {
    return '<p>Erro ao renderizar conteúdo.</p>';
  }
}

function renderRawJson(data: unknown): string {
  if (typeof data !== 'object' || data === null) {
    return `<p>${escapeHtml(String(data))}</p>`;
  }

  if (Array.isArray(data)) {
    return data.map((item) => `<div class="mb-4">${renderRawJson(item)}</div>`).join('');
  }

  const obj = data as Record<string, unknown>;
  const skipKeys = new Set(['id', 'image', 'image_url', 'code']);

  const parts: string[] = [];

  const name = (obj.name || obj.title || obj.world_name || '') as string;
  if (name) {
    parts.push(`<h2 class="text-xl font-bold mb-2">${escapeHtml(name)}</h2>`);
  }

  if (obj.description) {
    parts.push(
      `<p class="text-muted-foreground border-l-2 border-primary/40 pl-4 mb-4">${escapeHtml(String(obj.description))}</p>`
    );
  }

  const fields = Object.entries(obj).filter(
    ([key, val]) => !skipKeys.has(key) && val != null && val !== ''
  );

  if (fields.length > 0) {
    parts.push('<div class="overflow-x-auto">');
    parts.push('<table class="min-w-full border-collapse">');
    parts.push('<tbody>');
    for (const [key, val] of fields) {
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      let display: string;
      if (typeof val === 'object' && val !== null) {
        display = renderRawJson(val);
      } else {
        display = escapeHtml(String(val));
      }
      parts.push(
        `<tr class="border-b border-border"><td class="py-2 pr-4 font-medium text-sm align-top whitespace-nowrap">${label}</td><td class="py-2 text-sm">${display}</td></tr>`
      );
    }
    parts.push('</tbody></table>');
    parts.push('</div>');
  }

  return parts.join('\n');
}

function renderProseMirrorNode(node: any): string {
  if (!node || typeof node !== 'object') return '';

  switch (node.type) {
    case 'doc':
      return (node.content || []).map(renderProseMirrorNode).join('\n');

    case 'paragraph':
      return `<p>${renderInline(node)}</p>`;

    case 'heading':
      const level = node.attrs?.level || 2;
      return `<h${level}>${renderInline(node)}</h${level}>`;

    case 'bulletList':
      return `<ul>${(node.content || []).map(renderProseMirrorNode).join('\n')}</ul>`;

    case 'orderedList':
      return `<ol>${(node.content || []).map(renderProseMirrorNode).join('\n')}</ol>`;

    case 'listItem':
      return `<li>${renderInline(node)}</li>`;

    case 'codeBlock':
      const lang = node.attrs?.language ? ` class="language-${node.attrs.language}"` : '';
      return `<pre><code${lang}>${escapeHtml(node.content?.[0]?.text || '')}</code></pre>`;

    case 'blockquote':
      return `<blockquote>${(node.content || []).map(renderProseMirrorNode).join('\n')}</blockquote>`;

    case 'horizontalRule':
      return '<hr />';

    case 'image':
      return `<img src="${escapeHtml(node.attrs?.src || '')}" alt="${escapeHtml(node.attrs?.alt || '')}" />`;

    case 'hardBreak':
      return '<br />';

    default:
      if (node.content) {
        return (node.content || []).map(renderProseMirrorNode).join('\n');
      }
      if (node.text) {
        return renderMarks(node.text, node.marks);
      }
      return '';
  }
}

function renderInline(node: any): string {
  if (!node) return '';
  if (node.text) {
    return renderMarks(node.text, node.marks);
  }
  if (node.content) {
    return node.content.map(renderInline).join('');
  }
  return '';
}

function renderMarks(text: string, marks?: any[]): string {
  if (!marks || marks.length === 0) return escapeHtml(text);

  let result = escapeHtml(text);
  for (const mark of marks) {
    switch (mark.type) {
      case 'bold':
        result = `<strong>${result}</strong>`;
        break;
      case 'italic':
        result = `<em>${result}</em>`;
        break;
      case 'underline':
        result = `<u>${result}</u>`;
        break;
      case 'code':
        result = `<code>${result}</code>`;
        break;
      case 'link':
        const href = escapeHtml(mark.attrs?.href || '#');
        result = `<a href="${href}">${result}</a>`;
        break;
      case 'strike':
        result = `<s>${result}</s>`;
        break;
      case 'highlight':
        result = `<mark>${result}</mark>`;
        break;
    }
  }
  return result;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
