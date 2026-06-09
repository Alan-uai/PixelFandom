import { NextRequest, NextResponse } from 'next/server';

function getToken(request: NextRequest): string | null {
  const token = request.cookies.get('discord_access_token')?.value;
  if (token) return token;
  const auth = request.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

export async function GET(request: NextRequest) {
  const token = getToken(request);

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const res = await fetch('https://discord.com/api/v10/users/@me/guilds', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch guilds' }, { status: res.status });
  }

  const guilds = await res.json() as { id: string; name: string; icon: string | null; owner: boolean; permissions: string }[];
  const adminGuilds = guilds.filter((g) => g.owner || (BigInt(g.permissions) & BigInt(0x8)) === BigInt(0x8));
  return NextResponse.json(adminGuilds);
}
