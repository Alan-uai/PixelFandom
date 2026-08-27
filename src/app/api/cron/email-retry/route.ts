import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/supabase/service';
import { sendEmail } from '@/lib/email';

const RETRY_INTERVAL_MS = 12 * 60 * 60 * 1000; // 12 horas
const MAX_RETRIES = 5;

// Protegido por CRON_SECRET. Agendado (Vercel Cron / pg_cron) para rodar a cada 12h.
export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const now = new Date().toISOString();

  const { data: pending, error } = await supabase
    .from('email_deliveries')
    .select('*')
    .in('status', ['pending', 'sent', 'delayed'])
    .lt('retries', MAX_RETRIES)
    .lte('next_retry_at', now);

  if (error) {
    console.error('[retry] Falha ao buscar pendentes:', error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }

  let retried = 0;
  for (const d of pending || []) {
    const result = await sendEmail({
      to: d.recipient,
      subject: d.subject,
      html: d.html,
      text: d.text_body,
      meta: {
        tenantId: d.tenant_id ?? undefined,
        category: d.category ?? undefined,
        skipDeliveryLog: true,
      },
    });

    await supabase
      .from('email_deliveries')
      .update({
        retries: d.retries + 1,
        resend_id: result.resendId ?? d.resend_id,
        status: result.sent ? 'sent' : 'pending',
        next_retry_at: new Date(Date.now() + RETRY_INTERVAL_MS).toISOString(),
        last_event_at: new Date().toISOString(),
      })
      .eq('id', d.id);

    retried++;
  }

  return NextResponse.json({ retried, total: pending?.length ?? 0 });
}
