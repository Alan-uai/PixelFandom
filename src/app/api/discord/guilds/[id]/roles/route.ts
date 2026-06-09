import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const botToken = process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN;

  if (!botToken) {
    return NextResponse.json({ error: 'Bot token not configured' }, { status: 500 });
  }

  const res = await fetch(`https://discord.com/api/v10/guilds/${id}/roles`, {
    headers: { Authorization: `Bot ${botToken}` },
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: res.status });
  }

  const roles = await res.json();
  return NextResponse.json(roles);
}
