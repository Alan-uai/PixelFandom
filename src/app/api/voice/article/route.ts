import { NextRequest, NextResponse } from 'next/server';
import { parseContentToJson } from '@/lib/content-utils';
import { getTenantBySlug } from '@/lib/tenant';
import { createClient } from '@/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const article = searchParams.get('article');

    if (!slug || !article) {
      return NextResponse.json({ error: 'slug and article required' }, { status: 400 });
    }

    const tenant = await getTenantBySlug(slug);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      if (!tenant.is_public) {
        return NextResponse.json({ error: 'Autenticação necessária para acessar esta wiki.' }, { status: 401 });
      }
    } else {
      const { data: membership } = await supabase
        .from('tenant_members')
        .select('role')
        .eq('tenant_id', tenant.id)
        .eq('user_id', user.id)
        .single();

      if (!membership && !tenant.is_public) {
        return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
      }
    }

    const { supabase: anon } = await import('@/supabase');

    const { data: wikiArticle } = await anon
      .from('wiki_articles')
      .select('id, title, slug, summary, content, tags, updated_at')
      .eq('tenant_id', tenant.id)
      .eq('slug', article)
      .single();

    if (wikiArticle) {
      const item_stats = parseContentToJson(wikiArticle.content);
      return NextResponse.json({ article: wikiArticle, item_stats });
    }

    const { data: byId } = await anon
      .from('wiki_articles')
      .select('id, title, slug, summary, content, tags, updated_at')
      .eq('tenant_id', tenant.id)
      .eq('id', article)
      .single();

    if (byId) {
      const item_stats = parseContentToJson(byId.content);
      return NextResponse.json({ article: byId, item_stats });
    }

    return NextResponse.json({ article: null, item_stats: null });
  } catch (error) {
    console.error('Voice article error:', error);
    return NextResponse.json({ error: 'Failed to get article' }, { status: 500 });
  }
}
