import { NextRequest, NextResponse } from 'next/server';
import { MAIN_DOMAIN } from '@/lib/constants';
const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPA_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|audio-processors).*)'],
};

const CACHE_TTL_MS = 3_600_000; // 1 hour

function getCachedTenant(request: NextRequest): { slug: string; id: string } | null {
  try {
    const raw = request.cookies.get('x-tenant-cache')?.value;
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.slug && parsed?.id && parsed?.exp && Date.now() < parsed.exp) {
      return { slug: parsed.slug, id: parsed.id };
    }
  } catch {/* noop */}
  return null;
}

function setCachedTenant(response: NextResponse, slug: string, id: string) {
  const payload = JSON.stringify({ slug, id, exp: Date.now() + CACHE_TTL_MS });
  response.cookies.set('x-tenant-cache', payload, {
    path: '/',
    maxAge: CACHE_TTL_MS / 1000,
    sameSite: 'lax',
    httpOnly: true,
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host')?.split(':')[0]?.toLowerCase() || '';
  const isDev = host === 'localhost' || host === '127.0.0.1';
  const isApiRoute = pathname.startsWith('/api/');

  // Main domain or dev: pass through, rewrite short URLs using tenant cookie
  if (isDev || host === MAIN_DOMAIN) {
    if (pathname.startsWith('/w/')) {
      const response = NextResponse.next();
      const slug = pathname.split('/')[2];
      if (slug) {
        response.cookies.set('x-tenant-slug', slug, {
          path: '/',
          maxAge: 60 * 60,
          sameSite: 'lax',
        });
      }
      return response;
    }

    // Rewrite short-form URLs (e.g. /marks → /w/{slug}/marks) if we have an active tenant
    const nonWikiPaths = ['/dashboard', '/api/', '/profile', '/settings', '/leaderboard', '/notifications', '/about'];
    const isNonWikiPath = nonWikiPaths.some(p => pathname === p || pathname.startsWith(p + '/'));
    if (!isNonWikiPath && pathname !== '/') {
      const tenantSlug = request.cookies.get('x-tenant-slug')?.value;
      if (tenantSlug) {
        const url = request.nextUrl.clone();
        url.pathname = `/w/${tenantSlug}${pathname}`;
        return NextResponse.rewrite(url);
      }
    }

    return NextResponse.next();
  }

  // Custom domain: lookup tenant and rewrite (only for wiki pages)
  if (!pathname.startsWith('/dashboard') && !pathname.startsWith('/api/')) {
    // Check cache first
    const cached = getCachedTenant(request);

    if (cached) {
      const url = request.nextUrl.clone();
      url.searchParams.set('__tenant_slug', cached.slug);
      url.searchParams.set('__tenant_id', cached.id);

      if (pathname.startsWith(`/w/${cached.slug}/`) || pathname === `/w/${cached.slug}`) {
        url.pathname = pathname;
      } else {
        url.pathname = `/w/${cached.slug}${pathname === '/' ? '' : pathname}`;
      }

      return NextResponse.rewrite(url);
    }

    // Cache miss — fetch from Supabase
    try {
      const headers = { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` };

      let tenantData: { slug: string; id: string }[] | undefined;

      const customDomainResp = await fetch(
        `${SUPA_URL}/rest/v1/tenants?custom_domain=eq.${encodeURIComponent(host)}&select=slug,id`,
        { headers }
      );

      if (customDomainResp.ok) {
        tenantData = (await customDomainResp.json()) as { slug: string; id: string }[];
      }

      // Fallback for Vercel preview domains: try matching host subdomain as slug
      if (!tenantData?.length && host.endsWith('.vercel.app')) {
        const subdomain = host.replace('.vercel.app', '');
        const fallbackResp = await fetch(
          `${SUPA_URL}/rest/v1/tenants?slug=eq.${encodeURIComponent(subdomain)}&select=slug,id`,
          { headers }
        );
        if (fallbackResp.ok) {
          tenantData = (await fallbackResp.json()) as { slug: string; id: string }[];
        }
      }

      if (tenantData && tenantData.length > 0) {
        const url = request.nextUrl.clone();
        const slug = tenantData[0].slug;

        url.searchParams.set('__tenant_slug', slug);
        url.searchParams.set('__tenant_id', tenantData[0].id);

        if (pathname.startsWith(`/w/${slug}/`) || pathname === `/w/${slug}`) {
          url.pathname = pathname;
        } else {
          url.pathname = `/w/${slug}${pathname === '/' ? '' : pathname}`;
        }

        const response = NextResponse.rewrite(url);
        setCachedTenant(response, slug, tenantData[0].id);
        return response;
      }
    } catch {
      // Tenant lookup failed — pass through
    }
  }

  return NextResponse.next();
}
