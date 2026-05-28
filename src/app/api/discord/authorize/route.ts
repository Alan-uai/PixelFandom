import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const envRedirect = process.env.DISCORD_REDIRECT_URI;
  const redirectUri = envRedirect || `${request.nextUrl.origin}/api/discord/callback`;

  if (!clientId) {
    return NextResponse.json({ error: 'Discord OAuth not configured' }, { status: 500 });
  }

  const returnTo = request.nextUrl.searchParams.get('return_to') || '/dashboard';

  const url = new URL('https://discord.com/oauth2/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', 'identify guilds');
  url.searchParams.set('prompt', 'consent');
  url.searchParams.set('state', returnTo);

  return NextResponse.json({ url: url.toString() });
}
