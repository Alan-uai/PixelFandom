import { NextRequest, NextResponse } from 'next/server';

const MAIN_DOMAIN = 'pixelfandom.vercel.app';
const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPA_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host')?.split(':')[0]?.toLowerCase() || '';
  const isDev = host === 'localhost' || host === '127.0.0.1';
  const isApiRoute = pathname.startsWith('/api/');

  // Main domain or dev: pass through, set cookie from path
  if (isDev || host === MAIN_DOMAIN) {
    const response = NextResponse.next();
    if (pathname.startsWith('/w/')) {
      const slug = pathname.split('/')[2];
      if (slug) {
        response.cookies.set('x-tenant-slug', slug, {
          path: '/',
          maxAge: 60 * 60,
          sameSite: 'lax',
        });
      }
    }
    return response;
  }

  // Custom domain: lookup tenant and rewrite (only for wiki pages)
  if (!pathname.startsWith('/dashboard') && !pathname.startsWith('/api/')) {
    try {
      const resp = await fetch(
        `${SUPA_URL}/rest/v1/tenants?custom_domain=eq.${encodeURIComponent(host)}&select=slug,id`,
        { headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` } }
      );

      if (resp.ok) {
        const data = (await resp.json()) as { slug: string; id: string }[];
        if (data?.length > 0) {
          const url = request.nextUrl.clone();
          const slug = data[0].slug;

          url.searchParams.set('__tenant_slug', slug);
          url.searchParams.set('__tenant_id', data[0].id);

          if (pathname.startsWith(`/w/${slug}/`) || pathname === `/w/${slug}`) {
            url.pathname = pathname;
          } else {
            url.pathname = `/w/${slug}${pathname === '/' ? '' : pathname}`;
          }

          return NextResponse.rewrite(url);
        }
      }
    } catch {
      // Tenant lookup failed — pass through
    }
  }

  return NextResponse.next();
}
