'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/supabase';
import { useCachedData } from '@/hooks/use-cached-data';
import { useSiteCache } from '@/lib/site-cache';
import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';
import { WeldingCard } from '@/components/ui/welding-card';
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
  BookOpen, Clock,
} from 'lucide-react';
import DataTableContent from '@/components/editor/data-table-content';
import TableViewerConfig from '@/components/editor/table-viewer-config';
import { translateGameTerm } from '@/lib/translate';
import { invalidateDataCache } from '@/lib/data-access';
import { TableIconDisplay } from '@/lib/table-icons';
import { TableIconPicker } from '@/components/ui/table-icon-picker';
import { Eye, Database } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  summary: string | null;
  tags: string[] | null;
  created_at: string;
  status?: string;
  scheduled_at?: string | null;
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

  const [viewerTab, setViewerTab] = useState<Record<string, 'dados' | 'visualizacao'>>({});

  const [showCreateArticleDialog, setShowCreateArticleDialog] = useState(false);
  const [createArticleTitle, setCreateArticleTitle] = useState('');
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [creatingArticle, setCreatingArticle] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: tenantData } = useCachedData<{ id: string }>(
    `tenant-id:${slug}`,
    async () => {
      const { data } = await supabase.from('tenants').select('id').eq('slug', slug).single();
      return data!;
    }
  );
  const editorTenantId = tenantData?.id ?? null;

  useEffect(() => {
    if (editorTenantId) setTenantId(editorTenantId);
  }, [editorTenantId]);

  const { data: cachedArticles, loading: articlesLoading } = useCachedData<Article[]>(
    editorTenantId ? `articles:${editorTenantId}` : null,
    async () => {
      const { data } = await supabase
        .from('wiki_articles')
        .select('id, title, summary, tags, created_at, status, scheduled_at')
        .eq('tenant_id', editorTenantId!)
        .order('created_at', { ascending: false });
      return data || [];
    }
  );
  const articlesCache = useRef<Article[] | null>(null);

  const { data: cachedCatalog, loading: catalogLoading } = useCachedData<TenantTable[]>(
    editorTenantId ? `catalog:${editorTenantId}` : null,
    async () => {
      const { data } = await supabase
        .from('tenant_game_tables')
        .select('table_name, display_label, parent_table, icon')
        .eq('tenant_id', editorTenantId!)
        .order('created_at');
      return data || [];
    }
  );
  const catalogCache = useRef<TenantTable[] | null>(null);

  const allTabs = [
    { key: 'articles', label: 'Artigos', iconNode: <BookOpen className="h-3.5 w-3.5 shrink-0" /> },
    ...catalog.map((t) => ({
      key: t.table_name,
      label: t.display_label,
      iconNode: <TableIconDisplay icon={t.icon || t.table_name} className="h-3.5 w-3.5 shrink-0" />,
    })),
  ];

  const searchParams = useSearchParams();
  const urlTab = searchParams.get('tab');

  useEffect(() => {
    if (urlTab) setActiveTab(urlTab);
  }, [urlTab]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.replace(`?tab=${value}`, { scroll: false });
  };

  useEffect(() => {
    if (cachedArticles) {
      articlesCache.current = cachedArticles;
      setArticles(cachedArticles);
    }
  }, [cachedArticles]);

  useEffect(() => {
    if (cachedCatalog) {
      catalogCache.current = cachedCatalog;
      setCatalog(cachedCatalog);
    }
  }, [cachedCatalog]);

  const loading = !editorTenantId || articlesLoading || catalogLoading;

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este artigo?')) return;
    setDeleting(id);
    const { error } = await supabase.from('wiki_articles').delete().eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      invalidateDataCache(slug);
      useSiteCache.getState().invalidate(`articles:${tenantId}`);
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

    const { slug } = await translateGameTerm(rawName);
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
        await supabase
          .from('tenant_game_tables')
          .update({
            viewer_config: {
              displayFormat: 'grid',
              columnsCount: 4,
              itemsPerPage: 20,
              enableSearch: true,
              enableFilters: true,
              showHeader: true,
              cardStyle: 'default',
              detailPanel: 'modal',
            },
          })
          .eq('tenant_id', tenantId)
          .eq('table_name', slug);
        invalidateDataCache(slug);
        useSiteCache.getState().invalidate(`catalog:${tenantId}`);
        const { data: cat } = await supabase
          .from('tenant_game_tables')
          .select('table_name, display_label, parent_table, icon')
          .eq('tenant_id', tenantId)
          .order('created_at');
        if (cat) setCatalog(cat);
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
        useSiteCache.getState().invalidate(`catalog:${tenantId}`);
        const { data: cat } = await supabase
          .from('tenant_game_tables')
          .select('table_name, display_label, parent_table, icon')
          .eq('tenant_id', tenantId)
          .order('created_at');
        if (cat) setCatalog(cat);
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
        useSiteCache.getState().invalidate(`catalog:${tenantId}`);
        const { data: cat } = await supabase
          .from('tenant_game_tables')
          .select('table_name, display_label, parent_table, icon')
          .eq('tenant_id', tenantId)
          .order('created_at');
        if (cat) setCatalog(cat);
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

  const filteredArticles = useMemo(() => {
    if (statusFilter === 'all') return articles;
    if (statusFilter === 'scheduled') {
      return articles.filter((a) => a.status === 'draft' && a.scheduled_at);
    }
    return articles.filter((a) => a.status === statusFilter);
  }, [articles, statusFilter]);

  // const catalogMap = new Map(catalog.map((t) => [t.table_name, t.display_label]));

  const handleCreateArticle = async () => {
    if (!tenantId) return;
    const title = createArticleTitle.trim();
    if (!title) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Digite um título para o artigo.' });
      return;
    }

    setCreatingArticle(true);

    const articleId = crypto.randomUUID();
    const articleSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const { data: { user } } = await supabase.auth.getUser();
    const now = new Date().toISOString();

    const isScheduled = scheduleEnabled && scheduledAt;

    const articleData: Record<string, unknown> = {
      id: articleId,
      title,
      slug: articleSlug,
      tenant_id: tenantId,
      created_at: now,
      updated_at: now,
      status: isScheduled ? 'draft' : 'published',
      created_by: user?.id ?? null,
    };

    if (isScheduled) {
      articleData.scheduled_at = new Date(scheduledAt).toISOString();
    }

    const { error } = await supabase.from('wiki_articles').insert(articleData);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
      setCreatingArticle(false);
      return;
    }

    if (isScheduled) {
      await supabase.from('scheduled_actions').insert({
        tenant_id: tenantId,
        target_type: 'article',
        target_id: articleId,
        action: 'publish',
        scheduled_at: new Date(scheduledAt).toISOString(),
        created_by: user?.id ?? null,
      });
    }

    invalidateDataCache(slug);
    useSiteCache.getState().invalidate(`articles:${tenantId}`);
    articlesCache.current = null;

    setShowCreateArticleDialog(false);
    setCreateArticleTitle('');
    setScheduleEnabled(false);
    setScheduledAt('');

    const { data: refreshed } = await supabase
      .from('wiki_articles')
      .select('id, title, summary, tags, created_at, status, scheduled_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    if (refreshed) setArticles(refreshed);

    toast({ title: isScheduled ? 'Artigo agendado!' : 'Artigo criado!' });
    router.push(`/dashboard/${slug}/editor/${articleId}`);

    setCreatingArticle(false);
  };

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
                <Button onClick={() => setShowCreateArticleDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Artigo
                </Button>
              </div>

              <div className="flex gap-2">
                {[
                  { key: 'all', label: 'Todos' },
                  { key: 'published', label: 'Publicados' },
                  { key: 'draft', label: 'Rascunhos' },
                  { key: 'scheduled', label: 'Agendados' },
                ].map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setStatusFilter(f.key)}
                    className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                      statusFilter === f.key
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {filteredArticles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">
                    {statusFilter === 'all'
                      ? 'Nenhum artigo ainda'
                      : statusFilter === 'published'
                        ? 'Nenhum artigo publicado'
                        : statusFilter === 'draft'
                          ? 'Nenhum rascunho'
                          : 'Nenhum artigo agendado'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {statusFilter === 'scheduled'
                      ? 'Artigos agendados aparecerão aqui.'
                      : 'Crie seu primeiro artigo para começar.'}
                  </p>
                  {statusFilter !== 'scheduled' && (
                    <Button
                      onClick={() => setShowCreateArticleDialog(true)}
                      className="mt-4"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Artigo
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredArticles.map((article) => (
                    <WeldingCard key={article.id}>
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
                              {article.status === 'draft' && article.scheduled_at ? (
                                <span className="flex items-center gap-1 text-[10px] text-amber-500 ml-auto">
                                  <Clock className="h-3 w-3" />
                                  {new Date(article.scheduled_at).toLocaleDateString('pt-BR')}
                                </span>
                              ) : (
                                <span className="text-[10px] text-muted-foreground ml-auto">
                                  {new Date(article.created_at).toLocaleDateString('pt-BR')}
                                </span>
                              )}
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
                    </WeldingCard>
                  ))}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {allTabs.slice(1).map(({ key, label }) => {
          const tableInfo = catalog.find(t => t.table_name === key);
          const subTab = viewerTab[key] || 'dados';
          return (
            <TabsContent key={key} value={key} className="mt-6">
              <div className="flex gap-1 border-b pb-1 mb-4 -mx-6 px-6 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setViewerTab((prev) => ({ ...prev, [key]: 'dados' }))}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    subTab === 'dados'
                      ? 'bg-primary/10 text-primary border border-primary/30'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent'
                  }`}
                >
                  <Database className="h-3.5 w-3.5" />
                  Dados
                </button>
                <button
                  type="button"
                  onClick={() => setViewerTab((prev) => ({ ...prev, [key]: 'visualizacao' }))}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    subTab === 'visualizacao'
                      ? 'bg-primary/10 text-primary border border-primary/30'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent'
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Visualização
                </button>
              </div>
              {subTab === 'dados' ? (
                <DataTableContent
                  slug={slug}
                  table={key}
                  displayLabel={label}
                  parentTable={tableInfo?.parent_table ?? null}
                  onRename={() => openRenameDialog(key, label, tableInfo?.icon || undefined)}
                  onDelete={() => openDeleteDialog(key, label)}
                />
              ) : (
                <TableViewerConfig
                  slug={slug}
                  table={key}
                  displayLabel={label}
                />
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Create Article Dialog */}
      <Dialog open={showCreateArticleDialog} onOpenChange={setShowCreateArticleDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Novo Artigo</DialogTitle>
            <DialogDescription>
              Crie um novo artigo para sua wiki. Você poderá editar o conteúdo depois.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Título do artigo</Label>
              <Input
                value={createArticleTitle}
                onChange={(e) => setCreateArticleTitle(e.target.value)}
                placeholder="Digite o título do artigo"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateArticle();
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Agendar publicação</Label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="schedule-toggle"
                  checked={scheduleEnabled}
                  onChange={(e) => setScheduleEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="schedule-toggle" className="text-sm font-normal">
                  Agendar para data futura
                </Label>
              </div>
              {scheduleEnabled && (
                <Input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="mt-1"
                  min={new Date().toISOString().slice(0, 16)}
                />
              )}
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleCreateArticle} disabled={creatingArticle || !createArticleTitle.trim()}>
              {creatingArticle ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Clock className="h-4 w-4 mr-2" />
              )}
              {scheduleEnabled && scheduledAt ? 'Agendar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
