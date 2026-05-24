import { supabase } from '@/supabase';

export async function getWikiData(slug: string, search?: string) {
  let embedding: number[] | null = null;

  if (search) {
    try {
      const res = await fetch('/api/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: search.slice(0, 2000) }),
      });
      const data = await res.json();
      embedding = data.embedding;
    } catch {
      // fallback to text search
    }
  }

  const { data, error } = await supabase.rpc('get_wiki_data', {
    p_slug: slug,
    p_search: search || null,
    p_embedding: embedding ? `[${embedding.join(',')}]` : null,
  });

  if (error) throw error;
  return data as {
    tenant: any;
    articles: any[];
    search_results: any[];
  } | null;
}

export async function updateArticleEmbedding(articleId: string, tenantId: string, content: string) {
  try {
    await fetch('/api/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: content.slice(0, 8000), articleId, tenantId }),
    });
  } catch {
    // non-critical
  }
}

export async function updateCollectionItemEmbedding(itemId: string, text: string) {
  try {
    await fetch('/api/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.slice(0, 8000), collectionItemId: itemId }),
    });
  } catch {
    // non-critical
  }
}
