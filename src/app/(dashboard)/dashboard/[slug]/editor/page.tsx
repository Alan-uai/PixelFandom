'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2, Plus, Edit, Trash2, FileText,
  BookOpen, Crosshair, Shield, Circle, Droplets,
  ArrowUp, Bug, Star, Hash, FlaskConical, Package, Settings,
} from 'lucide-react';
import DataTableContent from '@/components/editor/data-table-content';

interface Article {
  id: string;
  title: string;
  summary: string | null;
  tags: string[] | null;
  created_at: string;
}

const editorTabs = [
  { key: 'articles', label: 'Artigos', Icon: BookOpen },
  { key: 'weapons', label: 'Armas', Icon: Crosshair },
  { key: 'armors', label: 'Armaduras', Icon: Shield },
  { key: 'rings', label: 'Anéis', Icon: Circle },
  { key: 'potions', label: 'Poções', Icon: Droplets },
  { key: 'upgrades', label: 'Upgrades', Icon: ArrowUp },
  { key: 'enemies', label: 'Inimigos', Icon: Bug },
  { key: 'bosses', label: 'Bosses', Icon: Star },
  { key: 'codes', label: 'Códigos', Icon: Hash },
  { key: 'crafting_recipes', label: 'Receitas', Icon: FlaskConical },
  { key: 'resources', label: 'Recursos', Icon: Package },
  { key: 'game_config', label: 'Config', Icon: Settings },
];

export default function EditorArticlesPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { toast } = useToast();

  const [tenantId, setTenantId] = useState<string | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('articles');

  const articlesCache = useRef<Article[] | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('editor-active-tab');
      if (stored) setActiveTab(stored);
    } catch {}
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    try {
      localStorage.setItem('editor-active-tab', value);
    } catch {}
  };

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

      if (articlesCache.current) {
        setArticles(articlesCache.current);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('wiki_articles')
        .select('id, title, summary, tags, created_at')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false });

      if (data) {
        articlesCache.current = data;
        setArticles(data);
      }
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
      articlesCache.current = null;
      setArticles((prev) => prev.filter((a) => a.id !== id));
      toast({ title: 'Artigo excluído.' });
    }
    setDeleting(null);
  };

  return (
    <div className="p-6">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div className="overflow-x-auto pb-2 -mx-6 px-6">
          <TabsList className="w-max min-w-full inline-flex">
            {editorTabs.map(({ key, label, Icon }) => (
              <TabsTrigger key={key} value={key} className="flex items-center gap-1.5 text-xs whitespace-nowrap">
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="articles" className="mt-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
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
          )}
        </TabsContent>

        {editorTabs.slice(1).map(({ key }) => (
          <TabsContent key={key} value={key} className="mt-6">
            <DataTableContent slug={slug} table={key} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
