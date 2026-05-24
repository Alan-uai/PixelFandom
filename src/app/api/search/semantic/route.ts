import { NextRequest, NextResponse } from 'next/server';

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const slug = searchParams.get('slug');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query || !slug) {
      return NextResponse.json({ error: 'q and slug are required' }, { status: 400 });
    }

    const embRes = await fetch(`${OPENROUTER_BASE}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'openai/text-embedding-3-small',
        input: query.slice(0, 2000),
      }),
    });

    if (!embRes.ok) {
      const err = await embRes.json().catch(() => null);
      throw new Error(err?.error?.message || `OpenRouter error (${embRes.status})`);
    }

    const embData = await embRes.json();
    const embedding = embData.data[0].embedding;

    const { supabase } = await import('@/supabase');
    const { data, error } = await supabase.rpc('get_wiki_data', {
      p_slug: slug,
      p_search: query,
      p_embedding: `[${embedding.join(',')}]`,
    });

    if (error) throw error;

    return NextResponse.json({
      results: data?.search_results || [],
      query,
    });
  } catch (error) {
    console.error('Semantic search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
