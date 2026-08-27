import crypto from 'crypto';
import { headers } from 'next/headers';
import { createServiceClient } from '@/supabase/service';

const EVENT_STATUS_MAP: Record<string, string> = {
  'email.sent': 'sent',
  'email.delivered': 'delivered',
  'email.bounced': 'bounced',
  'email.complained': 'complained',
  'email.delivery_delayed': 'delayed',
};

// Resend entrega webhooks assinados via Svix.
// O segredo (RESEND_WEBHOOK_SECRET) tem formato "whsec_<base64url>".
function decodeSvixSecret(secret: string): Buffer {
  const raw = secret.startsWith('whsec_') ? secret.slice('whsec_'.length) : secret;
  const b64 = raw.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(b64, 'base64');
}

// Verifica a assinatura Svix (HMAC-SHA256 de `${id}.${timestamp}.${body}`).
export async function verifyResendSignature(rawBody: string): Promise<boolean> {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[webhook] RESEND_WEBHOOK_SECRET não configurado');
    return false;
  }

  const h = await headers();
  const msgId = h.get('svix-id');
  const timestamp = h.get('svix-timestamp');
  const signatures = h.get('svix-signature');
  if (!msgId || !timestamp || !signatures) return false;

  // Rejeita eventos com mais de 5 minutos (replay protection).
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Date.now() - ts * 1000 > 5 * 60 * 1000) return false;

  const key = decodeSvixSecret(secret);
  const signedContent = `${msgId}.${timestamp}.${rawBody}`;
  const expected = crypto.createHmac('sha256', key).update(signedContent).digest('base64');

  const provided = signatures.split(',').map((s) => s.trim());
  const valid = provided.some((sig) => {
    const v = sig.startsWith('v1,') ? sig.slice(3) : sig;
    const a = Buffer.from(expected);
    const b = Buffer.from(v);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  });

  return valid;
}

function extractResendId(event: any): string | undefined {
  return event?.data?.email_id || event?.data?.id;
}

function extractRecipient(event: any): string {
  const to = event?.data?.to;
  if (Array.isArray(to) && to.length) return to[0];
  return event?.data?.email || '';
}

// Persiste o evento (trilha jurídica) e atualiza o estado de entrega.
export async function recordResendEvent(event: any): Promise<void> {
  const supabase = createServiceClient();
  const type: string = event?.type;
  const resendId = extractResendId(event);
  const recipient = extractRecipient(event);
  const createdAt = event?.created_at ? new Date(event.created_at) : new Date();

  await supabase.from('email_events').insert({
    resend_id: resendId,
    recipient,
    event: type,
    occurred_at: createdAt,
    data: event || {},
  });

  const localStatus = EVENT_STATUS_MAP[type];
  if (resendId && localStatus) {
    const update: Record<string, unknown> = {
      status: localStatus,
      last_event_at: new Date().toISOString(),
    };
    if (type === 'email.opened') update.opened = true;
    await supabase.from('email_deliveries').update(update).eq('resend_id', resendId);
  }
}
