'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/supabase';
import { Loader2, Home, FileText, ChevronDown, ChevronRight, MessageCircle } from 'lucide-react';

type SidebarArticle = {
  id: string;
  title: string;
  slug: string | null;
};

type Props = {
  tenantSlug: string;
  tenantId: string;
};

export default function WikiSidebar({ tenantSlug, tenantId }: Props) {
  const pathname = usePathname();
  const [articles, setArticles] = useState<SidebarArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!tenantId) return;
    supabase
      .from('wiki_articles')
      .select('id, title, slug')
      .eq('tenant_id', tenantId)
      .order('title')
      .then(({ data }) => {
        if (data) setArticles(data);
        setLoading(false);
      });
  }, [tenantId]);

  const currentSlug = pathname.replace(`/w/${tenantSlug}/`, '');

  return (
    <aside className="w-64 shrink-0 border-r bg-muted/30 flex flex-col h-[calc(100vh-3.5rem)] sticky top-14">
      <div className="p-4 border-b space-y-1">
        <Link
          href={`/w/${tenantSlug}`}
          className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            pathname === `/w/${tenantSlug}`
              ? 'bg-primary/10 text-primary'
              : 'hover:bg-muted'
          }`}
        >
          <Home className="h-4 w-4" />
          Home
        </Link>
        <Link
          href={`/w/${tenantSlug}/chat`}
          className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            pathname === `/w/${tenantSlug}/chat`
              ? 'bg-primary/10 text-primary'
              : 'hover:bg-muted'
          }`}
        >
          <MessageCircle className="h-4 w-4" />
          Assistente IA
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-1 w-full px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground"
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          Artigos
        </button>

        {!collapsed && (
          <nav className="space-y-0.5 mt-1">
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : articles.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted-foreground">
                Nenhum artigo ainda.
              </p>
            ) : (
              articles.map((article) => {
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
            )}
          </nav>
        )}
      </div>
    </aside>
  );
}
