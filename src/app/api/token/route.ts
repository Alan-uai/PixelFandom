import { NextResponse } from 'next/server';

export async function POST() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
  }

  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1alpha/api_key_tokens:create',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        uses: 1,
        expire_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        new_session_expire_time: new Date(Date.now() + 60 * 1000).toISOString(),
      }),
    },
  );

  if (!response.ok) {
    const err = await response.text().catch(() => response.statusText);
    console.error('[POST /api/token] Gemini API error:', response.status, err);
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
  }

  const data = await response.json();
  return NextResponse.json({ token: data.name, expires_at: data.expire_time });
}