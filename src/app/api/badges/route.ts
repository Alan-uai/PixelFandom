import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');
  const category = searchParams.get('category');

  let query = supabase.from('badges').select('*').order('rarity', { ascending: true });

  if (category) query = query.eq('category', category);

  const { data: badges, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (userId) {
    const { data: earned } = await supabase
      .from('user_badges')
      .select('badge_id, earned_at')
      .eq('user_id', userId);

    const earnedMap = new Map((earned || []).map((e) => [e.badge_id, e.earned_at]));
    const result = (badges || []).map((b) => ({
      ...b,
      earned: earnedMap.has(b.id),
      earned_at: earnedMap.get(b.id) || null,
    }));
    return NextResponse.json(result);
  }

  return NextResponse.json(badges);
}
