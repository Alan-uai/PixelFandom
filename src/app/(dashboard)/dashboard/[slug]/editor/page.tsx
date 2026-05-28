'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Edit, Trash2, FileText } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  summary: string | null;
  tags: string[] | null;
  created_at: string;
}

export default function EditorArticlesPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { toast } = useToast();

  const [tenantId, setTenantId] = useState<string | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', slug)
        .single();
      if (!tenant) {
        setLoading(false);
        return;
      }
      setTenantId(tenant.id);

      const { data } = await supabase
        .from('wiki_articles')
        .select('id, title, summary, tags, created_at')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false });

      if (data) setArticles(data);
      setLoading(false);
    })();
  }, [slug]);

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este artigo?')) return;
    setDeleting(id);
    const { error } = await supabase.from('wiki_articles').delete().eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      setArticles((prev) => prev.filter((a) => a.id !== id));
      toast({ title: 'Artigo excluído.' });
    }
    setDeleting(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Artigos</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Gerencie os artigos da sua wiki.
          </p>
        </div>
        <Button onClick={() => router.push(`/dashboard/${slug}/editor/new`)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Artigo
        </Button>
      </div>

      {articles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Nenhum artigo ainda</p>
          <p className="text-sm text-muted-foreground mt-1">
            Crie seu primeiro artigo para começar.
          </p>
          <Button
            onClick={() => router.push(`/dashboard/${slug}/editor/new`)}
            className="mt-4"
          >
            <Plus className="h-4 w-4 mr-2" />
            Criar Artigo
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => (
            <Card key={article.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{article.title}</p>
                    {article.summary && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {article.summary}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      {article.tags && article.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {article.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                            >
                              {tag}
                            </span>
                          ))}
                          {article.tags.length > 3 && (
                            <span className="text-[10px] text-muted-foreground">
                              +{article.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        {new Date(article.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => router.push(`/dashboard/${slug}/editor/${article.id}`)}
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(article.id)}
                      disabled={deleting === article.id}
                      title="Excluir"
                    >
                      {deleting === article.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
