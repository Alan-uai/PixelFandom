import type DOMPurify from 'dompurify';

type Purify = ReturnType<typeof DOMPurify>;
type Config = Parameters<Purify['sanitize']>[1];

let purifyCache: Purify | null = null;

async function getPurify(): Promise<Purify> {
  if (purifyCache) return purifyCache;

  if (typeof window !== 'undefined') {
    const dompurify = await import('dompurify');
    purifyCache = dompurify.default(window as any);
  } else {
    const [dompurifyMod, jsdomMod] = await Promise.all([
      import('dompurify'),
      import('jsdom'),
    ]);
    const window = new (jsdomMod as any).JSDOM('<!DOCTYPE html>').window;
    purifyCache = dompurifyMod.default(window as any);
  }
  return purifyCache;
}

export async function sanitizeHtml(html: string): Promise<string> {
  const purify = await getPurify();
  return purify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'b', 'i', 'u', 'em', 'strong', 'a', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code',
      'span', 'div', 'hr', 'sub', 'sup', 'img', 'table', 'thead', 'tbody',
      'tr', 'th', 'td',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'class', 'style'],
    ALLOW_DATA_ATTR: false,
  } as Config);
}

const DISALLOWED_PROTOCOLS = /^(javascript|data|vbscript):/i;

export function sanitizeUrl(url: string): string {
  if (!url) return url;
  url = url.trim();
  if (DISALLOWED_PROTOCOLS.test(url)) {
    return '#';
  }
  return url;
}

export async function sanitizeBlockConfig(config: Record<string, unknown>): Promise<Record<string, unknown>> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(config)) {
    if (typeof value === 'string') {
      const isHtml = key === 'html' || key === 'content' || key === 'answer';
      const isUrl = /url|src|link|href|discord/i.test(key);
      if (isHtml) {
        sanitized[key] = await sanitizeHtml(value);
      } else if (isUrl) {
        sanitized[key] = sanitizeUrl(value);
      } else {
        sanitized[key] = value;
      }
    } else if (Array.isArray(value)) {
      sanitized[key] = await Promise.all(
        value.map(async (item) => {
          if (typeof item === 'object' && item !== null) {
            return sanitizeBlockConfig(item as Record<string, unknown>);
          }
          if (typeof item === 'string' && /url|src|link|href/i.test(key)) {
            return sanitizeUrl(item);
          }
          return item;
        })
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = await sanitizeBlockConfig(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export async function sanitizeBlock(block: Record<string, unknown>): Promise<Record<string, unknown>> {
  const sanitized: Record<string, unknown> = { ...block };
  if (block.config && typeof block.config === 'object') {
    sanitized.config = await sanitizeBlockConfig(block.config as Record<string, unknown>);
  }
  if (block.children && Array.isArray(block.children)) {
    sanitized.children = await Promise.all(
      block.children.map((child: unknown) =>
        sanitizeBlock(child as Record<string, unknown>)
      )
    );
  }
  return sanitized;
}
