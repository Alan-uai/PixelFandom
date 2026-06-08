'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2, Plus, Edit, Trash2, FileText,
  BookOpen,
} from 'lucide-react';
import DataTableContent from '@/components/editor/data-table-content';
import { translateGameTerm } from '@/lib/translate';
import { invalidateDataCache } from '@/lib/data-access';
import { TableIconDisplay } from '@/lib/table-icons';
import { TableIconPicker } from '@/components/ui/table-icon-picker';

interface Article {
  id: string;
  title: string;
  summary: string | null;
  tags: string[] | null;
  created_at: string;
}

interface TenantTable {
  table_name: string;
  display_label: string;
  parent_table: string | null;
  icon?: string | null;
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
  const [activeTab, setActiveTab] = useState('articles');
  const [catalog, setCatalog] = useState<TenantTable[]>([]);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createLabel, setCreateLabel] = useState('');
  const [createIcon, setCreateIcon] = useState('Database');
  const [creating, setCreating] = useState(false);

  const [renameTable, setRenameTable] = useState<string | null>(null);
  const [renameLabel, setRenameLabel] = useState('');
  const [renameIcon, setRenameIcon] = useState('Database');
  const [renaming, setRenaming] = useState(false);

  const [deleteTable, setDeleteTable] = useState<string | null>(null);
  const [deleteLabel, setDeleteLabel] = useState('');
  const [deletingTable, setDeletingTable] = useState(false);

  const articlesCache = useRef<Article[] | null>(null);
  const catalogCache = useRef<TenantTable[] | null>(null);

  const allTabs = [
    { key: 'articles', label: 'Artigos', iconNode: <BookOpen className="h-3.5 w-3.5 shrink-0" /> },
    ...catalog.map((t) => ({
      key: t.table_name,
      label: t.display_label,
      iconNode: <TableIconDisplay icon={t.icon || t.table_name} className="h-3.5 w-3.5 shrink-0" />,
    })),
  ];

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
      } else {
        const { data } = await supabase
          .from('wiki_articles')
          .select('id, title, summary, tags, created_at')
          .eq('tenant_id', tenant.id)
          .order('created_at', { ascending: false });

        if (data) {
          articlesCache.current = data;
          setArticles(data);
        }
      }

      if (catalogCache.current) {
        setCatalog(catalogCache.current);
      } else {
        const { data: cat } = await supabase
          .from('tenant_game_tables')
          .select('table_name, display_label, parent_table, icon')
          .eq('tenant_id', tenant.id)
          .order('created_at');

        if (cat && cat.length > 0) {
          catalogCache.current = cat;
          setCatalog(cat);
        }
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
      invalidateDataCache(slug);
      articlesCache.current = null;
      setArticles((prev) => prev.filter((a) => a.id !== id));
      toast({ title: 'Artigo excluído.' });
    }
    setDeleting(null);
  };

  const openCreateDialog = () => {
    setCreateName('');
    setCreateLabel('');
    setCreateIcon('Database');
    setShowCreateDialog(true);
  };

  const handleCreateTable = async () => {
    if (!tenantId) return;
    const rawName = createName.trim();
    if (!rawName) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Digite um nome para a tabela.' });
      return;
    }

    setCreating(true);

    const { translated, slug } = await translateGameTerm(rawName);
    const label = createLabel.trim() || rawName;

    const { data, error } = await supabase.rpc('ensure_game_table', {
      p_table: slug,
      p_tenant_id: tenantId,
      p_label: label,
      p_icon: createIcon,
    });

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      const result = data as { ok: boolean; error?: string; table: string };
      if (result.ok) {
        invalidateDataCache(slug);
        catalogCache.current = null;
        const { data: cat } = await supabase
          .from('tenant_game_tables')
          .select('table_name, display_label, parent_table, icon')
          .eq('tenant_id', tenantId)
          .order('created_at');
        if (cat) {
          catalogCache.current = cat;
          setCatalog(cat);
        }
        setShowCreateDialog(false);
        setActiveTab(slug);
        toast({ title: `Tabela "${label}" adicionada!` });
      } else {
        if (result.error?.includes('Você já tem esta tabela')) {
          toast({ title: 'Você já usa esta tabela.' });
        } else {
          toast({ variant: 'destructive', title: 'Erro', description: result.error });
        }
      }
    }
    setCreating(false);
  };

  const openRenameDialog = (tableName: string, currentLabel: string, currentIcon?: string) => {
    setRenameTable(tableName);
    setRenameLabel(currentLabel);
    setRenameIcon(currentIcon || 'Database');
  };

  const handleRename = async () => {
    if (!tenantId || !renameTable) return;
    if (!renameLabel.trim()) {
      toast({ variant: 'destructive', title: 'Erro', description: 'O nome de exibição não pode ficar vazio.' });
      return;
    }
    setRenaming(true);
    const { data, error } = await supabase.rpc('rename_tenant_table', {
      p_old_name: renameTable,
      p_new_name: renameTable,
      p_tenant_id: tenantId,
      p_new_label: renameLabel.trim(),
      p_new_icon: renameIcon,
    });
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      const result = data as { ok: boolean; error?: string };
      if (result.ok) {
        invalidateDataCache(slug);
        catalogCache.current = null;
        const { data: cat } = await supabase
          .from('tenant_game_tables')
          .select('table_name, display_label, parent_table, icon')
          .eq('tenant_id', tenantId)
          .order('created_at');
        if (cat) {
          catalogCache.current = cat;
          setCatalog(cat);
        }
        setRenameTable(null);
        toast({ title: 'Tabela atualizada!' });
      } else {
        toast({ variant: 'destructive', title: 'Erro', description: result.error });
      }
    }
    setRenaming(false);
  };

  const openDeleteDialog = (tableName: string, label: string) => {
    setDeleteTable(tableName);
    setDeleteLabel(label);
  };

  const handleDeleteTable = async () => {
    if (!tenantId || !deleteTable) return;
    setDeletingTable(true);
    const { data, error } = await supabase.rpc('remove_tenant_table', {
      p_table: deleteTable,
      p_tenant_id: tenantId,
    });
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      const result = data as { ok: boolean; error?: string; dropped_table?: boolean; dropped_columns?: string[] };
      if (result.ok) {
        invalidateDataCache(slug);
        catalogCache.current = null;
        const { data: cat } = await supabase
          .from('tenant_game_tables')
          .select('table_name, display_label, parent_table, icon')
          .eq('tenant_id', tenantId)
          .order('created_at');
        if (cat) {
          catalogCache.current = cat;
          setCatalog(cat);
        }
        if (activeTab === deleteTable) setActiveTab('articles');

        const msgs: string[] = [];
        if (result.dropped_table) msgs.push('Tabela removida permanentemente (ninguém mais usava).');
        if (result.dropped_columns && result.dropped_columns.length > 0) {
          msgs.push(`${result.dropped_columns.length} coluna(s) órfã(s) removida(s).`);
        }
        toast({ title: `Tabela "${deleteLabel}" removida.`, description: msgs.join(' ') });
        setDeleteTable(null);
      } else {
        toast({ variant: 'destructive', title: 'Erro', description: result.error || 'Falha ao remover tabela.' });
      }
    }
    setDeletingTable(false);
  };

  const catalogMap = new Map(catalog.map((t) => [t.table_name, t.display_label]));

  return (
    <div className="p-6">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div className="overflow-x-auto pb-2 -mx-6 px-6">
          <TabsList className="w-max min-w-full inline-flex">
            {allTabs.map(({ key, label, iconNode }) => (
              <TabsTrigger key={key} value={key} className="flex items-center gap-1.5 text-xs whitespace-nowrap">
                {iconNode}
                {label}
              </TabsTrigger>
            ))}
            <Button
              variant="ghost"
              size="icon"
              className="ml-1 shrink-0 h-8 w-8"
              onClick={openCreateDialog}
              title="Adicionar tabela"
            >
              <Plus className="h-4 w-4" />
            </Button>
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

        {allTabs.slice(1).map(({ key, label }) => {
          const tableInfo = catalog.find(t => t.table_name === key);
          return (
            <TabsContent key={key} value={key} className="mt-6">
              <DataTableContent
                slug={slug}
                table={key}
                displayLabel={label}
                parentTable={tableInfo?.parent_table ?? null}
                onRename={() => openRenameDialog(key, label, tableInfo?.icon || undefined)}
                onDelete={() => openDeleteDialog(key, label)}
              />
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Create Table Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Adicionar Tabela</DialogTitle>
            <DialogDescription>
              Digite o nome da tabela. O sistema traduz automaticamente para o formato interno.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nome da tabela</Label>
              <Input
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="ex: Armas de longo alcance"
              />
            </div>
            <div className="space-y-1">
              <Label>Nome de exibição (opcional)</Label>
              <Input
                value={createLabel}
                onChange={(e) => setCreateLabel(e.target.value)}
                placeholder="Igual ao nome digitado"
              />
            </div>
            <div className="space-y-1">
              <Label>Ícone</Label>
              <TableIconPicker value={createIcon} onChange={setCreateIcon} slug={slug} />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleCreateTable} disabled={creating || !createName.trim()}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Table Dialog (rename + icon) */}
      <Dialog open={!!renameTable} onOpenChange={(o) => !o && setRenameTable(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Editar Tabela</DialogTitle>
            <DialogDescription>
              Altere o nome de exibição e o ícone da tabela.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nome de exibição</Label>
              <Input
                value={renameLabel}
                onChange={(e) => setRenameLabel(e.target.value)}
                placeholder="Nome de exibição"
              />
            </div>
            <div className="space-y-1">
              <Label>Ícone</Label>
              <TableIconPicker value={renameIcon} onChange={setRenameIcon} slug={slug} />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleRename} disabled={renaming}>
              {renaming ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTable} onOpenChange={(o) => !o && setDeleteTable(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Tabela</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover a tabela <strong>{deleteLabel}</strong> da sua wiki?
              <br /><br />
              Seus dados nesta tabela serão excluídos permanentemente.
              Se outros tenants também usarem esta tabela, ela continuará existindo para eles.
              Se você for o único a usar, a tabela será removida do banco de dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTable}
              disabled={deletingTable}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingTable ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
