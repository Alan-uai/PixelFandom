import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { MAIN_DOMAIN } from '@/lib/constants';

const ALLOWED_DOMAINS = [MAIN_DOMAIN, 'localhost', '127.0.0.1'];

function isRedirectAllowed(redirectTo: string | null, origin: string): { allowed: boolean; url: string } {
  if (!redirectTo) return { allowed: false, url: origin };
  
  try {
    const parsed = new URL(redirectTo);
    const host = parsed.hostname.toLowerCase();
    const originHost = new URL(origin).hostname.toLowerCase();
    
    if (host === originHost) {
      return { allowed: true, url: redirectTo };
    }
    
    const domainMatch = host === originHost || host.endsWith('.' + originHost);
    if (domainMatch) {
      return { allowed: true, url: redirectTo };
    }
    
    if (ALLOWED_DOMAINS.some(d => host === d || host.endsWith('.' + d))) {
      return { allowed: true, url: redirectTo };
    }
    
    console.warn('[Auth callback] Blocked redirect to:', redirectTo);
    return { allowed: false, url: origin };
  } catch {
    console.warn('[Auth callback] Invalid redirect_to:', redirectTo);
    return { allowed: false, url: origin };
  }
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';
  const redirectTo = searchParams.get('redirect_to');
  const errorDescription = searchParams.get('error_description');

  if (errorDescription) {
    console.error('[Auth callback] OAuth error:', errorDescription);
    return NextResponse.redirect(`${origin}?error=auth_failed`);
  }

  if (code) {
    const { allowed, url } = isRedirectAllowed(redirectTo, origin);
    const redirectUrl = allowed ? url : `${origin}${next}`;

    const response = NextResponse.redirect(redirectUrl);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return response;
    }

    console.error('[Auth callback] exchangeCodeForSession error:', error.message, 'code:', error.status);
  } else {
    console.warn('[Auth callback] No code received. searchParams:', Object.fromEntries(searchParams.entries()));
  }

  return NextResponse.redirect(`${origin}?error=auth_failed`);
}
