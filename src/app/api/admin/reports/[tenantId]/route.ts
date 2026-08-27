import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';

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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const supabase = await createClient();
    const admin = await requireAdmin(supabase);
    if (!admin) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });

    const { tenantId } = await params;

    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name, slug, status')
      .eq('id', tenantId)
      .single();
    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Wiki não encontrada.' }, { status: 404 });
    }

    const { data: reports, error: reportsError } = await supabase
      .from('wiki_reports')
      .select('id, reason, description, status, created_at, reporter_id')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (reportsError) {
      return NextResponse.json({ error: reportsError.message }, { status: 500 });
    }

    const { count } = await supabase
      .from('wiki_reports')
      .select('reporter_id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .neq('status', 'rejected')
      .neq('status', 'dismissed');

    return NextResponse.json({
      tenant,
      reports: reports || [],
      distinct_reporters: count ?? 0,
    });
  } catch (error) {
    console.error('Admin report detail GET error:', error);
    return NextResponse.json({ error: 'Erro ao carregar denúncia.' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const supabase = await createClient();
    const admin = await requireAdmin(supabase);
    if (!admin) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });

    const { tenantId } = await params;
    const body = await request.json().catch(() => ({}));

    // Avaliar uma denúncia individual
    if (body.reportId && body.decision) {
      const allowed = ['resolved', 'rejected', 'dismissed', 'reviewing', 'pending'];
      if (!allowed.includes(body.decision)) {
        return NextResponse.json({ error: 'Decisão inválida.' }, { status: 400 });
      }
      const { error } = await supabase
        .from('wiki_reports')
        .update({
          status: body.decision,
          reviewed_by: admin.id,
          reviewed_at: new Date().toISOString(),
          review_notes: typeof body.notes === 'string' ? body.notes.slice(0, 1000) : null,
        })
        .eq('id', body.reportId)
        .eq('tenant_id', tenantId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Restrição da wiki
    if (body.restriction === 'lift' || body.restriction === 'keep') {
      const next = body.restriction === 'lift' ? 'active' : 'restricted_review';
      const { error } = await supabase
        .from('tenants')
        .update({ status: next })
        .eq('id', tenantId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin report PATCH error:', error);
    return NextResponse.json({ error: 'Erro ao avaliar denúncia.' }, { status: 500 });
  }
}
