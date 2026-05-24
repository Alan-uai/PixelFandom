import { NextRequest, NextResponse } from 'next/server';

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

export async function POST(request: NextRequest) {
  try {
    const { text, articleId, tenantId } = await request.json();
    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const res = await fetch(`${OPENROUTER_BASE}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'openai/text-embedding-3-small',
        input: text,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.error?.message || `OpenRouter error (${res.status})`);
    }

    const data = await res.json();
    const embedding = data.data[0].embedding;

    if (articleId && tenantId) {
      const { supabase } = await import('@/supabase');
      await supabase
        .from('wiki_articles')
        .update({ embedding: `[${embedding.join(',')}]` })
        .eq('id', articleId)
        .eq('tenant_id', tenantId);
    }

    return NextResponse.json({ embedding });
  } catch (error) {
    console.error('Embedding error:', error);
    return NextResponse.json({ error: 'Failed to generate embedding' }, { status: 500 });
  }
}
