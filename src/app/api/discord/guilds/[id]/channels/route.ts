import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const botToken = process.env.DISCORD_BOT_TOKEN;

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
