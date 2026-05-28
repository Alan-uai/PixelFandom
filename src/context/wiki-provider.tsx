'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '@/supabase';

export type WikiData = {
  tenant: Record<string, any> | null;
  articles: any[];
  article: Record<string, any> | null;
  search_results: any[];
};

type WikiDataContextType = {
  data: WikiData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

const WikiDataContext = createContext<WikiDataContextType>({
  data: null,
  loading: true,
  error: null,
  refetch: () => {},
});

const CACHE_KEY_PREFIX = 'wiki-data:';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedWiki(slug: string): WikiData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY_PREFIX + slug);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.data && parsed?.cachedAt && Date.now() - parsed.cachedAt < CACHE_TTL) {
      return parsed.data as WikiData;
    }
    localStorage.removeItem(CACHE_KEY_PREFIX + slug);
  } catch {}
  return null;
}

function setCachedWiki(slug: string, data: WikiData) {
  try {
    localStorage.setItem(CACHE_KEY_PREFIX + slug, JSON.stringify({
      data,
      cachedAt: Date.now(),
    }));
  } catch {}
}

export function WikiDataProvider({
  slug,
  children,
}: {
  slug: string;
  children: ReactNode;
}) {
  const [data, setData] = useState<WikiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!slug) return;

    const cached = getCachedWiki(slug);
    if (cached) {
      setData(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data: result, error: err } = await supabase.rpc('get_wiki', {
      p_slug: slug,
      p_article_slug: null,
      p_search: null,
    });

    if (err) {
      console.error('[WikiDataProvider] get_wiki RPC error:', err.message, err);
      setError(err.message);
      setData(null);
    } else {
      const wikiData = result as unknown as WikiData;
      setData(wikiData);
      setCachedWiki(slug, wikiData);
    }
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <WikiDataContext.Provider value={{ data, loading, error, refetch: fetchData }}>
      {children}
    </WikiDataContext.Provider>
  );
}

export function useWikiData() {
  const context = useContext(WikiDataContext);
  if (!context) {
    throw new Error('useWikiData must be used within a WikiDataProvider');
  }
  return context;
}
