import { NextRequest, NextResponse } from 'next/server';
import { generateEmbedding } from '@/lib/gemini-embedding';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/supabase/server';
import { checkRateLimit } from '@/lib/rate-limiter';

const BATCH_DELAY_MS = 150;
const DEFAULT_LIMIT = 50;

const GAME_TABLES = ['weapons', 'armors', 'enemies', 'bosses', 'rings', 'potions', 'upgrades'] as const;

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key);
}

async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';

  const rl = checkRateLimit(`backfill:${ip}`, {
    windowMs: 60_000,
    maxRequests: 5,
  });
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Muitas requisições. Tente novamente em breve.' }, {
      status: 429,
      headers: { 'X-RateLimit-Reset': String(rl.resetAt) },
    });
  }

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 });
  }

  return null;
}

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  const supabase = serviceClient();

  const { count: wikiCount } = await supabase
    .from('wiki_articles')
    .select('*', { count: 'exact', head: true })
    .is('embedding', null);

  const gameCounts: Record<string, number> = {};
  for (const table of GAME_TABLES) {
    const { count } = await supabase
      .from(table as any)
      .select('*', { count: 'exact', head: true })
      .is('embedding', null);
    gameCounts[table] = count ?? 0;
  }

  const gameTotal = Object.values(gameCounts).reduce((a, b) => a + b, 0);

  return NextResponse.json({
    wiki_articles: wikiCount ?? 0,
    ...gameCounts,
    total: (wikiCount ?? 0) + gameTotal,
  });
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  const { limit = DEFAULT_LIMIT, table = 'wiki_articles' } = await request.json().catch(() => ({}));
  const maxItems = Math.min(Math.max(1, Number(limit)), 200);

  if (table !== 'wiki_articles' && !GAME_TABLES.includes(table as any)) {
    return NextResponse.json({ error: `Invalid table: ${table}` }, { status: 400 });
  }

  const supabase = serviceClient();

  const { data: rows, error: fetchError } = await supabase
    .from(table as any)
    .select('id, slug')
    .is('embedding', null)
    .limit(maxItems);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  const processed: string[] = [];
  const failed: { id: string; table: string; error: string }[] = [];

  for (const row of rows ?? []) {
    try {
      const text = (row as any).slug?.trim();

      if (!text) {
        failed.push({ id: (row as any).id, table, error: 'No slug' });
        continue;
      }

      const embedding = await generateEmbedding(text);

      const { error: updateError } = await supabase
        .from(table as any)
        .update({ embedding } as any)
        .eq('id', (row as any).id);

      if (updateError) {
        failed.push({ id: (row as any).id, table, error: updateError.message });
      } else {
        processed.push(`${table}:${(row as any).id}`);
      }

      await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
    } catch (err) {
      failed.push({ id: (row as any).id, table, error: String(err) });
    }
  }

  return NextResponse.json({
    table,
    processed: processed.length,
    failed: failed.length,
    errors: failed.slice(0, 10),
    remaining: null,
  });
}
