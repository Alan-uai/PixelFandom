import { NextRequest, NextResponse } from 'next/server';

async function findMatchingItem(
  supabase: any,
  tenantId: string,
  title: string
): Promise<Record<string, unknown> | null> {
  const { data: collections } = await supabase
    .from('custom_collections')
    .select('id')
    .eq('tenant_id', tenantId);

  const collectionIds: string[] = collections?.map((c: any) => c.id) ?? [];
  if (collectionIds.length === 0) return null;

  const { data: items } = await supabase
    .from('collection_items')
    .select('data')
    .in('collection_id', collectionIds)
    .or(`data->>name.ilike.%${title}%`)
    .limit(1);

  return items?.[0]?.data ?? null;
}

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
      const itemStats = await findMatchingItem(supabase, tenant.id, wikiArticle.title);
      return NextResponse.json({ article: wikiArticle, item_stats: itemStats });
    }

    const { data: byId } = await supabase
      .from('wiki_articles')
      .select('id, title, slug, summary, content, tags, updated_at')
      .eq('tenant_id', tenant.id)
      .eq('id', article)
      .single();

    if (byId) {
      const itemStats = await findMatchingItem(supabase, tenant.id, byId.title);
      return NextResponse.json({ article: byId, item_stats: itemStats });
    }

    return NextResponse.json({ article: null, item_stats: null });
  } catch (error) {
    console.error('Voice article error:', error);
    return NextResponse.json({ error: 'Failed to get article' }, { status: 500 });
  }
}
