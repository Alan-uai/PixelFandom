import { supabase } from '@/supabase';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, FileText, Calendar, Tags, Search as SearchIcon } from 'lucide-react';
import { WikiContent } from '@/components/wiki/wiki-content';

type Props = {
  params: Promise<{ slug: string; path?: string[] }>;
  searchParams: Promise<{ search?: string }>;
};

export default async function WikiPage({ params, searchParams }: Props) {
  const { slug, path } = await params;
  const { search } = await searchParams;
  const articleSlug = path?.join('/') || null;

  // Fetch tenant
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!tenant) notFound();

  // Search mode
  if (search) {
    const { data: results } = await supabase
      .from('wiki_articles')
      .select('*')
      .eq('tenant_id', tenant.id)
      .or(`title.ilike.%${search}%,summary.ilike.%${search}%,content.ilike.%${search}%`)
      .order('title')
      .limit(30);

    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <SearchIcon className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-bold">
            Resultados para &ldquo;{search}&rdquo;
          </h1>
        </div>

        {results && results.length > 0 ? (
          <div className="space-y-3">
            {results.map((article: any) => (
              <Link
                key={article.id}
                href={`/w/${slug}/${article.slug || article.id}`}
                className="block rounded-lg border p-4 hover:bg-muted/50 transition-colors"
              >
                <h2 className="font-medium">{article.title}</h2>
                {article.summary && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {article.summary}
                  </p>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border rounded-lg">
            <p className="text-muted-foreground">
              Nenhum resultado encontrado para &ldquo;{search}&rdquo;.
            </p>
          </div>
        )}

        <div className="mt-6">
          <Link
            href={`/w/${slug}`}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para home
          </Link>
        </div>
      </div>
    );
  }

  // Article view
  if (articleSlug) {
    const { data: article } = await supabase
      .from('wiki_articles')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('slug', articleSlug)
      .single();

    return (
      <article className="max-w-3xl mx-auto">
        <Link
          href={`/w/${slug}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para home
        </Link>

        {article ? (
          <>
            <h1 className="text-3xl font-bold mb-2">{article.title}</h1>

            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-6">
              {article.updated_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(article.updated_at).toLocaleDateString('pt-BR')}
                </span>
              )}
              {article.tags && article.tags.length > 0 && (
                <span className="flex items-center gap-1">
                  <Tags className="h-3.5 w-3.5" />
                  {article.tags.slice(0, 3).join(', ')}
                </span>
              )}
            </div>

            {article.image_url && (
              <img
                src={article.image_url}
                alt={article.title}
                className="w-full rounded-lg mb-6 max-h-64 object-cover"
              />
            )}

            {article.summary && (
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed border-l-2 border-primary/30 pl-4">
                {article.summary}
              </p>
            )}

            <WikiContent content={article.content} />

            {article.tags && article.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t">
                <Tags className="h-4 w-4 text-muted-foreground mt-0.5" />
                {article.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Página não encontrada</h1>
            <p className="text-muted-foreground mb-6">
              Esta página ainda não foi criada.
            </p>
          </div>
        )}
      </article>
    );
  }

  // Wiki home — show recent articles
  const { data: articles } = await supabase
    .from('wiki_articles')
    .select('*')
    .eq('tenant_id', tenant.id)
    .order('updated_at', { ascending: false })
    .limit(20);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{tenant.name}</h1>
        {tenant.description && (
          <p className="text-muted-foreground text-lg">{tenant.description}</p>
        )}
      </div>

      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <FileText className="h-5 w-5 text-primary" />
        Artigos Recentes
      </h2>

      {articles && articles.length > 0 ? (
        <div className="grid gap-4">
          {articles.map((article: any) => (
            <Link
              key={article.id}
              href={`/w/${slug}/${article.slug || article.id}`}
              className="block rounded-lg border p-5 hover:bg-muted/50 transition-colors"
            >
              <h3 className="font-medium text-lg">{article.title}</h3>
              {article.summary && (
                <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
                  {article.summary}
                </p>
              )}
              <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                {article.updated_at && (
                  <span>
                    {new Date(article.updated_at).toLocaleDateString('pt-BR')}
                  </span>
                )}
                {article.tags && article.tags.length > 0 && (
                  <span>{article.tags.slice(0, 2).join(', ')}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border rounded-lg">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            Esta wiki ainda não tem artigos.
          </p>
        </div>
      )}
    </div>
  );
}
