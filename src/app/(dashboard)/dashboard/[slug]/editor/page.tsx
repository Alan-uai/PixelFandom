'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { supabase } from '@/supabase';
import { useTableCatalog } from '@/hooks/use-data-access';
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
  BookOpen, Clock, Eye, Database, Minus,
} from 'lucide-react';
import DataTableContent from '@/components/editor/data-table-content';
import TableViewerConfig from '@/components/editor/table-viewer-config';
import { translateGameTerm } from '@/lib/translate';
import { invalidateDataCache } from '@/lib/data-access';
import { TableIconDisplay } from '@/lib/table-icons';
import { TableIconPicker } from '@/components/ui/table-icon-picker';
import { renderMarkdown } from '@/lib/content-utils';

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
  const t = useTranslations('editor');
  const tc = useTranslations('common');

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
  const [availableCreateTables, setAvailableCreateTables] = useState<string[]>([]);
  const [loadingCreateTables, setLoadingCreateTables] = useState(false);

  const [renameTable, setRenameTable] = useState<string | null>(null);
  const [renameLabel, setRenameLabel] = useState('');
  const [renameIcon, setRenameIcon] = useState('Database');
  const [renaming, setRenaming] = useState(false);

  const [deleteTable, setDeleteTable] = useState<string | null>(null);
  const [deleteLabel, setDeleteLabel] = useState('');
  const [deletingTable, setDeletingTable] = useState(false);

  const [viewerTab, setViewerTab] = useState<Record<string, 'dados' | 'exibicao'>>({});

  const [showCreateArticleDialog, setShowCreateArticleDialog] = useState(false);
  const [createArticleTitle, setCreateArticleTitle] = useState('');
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [creatingArticle, setCreatingArticle] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    supabase.from('tenants').select('id').eq('slug', slug).single().then(({ data }) => {
      if (data) setTenantId(data.id);
    });
  }, [slug]);

  useEffect(() => {
    if (!tenantId) return;
    supabase
      .from('wiki_articles')
      .select('id, title, summary, tags, created_at, status, scheduled_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setArticles(data as Article[]);
      });
  }, [tenantId]);

  const { data: catalogData, loading: catalogLoading } = useTableCatalog(slug);

  const allTabs = [
    { key: 'articles', label: t('tabs.articles'), iconNode: <BookOpen className="h-3.5 w-3.5 shrink-0" /> },
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
    if (catalogData) {
      setCatalog(catalogData as TenantTable[]);
    }
  }, [catalogData]);

  const loading = !tenantId || catalogLoading;

  const handleDelete = async (id: string) => {
    if (!confirm(t('delete.confirm_message'))) return;
    setDeleting(id);
    const { error } = await supabase.from('wiki_articles').delete().eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: tc('error'), description: error.message });
    } else {
      invalidateDataCache(slug);
      setArticles((prev) => prev.filter((a) => a.id !== id));
      toast({ title: t('toast.article_deleted') });
    }
    setDeleting(null);
  };

  const openCreateDialog = () => {
    setCreateName('');
    setCreateLabel('');
    setCreateIcon('Database');
    setShowCreateDialog(true);
    setLoadingCreateTables(true);
    supabase.from('tenant_game_tables').select('table_name').then(({ data }) => {
      if (data) {
        setAvailableCreateTables([...new Set(data.map((r: any) => r.table_name))]);
      }
      setLoadingCreateTables(false);
    });
  };

  const handleCreateTable = async () => {
    if (!tenantId) return;
    const rawName = createName.trim();
    if (!rawName) {
      toast({ variant: 'destructive', title: tc('error'), description: t('toast.enter_table_name') });
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
      toast({ variant: 'destructive', title: tc('error'), description: error.message });
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
        setShowCreateDialog(false);
        setActiveTab(slug);
        toast({ title: t('toast.table_added', { label }) });
      } else {
        if (result.error?.includes('Você já tem esta tabela')) {
          toast({ title: t('toast.table_already_exists') });
        } else {
          toast({ variant: 'destructive', title: tc('error'), description: result.error });
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
      toast({ variant: 'destructive', title: tc('error'), description: t('toast.display_name_empty') });
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
      toast({ variant: 'destructive', title: tc('error'), description: error.message });
    } else {
      const result = data as { ok: boolean; error?: string };
      if (result.ok) {
        invalidateDataCache(slug);
        setRenameTable(null);
        toast({ title: t('toast.table_updated') });
      } else {
        toast({ variant: 'destructive', title: tc('error'), description: result.error });
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
      toast({ variant: 'destructive', title: tc('error'), description: error.message });
    } else {
      const result = data as { ok: boolean; error?: string; dropped_table?: boolean; dropped_columns?: string[] };
      if (result.ok) {
        invalidateDataCache(slug);
        if (activeTab === deleteTable) setActiveTab('articles');

        const msgs: string[] = [];
        if (result.dropped_table) msgs.push(t('toast.table_removed_permanent'));
        if (result.dropped_columns && result.dropped_columns.length > 0) {
          msgs.push(t('toast.orphan_columns_removed', { count: result.dropped_columns.length }));
        }
        toast({ title: t('toast.table_removed', { label: deleteLabel }), description: msgs.join(' ') });
        setDeleteTable(null);
      } else {
        toast({ variant: 'destructive', title: tc('error'), description: result.error || t('toast.failed_to_remove') });
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

  const handleCreateArticle = async () => {
    if (!tenantId) return;
    const title = createArticleTitle.trim();
    if (!title) {
      toast({ variant: 'destructive', title: tc('error'), description: t('toast.enter_article_title') });
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
      toast({ variant: 'destructive', title: tc('error'), description: error.message });
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

    toast({ title: isScheduled ? t('toast.article_scheduled') : t('toast.article_created') });
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
              title={t('tabs.add_table')}
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
                  <h1 className="text-2xl font-bold">{t('articles_section.title')}</h1>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {t('articles_section.description')}
                  </p>
                </div>
                <Button onClick={() => setShowCreateArticleDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('articles_section.new_article')}
                </Button>
              </div>

              <div className="flex gap-2">
                {[
                  { key: 'all', label: t('filters.all') },
                  { key: 'published', label: t('filters.published') },
                  { key: 'draft', label: t('filters.draft') },
                  { key: 'scheduled', label: t('filters.scheduled') },
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
                      ? t('empty.no_articles')
                      : statusFilter === 'published'
                        ? t('empty.no_published')
                        : statusFilter === 'draft'
                          ? t('empty.no_drafts')
                          : t('empty.no_scheduled')}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {statusFilter === 'scheduled'
                      ? t('empty.scheduled_will_appear')
                      : t('empty.create_first')}
                  </p>
                  {statusFilter !== 'scheduled' && (
                    <Button
                      onClick={() => setShowCreateArticleDialog(true)}
                      className="mt-4"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {t('empty.create_article')}
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
                              <p
                                className="text-sm text-muted-foreground mt-1 line-clamp-2 [&_*]:inline [&_br]:hidden"
                                dangerouslySetInnerHTML={{ __html: renderMarkdown(article.summary) }}
                              />
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
                              title={t('actions.edit')}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(article.id)}
                              disabled={deleting === article.id}
                              title={t('actions.delete')}
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
                  {t('tableTabs.data')}
                </button>
                <button
                  type="button"
                  onClick={() => setViewerTab((prev) => ({ ...prev, [key]: 'exibicao' }))}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    subTab === 'exibicao'
                      ? 'bg-primary/10 text-primary border border-primary/30'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent'
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  {t('tableTabs.display')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCatalog((prev) => prev.filter((t) => t.table_name !== key));
                    if (activeTab === key) setActiveTab('articles');
                  }}
                  className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent transition-colors"
                  title={t('tableTabs.remove_tab')}
                >
                  <Minus className="h-3.5 w-3.5" />
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
                  onRecover={(newName) => {
                    setActiveTab(newName);
                  }}
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
            <DialogTitle>{t('createArticleDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('createArticleDialog.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label>{t('createArticleDialog.article_title')}</Label>
              <Input
                value={createArticleTitle}
                onChange={(e) => setCreateArticleTitle(e.target.value)}
                placeholder={t('createArticleDialog.article_title_placeholder')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateArticle();
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('createArticleDialog.schedule_label')}</Label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="schedule-toggle"
                  checked={scheduleEnabled}
                  onChange={(e) => setScheduleEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="schedule-toggle" className="text-sm font-normal">
                  {t('createArticleDialog.schedule_future')}
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
              <Button variant="outline">{tc('cancel')}</Button>
            </DialogClose>
            <Button onClick={handleCreateArticle} disabled={creatingArticle || !createArticleTitle.trim()}>
              {creatingArticle ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Clock className="h-4 w-4 mr-2" />
              )}
              {scheduleEnabled && scheduledAt ? t('createArticleDialog.schedule') : t('createArticleDialog.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Table Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('createTableDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('createTableDialog.description')}
            </DialogDescription>
          </DialogHeader>

          {loadingCreateTables ? (
            <div className="flex justify-center py-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : availableCreateTables.length > 0 ? (
            <div className="border rounded-md p-2">
              <span className="text-xs font-medium text-muted-foreground mb-1 block">
                {t('createTableDialog.available_tables')}
              </span>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {availableCreateTables
                  .filter((t) => !catalog.some((c) => c.table_name === t))
                  .map((t) => (
                    <button
                      key={t}
                      type="button"
                      className="flex-shrink-0 px-2 py-1 rounded text-xs bg-secondary/50 hover:bg-secondary transition-colors font-mono cursor-pointer whitespace-nowrap"
                      onClick={() => setCreateName(t)}
                    >
                      {t}
                    </button>
                  ))}
              </div>
            </div>
          ) : null}

          <div className="space-y-3">
            <div className="space-y-1">
              <Label>{t('createTableDialog.table_name')}</Label>
              <Input
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder={t('createTableDialog.table_name_placeholder')}
              />
            </div>
            <div className="space-y-1">
              <Label>{t('createTableDialog.display_name')}</Label>
              <Input
                value={createLabel}
                onChange={(e) => setCreateLabel(e.target.value)}
                placeholder={t('createTableDialog.display_name_placeholder')}
              />
            </div>
            <div className="space-y-1">
              <Label>{t('createTableDialog.icon')}</Label>
              <TableIconPicker value={createIcon} onChange={setCreateIcon} slug={slug} tenantId={tenantId ?? undefined} />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{tc('cancel')}</Button>
            </DialogClose>
            <Button onClick={handleCreateTable} disabled={creating || !createName.trim()}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              {t('createTableDialog.add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Table Dialog */}
      <Dialog open={!!renameTable} onOpenChange={(o) => !o && setRenameTable(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('editTableDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('editTableDialog.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label>{t('editTableDialog.display_name')}</Label>
              <Input
                value={renameLabel}
                onChange={(e) => setRenameLabel(e.target.value)}
                placeholder={t('editTableDialog.display_name_placeholder')}
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{tc('cancel')}</Button>
            </DialogClose>
            <Button onClick={handleRename} disabled={renaming}>
              {renaming ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
              {tc('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTable} onOpenChange={(o) => !o && setDeleteTable(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteTableDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteTableDialog.confirm_message', { label: deleteLabel })}
              <br /><br />
              {t('deleteTableDialog.your_data_deleted')}
              {' '}
              {t('deleteTableDialog.other_tenants_keep')}
              {' '}
              {t('deleteTableDialog.only_you')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTable}
              disabled={deletingTable}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingTable ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              {tc('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
