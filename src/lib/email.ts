// Envio de e-mails sem dependências externas (Resend REST API).
// Se RESEND_API_KEY não estiver configurado, o e-mail é registrado no console.

interface SendEmailArgs {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailArgs): Promise<{ sent: boolean; logged: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || 'PixelFandom <noreply@pixelfandom.vercel.app>';

  if (!apiKey) {
    console.log('[email:logged]', JSON.stringify({ to, subject, text: text || html }));
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
      return { sent: false, logged: true };
    }
    return { sent: true, logged: false };
  } catch (e) {
    console.error('Email send failed:', e);
    return { sent: false, logged: true };
  }
}
