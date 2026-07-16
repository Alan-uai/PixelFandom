import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';
import { MAIN_DOMAIN } from '@/lib/constants';
import { parseTenantCache } from '@/lib/hmac';

const NO_CACHE = 'no-cache, private';

function respond(url: string, request: NextRequest) {
  const res = NextResponse.redirect(new URL(url, request.url), 307);
  res.headers.set('Cache-Control', NO_CACHE);
  return res;
}

function respondExternal(url: string) {
  const res = NextResponse.redirect(url, 307);
  res.headers.set('Cache-Control', NO_CACHE);
  return res;
}

async function lookupFavicon(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('tenants')
    .select('favicon_url')
    .eq('slug', slug)
    .maybeSingle();
  return data?.favicon_url || null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  let slug = searchParams.get('slug');

  // 1. __tenant_slug search param — set by middleware on rewrites
  if (!slug) {
    slug = searchParams.get('__tenant_slug') || null;
  }

  // 2. x-tenant-cache cookie (HMAC-signed) — set by middleware on custom domains
  if (!slug) {
    const cached = await parseTenantCache(request.cookies.get('x-tenant-cache')?.value);
    if (cached) slug = cached.slug;
  }

  // 3. Cookie x-tenant-slug — set by middleware on /w/{slug} visits + custom domains
  if (!slug) {
    slug = request.cookies.get('x-tenant-slug')?.value || null;
  }

  // 4. Referer header — extract slug from /w/{slug} paths
  if (!slug) {
    const referer = request.headers.get('referer');
    if (referer) {
      try {
        const refUrl = new URL(referer);
        const match = refUrl.pathname.match(/^\/w\/([^/]+)/);
        if (match) slug = match[1];
      } catch {
        // invalid referer URL
      }
    }
  }

  // 5. If we have a slug, look up the tenant's favicon
  if (slug) {
    const faviconUrl = await lookupFavicon(slug).catch(() => null);
    if (faviconUrl) return respondExternal(faviconUrl);
  }

  // 6. Host header — custom domain or vercel subdomain
  const host = request.headers.get('host')?.split(':')[0]?.toLowerCase() || '';
  if (host && host !== MAIN_DOMAIN && host !== 'localhost' && host !== '127.0.0.1') {
    try {
      const supabase = await createClient();

      let { data } = await supabase
        .from('tenants')
        .select('slug, favicon_url')
        .eq('custom_domain', host)
        .maybeSingle();

      if (!data) {
        const result = await supabase
          .from('tenants')
          .select('slug, favicon_url')
          .eq('vercel_domain', host)
          .maybeSingle();
        data = result.data;
      }

      if (data?.favicon_url) return respondExternal(data.favicon_url);
      if (data?.slug) {
        const faviconUrl = await lookupFavicon(data.slug).catch(() => null);
        if (faviconUrl) return respondExternal(faviconUrl);
      }
    } catch {
      // lookup failed
    }
  }

  // Default: site favicon
  return respond('/icon-512.png', request);
}
