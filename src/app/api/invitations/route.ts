import { NextRequest, NextResponse } from 'next/server';
import { MAIN_URL } from '@/lib/constants';
import { createClient } from '@/supabase/server';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant_id');

    if (!tenantId) {
      return NextResponse.json({ error: 'tenant_id is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('invitations')
      .select('*, invited_by_profile:profiles!invited_by(display_name, avatar_url)')
      .eq('tenant_id', tenantId)
      .is('accepted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch invitations:', error);
      return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { tenant_id, email, role, expires_in } = body;

    if (!tenant_id || typeof tenant_id !== 'string' || !email || typeof email !== 'string') {
      return NextResponse.json({ error: 'tenant_id and email are required' }, { status: 400 });
    }

    const validRoles = ['admin', 'editor', 'viewer'];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    let expiresAt: string | null = null;
    if (expires_in && expires_in !== 'never') {
      const ms = parseInt(expires_in, 10);
      if (!isNaN(ms) && ms > 0) {
        expiresAt = new Date(Date.now() + ms).toISOString();
      }
    }

    const { data, error } = await supabase
      .from('invitations')
      .insert({
        tenant_id,
        invited_by: user.id,
        email,
        role: role || 'viewer',
        token: tokenHash,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create invitation:', error);
      return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });
    }

    const origin = request.headers.get('origin') || MAIN_URL;
    const inviteUrl = `${origin}/invite/${token}`;

    return NextResponse.json({ ...data, invite_url: inviteUrl }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { id } = body;

    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    const { data: invitation, error: findError } = await supabase
      .from('invitations')
      .select('tenant_id')
      .eq('id', id)
      .is('accepted_at', null)
      .single();

    if (findError || !invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    const { data: membership } = await supabase
      .from('tenant_members')
      .select('role')
      .eq('tenant_id', invitation.tenant_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { error } = await supabase
      .from('invitations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete invitation:', error);
      return NextResponse.json({ error: 'Failed to delete invitation' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
