import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { feedback } = body;

  if (feedback !== null && feedback !== 'positive' && feedback !== 'negative') {
    return NextResponse.json({ error: 'Invalid feedback value' }, { status: 400 });
  }

  const { data: message } = await supabase
    .from('chat_messages')
    .select('session_id')
    .eq('id', id)
    .single();

  if (!message) {
    return NextResponse.json({ error: 'Message not found' }, { status: 404 });
  }

  const { data: session } = await supabase
    .from('chat_sessions')
    .select('user_id')
    .eq('id', message.session_id)
    .single();

  if (!session || session.user_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data, error } = await supabase
    .from('chat_messages')
    .update({
      feedback,
      feedback_updated_at: feedback ? new Date().toISOString() : null,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
