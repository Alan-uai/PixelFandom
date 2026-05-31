import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const articleId = (await params).id;

  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('votes')
    .select('vote_type, user_id')
    .eq('target_type', 'article')
    .eq('target_id', articleId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const upvotes = data.filter((v) => v.vote_type === 'up').length;
  const downvotes = data.filter((v) => v.vote_type === 'down').length;

  const userVote = user
    ? data.find((v) => v.user_id === user.id)?.vote_type || null
    : null;

  return NextResponse.json({ upvotes, downvotes, score: upvotes - downvotes, user_vote: userVote });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const articleId = (await params).id;
  const { vote_type } = await request.json();

  if (!['up', 'down'].includes(vote_type)) {
    return NextResponse.json({ error: 'Invalid vote_type' }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from('votes')
    .select('id, vote_type')
    .eq('user_id', user.id)
    .eq('target_type', 'article')
    .eq('target_id', articleId)
    .maybeSingle();

  if (existing) {
    if (existing.vote_type === vote_type) {
      await supabase.from('votes').delete().eq('id', existing.id);
      return NextResponse.json({ vote_type: null });
    }
    await supabase.from('votes').update({ vote_type }).eq('id', existing.id);
    return NextResponse.json({ vote_type });
  }

  await supabase.from('votes').insert({
    user_id: user.id,
    target_type: 'article',
    target_id: articleId,
    vote_type,
  });

  return NextResponse.json({ vote_type });
}
