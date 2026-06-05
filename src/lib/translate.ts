'use client';

const cache = new Map<string, { translated: string; slug: string }>();

export async function translateGameTerm(text: string): Promise<{ translated: string; slug: string }> {
  const trimmed = text.trim();
  if (!trimmed) return { translated: '', slug: '' };

  const key = trimmed.toLowerCase();
  if (cache.has(key)) return cache.get(key)!;

  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: trimmed }),
    });
    const data = await res.json();
    if (data.slug) {
      const result = { translated: data.translated || trimmed, slug: data.slug };
      cache.set(key, result);
      return result;
    }
  } catch {}

  const slug = trimmed.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  const result = { translated: trimmed, slug };
  cache.set(key, result);
  return result;
}
