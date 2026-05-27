import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const article = searchParams.get('article');

    if (!slug || !article) {
      return NextResponse.json({ error: 'slug and article required' }, { status: 400 });
    }

    const { supabase } = await import('@/supabase');

    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', slug)
      .single();

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const { data: wikiArticle } = await supabase
      .from('wiki_articles')
      .select('id, title, slug, summary, content, tags, updated_at')
      .eq('tenant_id', tenant.id)
      .eq('slug', article)
      .single();

    if (wikiArticle) {
      return NextResponse.json({ article: wikiArticle });
    }

    const { data: byId } = await supabase
      .from('wiki_articles')
      .select('id, title, slug, summary, content, tags, updated_at')
      .eq('tenant_id', tenant.id)
      .eq('id', article)
      .single();

    if (byId) {
      return NextResponse.json({ article: byId });
    }

    return NextResponse.json({ article: null });
  } catch (error) {
    console.error('Voice article error:', error);
    return NextResponse.json({ error: 'Failed to get article' }, { status: 500 });
  }
}
