import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limiter';

async function getUserGuilds(request: NextRequest): Promise<any[] | null> {
  const token = request.cookies.get('discord_access_token')?.value ||
    (request.headers.get('authorization')?.startsWith('Bearer ') ? request.headers.get('authorization')!.slice(7) : null);

  if (!token) return null;

  const res = await fetch('https://discord.com/api/v10/users/@me/guilds', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return null;
  return await res.json();
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const rl = await checkRateLimit(`discord-channels:${ip}`, { windowMs: 60_000, maxRequests: 20 });
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Muitas requisições. Tente novamente em breve.' }, {
      status: 429,
      headers: { 'X-RateLimit-Reset': String(rl.resetAt) },
    });
  }

  const { id } = await params;

  const guilds = await getUserGuilds(request);
  if (!guilds) {
    return NextResponse.json({ error: 'Not authenticated with Discord' }, { status: 401 });
  }

  const guild = guilds.find((g: any) => g.id === id);
  if (!guild) {
    return NextResponse.json({ error: 'You do not have access to this guild' }, { status: 403 });
  }

  const isAdmin = guild.owner || (BigInt(guild.permissions) & BigInt(0x8)) === BigInt(0x8);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Admin access required for this guild' }, { status: 403 });
  }

  const botToken = process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN;

  if (!botToken) {
    return NextResponse.json({ error: 'Bot token not configured' }, { status: 500 });
  }

  const res = await fetch(`https://discord.com/api/v10/guilds/${id}/channels`, {
    headers: { Authorization: `Bot ${botToken}` },
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch channels' }, { status: res.status });
  }

  const channels = await res.json();
  return NextResponse.json(channels);
}
