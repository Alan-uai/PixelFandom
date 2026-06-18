import { NextRequest, NextResponse } from 'next/server';
import { getTenantBySlug } from '@/lib/tenant';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const tagFilter = searchParams.get('tag');

    if (!slug) {
      return NextResponse.json({ error: 'slug required' }, { status: 400 });
    }

    const tenant = await getTenantBySlug(slug);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const { supabase } = await import('@/supabase');

    let query = supabase
      .from('wiki_articles')
      .select('id, title, slug, summary, tags, updated_at')
      .eq('tenant_id', tenant.id);

    if (tagFilter) {
      query = query.filter('tags', 'cs', `{${tagFilter}}`);
    }

    const { data, error } = await query.order('title').limit(100);

    if (error) throw error;

    return NextResponse.json({ articles: data || [] });
  } catch (error) {
    console.error('Voice articles error:', error);
    return NextResponse.json({ error: 'Failed to list articles' }, { status: 500 });
  }
}
