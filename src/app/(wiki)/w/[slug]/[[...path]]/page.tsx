import { supabase } from '@/supabase';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, FileText, Calendar, Tag, Search as SearchIcon, LayoutList, LayoutGrid, Clock, BookOpen } from 'lucide-react';
import { WikiContent } from '@/components/wiki/wiki-content';
import WikiGrid from '@/components/wiki/wiki-grid';

function formatCollectionData(data: Record<string, any>): string {
  const skipKeys = ['name', 'title', 'description', 'world_name', 'code', 'id', 'image', 'image_url'];
  const lines: string[] = [];

  if (data.description) {
    lines.push(data.description);
    lines.push('');
  }

  const fields = Object.entries(data).filter(
    ([key, val]) => !skipKeys.includes(key) && val != null && val !== ''
  );

  if (fields.length > 0) {
    lines.push('| Campo | Valor |');
    lines.push('|-------|-------|');
    for (const [key, val] of fields) {
      const display = typeof val === 'object' ? JSON.stringify(val) : String(val);
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      lines.push(`| ${label} | ${display} |`);
    }
  }

  return lines.join('\n');
}

type Props = {
  params: Promise<{ slug: string; path?: string[] }>;
  searchParams: Promise<{ search?: string; view?: string }>;
};

export default async function WikiPage({ params, searchParams }: Props) {
  const { slug, path } = await params;
  const { search, view } = await searchParams;
  const articleSlug = path?.join('/') || null;
  const isGrid = view !== 'list';

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name, slug, logo_url, description')
    .eq('slug', slug)
    .single();

  if (!tenant) notFound();

  // ── Search mode ──
  if (search) {
    const { data: results } = await supabase
      .from('wiki_articles')
      .select('id, title, slug, summary, content, tags, image_url, updated_at')
      .eq('tenant_id', tenant.id)
      .or(`title.ilike.%${search}%,summary.ilike.%${search}%,content.ilike.%${search}%`)
      .order('title')
      .limit(30);

    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <SearchIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">
              Resultados para &ldquo;{search}&rdquo;
            </h1>
            <p className="text-sm text-muted-foreground">
              {results?.length || 0} artigo{(results?.length || 0) !== 1 ? 's' : ''} encontrado{(results?.length || 0) !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {results && results.length > 0 ? (
          <div className="space-y-3">
            {results.map((article: any) => (
              <Link
                key={article.id}
                href={`/w/${slug}/${article.slug || article.id}`}
                className="group block rounded-xl border bg-card p-5 hover:border-primary/30 hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-4">
                  {article.image_url && (
                    <div className="hidden sm:block w-20 h-20 rounded-lg overflow-hidden shrink-0">
                      <img src={article.image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold group-hover:text-primary transition-colors">
                      {article.title}
                    </h2>
                    {article.summary && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {article.summary}
                      </p>
                    )}
                    {article.tags && article.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {article.tags.slice(0, 3).map((tag: string) => (
                          <span key={tag} className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 rounded-xl border bg-card">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-1">Nenhum resultado</h2>
            <p className="text-sm text-muted-foreground">
              Tente termos diferentes ou mais genéricos.
            </p>
          </div>
        )}

        <div className="mt-8">
          <Link
            href={`/w/${slug}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para home
          </Link>
        </div>
      </div>
    );
  }

  // ── Article view ──
  if (articleSlug) {
    let { data: article } = await supabase
      .from('wiki_articles')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('slug', articleSlug)
      .single();

    if (!article) {
      const { data: collections } = await supabase
        .from('custom_collections')
        .select('id')
        .eq('tenant_id', tenant.id);

      if (collections && collections.length > 0) {
        const { data: items } = await supabase
          .from('collection_items')
          .select('id, data, created_at, updated_at')
          .in('collection_id', collections.map((c: any) => c.id));

        if (items) {
          for (const item of items) {
            const itemData = item.data as Record<string, any>;
            const name = itemData?.name || itemData?.title || itemData?.world_name || itemData?.code || '';
            const itemSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            if (itemSlug === articleSlug) {
              article = {
                title: name,
                content: formatCollectionData(itemData),
                summary: itemData?.description || null,
                tags: null,
                image_url: null,
                updated_at: item.updated_at,
                id: item.id,
              } as any;
              break;
            }
          }
        }
      }
    }

    return (
      <article className="max-w-3xl mx-auto">
        <Link
          href={`/w/${slug}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Voltar para home
        </Link>

        {article ? (
          <>
            {article.image_url && (
              <div className="rounded-xl overflow-hidden mb-8 border">
                <img
                  src={article.image_url}
                  alt={article.title}
                  className="w-full max-h-72 object-cover"
                />
              </div>
            )}

            <header className="mb-8">
              <h1 className="text-3xl font-bold leading-tight mb-3">
                {article.title}
              </h1>

              {article.summary && (
                <p className="text-base text-muted-foreground leading-relaxed border-l-2 border-primary/40 pl-4">
                  {article.summary}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 text-sm text-muted-foreground">
                {article.updated_at && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Atualizado em {new Date(article.updated_at).toLocaleDateString('pt-BR')}
                  </span>
                )}
                {article.created_at && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(article.created_at).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>

              {article.tags && article.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {article.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                    >
                      <Tag className="h-3 w-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </header>

            <div className="prose prose-sm dark:prose-invert max-w-none">
              <WikiContent content={article.content} />
            </div>
          </>
        ) : (
          <div className="text-center py-20 rounded-xl border bg-card">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Página não encontrada</h1>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Esta página ainda não foi criada ou o link pode estar incorreto.
            </p>
            <Link
              href={`/w/${slug}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              Ver artigos disponíveis
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        )}
      </article>
    );
  }

  // ── Wiki home ──
  const { data: articles } = await supabase
    .from('wiki_articles')
    .select('id, title, slug, summary, tags, image_url, updated_at')
    .eq('tenant_id', tenant.id)
    .order('updated_at', { ascending: false })
    .limit(30);

  const recentArticles = articles?.slice(0, 6) || [];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero */}
      <div className="mb-10">
        <div className="flex items-center gap-4 mb-4">
          {tenant.logo_url && (
            <div className="h-14 w-14 rounded-xl overflow-hidden border shrink-0">
              <img src={tenant.logo_url} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{tenant.name}</h1>
            {tenant.description && (
              <p className="text-muted-foreground mt-1">{tenant.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BookOpen className="h-4 w-4" />
          <span>{articles?.length || 0} artigo{(articles?.length || 0) !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Articles */}
      {articles && articles.length > 0 ? (
        <>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Artigos Recentes
            </h2>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <LayoutGrid className={`h-4 w-4 ${isGrid ? 'text-primary' : ''}`} />
              <span className="mx-1">|</span>
              <LayoutList className={`h-4 w-4 ${!isGrid ? 'text-primary' : ''}`} />
            </div>
          </div>

          {isGrid ? (
            <WikiGrid articles={articles} tenantSlug={slug} />
          ) : (
            <div className="space-y-2">
              {articles.map((article: any) => (
                <Link
                  key={article.id}
                  href={`/w/${slug}/${article.slug || article.id}`}
                  className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 hover:border-primary/30 hover:bg-muted/50 transition-all group"
                >
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="flex-1 font-medium text-sm group-hover:text-primary transition-colors truncate">
                    {article.title}
                  </span>
                  {article.tags && article.tags.length > 0 && (
                    <span className="text-[11px] text-muted-foreground hidden sm:inline">
                      {article.tags[0]}
                    </span>
                  )}
                  {article.updated_at && (
                    <span className="text-[11px] text-muted-foreground hidden md:inline">
                      {new Date(article.updated_at).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20 rounded-xl border bg-card">
          <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Nenhum artigo ainda</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Esta wiki ainda não tem conteúdo publicado.
          </p>
        </div>
      )}
    </div>
  );
}
