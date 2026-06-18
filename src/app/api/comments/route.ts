import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const articleId = searchParams.get('article_id');
  const limit = Math.min(Number(searchParams.get('limit')) || 50, 100);
  const offset = Number(searchParams.get('offset')) || 0;

  if (!articleId) {
    return NextResponse.json({ error: 'article_id is required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('article_comments')
    .select('*, user:profiles(id, username, display_name, avatar_url, reputation_points)')
    .eq('article_id', articleId)
    .is('parent_id', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fetch replies for each comment
  const commentsWithReplies = await Promise.all(
    (data || []).map(async (comment) => {
      const { data: replies } = await supabase
        .from('article_comments')
        .select('*, user:profiles(id, username, display_name, avatar_url, reputation_points)')
        .eq('parent_id', comment.id)
        .order('created_at', { ascending: true });
      return { ...comment, replies: replies || [] };
    })
  );

  return NextResponse.json(commentsWithReplies);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { article_id, tenant_id, content, parent_id } = await request.json();

  if (!article_id || !tenant_id || !content?.trim()) {
    return NextResponse.json({ error: 'article_id, tenant_id, and content are required' }, { status: 400 });
  }

  let depth = 0;
  if (parent_id) {
    const { data: parent } = await supabase
      .from('article_comments')
      .select('depth')
      .eq('id', parent_id)
      .single();
    depth = (parent?.depth || 0) + 1;
  }

  const { data, error } = await supabase
    .from('article_comments')
    .insert({
      article_id,
      tenant_id,
      user_id: user.id,
      content: content.trim(),
      parent_id: parent_id || null,
      depth,
    })
    .select('*, user:profiles(id, username, display_name, avatar_url, reputation_points)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify article author
  const { data: article } = await supabase
    .from('wiki_articles')
    .select('created_by, title, slug')
    .eq('id', article_id)
    .single();

  if (article && article.created_by !== user.id) {
    await supabase.from('notifications').insert({
      user_id: article.created_by,
      tenant_id,
      type: parent_id ? 'comment_reply' : 'comment_added',
      title: `Novo comentário em "${article.title}"`,
      body: content.trim().slice(0, 200),
      link: `/w/${request.headers.get('x-tenant-slug') || ''}/${article.slug}`,
      metadata: { comment_id: data.id, article_id },
    });
  }

  return NextResponse.json(data, { status: 201 });
}
