import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const ids = request.nextUrl.searchParams.get('ids');

  if (!ids) return NextResponse.json({ error: 'Missing ids param' }, { status: 400 });

  const articleIds = ids.split(',').filter(Boolean);
  if (articleIds.length === 0) return NextResponse.json({ error: 'No ids provided' }, { status: 400 });

  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('votes')
    .select('target_id, vote_type, user_id')
    .eq('target_type', 'article')
    .in('target_id', articleIds);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const result: Record<string, { upvotes: number; downvotes: number; score: number; user_vote: string | null }> = {};

  for (const id of articleIds) {
    const articleVotes = (data || []).filter((v) => v.target_id === id);
    const upvotes = articleVotes.filter((v) => v.vote_type === 'up').length;
    const downvotes = articleVotes.filter((v) => v.vote_type === 'down').length;
    result[id] = {
      upvotes,
      downvotes,
      score: upvotes - downvotes,
      user_vote: user
        ? articleVotes.find((v) => v.user_id === user.id)?.vote_type || null
        : null,
    };
  }

  return NextResponse.json(result);
}
