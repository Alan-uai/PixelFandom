import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  let rawText = '';
  try {
    const { text } = await request.json();
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ translated: '', slug: '' });
    }
    rawText = text.trim();
    if (!rawText) {
      return NextResponse.json({ translated: '', slug: '' });
    }

    if (/^[a-zA-Z][a-zA-Z0-9 _-]*$/.test(rawText)) {
      const slug = rawText.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      return NextResponse.json({ translated: rawText, slug });
    }

    const res = await fetch(
      `https://translate.googleapis.com/translate_a/single?` +
      `client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(rawText)}`,
      {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(5000),
      },
    );
    const data = await res.json();
    const translated = data?.[0]?.[0]?.[0];

    if (translated) {
      const slug = translated.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      return NextResponse.json({ translated, slug });
    }
  } catch {}

  const slug = rawText.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  return NextResponse.json({ translated: rawText, slug });
}
