import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');

  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return getProfile(supabase, user.id);
  }

  return getProfile(supabase, userId);
}

async function getProfile(supabase: any, userId: string) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: badges } = await supabase
    .from('user_badges')
    .select('*, badge:badges(*)')
    .eq('user_id', userId);

  const { data: recentComments } = await supabase
    .from('article_comments')
    .select('*, article:wiki_articles(title, slug)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  return NextResponse.json({
    ...profile,
    badges: badges || [],
    recent_comments: recentComments || [],
  });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { display_name, username, avatar_url, bio, cover_image } = await request.json();

  const updates: Record<string, string> = {};
  if (display_name !== undefined) updates.display_name = display_name;
  if (username !== undefined) updates.username = username;
  if (avatar_url !== undefined) updates.avatar_url = avatar_url;
  if (bio !== undefined) updates.bio = bio;
  if (cover_image !== undefined) updates.cover_image = cover_image;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
