'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/supabase';
import {
  Loader2, FileText, ChevronDown, ChevronRight,
  Search, Grid3X3, List,
  X, Hash, BookOpen, PanelLeft
} from 'lucide-react';

type SidebarArticle = {
  id: string;
  title: string;
  slug: string | null;
  tags: string[] | null;
};

type Props = {
  tenantSlug: string;
  tenantId: string;
  collapsed?: boolean;
  onToggle?: () => void;
};

export default function WikiSidebar({ tenantSlug, tenantId, collapsed, onToggle }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [articles, setArticles] = useState<SidebarArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [articleCollapsed, setArticleCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const currentView = searchParams.get('view') || 'grid';

  useEffect(() => {
    if (!tenantId) return;
    supabase
      .from('wiki_articles')
      .select('id, title, slug, tags')
      .eq('tenant_id', tenantId)
      .order('title')
      .then(({ data }) => {
        if (data) setArticles(data);
        setLoading(false);
      });
  }, [tenantId]);

  const currentSlug = useMemo(() => {
    const base = `/w/${tenantSlug}/`;
    if (!pathname.startsWith(base)) return '';
    return pathname.slice(base.length);
  }, [pathname, tenantSlug]);

  const categories = useMemo(() => {
    const map = new Map<string, SidebarArticle[]>();
    for (const a of articles) {
      const cat = a.tags?.[0] || 'Geral';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(a);
    }
    return map;
  }, [articles]);

  const filteredArticles = useMemo(() => {
    if (!searchQuery) return articles;
    const q = searchQuery.toLowerCase();
    return articles.filter((a) =>
      a.title.toLowerCase().includes(q)
    );
  }, [articles, searchQuery]);

  const toggleView = useCallback(() => {
    const next = currentView === 'grid' ? 'list' : 'grid';
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', next);
    router.push(`${pathname}?${params.toString()}`);
  }, [currentView, searchParams, pathname, router]);

  if (collapsed) {
    return (
      <aside className="w-12 shrink-0 border-r bg-muted/30 flex flex-col items-center py-3 gap-3 h-[calc(100vh-3.5rem)] sticky top-14">
        <button
          onClick={onToggle}
          className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Expandir sidebar"
        >
          <PanelLeft className="h-4 w-4" />
        </button>
        <div className="flex-1" />
      </aside>
    );
  }

  const isHome = pathname === `/w/${tenantSlug}`;

  return (
    <aside className="w-64 shrink-0 border-r bg-muted/30 flex flex-col h-[calc(100vh-3.5rem)] sticky top-14 transition-all duration-200">
      {/* Toggle */}
      <div className="flex items-center justify-between px-3 pt-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
          Navegação
        </span>
        {onToggle && (
          <button
            onClick={onToggle}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Recolher sidebar"
          >
            <PanelLeft className="h-3.5 w-3.5 rotate-180" />
          </button>
        )}
      </div>

      {/* Search */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filtrar artigos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border bg-background pl-8 pr-3 py-1.5 text-xs outline-none focus:border-primary transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Articles section */}
      <div className="flex-1 overflow-y-auto px-2 py-1">
        <button
          onClick={() => setArticleCollapsed(!articleCollapsed)}
          className="flex items-center gap-1 w-full px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground"
        >
          {articleCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          <BookOpen className="h-3 w-3" />
          Artigos
          <span className="ml-auto text-[10px] text-muted-foreground/60">
            {articles.length}
          </span>
        </button>

        {!articleCollapsed && (
          <nav className="space-y-0.5 mt-1">
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : searchQuery ? (
              filteredArticles.length === 0 ? (
                <p className="px-3 py-2 text-xs text-muted-foreground">
                  Nenhum artigo encontrado.
                </p>
              ) : (
                filteredArticles.map((article) => {
                  const articlePath = article.slug || article.id;
                  const isActive = currentSlug === articlePath;
                  return (
                    <Link
                      key={article.id}
                      href={`/w/${tenantSlug}/${articlePath}`}
                      className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors ${
                        isActive
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      <FileText className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{article.title}</span>
                    </Link>
                  );
                })
              )
            ) : (
              Array.from(categories.entries()).map(([category, catArticles]) => {
                const isCategoryActive = activeCategory === category;
                const hasActive = catArticles.some(
                  (a) => currentSlug === (a.slug || a.id)
                );

                return (
                  <div key={category}>
                    <button
                      onClick={() =>
                        setActiveCategory(isCategoryActive ? null : category)
                      }
                      className={`flex items-center gap-1.5 w-full rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                        hasActive
                          ? 'text-primary'
                          : 'text-muted-foreground/70 hover:text-foreground'
                      }`}
                    >
                      <Hash className="h-3 w-3" />
                      <span className="truncate">{category}</span>
                      <span className="ml-auto text-[10px] text-muted-foreground/50">
                        {catArticles.length}
                      </span>
                      {isCategoryActive ? (
                        <ChevronDown className="h-3 w-3 shrink-0" />
                      ) : (
                        <ChevronRight className="h-3 w-3 shrink-0" />
                      )}
                    </button>

                    {isCategoryActive && (
                      <div className="ml-2 space-y-0.5">
                        {catArticles.map((article) => {
                          const articlePath = article.slug || article.id;
                          const isActive = currentSlug === articlePath;
                          return (
                            <Link
                              key={article.id}
                              href={`/w/${tenantSlug}/${articlePath}`}
                              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors ${
                                isActive
                                  ? 'bg-primary/10 text-primary font-medium'
                                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                              }`}
                            >
                              <FileText className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{article.title}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </nav>
        )}
      </div>

      {/* View toggle */}
      <div className="p-3 border-t">
        <button
          onClick={toggleView}
          className="flex items-center gap-2 w-full rounded-md px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title={currentView === 'grid' ? 'Visualizar como lista' : 'Visualizar como grid'}
        >
          {currentView === 'grid' ? (
            <>
              <List className="h-3.5 w-3.5" />
              Ver como Lista
            </>
          ) : (
            <>
              <Grid3X3 className="h-3.5 w-3.5" />
              Ver como Grid
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
