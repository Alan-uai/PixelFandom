'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/supabase';
import type { Tenant } from '@/supabase/client';
import HeroSection from '@/components/marketing/hero-section';
import NavStrip from '@/components/marketing/nav-strip';
import StatBar from '@/components/marketing/stat-bar';
import SearchSection from '@/components/marketing/search-section';
import WikisCarousel from '@/components/marketing/wikis-carousel';
import Footer from '@/components/marketing/footer';
import { useAuthDialog } from '@/context/auth-dialog-context';

export default function Home() {
  const { openAuth } = useAuthDialog();
  const [wikis, setWikis] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Tenant[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [voteData, setVoteData] = useState<Record<string, { upvotes: number; downvotes: number; score: number; user_vote: string | null }>>({});
  const [membersCount, setMembersCount] = useState(0);
  const [articlesCount, setArticlesCount] = useState(0);
  const cache = useRef<{ wikis?: Tenant[]; voteData?: any; membersCount?: number; articlesCount?: number }>({});

  useEffect(() => {
    if (cache.current.wikis) {
      setWikis(cache.current.wikis);
      setLoading(false);
      return;
    }
    supabase
      .from('tenants')
      .select('*')
      .eq('is_public', true)
      .order('name')
      .then(({ data, error: err }) => {
        if (err) {
          setError(err.message);
        } else if (data) {
          setWikis(data);
          cache.current.wikis = data;
          fetchVoteData(data.map((w) => w.id));
        }
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (cache.current.membersCount !== undefined) {
      setMembersCount(cache.current.membersCount);
      return;
    }
    supabase
      .from('tenant_members')
      .select('user_id', { count: 'exact', head: true })
      .then(({ count }) => {
        if (count !== null) {
          setMembersCount(count);
          cache.current.membersCount = count;
        }
      });
  }, []);

  useEffect(() => {
    if (cache.current.articlesCount !== undefined) {
      setArticlesCount(cache.current.articlesCount);
      return;
    }
    supabase
      .from('tenant_pages')
      .select('id', { count: 'exact', head: true })
      .then(({ count }) => {
        if (count !== null) {
          setArticlesCount(count);
          cache.current.articlesCount = count;
        }
      });
  }, []);

  const fetchVoteData = async (ids: string[]) => {
    if (ids.length === 0) return;
    const res = await fetch(`/api/tenants/vote/batch?ids=${ids.join(',')}`);
    if (res.ok) {
      const data = await res.json();
      cache.current.voteData = data;
      setVoteData(data);
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/wikis/search?q=${encodeURIComponent(searchQuery)}&limit=10`);
        if (res.ok) setSearchResults(await res.json());
      } catch {} finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection />
      <NavStrip onLogin={openAuth} />

      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.01] to-transparent pointer-events-none" />
        <SearchSection
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchResults={searchResults}
          searchLoading={searchLoading}
          categories={wikis.map((w) => ({ slug: w.slug, name: w.name }))}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
      </div>

      <WikisCarousel
        wikis={wikis}
        loading={loading}
        error={error}
        voteData={voteData}
        activeCategory={activeCategory}
      />

      <StatBar
        wikisCount={wikis.length}
        membersCount={membersCount}
        articlesCount={articlesCount}
      />

      <Footer />
    </div>
  );
}
