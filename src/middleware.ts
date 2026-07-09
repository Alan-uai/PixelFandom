import { NextRequest, NextResponse } from 'next/server';
import { MAIN_DOMAIN } from '@/lib/constants';
import { checkRateLimit, getRateLimiterForPath } from '@/lib/rate-limiter';
import { isIpBlocked, isFingerprintBlocked, getClientIp, getFingerprint, handleThreatDetection } from '@/lib/threat-detection';
import { detectSqlInjection } from '@/lib/sql-injection-detect';

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPA_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const HMAC_SECRET = process.env.COOKIE_SECRET || 'pixelfandom-cookie-secret-change-in-production';

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|audio-processors).*)'],
};

const CACHE_TTL_MS = 3_600_000;

async function hmacSign(payload: string): Promise<string> {
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

async function getCachedTenant(request: NextRequest): Promise<{ slug: string; id: string } | null> {
  try {
    const raw = request.cookies.get('x-tenant-cache')?.value;
    if (!raw) return null;
    const parsed = JSON.parse(raw);
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

async function setCachedTenant(response: NextResponse, slug: string, id: string) {
  const payload = JSON.stringify({ slug, id, exp: Date.now() + CACHE_TTL_MS });
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
    'camera=(), microphone=(), geolocation=(), interest-cohort=(), display-capture=(), clipboard-read=(), clipboard-write=(), fullscreen=()',
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
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com https://openrouter.ai https://generativelanguage.googleapis.com",
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

    return response;
  }

  // Custom domain: lookup tenant and rewrite
  if (!pathname.startsWith('/dashboard') && !pathname.startsWith('/api/')) {
    const cached = await getCachedTenant(request);

    if (cached) {
      const url = request.nextUrl.clone();
      url.searchParams.set('__tenant_slug', cached.slug);
      url.searchParams.set('__tenant_id', cached.id);

      if (pathname.startsWith(`/w/${cached.slug}/`) || pathname === `/w/${cached.slug}`) {
        url.pathname = pathname;
      } else {
        url.pathname = `/w/${cached.slug}${pathname === '/' ? '' : pathname}`;
      }

      const rewriteResponse = NextResponse.rewrite(url);
      addSecurityHeaders(rewriteResponse);
      return rewriteResponse;
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

      if (!tenantData?.length && host.endsWith('.vercel.app')) {
        const subdomain = host.replace('.vercel.app', '');
        const fallbackResp = await fetch(
          `${SUPA_URL}/rest/v1/tenants?slug=eq.${encodeURIComponent(subdomain)}&select=slug,id`,
          { headers },
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

        const rewriteResponse = NextResponse.rewrite(url);
        addSecurityHeaders(rewriteResponse);
        await setCachedTenant(rewriteResponse, slug, tenantData[0].id);
        return rewriteResponse;
      }
    } catch {
      // Tenant lookup failed — pass through
    }
  }

  return response;
}
