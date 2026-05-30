import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const tag = request.nextUrl.searchParams.get('tag') || '';

    if (!tag) {
      return NextResponse.json({ articles: [] });
    }

    const { data, error } = await supabase
      .from('wiki_articles')
      .select('id, title, slug, summary, image_url, updated_at')
      .eq('tenant_id', id)
      .contains('tags', [tag])
      .order('updated_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Articles by tag error:', error);
      return NextResponse.json({ articles: [] });
    }

    return NextResponse.json({ articles: data || [] });
  } catch (error) {
    console.error('Articles by tag error:', error);
    return NextResponse.json({ articles: [] });
  }
}
