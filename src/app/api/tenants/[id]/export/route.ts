import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name, slug')
      .eq('id', id)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const [articles, tables, members, pages] = await Promise.all([
      supabase.from('wiki_articles').select('*').eq('tenant_id', id),
      supabase.from('tenant_game_tables').select('*').eq('tenant_id', id),
      supabase.from('tenant_members').select('*').eq('tenant_id', id),
      supabase.from('tenant_pages').select('*').eq('tenant_id', id),
    ]);

    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      tenant: { name: tenant.name, slug: tenant.slug },
      articles: articles.data || [],
      tables: tables.data || [],
      members: members.data || [],
      pages: pages.data || [],
    };

    await supabase.from('import_jobs').insert({
      tenant_id: id,
      type: 'export',
      status: 'completed',
      source: 'manual',
      total_count: (articles.data?.length || 0) + (tables.data?.length || 0),
      result: { exported_at: new Date().toISOString() },
    });

    return NextResponse.json(exportData);
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
