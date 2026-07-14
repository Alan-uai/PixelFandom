import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';
import { MAIN_DOMAIN } from '@/lib/constants';

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

  // 1. Referer header — extract slug from /w/{slug} paths
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

  // 2. Cookie x-tenant-slug — set by middleware on /w/{slug} visits
  if (!slug) {
    slug = request.cookies.get('x-tenant-slug')?.value || null;
  }

  // 3. If we have a slug, look up the tenant's favicon
  if (slug) {
    const faviconUrl = await lookupFavicon(slug).catch(() => null);
    if (faviconUrl) return respondExternal(faviconUrl);
  }

  // 4. Host header — custom domain or vercel subdomain
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

      if (!data && host.endsWith('.vercel.app')) {
        const subdomain = host.replace('.vercel.app', '');
        const result = await supabase
          .from('tenants')
          .select('slug, favicon_url')
          .eq('slug', subdomain)
          .maybeSingle();
        data = result.data;
      }

      if (data?.favicon_url) return respondExternal(data.favicon_url);
    } catch {
      // lookup failed
    }
  }

  // Default: site favicon
  return respond('/icon-512.png', request);
}
