const HMAC_SECRET = process.env.COOKIE_SECRET || 'pixelfandom-cookie-secret-change-in-production';
const CACHE_TTL_MS = 3_600_000;

export async function hmacSign(payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(HMAC_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export type TenantCache = { slug: string; id: string } | null;

export async function parseTenantCache(cookieValue: string | undefined): Promise<TenantCache> {
  if (!cookieValue) return null;
  try {
    const parsed = JSON.parse(cookieValue);
    if (!parsed?.payload || !parsed?.sig) return null;
    const expectedSig = await hmacSign(parsed.payload);
    if (parsed.sig !== expectedSig) return null;
    const data = JSON.parse(parsed.payload);
    if (data?.slug && data?.id && data?.exp && Date.now() < data.exp) {
      return { slug: data.slug, id: data.id };
    }
  } catch { /* noop */ }
  return null;
}

export function buildTenantCachePayload(slug: string, id: string): string {
  return JSON.stringify({ slug, id, exp: Date.now() + CACHE_TTL_MS });
}
