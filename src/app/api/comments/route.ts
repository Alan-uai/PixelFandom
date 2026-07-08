import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';
import { z } from 'zod';
import { sanitizeHtml } from '@/lib/sanitize.server';
import { checkRateLimit } from '@/lib/rate-limiter';
import { getClientIp } from '@/lib/threat-detection';

const MAX_CONTENT_LENGTH = 10000;
const MAX_DEPTH = 5;

const commentSchema = z.object({
  article_id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  content: z.string().min(1).max(MAX_CONTENT_LENGTH),
  parent_id: z.string().uuid().optional().nullable(),
});

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
  const ip = getClientIp(request);
  const rl = checkRateLimit(`comments:${ip}`, {
    windowMs: 60_000,
    maxRequests: 10,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Muitos comentários. Aguarde antes de publicar novamente.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = commentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { article_id, tenant_id, content, parent_id } = parsed.data;
  const cleanContent = await sanitizeHtml(content.trim());

  let depth = 0;
  if (parent_id) {
    const { data: parent } = await supabase
      .from('article_comments')
      .select('depth')
      .eq('id', parent_id)
      .single();

    if (!parent) {
      return NextResponse.json({ error: 'Comentário pai não encontrado' }, { status: 404 });
    }

    depth = parent.depth + 1;
    if (depth > MAX_DEPTH) {
      return NextResponse.json({ error: 'Profundidade máxima de respostas atingida' }, { status: 400 });
    }
  }

  const { data, error } = await supabase
    .from('article_comments')
    .insert({
      article_id,
      tenant_id,
      user_id: user.id,
      content: cleanContent,
      parent_id: parent_id || null,
      depth,
    })
    .select('*, user:profiles(id, username, display_name, avatar_url, reputation_points)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

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
      body: cleanContent.slice(0, 200),
      link: `/w/${request.headers.get('x-tenant-slug') || ''}/${article.slug}`,
      metadata: { comment_id: data.id, article_id },
    });
  }

  return NextResponse.json(data, { status: 201 });
}
