import { NextRequest, NextResponse } from 'next/server';
import { MAIN_DOMAIN } from '@/lib/constants';
import { checkRateLimit, getRateLimiterForPath } from '@/lib/rate-limiter';
import { isIpBlocked, isFingerprintBlocked, getClientIp, getFingerprint, handleThreatDetection } from '@/lib/threat-detection';
import { detectSqlInjection } from '@/lib/sql-injection-detect';
import { hmacSign, parseTenantCache, buildTenantCachePayload } from '@/lib/hmac';

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPA_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|audio-processors).*)'],
};

const CACHE_TTL_MS = 3_600_000;

function setTenantSlugCookie(response: NextResponse, slug: string) {
  response.cookies.set('x-tenant-slug', slug, {
    path: '/',
    maxAge: 60 * 60,
    sameSite: 'lax',
    secure: true,
  });
}

async function setCachedTenant(response: NextResponse, slug: string, id: string) {
  const payload = buildTenantCachePayload(slug, id);
  const sig = await hmacSign(payload);
  response.cookies.set('x-tenant-cache', JSON.stringify({ payload, sig }), {
    path: '/',
    maxAge: CACHE_TTL_MS / 1000,
    sameSite: 'lax',
    httpOnly: true,
    secure: true,
  });
}

function addSecurityHeaders(response: NextResponse): void {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), geolocation=(), interest-cohort=(), display-capture=(), clipboard-read=(), clipboard-write=(), fullscreen=()',
  );
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      // TODO: Replace 'unsafe-inline' with strict nonce-based CSP in production
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.supabase.co https://*.googleapis.com https://accounts.google.com https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://*.supabase.co https://fonts.googleapis.com",
      "img-src 'self' data: blob: http://*.supabase.co https://*.supabase.co https://*.googleusercontent.com https://cdn.discordapp.com https://placehold.co https://images.unsplash.com https://picsum.photos",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com https://openrouter.ai https://generativelanguage.googleapis.com wss://generativelanguage.googleapis.com https://api.iconify.design https://*.iconify.design",
      "frame-src 'self' https://accounts.google.com https://*.youtube.com https://*.youtu.be",
      "media-src 'self' https://*.supabase.co",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; '),
  );
}

function errorResponse(status: number, message: string, retryAfter?: number): NextResponse {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-XSS-Protection': '1; mode=block',
  };
  if (retryAfter) {
    headers['Retry-After'] = String(retryAfter);
  }
  return new NextResponse(JSON.stringify({ error: message }), { status, headers });
}

function getPathGroup(pathname: string): string {
  if (pathname.startsWith('/api/upload')) return '/api/upload';
  if (pathname.startsWith('/api/')) return '/api';
  if (pathname.startsWith('/dashboard')) return '/dashboard';
  return '/wiki';
}

function handleTenantPath(request: NextRequest, slug: string, id: string): NextResponse {
  const { pathname } = request.nextUrl;
  const url = request.nextUrl.clone();
  url.searchParams.set('__tenant_slug', slug);
  url.searchParams.set('__tenant_id', id);

  if (pathname === `/w/${slug}` || pathname.startsWith(`/w/${slug}/`)) {
    url.pathname = pathname;
  } else if (pathname.startsWith('/w/')) {
    // A stray `/w/{...}` path on a custom/vercel domain (e.g. a link built with
    // the main-domain prefix but without the tenant slug, or a legacy URL).
    // Rewriting it as-is would nest it under the tenant and 404, so redirect
    // to the clean custom-domain URL instead.
    const cleanUrl = request.nextUrl.clone();
    cleanUrl.pathname = `/${pathname.slice(3)}`;
    const redirect = NextResponse.redirect(cleanUrl, 301);
    addSecurityHeaders(redirect);
    return redirect;
  } else {
    url.pathname = `/w/${slug}${pathname === '/' ? '' : pathname}`;
  }

  const rewriteResponse = NextResponse.rewrite(url);
  addSecurityHeaders(rewriteResponse);
  return rewriteResponse;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host')?.split(':')[0]?.toLowerCase() || '';
  const isDev = host === 'localhost' || host === '127.0.0.1';

  const response = NextResponse.next();
  addSecurityHeaders(response);

  if (pathname.startsWith('/dashboard')) {
    response.headers.set('Referrer-Policy', 'same-origin');
  }

  // ── Skip security checks in dev ──
  if (!isDev) {
    const ip = getClientIp(request);
    const fingerprint = await getFingerprint(request);

    // Layer 1: IP Block Check
    const ipBlocked = await isIpBlocked(ip);
    if (ipBlocked) {
      return errorResponse(403, 'Access denied');
    }

    // Layer 2: Fingerprint Block Check
    const fpBlocked = await isFingerprintBlocked(fingerprint);
    if (fpBlocked) {
      return errorResponse(403, 'Access denied');
    }

    // Layer 3: SQL Injection Detection on URL params & headers
    const sqliTargets = [
      ...Array.from(request.nextUrl.searchParams.values()),
      request.headers.get('x-forwarded-for') || '',
      request.headers.get('referer') || '',
    ];

    if (pathname.startsWith('/api/')) {
      const sqliResult = detectSqlInjection(sqliTargets);
      if (sqliResult.detected) {
        await handleThreatDetection(
          { ip, fingerprint, path: pathname, method: request.method },
          {
            eventType: 'sql_injection',
            severity: 'critical',
            details: { findings: sqliResult.findings.map(f => ({ path: f.path })) },
          },
        );
        return errorResponse(403, 'Malicious request detected');
      }
    }

    // Layer 4: Rate Limiting
    const pathGroup = getPathGroup(pathname);
    const rl = await checkRateLimit(`${pathGroup}:${ip}`, getRateLimiterForPath(pathname));
    if (!rl.allowed) {
      return errorResponse(429, 'Too many requests', Math.ceil((rl.resetAt - Date.now()) / 1000));
    }
  }

  // ── Original tenant routing logic ──
  if (isDev || host === MAIN_DOMAIN) {
    if (pathname.startsWith('/w/')) {
      const slug = pathname.split('/')[2];
      if (slug) {
        response.cookies.set('x-tenant-slug', slug, {
          path: '/',
          maxAge: 60 * 60,
          sameSite: 'lax',
          secure: true,
        });
      }
      return response;
    }

    const nonWikiPaths = [
      '/dashboard', '/api', '/auth', '/login',
      '/profile', '/settings', '/leaderboard', '/notifications',
      '/about', '/blog', '/contact', '/cookies', '/docs',
      '/features', '/pricing', '/privacy', '/security', '/status', '/terms',
    ];
    const isNonWikiPath = nonWikiPaths.some(p => pathname === p || pathname.startsWith(p + '/'));
    if (!isNonWikiPath && pathname !== '/') {
      const tenantSlug = request.cookies.get('x-tenant-slug')?.value;
      if (tenantSlug) {
        const url = request.nextUrl.clone();
        url.pathname = `/w/${tenantSlug}${pathname}`;
        return NextResponse.rewrite(url);
      }
    }

    return response;
  }

  // Custom domain: lookup tenant and rewrite
  if (!pathname.startsWith('/dashboard') && !pathname.startsWith('/api/') && !pathname.startsWith('/auth/')) {
    const cached = await parseTenantCache(request.cookies.get('x-tenant-cache')?.value);

    if (cached) {
      return handleTenantPath(request, cached.slug, cached.id);
    }

    try {
      const headers = { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` };
      let tenantData: { slug: string; id: string }[] | undefined;

      const customDomainResp = await fetch(
        `${SUPA_URL}/rest/v1/tenants?custom_domain=eq.${encodeURIComponent(host)}&select=slug,id`,
        { headers },
      );

      if (customDomainResp.ok) {
        tenantData = (await customDomainResp.json()) as { slug: string; id: string }[];
      }

      if (!tenantData?.length) {
        const vercelDomainResp = await fetch(
          `${SUPA_URL}/rest/v1/tenants?vercel_domain=eq.${encodeURIComponent(host)}&select=slug,id`,
          { headers },
        );
        if (vercelDomainResp.ok) {
          tenantData = (await vercelDomainResp.json()) as { slug: string; id: string }[];
        }
      }

      if (tenantData && tenantData.length > 0) {
        const response = handleTenantPath(request, tenantData[0].slug, tenantData[0].id);
        setTenantSlugCookie(response, tenantData[0].slug);
        await setCachedTenant(response, tenantData[0].slug, tenantData[0].id);
        return response;
      }
    } catch {
      // Tenant lookup failed — pass through
    }
  }

  return response;
}
