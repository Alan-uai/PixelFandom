import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get('tenant_ids');

  if (!idsParam) {
    return NextResponse.json({});
  }

  const tenantIds = idsParam.split(',').filter(Boolean);
  if (tenantIds.length === 0) {
    return NextResponse.json({});
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const result: Record<string, { following: boolean; follower_count: number }> = {};
    for (const tid of tenantIds) {
      const { count } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tid);
      result[tid] = { following: false, follower_count: count || 0 };
    }
    return NextResponse.json(result);
  }

  const { data: follows } = await supabase
    .from('user_follows')
    .select('tenant_id')
    .eq('user_id', user.id)
    .in('tenant_id', tenantIds);

  const followingSet = new Set(follows?.map((f) => f.tenant_id) || []);

  const result: Record<string, { following: boolean; follower_count: number }> = {};
  for (const tid of tenantIds) {
    const { count } = await supabase
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tid);
    result[tid] = {
      following: followingSet.has(tid),
      follower_count: count || 0,
    };
  }

  return NextResponse.json(result);
}
