import { createServerClient } from '@supabase/ssr';

// Envio de e-mails sem dependências externas (Resend REST API).
// Se RESEND_API_KEY não estiver configurado, o e-mail é registrado no console.
// Ao enviar com sucesso, registra a entrega em `email_deliveries` para trilha
// de auditoria jurídica e reenvio automático (webhook do Resend atualiza o status).

interface SendEmailMeta {
  tenantId?: string;
  category?: string;
  // Usado no reenvio: não cria linha duplicada, apenas o chamador atualiza a existente.
  skipDeliveryLog?: boolean;
}

interface SendEmailArgs {
  to: string;
  subject: string;
  html: string;
  text?: string;
  meta?: SendEmailMeta;
}

function getServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

async function logDelivery(args: {
  resendId: string | null;
  to: string;
  subject: string;
  html: string;
  text: string;
  meta?: SendEmailMeta;
}) {
  if (args.meta?.skipDeliveryLog) return;
  try {
    const supabase = getServiceClient();
    const nextRetryAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
    await supabase.from('email_deliveries').insert({
      resend_id: args.resendId,
      recipient: args.to,
      tenant_id: args.meta?.tenantId ?? null,
      category: args.meta?.category ?? null,
      subject: args.subject,
      html: args.html,
      text_body: args.text || args.html,
      status: args.resendId ? 'sent' : 'pending',
      next_retry_at: nextRetryAt,
    });
  } catch (e) {
    console.error('[email] Falha ao registrar entrega:', e);
  }
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  meta,
}: SendEmailArgs): Promise<{ sent: boolean; logged: boolean; resendId?: string | null }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || 'PixelFandom <noreply@pixelfandom.vercel.app>';

  if (!apiKey) {
    console.log('[email:logged]', JSON.stringify({ to, subject, text: text || html }));
    await logDelivery({ resendId: null, to, subject, html, text: text || html, meta });
    return { sent: false, logged: true };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, subject, html, text: text || html }),
    });
    if (!res.ok) {
      console.error('Resend error:', await res.text());
      await logDelivery({ resendId: null, to, subject, html, text: text || html, meta });
      return { sent: false, logged: true };
    }
    const json = (await res.json()) as { id?: string };
    const resendId = json?.id ?? null;
    await logDelivery({ resendId, to, subject, html, text: text || html, meta });
    return { sent: true, logged: false, resendId };
  } catch (e) {
    console.error('Email send failed:', e);
    await logDelivery({ resendId: null, to, subject, html, text: text || html, meta });
    return { sent: false, logged: true };
  }
}
