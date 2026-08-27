import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@/supabase/server';
import { sendEmail } from '@/lib/email';

function getServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const supabase = await createClient();
    const admin = await requireAdmin(supabase);
    if (!admin) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });

    const { tenantId } = await params;
    const body = await request.json().catch(() => ({}));
    const action: 'report' | 'delete' = body.action;

    if (action !== 'report' && action !== 'delete') {
      return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 });
    }

    const fine = typeof body.fine === 'string' ? body.fine.trim() : '';
    const offlineDuration = typeof body.offlineDuration === 'string' ? body.offlineDuration.trim() : '';
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const evidence = typeof body.evidence === 'string' ? body.evidence.trim() : '';

    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name, slug')
      .eq('id', tenantId)
      .single();
    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Wiki não encontrada.' }, { status: 404 });
    }

    // Buscar e-mail do owner (service client para contornar RLS)
    const service = getServiceClient();
    const { data: ownerRow } = await service
      .from('tenant_members')
      .select('user_id, profiles(email, display_name)')
      .eq('tenant_id', tenantId)
      .eq('role', 'owner')
      .limit(1)
      .maybeSingle();

    const ownerEmail: string | undefined = (ownerRow?.profiles as any)?.email;
    const ownerName: string = (ownerRow?.profiles as any)?.display_name || 'dono da Wiki';

    if (!ownerEmail) {
      return NextResponse.json({ error: 'E-mail do dono da Wiki não encontrado.' }, { status: 404 });
    }

    let subject: string;
    let html: string;
    let text: string;

    if (action === 'report') {
      subject = `[PixelFandom] Relatório de denúncias — ${tenant.name}`;
      const parts: string[] = [];
      parts.push(`Olá ${ownerName},`);
      parts.push(`A sua Wiki "${tenant.name}" (/${tenant.slug}) recebeu denúncias que estão em avaliação pela equipe do PixelFandom e pelo nosso sistema automatizado.`);
      if (fine) parts.push(`<strong>Multa aplicável:</strong> ${fine}`);
      if (offlineDuration) parts.push(`<strong>Tempo de Wiki fora do ar:</strong> ${offlineDuration}`);
      if (message) parts.push(`<strong>Mensagem da equipe:</strong> ${message}`);
      parts.push(`Enquanto a análise estiver em curso, a Wiki pode permanecer restrita. Para mais detalhes, consulte nossas páginas de transparência.`);
      html = parts.map((p) => `<p>${p}</p>`).join('');
      text = parts.join('\n');
    } else {
      subject = `[PixelFandom] Exclusão da Wiki ${tenant.name}`;
      const parts: string[] = [];
      parts.push(`Olá ${ownerName},`);
      parts.push(`Após avaliação, a sua Wiki "${tenant.name}" (/${tenant.slug}) será <strong>excluída</strong> pela equipe do PixelFandom.`);
      parts.push(`<strong>Motivo / Provas:</strong> ${evidence || 'Não informado'}`);
      parts.push(`Esta decisão decorre do descumprimento das políticas do site e/ou do contrato de uso, conforme detalhado em nossas páginas de transparência. O desligamento é definitivo: não haverá reversão de acordos, restauração de dados ou reativação da Wiki.`);
      if (message) parts.push(`<strong>Observações da equipe:</strong> ${message}`);
      html = parts.map((p) => `<p>${p}</p>`).join('');
      text = parts.join('\n');
    }

    const result = await sendEmail({
      to: ownerEmail,
      subject,
      html,
      text,
      meta: { tenantId, category: action },
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Notify route error:', error);
    return NextResponse.json({ error: 'Erro ao enviar notificação.' }, { status: 500 });
  }
}
