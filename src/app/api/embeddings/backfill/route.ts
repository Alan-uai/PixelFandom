import { NextRequest, NextResponse } from 'next/server';
import { generateEmbedding } from '@/lib/gemini-embedding';

const BATCH_DELAY_MS = 100;
const DEFAULT_LIMIT = 50;

export async function GET() {
  const { supabase } = await import('@/supabase');

  const [wikiCount, collectionCount] = await Promise.all([
    supabase.from('wiki_articles').select('id', { count: 'exact', head: true }).is('embedding', null),
    supabase.from('collection_items').select('id', { count: 'exact', head: true }).is('embedding', null),
  ]);

  return NextResponse.json({
    wiki_articles: wikiCount.count ?? 0,
    collection_items: collectionCount.count ?? 0,
    total: (wikiCount.count ?? 0) + (collectionCount.count ?? 0),
  });
}

export async function POST(request: NextRequest) {
  const { limit = DEFAULT_LIMIT } = await request.json().catch(() => ({}));
  const maxItems = Math.min(Math.max(1, Number(limit)), 200);

  const { supabase } = await import('@/supabase');

  const [wikiRows, collectionRows] = await Promise.all([
    supabase
      .from('wiki_articles')
      .select('id, tenant_id, title, summary, content')
      .is('embedding', null)
      .limit(maxItems),
    supabase
      .from('collection_items')
      .select('id, collection_id, data')
      .is('embedding', null)
      .limit(maxItems),
  ]);

  const processed: string[] = [];
  const failed: { id: string; table: string; error: string }[] = [];

  for (const article of wikiRows.data ?? []) {
    try {
      const text = [article.title, article.summary, article.content]
        .filter(Boolean)
        .join(' ')
        .slice(0, 8000);

      if (!text) {
        failed.push({ id: article.id, table: 'wiki_articles', error: 'No text' });
        continue;
      }

      const embedding = await generateEmbedding(text);
      const { error: updateError } = await supabase
        .from('wiki_articles')
        .update({ embedding: `[${embedding.join(',')}]` })
        .eq('id', article.id)
        .eq('tenant_id', article.tenant_id);

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

  for (const item of collectionRows.data ?? []) {
    try {
      const data = (item.data as Record<string, unknown>) || {};
      const text = [data.name, data.description]
        .filter(Boolean)
        .join(' ')
        .slice(0, 8000);

      if (!text) {
        failed.push({ id: item.id, table: 'collection_items', error: 'No text' });
        continue;
      }

      const embedding = await generateEmbedding(text);
      const { error: updateError } = await supabase
        .from('collection_items')
        .update({ embedding: `[${embedding.join(',')}]` })
        .eq('id', item.id);

      if (updateError) {
        failed.push({ id: item.id, table: 'collection_items', error: updateError.message });
      } else {
        processed.push(`collection:${item.id}`);
      }

      await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
    } catch (err) {
      failed.push({ id: item.id, table: 'collection_items', error: String(err) });
    }
  }

  return NextResponse.json({
    processed: processed.length,
    failed: failed.length,
    errors: failed.slice(0, 10),
    remaining: null,
  });
}
