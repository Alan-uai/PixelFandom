import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const query = searchParams.get('q');

    if (!slug || !query) {
      return NextResponse.json({ error: 'slug and q required' }, { status: 400 });
    }

    const { supabase } = await import('@/supabase');

    const { data, error } = await supabase
      .from('wiki_articles')
      .select('id, title, slug, summary, content')
      .eq('tenant_id', (await supabase.from('tenants').select('id').eq('slug', slug).single()).data?.id)
      .or(`title.ilike.%${query}%,summary.ilike.%${query}%,content.ilike.%${query}%`)
      .limit(5);

    if (error) throw error;

    return NextResponse.json({ results: data || [] });
  } catch (error) {
    console.error('Voice search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
