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
