import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const metric = searchParams.get('metric') || 'reputation_points';
  const tenantId = searchParams.get('tenant_id');
  const limit = Math.min(Number(searchParams.get('limit')) || 20, 100);

  const validMetrics = ['reputation_points', 'articles_count', 'comments_count', 'streak_days', 'reactions_received'];
  const orderColumn = validMetrics.includes(metric) ? metric : 'reputation_points';

  const { data: { user } } = await supabase.auth.getUser();

  // Get top users by metric
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, reputation_points, articles_count, comments_count, streak_days, reactions_received')
    .order(orderColumn, { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const ranked = (data || []).map((row, index) => ({
    rank: index + 1,
    ...row,
    is_current_user: row.id === user?.id,
  }));

  return NextResponse.json({
    metric: orderColumn,
    users: ranked,
    total: ranked.length,
  });
}
