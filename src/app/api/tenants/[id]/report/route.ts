import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';
import { isWikiReportReason } from '@/lib/wiki-reports';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: tenantId } = await params;

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Você precisa estar logado para denunciar.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const reason = body.reason;
    const description = typeof body.description === 'string' ? body.description.slice(0, 2000) : null;

    if (!isWikiReportReason(reason)) {
      return NextResponse.json({ error: 'Motivo de denúncia inválido.' }, { status: 400 });
    }

    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, status')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Wiki não encontrada.' }, { status: 404 });
    }

    const { error: upsertError } = await supabase
      .from('wiki_reports')
      .upsert(
        {
          tenant_id: tenantId,
          reporter_id: user.id,
          reason,
          description,
          status: 'pending',
          reviewed_by: null,
          reviewed_at: null,
          review_notes: null,
        },
        { onConflict: 'tenant_id,reporter_id' }
      );

    if (upsertError) {
      console.error('Report insert error:', upsertError);
      return NextResponse.json({ error: 'Não foi possível enviar a denúncia.' }, { status: 500 });
    }

    const { data: restricted } = await supabase
      .from('tenants')
      .select('status')
      .eq('id', tenantId)
      .single();

    return NextResponse.json({
      success: true,
      restricted: restricted?.status === 'restricted_review',
    });
  } catch (error) {
    console.error('Report route error:', error);
    return NextResponse.json({ error: 'Erro ao processar denúncia.' }, { status: 500 });
  }
}
