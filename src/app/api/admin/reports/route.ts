import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';
import { WIKI_REPORT_AUTO_RESTRICT_THRESHOLD } from '@/lib/wiki-reports';

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin') return null;
  return user;
}

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const admin = await requireAdmin(supabase);
    if (!admin) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('wiki_reports')
      .select('id, status, reporter_id, reason, created_at, tenant:tenants(id, name, slug, status)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Admin reports error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const byTenant = new Map<string, any>();
    for (const r of data as any[]) {
      const t = r.tenant;
      if (!t) continue;
      const entry = byTenant.get(t.id) || {
        tenant_id: t.id,
        name: t.name,
        slug: t.slug,
        status: t.status,
        total_reports: 0,
        pending_reports: 0,
        distinct_reporters: new Set<string>(),
        latest_reason: r.reason,
        latest_at: r.created_at,
      };
      entry.total_reports += 1;
      if (r.status === 'pending') entry.pending_reports += 1;
      entry.distinct_reporters.add(r.reporter_id);
      byTenant.set(t.id, entry);
    }

    const items = Array.from(byTenant.values()).map((e) => {
      const distinct = e.distinct_reporters.size;
      return {
        tenant_id: e.tenant_id,
        name: e.name,
        slug: e.slug,
        status: e.status,
        total_reports: e.total_reports,
        pending_reports: e.pending_reports,
        distinct_reporters: distinct,
        urgent: distinct > WIKI_REPORT_AUTO_RESTRICT_THRESHOLD,
        latest_reason: e.latest_reason,
        latest_at: e.latest_at,
      };
    });

    items.sort((a, b) => {
      if (a.urgent !== b.urgent) return a.urgent ? -1 : 1;
      return b.distinct_reporters - a.distinct_reporters;
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Admin reports GET error:', error);
    return NextResponse.json({ error: 'Erro ao carregar denúncias.' }, { status: 500 });
  }
}
