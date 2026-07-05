'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef, useMemo } from 'react';
import { ArrowLeft, FileText, Calendar, Tag, LayoutList, LayoutGrid, Clock, BookOpen } from 'lucide-react';
import { WikiContent } from '@/components/wiki/wiki-content';
import CollectionItemView from '@/components/wiki/collection-item-view';
import GameTableListing from '@/components/wiki/game-table-listing';
import { parseViewerConfig } from '@/lib/viewer-config';
import WikiGrid from '@/components/wiki/wiki-grid';
import GameDataCards from '@/components/wiki/game-data-cards';
import { useWikiData } from '@/context/wiki-provider';
import { useWikiSearch } from '@/context/wiki-search-context';
import HubLink from '@/components/hub-link';
import { PageRenderer } from '@/components/page-builder/renderer/page-renderer';
import { MAIN_DOMAIN } from '@/lib/constants';
import { useWikiPath } from '@/hooks/use-wiki-path';
import { CommentsSection } from '@/components/comments/comments-section';

import { CardSymbols } from '@/components/wiki/card-symbols';
import { VoteButtons } from '@/components/wiki/vote-buttons';
import { FollowButton } from '@/components/wiki/follow-button';
import { useSlugResolution, useTableCatalog } from '@/hooks/use-data-access';
import type { CardPosition } from '@/components/page-builder/types';

export default function WikiPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params?.slug as string;
  const path = params?.path as string[] | undefined;
  const view = searchParams?.get('view');
  const articleSlug = path?.join('/') || null;
  const isGrid = view !== 'list';
  const { basePath, homePath, articlePath: wikiArticlePath } = useWikiPath(slug);
  const router = useRouter();

  const { data: wiki, loading } = useWikiData();

  const tenant = wiki?.tenant;
  const articles = wiki?.articles;
  const tenantTheme = (tenant?.theme as Record<string, unknown>) || {};
  const articlesPerRow = (tenantTheme.articles_per_row as number) || 3;
  const gameTablesDisplay = (tenantTheme.game_tables_display as Record<string, unknown>) || {};
  const gameTableListingDisplay = (tenantTheme.game_table_listing_display as Record<string, unknown>) || {};
  const widgetConfig = (tenantTheme.widgets as Record<string, unknown>) || {};
  const cardPositions = (widgetConfig.cardPositions as Record<string, unknown>) || {};
  const articleCardVotePos = (cardPositions.article_card as { vote?: CardPosition } | undefined)?.vote;
  const comparisonMode = ((widgetConfig.comparison as Record<string, unknown>)?.display_mode as string) || 'modal';
  const { searchQuery, setSearchQuery } = useWikiSearch();

  // Sync ?search= URL param to context on mount
  useEffect(() => {
    const urlSearch = searchParams?.get('search');
    if (urlSearch && !searchQuery) {
      setSearchQuery(urlSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fetch individual article by slug (not provided by WikiDataProvider)
  const [fetchedArticle, setFetchedArticle] = useState<any>(null);
  const [fetchingArticle, setFetchingArticle] = useState<boolean>(() => !!articleSlug);
  const [errorIsExternal, setErrorIsExternal] = useState(false);
  const [landingLayout, setLandingLayout] = useState<any>(null);
  const [loadingLayout, setLoadingLayout] = useState(false);
  const [custom404Layout, setCustom404Layout] = useState<any>(null);
  const layoutCache = useRef<Record<string, any>>({});
  const { data: slugResolved } = useSlugResolution(
    articleSlug && tenant?.id ? slug : null,
    articleSlug,
  );
  const { data: catalog } = useTableCatalog(articleSlug ? slug : null, true);

  const gameItemRedirect = useMemo(() => {
    if (articleSlug && articleSlug.includes('/') && catalog) {
      const parts = articleSlug.split('/');
      if (parts.length === 2 && catalog.some((t) => t.table_name === parts[0])) {
        return { tableName: parts[0], itemSlug: parts[1] };
      }
    }
    return null;
  }, [articleSlug, catalog]);

  useEffect(() => {
    if (gameItemRedirect) {
      router.replace(`${basePath}${gameItemRedirect.tableName}?item=${gameItemRedirect.itemSlug}`);
    }
  }, [gameItemRedirect, basePath, router]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      if (host !== MAIN_DOMAIN && host !== 'localhost' && host !== '127.0.0.1') {
        setErrorIsExternal(true);
      }
    }
  }, []);

  useEffect(() => {
    if (articleSlug || !tenant?.id) return;
    const key = tenant.id;
    if (layoutCache.current[key]) {
      const cached = layoutCache.current[key];
      if (cached.blocks?.length > 0) setLandingLayout({ blocks: cached.blocks });
      return;
    }
    setLoadingLayout(true);
    (async () => {
      try {
        const res = await fetch(`/api/tenants/${tenant.id}/page-layout`);
        const data = await res.json();
        layoutCache.current[key] = data;
        if (data?.blocks?.length > 0) {
          setLandingLayout({ blocks: data.blocks });
        }
      } catch {/* noop */}
      setLoadingLayout(false);
    })();
  }, [articleSlug, tenant?.id]);

  // Fetch 404 layout
  useEffect(() => {
    if (!tenant?.id) return;
    const key = `404-${tenant.id}`;
    if (layoutCache.current[key]) {
      const cached = layoutCache.current[key];
      if (cached.blocks?.length > 0) setCustom404Layout({ blocks: cached.blocks });
      return;
    }
    fetch(`/api/tenants/${tenant.id}/page-layout?type=404`)
      .then((r) => r.json())
      .then((data) => {
        layoutCache.current[key] = data;
        if (data?.blocks?.length > 0) setCustom404Layout({ blocks: data.blocks });
      })
      .catch(() => {});
  }, [tenant?.id]);

  // Slug resolution now uses useSlugResolution hook
  useEffect(() => {
    if (!articleSlug || !slugResolved) {
      setFetchingArticle(false);
      return;
    }
    if (slugResolved.table === 'wiki_articles') {
      setFetchedArticle(slugResolved.item);
    } else {
      setFetchedArticle({ ...slugResolved.item, _source_table: slugResolved.table });
    }
    setFetchingArticle(false);
  }, [articleSlug, slugResolved]);

  if (loading) {
    if (articleSlug) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      );
    }
    return <WikiPageSkeleton />;
  }

  if (!wiki || !tenant) {
    return (
      <div className="text-center py-20 rounded-xl border bg-card max-w-4xl mx-auto mt-10">
        <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Wiki não encontrada</h1>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Esta wiki não existe ou o link está incorreto.
        </p>
        <HubLink className="text-primary hover:underline text-sm font-medium" isExternal={errorIsExternal}>
          Voltar para o hub
        </HubLink>
      </div>
    );
  }

  // Home page: wait for layout before rendering
  if (!articleSlug && loadingLayout) {
    return <WikiPageSkeleton />;
  }

  // ── Game table listing ──
  if (articleSlug && !articleSlug.includes('/') && catalog?.some((t) => t.table_name === articleSlug)) {
    const tableEntry = catalog.find((t) => t.table_name === articleSlug);
    const tableDisplayFormat = tableEntry?.display_format || (gameTablesDisplay.default_format as string) || (gameTableListingDisplay.default_format as string) || 'grid';
    const tableColumnsCount = tableEntry?.columns_count || (gameTablesDisplay.default_columns as number) || (gameTableListingDisplay.default_columns as number) || 4;
    return (
      <GameTableListing
        tenantSlug={slug}
        tableName={articleSlug}
        tenantId={tenant.id}
        displayFormat={tableDisplayFormat}
        columnsCount={tableColumnsCount}
        viewerConfig={tableEntry?.viewer_config ? parseViewerConfig(tableEntry.viewer_config) : null}
      />
    );
  }

  // ── Game item view: redirected to listing with ?item= ──
  if (gameItemRedirect) {
    return null;
  }

  // ── Article view ──
  if (articleSlug) {
    const article = fetchedArticle;
    const isGameItem = article?._source_table;
    const fromWikiArticle = article && !isGameItem;

    // Detect if the article content is raw collection JSON (from seed data, not TipTap)
    const isRawJsonContent =
      fromWikiArticle && typeof article.content === 'string' &&
      (article.content.trim().startsWith('{"name"') ||
       article.content.trim().startsWith('{"code"') ||
       article.content.trim().startsWith('{"item_name"'));

    // Parse the raw JSON content from wiki_articles
    let collectionItemData: Record<string, any> | null = null;
    if (fromWikiArticle && isRawJsonContent) {
      try {
        const parsed = JSON.parse(article.content);
        if (parsed && typeof parsed === 'object' && !parsed.type) {
          collectionItemData = parsed;
        }
      } catch {
        // not JSON, proceed with normal rendering
      }
    }

    return (
      <article className="max-w-3xl mx-auto">
        <Link
          href={homePath}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Voltar para home
        </Link>

        {fetchingArticle ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-5 w-32 bg-muted rounded" />
            <div className="h-56 rounded-xl bg-muted" />
            <div className="h-7 w-2/3 bg-muted rounded" />
            <div className="h-4 w-full bg-muted rounded" />
            <div className="h-4 w-4/5 bg-muted rounded" />
            <div className="h-4 w-3/5 bg-muted rounded" />
          </div>
        ) : article ? (
          <>
            {isGameItem || collectionItemData ? (
              <CollectionItemView
                data={isGameItem ? article : collectionItemData!}
                tenantId={tenant.id}
                tenantSlug={slug}
                sourceTable={isGameItem ? article._source_table : undefined}
                comparisonMode={comparisonMode as 'modal' | 'page'}
                updatedAt={article.updated_at}
                createdAt={article.created_at}
                schema={undefined}
              />
            ) : (
              <>
                {article.image_url && (
                  <div className="rounded-xl overflow-hidden mb-8 border">
                    <Image
                      src={article.image_url}
                      alt={article.title}
                      width={800}
                      height={300}
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

                <div className="flex justify-end items-center gap-2 mb-4">
                  {tenant?.id && <FollowButton tenantId={tenant.id} />}
                  <VoteButtons
                    targetType="article"
                    targetId={article.id}
                  />
                </div>

                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <WikiContent content={article.content} />
                </div>

                <div className="mt-12 pt-8 border-t">
                  <CommentsSection
                    articleId={article.id}
                    tenantId={tenant.id}
                    tenantSlug={slug}
                  />
                </div>
              </>
            )}
          </>
        ) : custom404Layout ? (
          <PageRenderer layout={custom404Layout} tenant={tenant} basePath={basePath} />
        ) : (
          <div className="text-center py-20 rounded-xl border bg-card">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Página não encontrada</h1>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Esta página ainda não foi criada ou o link pode estar incorreto.
            </p>
            <Link
              href={homePath}
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

  const allArticles = articles || [];
  const displayArticles = searchQuery
    ? allArticles.filter((a: any) =>
        a.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.summary?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allArticles;

  if (!articleSlug && !loadingLayout) {
    return (
      <div className="max-w-4xl mx-auto">
        {/* Cover Image */}
        {(tenant as any).cover_image && (
          <div className="rounded-xl overflow-hidden mb-8 border">
            <Image
              src={(tenant as any).cover_image}
              alt=""
              width={1200}
              height={300}
              className="w-full h-48 md:h-64 lg:h-72 object-cover"
            />
          </div>
        )}

        {/* Hero */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-4">
            {tenant.logo_url && (
              <div className="h-14 w-14 rounded-xl overflow-hidden border shrink-0">
                <Image src={tenant.logo_url} alt="" fill className="object-cover" />
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
          <div className="mt-3">
            <FollowButton tenantId={tenant.id} />
          </div>
        </div>

        {landingLayout ? (
          <PageRenderer layout={landingLayout} tenant={tenant} basePath={basePath} />
        ) : (
          <>

            {!searchQuery && (
              <GameDataCards
                slug={slug}
                tenantId={tenant.id}
                displayFormat={gameTablesDisplay.default_format as string}
                columnsCount={gameTablesDisplay.default_columns as number}
                tabsEnabled={gameTablesDisplay.tabs_enabled as boolean}
                tabsSubFormat={gameTablesDisplay.tabs_sub_format as string}
              />
            )}

            {articles && articles.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    {searchQuery ? `Resultados (${displayArticles.length})` : 'Artigos Recentes'}
                  </h2>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <LayoutGrid className={`h-4 w-4 ${isGrid ? 'text-primary' : ''}`} />
                    <span className="mx-1">|</span>
                    <LayoutList className={`h-4 w-4 ${!isGrid ? 'text-primary' : ''}`} />
                  </div>
                </div>

                {displayArticles.length > 0 ? (
                  isGrid ? (
                    <WikiGrid articles={displayArticles} basePath={basePath} tenantSlug={slug} columns={articlesPerRow} votePosition={articleCardVotePos} />
                  ) : (
                    <div className="space-y-2">
                      {displayArticles.map((article: any) => (
                        <div key={article.id} className="relative pb-1">
                          <Link
                            href={wikiArticlePath(article.slug || article.id)}
                            className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 hover:border-primary/30 hover:bg-muted/50 transition-all group relative"
                          >
                            {article.image_url ? (
                              <Image src={article.image_url} alt="" width={32} height={32} className="h-8 w-8 rounded object-cover shrink-0" />
                            ) : (
                              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                            )}
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
                            <CardSymbols
                              targetType="article"
                              targetId={article.id}
                              votePosition={articleCardVotePos}
                            />
                          </Link>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <div className="text-center py-16 rounded-xl border bg-card">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h2 className="text-lg font-semibold mb-1">Nenhum resultado</h2>
                    <p className="text-sm text-muted-foreground">
                      Nenhum artigo encontrado para &ldquo;{searchQuery}&rdquo;
                    </p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    );
  }

  // Unreachable fallback (all landing/article/table cases handled above)
  return null;
}

function WikiPageSkeleton() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="rounded-xl overflow-hidden mb-8 border">
        <div className="h-48 md:h-64 lg:h-72 bg-muted animate-pulse" />
      </div>
      <div className="mb-10">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-14 w-14 rounded-xl bg-muted animate-pulse shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-7 w-48 bg-muted animate-pulse rounded" />
            <div className="h-4 w-72 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-12">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
      <div className="space-y-3">
        <div className="h-6 w-40 bg-muted animate-pulse rounded mb-5" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    </div>
  );
}
