import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ error: 'slug required' }, { status: 400 });
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

    const { data, error } = await supabase
      .from('wiki_articles')
      .select('id, title, slug, summary, updated_at')
      .eq('tenant_id', tenant.id)
      .order('title')
      .limit(100);

    if (error) throw error;

    return NextResponse.json({ articles: data || [] });
  } catch (error) {
    console.error('Voice articles error:', error);
    return NextResponse.json({ error: 'Failed to list articles' }, { status: 500 });
  }
}
