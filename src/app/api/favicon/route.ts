import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';
import { MAIN_DOMAIN } from '@/lib/constants';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  let slug = searchParams.get('slug');

  // 1. Query param (explicit)
  // 2. Referer header — extract slug from /w/{slug} paths
  if (!slug) {
    const referer = request.headers.get('referer');
    if (referer) {
      try {
        const refUrl = new URL(referer);
        const match = refUrl.pathname.match(/^\/w\/([^/]+)/);
        if (match) slug = match[1];
      } catch {
        // invalid referer URL — ignore
      }
    }
  }

  // 3. Host header — custom domain or vercel subdomain
  if (!slug) {
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

        if (data?.favicon_url) {
          const res = NextResponse.redirect(data.favicon_url, 307);
          res.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=3600');
          return res;
        }

        if (data?.slug) {
          slug = data.slug;
        }
      } catch {
        // lookup failed — fall through to default
      }
    }
  }

  // Look up favicon by slug
  if (slug) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from('tenants')
        .select('favicon_url')
        .eq('slug', slug)
        .maybeSingle();

      if (data?.favicon_url) {
        const res = NextResponse.redirect(data.favicon_url, 307);
        res.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=3600');
        return res;
      }
    } catch {
      // query failed — fall through to default
    }
  }

  // Default: site favicon
  const res = NextResponse.redirect(new URL('/icon-512.png', request.url), 307);
  res.headers.set('Cache-Control', 'public, max-age=86400, s-maxage=86400');
  return res;
}
