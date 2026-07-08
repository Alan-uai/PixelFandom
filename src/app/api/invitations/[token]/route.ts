import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const supabase = await createClient();
  const { token } = await params;
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const { data, error } = await supabase
    .from('invitations')
    .select('*, tenant:tenants(name, slug, logo_url, description)')
    .eq('token', tokenHash)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
  }

  if (data.accepted_at) {
    return NextResponse.json({ error: 'Invitation already accepted' }, { status: 410 });
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Invitation expired' }, { status: 410 });
  }

  return NextResponse.json(data);
}
