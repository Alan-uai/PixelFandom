import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

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

    if (!GEMINI_API_KEY) {
      const slug = rawText.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      return NextResponse.json({ translated: rawText, slug });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Translate this game term to English. Return ONLY the English translation, nothing else. Keep it as a short term (1-5 words, lowercase). If it's already English or a proper game term, return it as-is. Term: "${rawText}"`,
            }],
          }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 30 },
        }),
      },
    );

    const data = await response.json();
    const translated = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (translated) {
      const slug = translated.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      return NextResponse.json({ translated, slug });
    }
  } catch {}

  const slug = rawText.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  return NextResponse.json({ translated: rawText, slug });
}
