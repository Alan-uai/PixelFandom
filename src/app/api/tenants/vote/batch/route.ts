import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const ids = request.nextUrl.searchParams.get('ids');

  if (!ids) return NextResponse.json({ error: 'Missing ids param' }, { status: 400 });

  const tenantIds = ids.split(',').filter(Boolean);
  if (tenantIds.length === 0) return NextResponse.json({ error: 'No ids provided' }, { status: 400 });

  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('votes')
    .select('target_id, vote_type, user_id')
    .eq('target_type', 'tenant')
    .in('target_id', tenantIds);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const result: Record<string, { upvotes: number; downvotes: number; score: number; user_vote: string | null }> = {};

  for (const id of tenantIds) {
    const tenantVotes = (data || []).filter((v) => v.target_id === id);
    const upvotes = tenantVotes.filter((v) => v.vote_type === 'up').length;
    const downvotes = tenantVotes.filter((v) => v.vote_type === 'down').length;
    result[id] = {
      upvotes,
      downvotes,
      score: upvotes - downvotes,
      user_vote: user
        ? tenantVotes.find((v) => v.user_id === user.id)?.vote_type || null
        : null,
    };
  }

  return NextResponse.json(result);
}
