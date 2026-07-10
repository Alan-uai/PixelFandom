'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useTenantRole } from '@/hooks/use-tenant-role';
import { CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { WeldingCard } from '@/components/ui/welding-card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { FloatingLabelInput } from '@/components/ui/floating-label-input';
import { FloatingLabelTextarea } from '@/components/ui/floating-label-textarea';
import { Button } from '@/components/ui/button';
import { Select3D } from '@/components/ui/select3d';
import { ImageUpload } from '@/components/ui/image-upload';
import TiptapEditor from '@/components/editor/tiptap-editor';
import { useTranslations } from 'next-intl';
import { extractTextFromContent, sanitizeUrl } from '@/lib/content-utils';
import { Sparkles, FileText, Wand2, Loader2, ShieldAlert, Text, History, Clock } from 'lucide-react';
import { Checkbox3D } from '@/components/ui/checkbox-3d';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { generateGuide } from '@/ai/flows/generate-guide-flow';
import { improveArticle } from '@/ai/flows/improve-article-flow';
import { searchAll } from '@/lib/search';
import { invalidateDataCache } from '@/lib/data-access';
import { useRegisterUnsavedChanges } from '@/components/unsaved-changes';

import { generateTags } from '@/ai/flows/generate-tags-flow';
import { summarizeWikiContent } from '@/ai/flows/summarize-wiki-content';
import { extractTextFromFile } from '@/ai/flows/extract-text-from-file-flow';
import { formatTextToJson } from '@/ai/flows/format-text-to-json-flow';
import { supabase } from '@/supabase';
import { RealtimeCursors } from '@/components/editor/realtime-cursors';
import { RealtimeIndicator } from '@/components/editor/realtime-indicator';

const protocolRegex = /^(https?:\/\/|\/)/;
const urlOrEmpty = z.string().max(2048).optional().or(z.literal(''));
const urlSafe = (msg: string) => urlOrEmpty.refine(
  (v) => !v || protocolRegex.test(v),
  { message: msg }
);

const articleSchema = z.object({
  title: z.string().min(3, 'O título é obrigatório.').max(500, 'Título muito longo.'),
  summary: z.string().min(10, 'O resumo é obrigatório.').max(5000, 'Resumo muito longo.'),
  content: z.string().min(20, 'O conteúdo é obrigatório.').max(500000, 'Conteúdo muito longo.'),
  tags: z.string().min(1, 'Pelo menos uma tag é necessária.').max(2000, 'Tags muito longas.'),
  imageUrl: urlSafe('URL inválida. Apenas HTTP(S) ou caminho relativo.'),
  bannerImage: urlSafe('URL inválida. Apenas HTTP(S) ou caminho relativo.'),
  ogImage: urlSafe('URL inválida. Apenas HTTP(S) ou caminho relativo.'),
  tables: z.string().max(500000, 'JSON muito grande.').optional(),
});

type ArticleFormData = z.infer<typeof articleSchema>;

function EditPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations('editor');

  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [changeSummary, setChangeSummary] = useState('');
  const [versions, setVersions] = useState<any[]>([]);
  const [showVersions, setShowVersions] = useState(false);
  const [isGeneratingGuide, setIsGeneratingGuide] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [showAiSidebar, setShowAiSidebar] = useState(false);
  const [guideTopic, setGuideTopic] = useState('');
  const [guideTone, setGuideTone] = useState<'guia' | 'tutorial' | 'analise'>('guia');

  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');

  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const { canEdit, isLoading: isAdminLoading } = useTenantRole(slug);
  const articleIdParam = Array.isArray(params.articleId) ? params.articleId[0] : params.articleId;
  const fromGeneration = searchParams.get('from-generation') === 'true';

  const isNewArticle = articleIdParam === 'new';
  const [articleId, setArticleId] = useState(isNewArticle ? crypto.randomUUID() : articleIdParam);

  const [article, setArticle] = useState<any>(null);
  const [isArticleLoading, setIsArticleLoading] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenantLoading, setTenantLoading] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from('tenants')
      .select('id')
      .eq('slug', slug)
      .single()
      .then(({ data }) => {
        if (data) setTenantId(data.id);
        setTenantLoading(false);
      });
  }, [slug]);

  useEffect(() => {
    if (isNewArticle || !tenantId) return;

    setIsArticleLoading(true);

    supabase
      .from('wiki_articles')
      .select('*')
      .eq('id', articleId)
      .eq('tenant_id', tenantId)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          setArticle(data);
        }
        setIsArticleLoading(false);
      });
  }, [articleId, isNewArticle, tenantId]);

  const form = useForm<ArticleFormData>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: '',
      summary: '',
      content: '',
      tags: '',
      imageUrl: '',
      bannerImage: '',
      ogImage: '',
      tables: '',
    },
  });

  const { setValue } = form;

  useEffect(() => {
    if (isNewArticle && fromGeneration) {
      const generatedArticleJson = sessionStorage.getItem('generated-wiki-article');
      if (generatedArticleJson) {
        try {
          const generatedArticle = JSON.parse(generatedArticleJson);
          setArticleId(generatedArticle.id || crypto.randomUUID());
          form.reset({
            title: generatedArticle.title || '',
            summary: generatedArticle.summary || '',
            content: generatedArticle.content || '',
            tags: Array.isArray(generatedArticle.tags) ? generatedArticle.tags.join(', ') : generatedArticle.tags || '',
            imageUrl: generatedArticle.imageUrl || '',
            tables: generatedArticle.tables ? JSON.stringify(generatedArticle.tables, null, 2) : '',
          });
          sessionStorage.removeItem('generated-wiki-article');
        } catch (error) {
          console.error("Erro ao analisar artigo gerado:", error);
          toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar o artigo gerado pela IA.' });
        }
      }
    }
  }, [isNewArticle, fromGeneration, form, toast]);

  useEffect(() => {
    if (article) {
      form.reset({
        title: article.title,
        summary: article.summary,
        content: article.content,
        tags: Array.isArray(article.tags) ? article.tags.join(', ') : '',
        imageUrl: article.image_url,
        bannerImage: article.banner_image || '',
        ogImage: article.og_image || '',
        tables: article.tables ? JSON.stringify(article.tables, null, 2) : '',
      });
      if (article.scheduled_at) {
        setScheduleEnabled(true);
        setScheduledAt(new Date(article.scheduled_at).toISOString().slice(0, 16));
      } else {
        setScheduleEnabled(false);
        setScheduledAt('');
      }
      supabase
        .from('article_versions')
        .select('*')
        .eq('article_id', article.id)
        .order('version_number', { ascending: false })
        .limit(50)
        .then(({ data }) => {
          if (data) setVersions(data);
        });
    }
  }, [article, form]);

  const handleGenerateTags = async () => {
    setIsGeneratingTags(true);
    const { title, summary } = form.getValues();
    const content = extractTextFromContent(form.getValues().content);
    try {
      const result = await generateTags({ title, summary, content });
      if (result.tags) {
        setValue('tags', result.tags);
        toast({ title: 'Tags Geradas!', description: 'As tags foram preenchidas com sugestões da IA.' });
      } else {
        throw new Error('A IA não retornou tags.');
      }
    } catch (error) {
      console.error('Erro ao gerar tags:', error);
      toast({ variant: 'destructive', title: 'Erro ao Gerar Tags', description: 'Não foi possível gerar as tags.' });
    } finally {
      setIsGeneratingTags(false);
    }
  };

  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    const { title } = form.getValues();
    const content = extractTextFromContent(form.getValues().content);
    try {
      const result = await summarizeWikiContent({ wikiContent: content, topic: title });
      if (result.summary) {
        setValue('summary', result.summary);
        toast({ title: 'Resumo Gerado!', description: 'O resumo foi preenchido com uma sugestão da IA.' });
      } else {
        throw new Error('A IA não retornou um resumo.');
      }
    } catch (error) {
      console.error('Erro ao gerar resumo:', error);
      toast({ variant: 'destructive', title: 'Erro ao Gerar Resumo', description: 'Não foi possível gerar o resumo.' });
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, extractionType: 'markdown' | 'json') => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    toast({ title: 'Processando arquivo...', description: 'A IA está extraindo o texto. Isso pode levar um momento.' });

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const fileDataUri = reader.result as string;

        const result = await extractTextFromFile({ fileDataUri, extractionType });

        if (result.extractedText) {
          if (extractionType === 'markdown') {
            setValue('content', result.extractedText);
          } else if (extractionType === 'json') {
            setValue('tables', result.extractedText);
          }
          toast({ title: 'Texto Extraído!', description: `O campo de ${extractionType === 'markdown' ? 'conteúdo' : 'tabelas'} foi preenchido.` });
        } else {
          throw new Error('A IA não retornou texto.');
        }
      };
      reader.onerror = (error) => {
        throw error;
      }
    } catch (error) {
      console.error(`Erro ao extrair texto para ${extractionType}:`, error);
      toast({ variant: 'destructive', title: 'Erro na Extração', description: 'Não foi possível extrair o texto do arquivo.' });
    } finally {
      setIsExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFormatText = async () => {
    const rawText = form.getValues('tables');
    if (!rawText) {
      toast({ variant: 'destructive', title: 'Campo Vazio', description: 'Por favor, insira o texto a ser formatado no campo de tabelas.' });
      return;
    }
    setIsFormatting(true);
    try {
      const result = await formatTextToJson({ rawText });
      if (result.jsonString && result.jsonString !== '[]') {
        const parsed = JSON.parse(result.jsonString);
        setValue('tables', JSON.stringify(parsed, null, 2));
        toast({ title: 'Texto Formatado!', description: 'O texto foi convertido para JSON com sucesso.' });
      } else {
        throw new Error('A IA não conseguiu formatar o texto.');
      }
    } catch (error) {
      console.error('Erro ao formatar texto:', error);
      toast({ variant: 'destructive', title: 'Erro na Formatação', description: 'Não foi possível formatar o texto para JSON.' });
    } finally {
      setIsFormatting(false);
    }
  };

  const handleGenerateGuide = async () => {
    if (!guideTopic.trim() || !tenantId || !slug) return;
    setIsGeneratingGuide(true);
    try {
      await supabase
        .from('wiki_articles')
        .select('title')
        .eq('tenant_id', tenantId)
        .limit(5);
      
      let gameDataContext = '';
      try {
        const searchResult = await searchAll(slug, guideTopic, { limit: 10 });
        gameDataContext = JSON.stringify({
          wiki_articles: searchResult.wiki.map(w => ({ title: w.title, summary: w.summary })),
          game_items: searchResult.game_items.map(i => ({ 
            source_type: i.source_type, name: i.name, description: i.description, 
            raw_data: i.raw_data 
          }))
        }, null, 2);
      } catch {/* noop */}

      const result = await generateGuide({
        topic: guideTopic,
        gameDataContext,
        tone: guideTone,
      });

      if (result.content) {
        form.setValue('content', result.content);
        form.setValue('summary', result.summary || '');
        form.setValue('tags', result.tags || '');
        if (result.tables) {
          form.setValue('tables', result.tables);
        }
        if (result.title) {
          form.setValue('title', result.title);
        }
        toast({ title: 'Guia Gerado!', description: 'O guia foi gerado pela IA. Revise e salve.' });
      }
    } catch (error) {
      console.error('Erro ao gerar guia:', error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível gerar o guia.' });
    } finally {
      setIsGeneratingGuide(false);
    }
  };

  const handleImproveArticle = async () => {
    if (!tenantId || !slug) return;
    setIsImproving(true);
    try {
      const values = form.getValues();
      const contentText = values.content;
      
      let gameDataContext = '';
      try {
        const searchResult = await searchAll(slug, values.title, { limit: 10 });
        gameDataContext = JSON.stringify({
          game_items: searchResult.game_items.map(i => ({
            source_type: i.source_type, name: i.name, description: i.description,
            raw_data: i.raw_data
          }))
        }, null, 2);
      } catch {/* noop */}

      const result = await improveArticle({
        title: values.title,
        content: contentText,
        summary: values.summary,
        tags: values.tags,
        tables: values.tables || '[]',
        gameDataContext,
        tone: guideTone,
      });

      if (result.content) {
        form.setValue('content', result.content);
        form.setValue('summary', result.summary || values.summary);
        form.setValue('tags', result.tags || values.tags);
        if (result.tables) {
          form.setValue('tables', result.tables);
        }
        toast({ title: 'Artigo Melhorado!', description: 'O artigo foi reestruturado. Revise e salve.' });
      }
    } catch (error) {
      console.error('Erro ao melhorar artigo:', error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível melhorar o artigo.' });
    } finally {
      setIsImproving(false);
    }
  };

  const onSubmit = async (values: ArticleFormData) => {
    const now = new Date().toISOString();
    let parsedTables = article?.tables;
    if (values.tables) {
      try {
        parsedTables = JSON.parse(values.tables);
        if (typeof parsedTables !== 'object' || parsedTables === null) {
          throw new Error('JSON deve ser um objeto ou array');
        }
      } catch (e) {
        const msg = e instanceof SyntaxError
          ? 'O JSON das tabelas é inválido. Verifique a sintaxe.'
          : 'A estrutura JSON das tabelas é inválida.';
        toast({ variant: 'destructive', title: 'Erro de JSON', description: msg });
        throw e;
      }
    }

    const slug = values.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const { data: { user } } = await supabase.auth.getUser();

    const dataToSave = {
      id: articleId,
      title: values.title.trim(),
      slug,
      summary: values.summary.trim(),
      content: values.content,
      tags: values.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      image_url: values.imageUrl ? sanitizeUrl(values.imageUrl.trim()) : null,
      banner_image: values.bannerImage ? sanitizeUrl(values.bannerImage.trim()) : null,
      og_image: values.ogImage ? sanitizeUrl(values.ogImage.trim()) : null,
      tables: parsedTables,
      tenant_id: tenantId,
      created_at: isNewArticle ? now : article?.created_at,
      updated_at: now,
      ...(isNewArticle && user?.id ? { created_by: user.id } : {}),
    };

    const dataToSaveFinal: Record<string, unknown> = {
      ...dataToSave,
    };

    const isScheduledNow = scheduleEnabled && scheduledAt;
    const wasScheduled = article?.scheduled_at;

    if (isScheduledNow) {
      dataToSaveFinal.status = 'draft';
      dataToSaveFinal.scheduled_at = new Date(scheduledAt).toISOString();
    } else if (wasScheduled && !isScheduledNow) {
      dataToSaveFinal.status = 'published';
      dataToSaveFinal.scheduled_at = null;
    } else {
      if (!isNewArticle && article?.status === 'draft' && !article?.scheduled_at) {
        dataToSaveFinal.status = 'draft';
      } else if (!isNewArticle) {
        dataToSaveFinal.status = article?.status || 'published';
      }
      dataToSaveFinal.scheduled_at = article?.scheduled_at || null;
    }

    const { error: upsertError } = await supabase
      .from('wiki_articles')
      .upsert(dataToSaveFinal, { onConflict: 'id' });

    if (upsertError) throw upsertError;

    // Handle scheduled_actions record
    if (isScheduledNow) {
      const { data: existingAction } = await supabase
        .from('scheduled_actions')
        .select('id')
        .eq('target_type', 'article')
        .eq('target_id', articleId)
        .single();
      if (existingAction) {
        await supabase
          .from('scheduled_actions')
          .update({ scheduled_at: new Date(scheduledAt).toISOString() })
          .eq('id', existingAction.id);
      } else {
        await supabase.from('scheduled_actions').insert({
          tenant_id: tenantId,
          target_type: 'article',
          target_id: articleId,
          action: 'publish',
          scheduled_at: new Date(scheduledAt).toISOString(),
          created_by: user?.id ?? null,
        });
      }
    } else if (wasScheduled && !isScheduledNow) {
      await supabase
        .from('scheduled_actions')
        .delete()
        .eq('target_type', 'article')
        .eq('target_id', articleId);
    }

    invalidateDataCache(slug);

    if (changeSummary.trim() && !isNewArticle) {
      try {
        supabase.rpc('update_last_version_summary', {
          p_article_id: articleId,
          p_summary: changeSummary.trim(),
        }).then();
      } catch {/* noop */}
    }

    if (isNewArticle) {
      toast({ title: t('success'), description: t('article_created') });
      router.push('/admin-chat');
    } else {
      const valuesToReset = {
        title: values.title,
        summary: values.summary,
        content: values.content,
        tags: values.tags,
        imageUrl: values.imageUrl || undefined,
        bannerImage: values.bannerImage || undefined,
        ogImage: values.ogImage || undefined,
        tables: values.tables || '',
      };
      form.reset(valuesToReset);
      setChangeSummary('');
      supabase
        .from('article_versions')
        .select('*')
        .eq('article_id', articleId)
        .order('version_number', { ascending: false })
        .limit(50)
        .then(({ data }) => {
          if (data) setVersions(data);
        });
    }
  };

  const { isDirty } = form.formState;

  useRegisterUnsavedChanges({
    isDirty,
    onSave: () => form.handleSubmit(onSubmit)(),
    onDiscard: () => form.reset(),
  });

  const isLoading = isAdminLoading || tenantLoading || (isArticleLoading && !isNewArticle);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <ShieldAlert className="h-16 w-16 mb-4 text-destructive" />
        <h1 className="text-2xl font-bold">{t('access_denied')}</h1>
        <p className="text-muted-foreground mt-2">{t('access_denied_desc')}</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <WeldingCard>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>{isNewArticle ? (fromGeneration ? t('review_ai_article') : t('create_new_article')) : `${t('editing_prefix')} ${article?.title || 'Carregando...'}`}</CardTitle>
              <CardDescription>{t('edit_hint')}</CardDescription>
            </div>
            {tenantId && articleId && (
              <>
                <RealtimeCursors articleId={articleId} tenantId={tenantId} />
                <RealtimeIndicator articleId={articleId} />
              </>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <input type="file" ref={fileInputRef} onChange={(_e) => {}} style={{ display: 'none' }} accept="image/*,application/pdf" />

              <FormField
                control={form.control}
                name="title"
                render={({ field, fieldState }) => (
                  <FloatingLabelInput label={t('title')} error={fieldState.error?.message} {...field} />
                )}
              />

              <FormField
                control={form.control}
                name="summary"
                render={({ field, fieldState }) => (
                  <div className="flex gap-2 items-start">
                    <FloatingLabelTextarea label={t('summary_label')} error={fieldState.error?.message} className="min-h-[100px]" {...field} />
                    <Button type="button" variant="outline" onClick={handleGenerateSummary} disabled={isGeneratingSummary} className="mt-1 shrink-0">
                      {isGeneratingSummary ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      {t('generate')}
                    </Button>
                  </div>
                )}
              />

              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('article_image_label')}</FormLabel>
                    <FormControl>
                      <ImageUpload
                          bucket="wiki-assets"
                          pathPrefix={`${slug}/covers/${articleId}`}
                        value={field.value || ''}
                        onChange={field.onChange}
                        label={t('article_image_upload')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bannerImage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('banner_label')}</FormLabel>
                    <FormControl>
                      <ImageUpload
                        bucket="wiki-assets"
                        pathPrefix={`${slug}/banners/${articleId}`}
                        value={field.value || ''}
                        onChange={field.onChange}
                        label={t('banner_upload')}
                        previewSize="w-full h-24"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ogImage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('og_label')}</FormLabel>
                    <FormControl>
                      <ImageUpload
                        bucket="wiki-assets"
                        pathPrefix={`${slug}/og/${articleId}`}
                        value={field.value || ''}
                        onChange={field.onChange}
                        label={t('og_upload')}
                        previewSize="w-40 h-24"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />



              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('content_label')}</FormLabel>
                    <FormControl>
                      <TiptapEditor
                        content={field.value}
                        onChange={(text) => {
                          field.onChange(text);
                        }}
                        placeholder={t('content_placeholder')}
                        articleId={articleId}
                        tenantId={params.slug as string}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tables"
                render={({ field, fieldState }) => (
                  <div>
                    <FloatingLabelTextarea label={t('tables_label')} error={fieldState.error?.message} className="min-h-[250px] font-mono text-xs" {...field} />
                    <div className="flex gap-2 mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isFormatting}
                        onClick={handleFormatText}
                      >
                        {isFormatting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Text className="mr-2 h-4 w-4" />}
                        {t('format_text')}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isExtracting}
                        onClick={() => {
                          const handler = (e: Event) => {
                            handleFileChange(e as unknown as React.ChangeEvent<HTMLInputElement>, 'json');
                            fileInputRef.current?.removeEventListener('change', handler);
                          };
                          fileInputRef.current?.addEventListener('change', handler);
                          fileInputRef.current?.click();
                        }}
                      >
                        {isExtracting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Text className="mr-2 h-4 w-4" />}
                        {t('extract_from_file')}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{t('tables_hint')}</p>
                  </div>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={({ field, fieldState }) => (
                  <div className="flex gap-2">
                    <FloatingLabelInput label={t('tags_label')} error={fieldState.error?.message} {...field} />
                    <Button type="button" variant="outline" onClick={handleGenerateTags} disabled={isGeneratingTags} className="mt-1 shrink-0">
                      {isGeneratingTags ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                      {t('generate_tags')}
                    </Button>
                  </div>
                )}
              />

              <div className="border-t pt-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Checkbox3D
                    checked={scheduleEnabled}
                    onChange={setScheduleEnabled}
                    size="md"
                  />
                  <Label className="text-sm font-normal cursor-pointer" onClick={() => setScheduleEnabled(!scheduleEnabled)}>
                    {t('edit_schedule_label') || 'Agendar publicação'}
                  </Label>
                </div>
                {scheduleEnabled && (
                  <Input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                  />
                )}
                {scheduleEnabled && scheduledAt && (
                  <p className="text-xs text-muted-foreground">
                    {t('edit_schedule_hint') || 'O artigo será publicado em'} {new Date(scheduledAt).toLocaleString('pt-BR')}
                  </p>
                )}
                <FloatingLabelTextarea
                  label={t('change_summary_label')}
                  value={changeSummary}
                  onChange={(e) => setChangeSummary(e.target.value)}
                  className="text-xs resize-none h-16"
                />
              </div>

              <div className="flex items-center gap-3">
                {!isNewArticle && versions.length > 0 && (
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowVersions(!showVersions)} className="gap-2">
                    <History className="h-4 w-4" />
                    {t('history')} ({versions.length})
                  </Button>
                )}

                  <Sheet open={showAiSidebar} onOpenChange={setShowAiSidebar}>
                    <SheetTrigger asChild>
                      <Button type="button" variant="outline" className="gap-2">
                        <Wand2 className="h-4 w-4" />
                        {t('ai_assistant')}
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-[400px] sm:w-[540px]">
                      <SheetHeader>
                        <SheetTitle>{t('ai_assistant_title')}</SheetTitle>
                      </SheetHeader>
                      <ScrollArea className="h-full pr-4 mt-6">
                        <div className="space-y-6">
                          {/* Generate Tab */}
                          <div>
                            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                              <Sparkles className="h-4 w-4 text-primary" />
                              {t('generate_guide_title')}
                            </h3>
                            <div className="space-y-3">
                              <input
                                type="text"
                                placeholder={t('guide_topic_placeholder')}
                                value={guideTopic}
                                onChange={(e) => setGuideTopic(e.target.value)}
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                              />
                              <Select3D value={guideTone} options={[
                                {value: 'guia', label: t('guide_tone_guide')},
                                {value: 'tutorial', label: t('guide_tone_tutorial')},
                                {value: 'analise', label: t('guide_tone_analise')},
                              ]} onChange={(v) => setGuideTone(v as any)} />
                              <Button
                                type="button"
                                className="w-full gap-2"
                                disabled={isGeneratingGuide || !guideTopic.trim()}
                                onClick={handleGenerateGuide}
                              >
                                {isGeneratingGuide ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Sparkles className="h-4 w-4" />
                                )}
                                {isGeneratingGuide ? t('generating') : t('generate_guide')}
                              </Button>
                            </div>
                          </div>

                          <div className="border-t pt-6">
                            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                              <Wand2 className="h-4 w-4 text-primary" />
                              {t('improve_article_title')}
                            </h3>
                            <p className="text-xs text-muted-foreground mb-3">
                              {t('improve_article_desc')}
                            </p>
                            <Select3D value={guideTone} options={[
                              {value: 'guia', label: 'Guia Prático'},
                              {value: 'tutorial', label: 'Tutorial Passo-a-Passo'},
                              {value: 'analise', label: 'Análise Detalhada'},
                            ]} onChange={(v) => setGuideTone(v as any)} className="mb-3" />
                            <Button
                              type="button"
                              variant="secondary"
                              className="w-full gap-2"
                              disabled={isImproving}
                              onClick={handleImproveArticle}
                            >
                              {isImproving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Wand2 className="h-4 w-4" />
                              )}
                              {isImproving ? t('improving') : t('improve_article')}
                            </Button>
                          </div>

                          <div className="border-t pt-6">
                            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                              <FileText className="h-4 w-4 text-primary" />
                              {t('what_are_guides')}
                            </h3>
                            <div className="text-xs text-muted-foreground space-y-2 leading-relaxed">
                              <p>{t.rich('guide_explanation_intro', { strong: (chunks) => <strong>{chunks}</strong> })}</p>
                              <ul className="list-disc pl-4 space-y-1">
                                <li>{t.rich('guide_explanation_obtain', { strong: (chunks) => <strong>{chunks}</strong> })}</li>
                                <li>{t.rich('guide_explanation_builds', { strong: (chunks) => <strong>{chunks}</strong> })}</li>
                                <li>{t.rich('guide_explanation_tierlists', { strong: (chunks) => <strong>{chunks}</strong> })}</li>
                                <li>{t.rich('guide_explanation_progression', { strong: (chunks) => <strong>{chunks}</strong> })}</li>
                              </ul>
                              <p className="mt-2">{t('guide_explanation_stats')}</p>
                            </div>
                          </div>
                        </div>
                      </ScrollArea>
                    </SheetContent>
                  </Sheet>

              </div>

              {showVersions && versions.length > 0 && (
                <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                  {versions.map((v: any) => (
                    <div key={v.id} className="p-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">v{v.version_number}</span>
                        <span className="text-muted-foreground">{new Date(v.created_at).toLocaleString('pt-BR')}</span>
                      </div>
                      {v.change_summary && v.change_summary !== 'Auto-saved' && (
                        <p className="text-muted-foreground mt-1">{v.change_summary}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </WeldingCard>
    </div>
  );
}

export default function EditArticlePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <EditPageContent />
    </Suspense>
  );
}
