import { NextRequest, NextResponse } from 'next/server';
import { slugify } from '@/lib/slugify';

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
      const slug = slugify(translated, { separator: '_' });
      return NextResponse.json({ translated, slug });
    }
  } catch {/* noop */}

  const slug = slugify(rawText, { separator: '_' });
  return NextResponse.json({ translated: rawText, slug });
}
