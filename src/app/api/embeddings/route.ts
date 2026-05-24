import { NextRequest, NextResponse } from 'next/server';
import { generateEmbedding } from '@/lib/gemini-embedding';

export async function POST(request: NextRequest) {
  try {
    const { text, articleId, tenantId, collectionItemId } = await request.json();
    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const embedding = await generateEmbedding(text);

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
