import { NextRequest, NextResponse } from 'next/server';
import { generateEmbedding } from '@/lib/gemini-embedding';

export async function POST(request: NextRequest) {
  try {
    const { text, articleId, tenantId } = await request.json();
    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const embedding = await generateEmbedding(text);

    if (articleId && tenantId) {
      const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supaKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const res = await fetch(
        `${supaUrl}/rest/v1/wiki_articles?id=eq.${encodeURIComponent(articleId)}&tenant_id=eq.${encodeURIComponent(tenantId)}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            apikey: supaKey,
            Authorization: `Bearer ${supaKey}`,
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({ embedding }),
        }
      );
      if (!res.ok) {
        console.error('Embedding update failed', res.status, await res.text());
      }
    }

    return NextResponse.json({ embedding });
  } catch (error) {
    console.error('Embedding error:', error);
    return NextResponse.json({ error: 'Failed to generate embedding' }, { status: 500 });
  }
}
