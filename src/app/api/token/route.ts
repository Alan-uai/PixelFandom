import { NextResponse } from 'next/server';

export async function POST() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
  }

  try {
    const now = new Date();
    const expireTime = new Date(now.getTime() + 30 * 60 * 1000);
    const sessionExpireTime = new Date(now.getTime() + 1 * 60 * 1000);

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1alpha/auth_tokens?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expireTime: expireTime.toISOString(),
          newSessionExpireTime: sessionExpireTime.toISOString(),
          uses: 1,
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json(
        { error: `Google API error: ${res.status} ${err}` },
        { status: res.status }
      );
    }

    const data = await res.json();

    return NextResponse.json({
      token: data.name,
      expires_at: expireTime.toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
