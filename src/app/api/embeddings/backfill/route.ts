import { NextRequest, NextResponse } from 'next/server';
import { generateEmbedding } from '@/lib/gemini-embedding';

const BATCH_DELAY_MS = 150;
const DEFAULT_LIMIT = 50;
const SUPABASE_PROJECT_REF = 'fwvqliiudwwwubtlxpen';

async function execSql(sql: string): Promise<void> {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) throw new Error('SUPABASE_ACCESS_TOKEN not set');

  const res = await fetch(
    `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`SQL error: ${err}`);
  }
}

async function updateArticleEmbedding(id: string, embedding: string) {
  const sql = `UPDATE wiki_articles SET embedding = '${embedding}'::vector(1536) WHERE id = '${id}'`;
  await execSql(sql);
}

async function countPending(): Promise<{ wiki: number }> {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) return { wiki: 0 };

  const res = await fetch(
    `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `SELECT COUNT(*) AS wiki FROM wiki_articles WHERE embedding IS NULL;`,
      }),
    }
  );

  if (!res.ok) return { wiki: 0 };
  const data = await res.json();
  return { wiki: Number(data[0]?.wiki ?? 0) };
}

export async function GET() {
  const counts = await countPending();
  return NextResponse.json({
    wiki_articles: counts.wiki,
    total: counts.wiki,
  });
}

export async function POST(request: NextRequest) {
  const { limit = DEFAULT_LIMIT } = await request.json().catch(() => ({}));
  const maxItems = Math.min(Math.max(1, Number(limit)), 200);

  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'SUPABASE_ACCESS_TOKEN not configured' }, { status: 500 });
  }

  const fetchRes = await fetch(
    `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `SELECT id, tenant_id, title, summary, content FROM wiki_articles WHERE embedding IS NULL LIMIT ${maxItems};`,
      }),
    }
  );

  const wikiRows: Array<{ id: string; tenant_id: string; title: string | null; summary: string | null; content: string | null }> = fetchRes.ok ? await fetchRes.json() : [];

  const processed: string[] = [];
  const failed: { id: string; table: string; error: string }[] = [];

  for (const article of wikiRows) {
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
      const embStr = embedding.join(',');

      try {
        await updateArticleEmbedding(article.id, embStr);
        processed.push(`wiki:${article.id}`);
      } catch (updateErr) {
        failed.push({ id: article.id, table: 'wiki_articles', error: String(updateErr) });
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
