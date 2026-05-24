import { NextRequest, NextResponse } from 'next/server';
import { generateEmbedding } from '@/lib/gemini-embedding';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const slug = searchParams.get('slug');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query || !slug) {
      return NextResponse.json({ error: 'q and slug are required' }, { status: 400 });
    }

    const embedding = await generateEmbedding(query);

    const { supabase } = await import('@/supabase');

    const [wikiRes, collectionRes] = await Promise.all([
      supabase.rpc('get_wiki_data', {
        p_slug: slug,
        p_search: query,
        p_embedding: `[${embedding.join(',')}]`,
      }),
      supabase.rpc('search_collection_items', {
        p_tenant_slug: slug,
        p_embedding: `[${embedding.join(',')}]`,
        p_search: query,
        p_limit: Math.min(limit, 10),
      }),
    ]);

    if (wikiRes.error) throw wikiRes.error;

    return NextResponse.json({
      wiki_results: wikiRes.data?.search_results || [],
      collection_results: collectionRes.data || [],
      query,
    });
  } catch (error) {
    console.error('Semantic search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
