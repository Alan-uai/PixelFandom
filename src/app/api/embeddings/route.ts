import { NextRequest, NextResponse } from 'next/server';

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
const EMBEDDING_MODEL = 'google/gemini-embedding-2-preview';
const EMBEDDING_DIMENSIONS = 1536;

export async function POST(request: NextRequest) {
  try {
    const { text, articleId, tenantId, collectionItemId } = await request.json();
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
        model: EMBEDDING_MODEL,
        input: text,
        dimensions: EMBEDDING_DIMENSIONS,
        encoding_format: 'float',
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.error?.message || `OpenRouter error (${res.status})`);
    }

    const data = await res.json();
    const embedding = data.data[0].embedding;

    const { supabase } = await import('@/supabase');

    if (articleId && tenantId) {
      await supabase
        .from('wiki_articles')
        .update({ embedding: `[${embedding.join(',')}]` })
        .eq('id', articleId)
        .eq('tenant_id', tenantId);
    }

    if (collectionItemId) {
      await supabase
        .from('collection_items')
        .update({ embedding: `[${embedding.join(',')}]` })
        .eq('id', collectionItemId);
    }

    return NextResponse.json({ embedding });
  } catch (error) {
    console.error('Embedding error:', error);
    return NextResponse.json({ error: 'Failed to generate embedding' }, { status: 500 });
  }
}
