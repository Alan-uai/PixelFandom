import { supabase } from '@/supabase';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

type Props = {
  params: Promise<{ slug: string; path?: string[] }>;
};

export default async function WikiPage({ params }: Props) {
  const { slug, path } = await params;
  const articleSlug = path?.join('/') || null;

  // Fetch tenant
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!tenant) notFound();

  // If article path provided, fetch article
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
            <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
            {article.summary && (
              <p className="text-muted-foreground mb-6">{article.summary}</p>
            )}
            <div className="prose prose-invert max-w-none">
              {article.content ? (
                <div dangerouslySetInnerHTML={{ __html: article.content }} />
              ) : (
                <p className="text-muted-foreground">Esta página ainda não tem conteúdo.</p>
              )}
            </div>
            {article.tags && article.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-8">
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
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-2">Página não encontrada</h1>
            <p className="text-muted-foreground">
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
          <p className="text-muted-foreground">{tenant.description}</p>
        )}
      </div>

      <h2 className="text-xl font-semibold mb-4">Artigos Recentes</h2>
      {articles && articles.length > 0 ? (
        <div className="grid gap-4">
          {articles.map((article: any) => (
            <Link
              key={article.id}
              href={`/w/${slug}/${article.slug || article.id}`}
              className="block rounded-lg border p-4 hover:bg-muted/50 transition-colors"
            >
              <h3 className="font-medium">{article.title}</h3>
              {article.summary && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {article.summary}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <span>{new Date(article.updated_at).toLocaleDateString('pt-BR')}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground">
            Esta wiki ainda não tem artigos.
          </p>
        </div>
      )}
    </div>
  );
}
