import { NextRequest, NextResponse } from 'next/server';
import { verifyResendSignature, recordResendEvent } from '@/lib/email-events';

export async function POST(req: NextRequest) {
  const raw = await req.text();

  const valid = await verifyResendSignature(raw);
  if (!valid) {
    return NextResponse.json({ error: 'Assinatura inválida.' }, { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }

  const events = Array.isArray(payload) ? payload : [payload];
  for (const event of events) {
    try {
      await recordResendEvent(event);
    } catch (err) {
      console.error('[webhook] Falha ao registrar evento:', err);
    }
  }

  return NextResponse.json({ received: events.length });
}
