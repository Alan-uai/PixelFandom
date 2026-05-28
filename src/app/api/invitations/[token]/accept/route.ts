import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { token } = await params;

  const { data: invitation, error: fetchError } = await supabase
    .from('invitations')
    .select('*')
    .eq('token', token)
    .single();

  if (fetchError || !invitation) {
    return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
  }

  if (invitation.accepted_at) {
    return NextResponse.json({ error: 'Invitation already accepted' }, { status: 410 });
  }

  if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Invitation expired' }, { status: 410 });
  }

  if (invitation.email && invitation.email.toLowerCase() !== user.email?.toLowerCase()) {
    return NextResponse.json({ error: 'This invitation was sent to a different email' }, { status: 403 });
  }

  const { error: memberError } = await supabase
    .from('tenant_members')
    .insert({
      tenant_id: invitation.tenant_id,
      user_id: user.id,
      role: invitation.role,
      invited_by: invitation.invited_by,
    });

  if (memberError) {
    if (memberError.code === '23505') {
      return NextResponse.json({ error: 'You are already a member of this tenant' }, { status: 409 });
    }
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  const { error: updateError } = await supabase
    .from('invitations')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', invitation.id);

  if (updateError) {
    console.error('Failed to update invitation:', updateError);
  }

  return NextResponse.json({ success: true, tenant_id: invitation.tenant_id, role: invitation.role });
}
