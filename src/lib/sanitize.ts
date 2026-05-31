import DOMPurify from 'dompurify';

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'b', 'i', 'u', 'em', 'strong', 'a', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code',
      'span', 'div', 'hr', 'sub', 'sup', 'img', 'table', 'thead', 'tbody',
      'tr', 'th', 'td',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'class', 'style'],
    ALLOW_DATA_ATTR: false,
  });
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

export function sanitizeBlockConfig(config: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(config)) {
    if (typeof value === 'string') {
      const isHtml = key === 'html';
      const isUrl = key.toLowerCase().includes('url') || key.toLowerCase().includes('src') || key === 'link' || key === 'discordUrl' || key === 'ctaUrl' || key === 'imageUrl';
      if (isHtml) {
        sanitized[key] = sanitizeHtml(value);
      } else if (isUrl) {
        sanitized[key] = sanitizeUrl(value);
      } else {
        sanitized[key] = value;
      }
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) => {
        if (typeof item === 'object' && item !== null) {
          return sanitizeBlockConfig(item as Record<string, unknown>);
        }
        return item;
      });
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeBlockConfig(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}
