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

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err) {
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

    if (!tenant_id || !email) {
      return NextResponse.json({ error: 'tenant_id and email are required' }, { status: 400 });
    }

    const validRoles = ['admin', 'editor', 'viewer'];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const token = crypto.randomBytes(32).toString('hex');

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
        token,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const origin = request.headers.get('origin') || MAIN_URL;
    const inviteUrl = `${origin}/invite/${token}`;

    return NextResponse.json({ ...data, invite_url: inviteUrl }, { status: 201 });
  } catch (err) {
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

    const { error } = await supabase
      .from('invitations')
      .delete()
      .eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
