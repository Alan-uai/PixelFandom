import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/supabase';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { error } = await supabase
      .from('negative_feedback')
      .update({
        status: body.status || 'reviewed',
        reviewed_at: body.reviewed_at || new Date().toISOString(),
        resolution: body.resolution || null,
      })
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Feedback update error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
