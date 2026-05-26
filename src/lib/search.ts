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

export interface CollectionSearchItem {
  id: string;
  collection_id: string;
  collection_name: string;
  collection_slug: string;
  name: string | null;
  description: string | null;
  data: Record<string, unknown>;
  score: number;
  match_type: 'semantic' | 'fulltext';
}

export interface SearchAllResult {
  wiki: WikiSearchItem[];
  collection: CollectionSearchItem[];
}

export async function searchAll(
  slug: string,
  query: string,
  options?: { signal?: AbortSignal; limit?: number }
): Promise<SearchAllResult> {
  const limit = options?.limit ?? 5;

  const embedding = await generateEmbedding(query, options?.signal);
  const embStr = `[${embedding.join(',')}]`;

  const { supabase } = await import('@/supabase');

  const [wikiRes, collectionRes] = await Promise.all([
    supabase.rpc('get_wiki_data', {
      p_slug: slug,
      p_search: query,
      p_embedding: embStr,
    }),
    supabase.rpc('search_collection_items', {
      p_tenant_slug: slug,
      p_embedding: embStr,
      p_search: query,
      p_limit: limit,
    }),
  ]);

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

  const collection: CollectionSearchItem[] = ((collectionRes.data || []) as any[]).map(
    (r: any) => ({
      id: r.id,
      collection_id: r.collection_id,
      collection_name: r.collection_name,
      collection_slug: r.collection_slug,
      name: r.name,
      description: r.description,
      data: r.data ?? {},
      score: r.score ?? 0,
      match_type: r.match_type ?? 'fulltext',
    })
  );

  return { wiki, collection };
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

  if (result.collection.length > 0) {
    parts.push('--- Itens do Jogo ---');
    for (const item of result.collection.slice(0, 5)) {
      const data = item.data ?? {};
      const stats = Object.entries(data)
        .filter(([k]) => !['name', 'description'].includes(k))
        .map(([k, v]) => `  ${k}: ${v}`)
        .join('\n');
      parts.push(`Item: ${item.name || 'Sem nome'}
Coleção: ${item.collection_name || ''}
Descrição: ${item.description || ''}
${stats ? `Stats:\n${stats}` : ''}`);
    }
  }

  return parts.join('\n\n');
}
