import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { endpoint, p256dh, auth, tenantId } = await request.json();
    const { supabase } = await import('@/supabase');
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { error } = await supabase.from('push_subscriptions').upsert({
      user_id: user.id,
      tenant_id: tenantId || null,
      endpoint,
      p256dh,
      auth,
      user_agent: request.headers.get('user-agent') || '',
    });

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Push subscribe error:', error);
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}
