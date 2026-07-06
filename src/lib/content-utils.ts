import { micromark } from 'micromark';
import { gfmTable, gfmTableHtml } from 'micromark-extension-gfm-table';
import { sanitizeHtml } from './sanitize';

export function extractTextFromContent(content: string | null | undefined): string {
  if (!content) return '';

  const trimmed = content.trim();

  // TipTap JSON
  if (trimmed.startsWith('{') && trimmed.includes('"type":"doc"')) {
    try {
      const doc = JSON.parse(trimmed);
      return extractTextFromProseMirror(doc);
    } catch {
      return content;
    }
  }

  // HTML
  if (trimmed.startsWith('<')) {
    return stripHtml(trimmed);
  }

  // Plain text / markdown
  return content;
}

export function extractTextFromProseMirror(node: any, separator = ' '): string {
  if (!node || typeof node !== 'object') return '';

  if (node.text) return node.text;

  if (node.content && Array.isArray(node.content)) {
    return node.content.map((n: any) => extractTextFromProseMirror(n, separator)).filter(Boolean).join(separator);
  }

  return '';
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
}

export function isTipTapJson(content: string): boolean {
  const trimmed = content.trim();
  return trimmed.startsWith('{') && trimmed.includes('"type":"doc"');
}

export function parseContentToJson(content: string | null): Record<string, unknown> | null {
  if (!content) return null;
  try {
    const parsed = JSON.parse(content);
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function renderMarkdown(text: string): string {
  if (!text) return '';
  try {
    const html = micromark(text, {
      allowDangerousHtml: true,
      extensions: [gfmTable()],
      htmlExtensions: [gfmTableHtml()],
    });
    return sanitizeHtml(html);
  } catch {
    return escapeHtml(text);
  }
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function sanitizeJsonString(input: string): string {
  if (!input) return input;
  try {
    const parsed = JSON.parse(input);
    return JSON.stringify(parsed);
  } catch {
    return '';
  }
}

export function sanitizeUrl(input: string): string {
  if (!input) return input;
  const trimmed = input.trim();
  if (/^(javascript|data|vbscript):/i.test(trimmed)) {
    return '#';
  }
  return trimmed;
}
