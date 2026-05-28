import { generateEmbedding } from './gemini-embedding';

export interface WikiSearchItem {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content?: string;
  tags: string[] | null;
  image_url: string | null;
  score: number;
  match_type: 'semantic' | 'fulltext';
}

export interface GameSearchItem {
  source_type: string;
  id: string;
  name: string;
  description: string;
  slug: string;
  tags: string[] | null;
  collection_name: string | null;
  collection_slug: string | null;
  raw_data: Record<string, unknown> | null;
  rank: number;
  match_type: string;
}

export interface SearchAllResult {
  wiki: WikiSearchItem[];
  collection: any[];
  game_items: GameSearchItem[];
}

function extractSearchTerms(rawQuery: string): string {
  const stopwords = /\b(como|obter|qual|onde|quais|tem|para|uma|um|dos|das|com|que|são|sao|este|esta|isso|isto|essa|esse|para|mais|muito|bem|vai|pode|fazer|acha|era|foi|seus|suas|seu|sua|pelo|pela|entre|num|numa|na|no|da|do|em|de|e|a|o|as|os|ao|aos|às|dum|duma|duns|dumas|daquele|daquela|naquele|naquela|naquilo|àquele|àquela|àquilo|neste|nesta|nisso|nesse|nessa|naquilo|ou|se|me|te|lhe|nos|vos|lhes|ele|ela|eles|elas|nós|vós|eu|tu|voce|você|nos|minha|meu|tua|teu|sua|seu|nossa|nosso|dela|dele|deles|delas|aqui|ali|lá|cá|sim|não|nao|ja|já|só|so|ainda|sempre|nunca|tambem|também|apenas|agora|depois|antes|hoje|ontem|amanhã|amanha|enquanto|durante|ate|até|sem|sob|sobre|trás|tras|detras|detrás|frente|atras|atrás|apos|após|contra|perante|segundo|conforme|consoante|mediante|salvo|exceto|menos|fora|afora|dentro|cerca|acerca|acima|abaixo|adiante|além|alem|ao_lado|em_volta|em_torno|através|atraves|apesar|conquanto|embora|posto|porquanto|pois|porque|por_que|porquê|ja_que|já_que|uma_vez|visto|dado|devido|graças|obrigado)\b/gi;
  return rawQuery.replace(stopwords, '').replace(/\s+/g, ' ').trim() || rawQuery.trim();
}

function extractItemNames(query: string): string[] {
  const cleaned = extractSearchTerms(query);
  const names = cleaned.split(/\s+/).filter(t => t.length > 2);
  const phrases: string[] = [];
  if (names.length > 1) {
    phrases.push(names.join(' '));
  }
  if (names.length > 2) {
    for (let i = 0; i < names.length - 1; i++) {
      phrases.push(names.slice(i, i + 2).join(' '));
    }
  }
  return [...new Set([cleaned, ...phrases, ...names])];
}

export async function searchAll(
  slug: string,
  query: string,
  options?: { signal?: AbortSignal; limit?: number }
): Promise<SearchAllResult> {
  const limit = options?.limit ?? 5;

  const terms = extractItemNames(query);
  const primaryQuery = terms[0] || query;

  let embedding: number[] | null = null;
  try {
    embedding = await generateEmbedding(query, options?.signal);
  } catch {
    embedding = null;
  }

  const { supabase } = await import('@/supabase');

  const wikiPromise = supabase.rpc('get_wiki_data', {
    p_slug: slug,
    p_search: embedding ? '' : primaryQuery,
    p_embedding: embedding ? `[${embedding.join(',')}]` : null,
  });

  const allPromise = supabase.rpc('search_all', {
    p_tenant_slug: slug,
    p_query: primaryQuery,
    p_limit: limit * 3,
    p_embedding: null,
  });

  const [wikiRes, allRes] = await Promise.all([wikiPromise, allPromise]);

  const wiki: WikiSearchItem[] = ((wikiRes.data?.search_results as any[]) || []).map(
    (r: any) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      summary: r.summary,
      content: r.content,
      tags: r.tags,
      image_url: r.image_url,
      score: r.score ?? 0,
      match_type: r.match_type ?? 'fulltext',
    })
  );

  const allData = allRes.data as { results?: any[] } | null;
  const game_items: GameSearchItem[] = (allData?.results ?? []).map(
    (r: any) => ({
      source_type: r.source_type,
      id: r.id,
      name: r.name ?? '',
      description: r.description ?? '',
      slug: r.slug ?? '',
      tags: r.tags ?? null,
      collection_name: r.collection_name ?? null,
      collection_slug: r.collection_slug ?? null,
      raw_data: r.raw_data ?? null,
      rank: r.rank ?? 0,
      match_type: r.match_type ?? 'fulltext',
    })
  );

  return { wiki, collection: [], game_items };
}

export function formatSearchContext(result: SearchAllResult): string {
  const parts: string[] = [];

  if (result.wiki.length > 0) {
    parts.push('--- Artigos do Wiki ---');
    for (const r of result.wiki.slice(0, 3)) {
      const content = r.content
        ? r.content.replace(/<[^>]+>/g, '').slice(0, 1000)
        : '';
      parts.push(
        `Título: ${r.title}\nResumo: ${r.summary || ''}\n${
          content ? `Conteúdo: ${content}` : ''
        }`
      );
    }
  }

  if (result.game_items.length > 0) {
    parts.push('--- Itens do Jogo (Busca Avançada) ---');
    const seen = new Set<string>();
    for (const item of result.game_items.slice(0, 8)) {
      const key = `${item.source_type}:${item.id}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const raw = item.raw_data ?? {};
      const stats = Object.entries(raw)
        .filter(([k]) => !['id', 'name', 'description', 'created_at', 'updated_at'].includes(k))
        .filter(([, v]) => v !== null && v !== undefined)
        .map(([k, v]) => `  ${k}: ${v}`)
        .join('\n');

      parts.push(`Tipo: ${item.source_type}
Nome: ${item.name}
${item.collection_name ? `Coleção: ${item.collection_name}` : ''}
${item.description ? `Descrição: ${item.description}` : ''}
${stats ? `Atributos:\n${stats}` : ''}
`);
    }
  }

  return parts.join('\n\n');
}
