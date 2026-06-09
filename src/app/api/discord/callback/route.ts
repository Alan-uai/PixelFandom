import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state');

  if (error || !code) {
    return NextResponse.redirect(new URL('/dashboard?discord=error', request.url));
  }

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const redirectUri = `${request.nextUrl.origin}/api/discord/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'Discord OAuth not configured' }, { status: 500 });
  }

  const tokenResponse = await fetch('https://discord.com/api/v10/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenResponse.ok) {
    const errBody = await tokenResponse.text();
    console.error('Discord token exchange failed:', errBody);
    return NextResponse.redirect(new URL('/dashboard?discord=token_error', request.url));
  }

  const tokens = await tokenResponse.json();

  const userResponse = await fetch('https://discord.com/api/v10/users/@me', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userResponse.ok) {
    return NextResponse.redirect(new URL('/dashboard?discord=user_error', request.url));
  }

  const user = await userResponse.json();

  const cookieReturnTo = request.cookies.get('discord_return_to')?.value;
  const returnTo = cookieReturnTo
    ? decodeURIComponent(cookieReturnTo)
    : state || '/dashboard';

  const response = NextResponse.redirect(new URL(`${returnTo}?discord=connected`, request.url));

  response.cookies.set('discord_access_token', tokens.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: tokens.expires_in,
    path: '/',
  });

  if (tokens.refresh_token) {
    response.cookies.set('discord_refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });
  }

  response.cookies.set('discord_user_id', user.id, {
    httpOnly: false,
    sameSite: 'lax',
    maxAge: tokens.expires_in,
    path: '/',
  });

  response.cookies.set('discord_user_name', user.username, {
    httpOnly: false,
    sameSite: 'lax',
    maxAge: tokens.expires_in,
    path: '/',
  });

  response.cookies.set('discord_user_avatar', user.avatar ?? '', {
    httpOnly: false,
    sameSite: 'lax',
    maxAge: tokens.expires_in,
    path: '/',
  });

  return response;
}
