import { NextRequest, NextResponse } from 'next/server';
import { generateEmbedding } from '@/lib/gemini-embedding';
import { createClient } from '@supabase/supabase-js';

const BATCH_DELAY_MS = 150;
const DEFAULT_LIMIT = 50;

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key);
}

export async function GET() {
  const supabase = serviceClient();

  const { count } = await supabase
    .from('wiki_articles')
    .select('*', { count: 'exact', head: true })
    .is('embedding', null);

  return NextResponse.json({ wiki_articles: count ?? 0, total: count ?? 0 });
}

export async function POST(request: NextRequest) {
  const { limit = DEFAULT_LIMIT } = await request.json().catch(() => ({}));
  const maxItems = Math.min(Math.max(1, Number(limit)), 200);

  const supabase = serviceClient();

  const { data: wikiRows, error: fetchError } = await supabase
    .from('wiki_articles')
    .select('id, tenant_id, slug')
    .is('embedding', null)
    .limit(maxItems);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  const processed: string[] = [];
  const failed: { id: string; table: string; error: string }[] = [];

  for (const article of wikiRows ?? []) {
    try {
      const text = article.slug?.trim();

      if (!text) {
        failed.push({ id: article.id, table: 'wiki_articles', error: 'No slug' });
        continue;
      }

      const embedding = await generateEmbedding(text);

      const { error: updateError } = await supabase
        .from('wiki_articles')
        .update({ embedding })
        .eq('id', article.id);

      if (updateError) {
        failed.push({ id: article.id, table: 'wiki_articles', error: updateError.message });
      } else {
        processed.push(`wiki:${article.id}`);
      }

      await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
    } catch (err) {
      failed.push({ id: article.id, table: 'wiki_articles', error: String(err) });
    }
  }

  return NextResponse.json({
    processed: processed.length,
    failed: failed.length,
    errors: failed.slice(0, 10),
    remaining: null,
  });
}
