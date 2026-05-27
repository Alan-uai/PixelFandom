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

    const wikiRes = await supabase.rpc('get_wiki_data', {
      p_slug: slug,
      p_search: query,
      p_embedding: `[${embedding.join(',')}]`,
    });

    if (wikiRes.error) throw wikiRes.error;

    return NextResponse.json({
      wiki_results: wikiRes.data?.search_results || [],
      query,
    });
  } catch (error) {
    console.error('Semantic search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
