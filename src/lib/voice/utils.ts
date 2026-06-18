import { extractTextFromProseMirror as pmExtract } from '@/lib/content-utils';

export function stripTipTapContent(content: string): string {
  if (!content) return '';
  const trimmed = content.trim();

  if (!trimmed.startsWith('{')) return content;

  try {
    const parsed = JSON.parse(trimmed);
    if (parsed?.type === 'doc') {
      return pmExtract(parsed, '\n');
    }
    if (typeof parsed === 'object') {
      return formatObjectAsText(parsed);
    }
  } catch {
    // not JSON
  }

  return content;
}

function formatObjectAsText(obj: Record<string, unknown>, depth = 0): string {
  if (depth > 2) return JSON.stringify(obj);

  const skipKeys = new Set(['id', 'image', 'image_url', 'code']);
  const parts: string[] = [];

  const name = (obj.name || obj.title || obj.world_name || '') as string;
  if (name) parts.push(name);

  if (obj.description) parts.push(obj.description as string);

  const fields = Object.entries(obj).filter(
    ([key, val]) => !skipKeys.has(key) && val != null && val !== ''
  );

  for (const [key, val] of fields) {
    const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      parts.push(`${label}: ${formatObjectAsText(val as Record<string, unknown>, depth + 1)}`);
    } else if (Array.isArray(val)) {
      const items = val
        .map((v: unknown) => {
          if (typeof v === 'object' && v !== null) {
            return (v as Record<string, unknown>).name || JSON.stringify(v);
          }
          return String(v);
        })
        .join(', ');
      parts.push(`${label}: ${items}`);
    } else {
      parts.push(`${label}: ${String(val)}`);
    }
  }

  return parts.join('\n');
}
