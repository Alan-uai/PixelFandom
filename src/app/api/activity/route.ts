import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenant_id');
  const limit = Math.min(Number(searchParams.get('limit')) || 50, 100);

  if (!tenantId) return NextResponse.json({ error: 'tenant_id required' }, { status: 400 });

  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
