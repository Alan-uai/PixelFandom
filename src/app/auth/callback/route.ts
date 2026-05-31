import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';
  const redirectTo = searchParams.get('redirect_to');

  if (code) {
    let redirectUrl: URL | null = null;
    if (redirectTo) {
      try { redirectUrl = new URL(redirectTo); } catch {}
    }
    const isExternal = redirectUrl !== null && redirectUrl.origin !== origin;

    const response = NextResponse.redirect(
      isExternal ? redirectTo! : `${origin}${next}`
    );

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
      if (isExternal) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          redirectUrl!.searchParams.set('sb_access_token', session.access_token);
          redirectUrl!.searchParams.set('sb_refresh_token', session.refresh_token);
          return NextResponse.redirect(redirectUrl!.toString());
        }
      }
      return response;
    }
  }

  return NextResponse.redirect(`${origin}?error=auth_failed`);
}
