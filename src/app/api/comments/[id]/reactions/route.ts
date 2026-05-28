import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const commentId = (await params).id;
  const { emoji } = await request.json();

  const finalEmoji = emoji || '👍';

  // Toggle: if exists, delete. Otherwise, insert.
  const { data: existing } = await supabase
    .from('article_reactions')
    .select('id')
    .eq('user_id', user.id)
    .eq('target_type', 'comment')
    .eq('target_id', commentId)
    .eq('emoji', finalEmoji)
    .maybeSingle();

  if (existing) {
    await supabase.from('article_reactions').delete().eq('id', existing.id);
    return NextResponse.json({ reacted: false });
  }

  await supabase.from('article_reactions').insert({
    user_id: user.id,
    target_type: 'comment',
    target_id: commentId,
    emoji: finalEmoji,
  });

  return NextResponse.json({ reacted: true });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const commentId = (await params).id;

  const { data, error } = await supabase
    .from('article_reactions')
    .select('emoji, user_id')
    .eq('target_type', 'comment')
    .eq('target_id', commentId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const grouped: Record<string, { count: number; users: string[] }> = {};
  for (const r of data || []) {
    if (!grouped[r.emoji]) grouped[r.emoji] = { count: 0, users: [] };
    grouped[r.emoji].count++;
    grouped[r.emoji].users.push(r.user_id);
  }

  return NextResponse.json(grouped);
}
