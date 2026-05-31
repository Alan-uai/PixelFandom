import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenant_id');

  if (!tenantId) {
    return NextResponse.json({ error: 'tenant_id is required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const { count } = await supabase
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

    return NextResponse.json({ following: false, follower_count: count || 0 });
  }

  const { data: follow } = await supabase
    .from('user_follows')
    .select('id')
    .eq('user_id', user.id)
    .eq('tenant_id', tenantId)
    .maybeSingle();

  const { count } = await supabase
    .from('user_follows')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);

  return NextResponse.json({
    following: !!follow,
    follower_count: count || 0,
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { tenant_id } = await request.json();

  if (!tenant_id) {
    return NextResponse.json({ error: 'tenant_id is required' }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from('user_follows')
    .select('id')
    .eq('user_id', user.id)
    .eq('tenant_id', tenant_id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('user_follows')
      .delete()
      .eq('id', existing.id);

    return NextResponse.json({ following: false });
  }

  await supabase
    .from('user_follows')
    .insert({ user_id: user.id, tenant_id });

  return NextResponse.json({ following: true });
}
