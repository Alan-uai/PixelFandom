'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '@/supabase';

export type WikiData = {
  tenant: Record<string, any> | null;
  articles: any[];
  collections: any[];
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
    setLoading(true);
    setError(null);

    const { data: result, error: err } = await supabase.rpc('get_wiki', {
      p_slug: slug,
      p_article_slug: null,
      p_search: null,
    });

    if (err) {
      setError(err.message);
      setData(null);
    } else {
      setData(result as unknown as WikiData);
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
