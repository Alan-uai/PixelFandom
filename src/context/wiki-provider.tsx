'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
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

const CACHE_TTL = 30_000;

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
  const cacheRef = useRef<{ slug: string; data: WikiData; timestamp: number } | null>(null);
  const fetchGenerationRef = useRef(0);
  const slugRef = useRef(slug);

  useEffect(() => {
    slugRef.current = slug;
  }, [slug]);

  const doFetch = useCallback(async (isBackground = false) => {
    const currentSlug = slugRef.current;
    if (!currentSlug) {
      if (!isBackground) {
        setLoading(false);
        setData(null);
      }
      return undefined;
    }

    fetchGenerationRef.current += 1;
    const gen = fetchGenerationRef.current;

    if (!isBackground) setLoading(true);
    if (!isBackground) setError(null);

    let lastError: string | null = null;
    for (let attempt = 0; attempt <= 2; attempt++) {
      const { data: result, error: err } = await supabase.rpc('get_wiki', {
        p_slug: currentSlug,
        p_article_slug: null,
        p_search: null,
      });

      if (err) {
        lastError = err.message;
        if (err.message?.includes('Failed to fetch') && attempt < 2) {
          await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
          continue;
        }
        break;
      }

      if (gen === fetchGenerationRef.current) {
        const wikiData = result as unknown as WikiData;
        cacheRef.current = { slug: currentSlug, data: wikiData, timestamp: Date.now() };
        setData(wikiData);
        if (!isBackground) setLoading(false);
        return wikiData;
      }
      return undefined;
    }

    if (gen === fetchGenerationRef.current) {
      console.error('[WikiDataProvider] get_wiki RPC error:', lastError);
      if (!isBackground) {
        setError(lastError || 'Falha ao carregar dados');
        setData(null);
        setLoading(false);
      }
    }
    return undefined;
  }, []);

  const fetchData = useCallback(async () => {
    const cached = cacheRef.current;
    if (cached && cached.slug === slugRef.current) {
      setData(cached.data);
      setLoading(false);
      if (Date.now() - cached.timestamp > CACHE_TTL) {
        doFetch(true);
      }
      return;
    }
    doFetch();
  }, [doFetch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    cacheRef.current = null;
    doFetch();
  }, [doFetch]);

  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        cacheRef.current = null;
        doFetch();
      }
    };
    window.addEventListener('pageshow', onPageShow);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        const cached = cacheRef.current;
        if (cached && Date.now() - cached.timestamp > CACHE_TTL) {
          doFetch(true);
        }
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    const onStorage = (e: StorageEvent) => {
      if (e.key?.includes('pixelfandom:site-cache')) {
        cacheRef.current = null;
        doFetch();
      }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('pageshow', onPageShow);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('storage', onStorage);
    };
  }, [doFetch]);

  return (
    <WikiDataContext.Provider value={{ data, loading, error, refetch }}>
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
