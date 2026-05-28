'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useTenantRole } from '@/hooks/use-tenant-role';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/ui/image-upload';
import TiptapEditor from '@/components/editor/tiptap-editor';
import { extractTextFromContent } from '@/lib/content-utils';
import { Loader2, Save, Check, ShieldAlert, Sparkles, Text, History } from 'lucide-react';

import { nanoid } from 'nanoid';
import { useApp } from '@/context/app-provider';
import { generateTags } from '@/ai/flows/generate-tags-flow';
import { summarizeWikiContent } from '@/ai/flows/summarize-wiki-content';
import { extractTextFromFile } from '@/ai/flows/extract-text-from-file-flow';
import { formatTextToJson } from '@/ai/flows/format-text-to-json-flow';
import { supabase } from '@/supabase';

const articleSchema = z.object({
  title: z.string().min(3, 'O título é obrigatório.'),
  summary: z.string().min(10, 'O resumo é obrigatório.'),
  content: z.string().min(20, 'O conteúdo é obrigatório.'),
  tags: z.string().min(1, 'Pelo menos uma tag é necessária.'),
  imageUrl: z.string().optional(),
  tables: z.string().optional(),
});

type ArticleFormData = z.infer<typeof articleSchema>;

function EditPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const [isSaving, setIsSaving] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [changeSummary, setChangeSummary] = useState('');
  const [versions, setVersions] = useState<any[]>([]);
  const [showVersions, setShowVersions] = useState(false);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const { canEdit, isLoading: isAdminLoading } = useTenantRole(slug);
  const articleIdParam = Array.isArray(params.articleId) ? params.articleId[0] : params.articleId;
  const fromGeneration = searchParams.get('from-generation') === 'true';

  const isNewArticle = articleIdParam === 'new';
  const [articleId, setArticleId] = useState(isNewArticle ? nanoid() : articleIdParam);

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
          setArticleId(generatedArticle.id || nanoid());
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
        imageUrl: article.imageUrl,
        tables: article.tables ? JSON.stringify(article.tables, null, 2) : '',
      });
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

  const onSubmit = async (values: ArticleFormData) => {
    setIsSaving(true);

    try {
      const now = new Date().toISOString();
      let parsedTables = article?.tables;
      if (values.tables) {
        try {
          parsedTables = JSON.parse(values.tables);
        } catch (e) {
          toast({ variant: 'destructive', title: 'Erro de JSON', description: 'A estrutura JSON das tabelas é inválida.' });
          setIsSaving(false);
          return;
        }
      }

      const dataToSave = {
        id: articleId,
        title: values.title,
        summary: values.summary,
        content: values.content,
        tags: values.tags.split(',').map(tag => tag.trim()),
        imageUrl: values.imageUrl || '',
        tables: parsedTables,
        updated_at: now,
        ...(isNewArticle ? { created_at: now, tenant_id: tenantId } : {}),
      };

      const { error: upsertError } = await supabase
        .from('wiki_articles')
        .upsert(dataToSave, { onConflict: 'id' });

      if (upsertError) throw upsertError;

      if (changeSummary.trim() && !isNewArticle) {
        try {
          supabase.rpc('update_last_version_summary', {
            p_article_id: articleId,
            p_summary: changeSummary.trim(),
          }).then();
        } catch {}
      }

      if (isNewArticle) {
        toast({ title: 'Sucesso!', description: 'O artigo foi criado.' });
        router.push('/admin-chat');
      } else {
        const valuesToReset = {
          title: values.title,
          summary: values.summary,
          content: values.content,
          tags: values.tags,
          imageUrl: values.imageUrl || '',
          tables: values.tables || '',
        };
        form.reset(valuesToReset);
        setSavedFeedback(true);
        setChangeSummary('');
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setSavedFeedback(false), 3000);
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
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({ variant: 'destructive', title: 'Erro ao Salvar', description: 'Não foi possível salvar os dados no Supabase.' });
    } finally {
      setIsSaving(false);
    }
  };

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
        <h1 className="text-2xl font-bold">Acesso Negado</h1>
        <p className="text-muted-foreground mt-2">Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{isNewArticle ? (fromGeneration ? 'Revisar Artigo Gerado pela IA' : 'Criar Novo Artigo') : `Editando: ${article?.title || 'Carregando...'}`}</CardTitle>
          <CardDescription>Faça as alterações abaixo e clique em salvar.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <input type="file" ref={fileInputRef} onChange={(e) => {}} style={{ display: 'none' }} accept="image/*,application/pdf" />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="summary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resumo</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Textarea {...field} className="min-h-[100px]" />
                      </FormControl>
                      <Button type="button" variant="outline" onClick={handleGenerateSummary} disabled={isGeneratingSummary}>
                        {isGeneratingSummary ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        Gerar
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Imagem do Artigo</FormLabel>
                    <FormControl>
                      <ImageUpload
                        bucket="wiki-assets"
                        pathPrefix={articleId}
                        value={field.value || ''}
                        onChange={field.onChange}
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
                    <FormLabel>Conteúdo</FormLabel>
                    <FormControl>
                      <TiptapEditor
                        content={field.value}
                        onChange={(html, json) => {
                          field.onChange(json);
                        }}
                        placeholder="Escreva o conteúdo do artigo..."
                        articleId={articleId}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tables"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Tabelas (JSON)</FormLabel>
                      <div className='flex gap-2'>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isFormatting}
                          onClick={handleFormatText}
                        >
                          {isFormatting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Text className="mr-2 h-4 w-4" />}
                          Formatar Texto
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
                          Extrair de Arquivo
                        </Button>
                      </div>
                    </div>
                    <FormControl>
                      <Textarea {...field} className="min-h-[250px] font-mono text-xs" />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">Cole o texto bruto e clique em "Formatar Texto", extraia de um arquivo, ou edite o JSON diretamente.</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags (separadas por vírgula)</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <Button type="button" variant="outline" onClick={handleGenerateTags} disabled={isGeneratingTags}>
                        {isGeneratingTags ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        Gerar Tags
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2 border-t pt-4">
                <label className="text-xs text-muted-foreground font-medium">Resumo da Alteração (opcional)</label>
                <textarea
                  value={changeSummary}
                  onChange={(e) => setChangeSummary(e.target.value)}
                  placeholder="Descreva brevemente o que mudou..."
                  className="w-full rounded-lg border bg-background px-3 py-2 text-xs resize-none h-16 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="flex items-center gap-3">
                {!isNewArticle && versions.length > 0 && (
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowVersions(!showVersions)} className="gap-2">
                    <History className="h-4 w-4" />
                    Histórico ({versions.length})
                  </Button>
                )}

                {savedFeedback ? (
                  <div className="flex items-center gap-2 text-sm text-green-500 font-medium">
                    <Check className="h-4 w-4" />
                    Salvo!
                  </div>
                ) : form.formState.isDirty ? (
                  <Button type="submit" disabled={isSaving || isExtracting || isFormatting}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Salvar Alterações
                  </Button>
                ) : null}
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
      </Card>
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
