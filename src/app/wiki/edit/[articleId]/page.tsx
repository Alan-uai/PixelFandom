'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFirestore, useMemoFirebase, useUser, useFirebase, useDoc } from '@/firebase';
import { doc, setDoc, serverTimestamp, getDoc, collection } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { useAdmin } from '@/hooks/use-admin';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Save, ShieldAlert, Sparkles, Upload, Image as ImageIcon, Text } from 'lucide-react';
import type { WikiArticle } from '@/lib/types';
import { nanoid } from 'nanoid';
import { useApp } from '@/context/app-provider';
import { generateTags } from '@/ai/flows/generate-tags-flow';
import { summarizeWikiContent } from '@/ai/flows/summarize-wiki-content';
import { extractTextFromFile } from '@/ai/flows/extract-text-from-file-flow';
import { formatTextToJson } from '@/ai/flows/format-text-to-json-flow';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

// Base schema for a generic document
const genericDocSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'O nome é obrigatório.'),
  // All other fields will be in a single JSON blob
  jsonData: z.string().refine((val) => {
    try {
      JSON.parse(val);
      return true;
    } catch {
      return false;
    }
  }, { message: 'JSON inválido.' }),
});

// Schema for the article form validation (more specific)
const articleSchema = z.object({
  title: z.string().min(3, 'O título é obrigatório.'),
  summary: z.string().min(10, 'O resumo é obrigatório.'),
  content: z.string().min(20, 'O conteúdo é obrigatório.'),
  tags: z.string().min(1, 'Pelo menos uma tag é necessária.'),
  imageUrl: z.string().optional(),
  tables: z.string().optional(), // JSON string
});

type ArticleFormData = z.infer<typeof articleSchema>;

function EditPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { firestore, firebaseApp } = useFirebase();
  const { toast } = useToast();
  const { isAdmin, isLoading: isAdminLoading } = useAdmin();
  
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  const articleIdParam = Array.isArray(params.articleId) ? params.articleId[0] : params.articleId;
  const collectionPath = searchParams.get('collectionPath');
  const fromGeneration = searchParams.get('from-generation') === 'true';

  const isGenericCollection = !!collectionPath;

  const isNewArticle = articleIdParam === 'new';
  const [articleId, setArticleId] = useState(isNewArticle ? nanoid() : articleIdParam);
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const storage = firebaseApp ? getStorage(firebaseApp) : null;
  
  // Determine the correct doc reference based on context (wiki article or generic collection item)
  const docRef = useMemoFirebase(() => {
    if (!firestore) return null;
    if (isGenericCollection) {
      if (!collectionPath) return null;
      return doc(firestore, collectionPath, articleId);
    }
    return doc(firestore, 'wikiContent', articleId);
  }, [firestore, articleId, collectionPath, isGenericCollection]);

  const { data: article, isLoading: isArticleLoading } = useDoc(docRef, { skip: isNewArticle });

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

  const { watch, setValue } = form;
  const imageUrlValue = watch('imageUrl');

  useEffect(() => {
    if (imageUrlValue) {
      if (imageUrlValue.startsWith('http')) {
        setImagePreview(imageUrlValue);
      } else {
        const placeholder = PlaceHolderImages.find(p => p.id === imageUrlValue);
        if (placeholder) {
          setImagePreview(placeholder.imageUrl);
        } else {
          setImagePreview(null);
        }
      }
    } else {
      setImagePreview(null);
    }
  }, [imageUrlValue]);

  // Handle pre-filling form from sessionStorage if redirected from generation
  useEffect(() => {
      if (isNewArticle && fromGeneration) {
          const generatedArticleJson = sessionStorage.getItem('generated-wiki-article');
          if (generatedArticleJson) {
              try {
                  const generatedArticle = JSON.parse(generatedArticleJson);
                  // Use the generated ID or create a new one
                  setArticleId(generatedArticle.id || nanoid());
                  form.reset({
                      title: generatedArticle.title || '',
                      summary: generatedArticle.summary || '',
                      content: generatedArticle.content || '',
                      tags: Array.isArray(generatedArticle.tags) ? generatedArticle.tags.join(', ') : generatedArticle.tags || '',
                      imageUrl: generatedArticle.imageUrl || '',
                      tables: generatedArticle.tables ? JSON.stringify(generatedArticle.tables, null, 2) : '',
                  });
                  // Clean up sessionStorage
                  sessionStorage.removeItem('generated-wiki-article');
              } catch (error) {
                  console.error("Erro ao analisar artigo gerado:", error);
                  toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar o artigo gerado pela IA.' });
              }
          }
      }
  }, [isNewArticle, fromGeneration, form, toast]);


  // When doc data loads, populate the form
  useEffect(() => {
    if (article) {
        if (isGenericCollection) {
            const { id, ...dataToEdit } = article;
            form.reset({
                title: dataToEdit.name || article.id, 
                summary: `Editando item ${article.id} de ${collectionPath}`,
                content: 'Os dados para este item são gerenciados no campo de Tabelas (JSON) abaixo.',
                tags: collectionPath?.split('/').join(', ') || '',
                tables: JSON.stringify(dataToEdit, null, 2),
                imageUrl: dataToEdit.imageUrl || ''
            });
        } else {
            form.reset({
                title: article.title,
                summary: article.summary,
                content: article.content,
                tags: Array.isArray(article.tags) ? article.tags.join(', ') : '',
                imageUrl: article.imageUrl,
                tables: article.tables ? JSON.stringify(article.tables, null, 2) : '',
            });
        }
    }
  }, [article, form, isGenericCollection, collectionPath]);
  
  const handleGenerateTags = async () => {
    setIsGeneratingTags(true);
    const { title, summary, content } = form.getValues();
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
    const { content, title } = form.getValues();
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
      if(fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !storage) return;

    setIsUploadingImage(true);
    toast({ title: 'Enviando imagem...', description: 'A imagem está sendo enviada para o armazenamento.' });

    try {
      const storageRef = ref(storage, `wiki-images/${articleId}/${file.name}`);
      const uploadResult = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(uploadResult.ref);
      
      setValue('imageUrl', downloadURL);
      setImagePreview(downloadURL);

      toast({ title: 'Imagem Enviada!', description: 'A nova imagem do artigo foi salva.' });
    } catch (error) {
      console.error('Erro ao enviar imagem:', error);
      toast({ variant: 'destructive', title: 'Erro no Upload', description: 'Não foi possível enviar a imagem.' });
    } finally {
      setIsUploadingImage(false);
      if(imageInputRef.current) imageInputRef.current.value = '';
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
    if (!docRef) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível encontrar o documento para atualizar.' });
      return;
    }
    setIsSaving(true);
    
    try {
      let dataToSave: any;

      if (isGenericCollection) {
         try {
            dataToSave = JSON.parse(values.tables || '{}');
            dataToSave.id = articleId;
            dataToSave.name = values.title;
         } catch (e) {
            toast({ variant: 'destructive', title: 'Erro de JSON', description: 'A estrutura JSON no campo Tabelas é inválida.' });
            setIsSaving(false);
            return;
         }
      } else {
          let parsedTables = article?.tables;
          if(values.tables) {
              try {
                  parsedTables = JSON.parse(values.tables);
              } catch (e) {
                  toast({ variant: 'destructive', title: 'Erro de JSON', description: 'A estrutura JSON das tabelas é inválida.' });
                  setIsSaving(false);
                  return;
              }
          }
          dataToSave = {
              id: articleId,
              title: values.title,
              summary: values.summary,
              content: values.content,
              tags: values.tags.split(',').map(tag => tag.trim()),
              imageUrl: values.imageUrl || '',
              tables: parsedTables,
              updatedAt: serverTimestamp()
          };
      }
      
      if (isNewArticle) {
        dataToSave.createdAt = serverTimestamp();
      }

      await setDoc(docRef, dataToSave, { merge: true });
      toast({ title: 'Sucesso!', description: `O item foi ${isNewArticle ? 'criado' : 'atualizado'}.` });
      
      if (isNewArticle) {
        router.push(isGenericCollection && collectionPath ? `/admin/manage-content` : '/admin-chat');
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({ variant: 'destructive', title: 'Erro ao Salvar', description: 'Não foi possível salvar os dados no Firestore.' });
    } finally {
      setIsSaving(false);
    }
  };

  const isLoading = isAdminLoading || (isArticleLoading && !isNewArticle);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <ShieldAlert className="h-16 w-16 mb-4 text-destructive" />
        <h1 className="text-2xl font-bold">Acesso Negado</h1>
        <p className="text-muted-foreground mt-2">Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }
  
  if (isNewArticle && isGenericCollection && !collectionPath) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <ShieldAlert className="h-16 w-16 mb-4 text-destructive" />
        <h1 className="text-2xl font-bold">Erro de Caminho</h1>
        <p className="text-muted-foreground mt-2">O caminho da coleção é necessário para criar um novo item. Volte e tente novamente.</p>
      </div>
    );
  }

  const formTitle = isNewArticle 
    ? (fromGeneration ? `Revisar Artigo Gerado pela IA` : `Criando Novo Item em ${isGenericCollection ? collectionPath : 'Wiki'}`)
    : `Editando: ${article?.name || article?.title || 'Carregando...'}`;

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{formTitle}</CardTitle>
          <CardDescription>Faça as alterações abaixo e clique em salvar. {isGenericCollection && "Todos os dados do item são editados no campo JSON."}</CardDescription>
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
                    <FormLabel>{isGenericCollection ? 'Nome / ID' : 'Título'}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!isGenericCollection && (
                <>
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
                    
                    <FormItem>
                        <FormLabel>Imagem do Artigo</FormLabel>
                        <div className="flex items-start gap-4">
                        <div className="w-32 h-32 relative rounded-md border bg-muted overflow-hidden shrink-0">
                            {imagePreview ? (
                            <Image src={imagePreview} alt="Pré-visualização do artigo" layout="fill" objectFit="cover" />
                            ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                <ImageIcon className="h-8 w-8" />
                            </div>
                            )}
                        </div>
                        <div className="space-y-4 w-full">
                            <div>
                                <input type="file" ref={imageInputRef} onChange={handleImageUpload} style={{ display: 'none' }} accept="image/*" />
                                <Button type="button" variant="outline" onClick={() => imageInputRef.current?.click()} disabled={isUploadingImage} className="w-full">
                                {isUploadingImage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                {isUploadingImage ? 'Enviando...' : 'Enviar Nova Imagem'}
                                </Button>
                                <p className="text-xs text-muted-foreground mt-2 text-center">Envie uma imagem para o artigo.</p>
                            </div>
                            
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card px-2 text-muted-foreground">
                                    Ou
                                </span>
                                </div>
                            </div>
                            
                            <FormField
                                control={form.control}
                                name="imageUrl"
                                render={({ field }) => (
                                <FormItem className='space-y-0'>
                                    <FormControl>
                                        <Input placeholder="Cole uma URL ou digite um ID (ex: wiki-1)" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </div>
                        </div>
                    </FormItem>
                    
                    <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                        <FormItem>
                            <div className="flex items-center justify-between">
                            <FormLabel>Conteúdo (Markdown)</FormLabel>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={isExtracting}
                                onClick={() => {
                                    const handler = (e: Event) => {
                                        handleFileChange(e as unknown as React.ChangeEvent<HTMLInputElement>, 'markdown');
                                        fileInputRef.current?.removeEventListener('change', handler);
                                    };
                                    fileInputRef.current?.addEventListener('change', handler);
                                    fileInputRef.current?.click();
                                }}
                            >
                                {isExtracting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                Extrair de Arquivo
                            </Button>
                            </div>
                            <FormControl>
                            <Textarea {...field} className="min-h-[250px]" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </>
              )}

               <FormField
                control={form.control}
                name="tables"
                render={({ field }) => (
                  <FormItem>
                     <div className="flex items-center justify-between">
                        <FormLabel>{isGenericCollection ? 'Dados do Item (JSON)' : 'Tabelas (JSON)'}</FormLabel>
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
                              {isExtracting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                              Extrair de Arquivo
                          </Button>
                        </div>
                     </div>
                    <FormControl>
                      <Textarea {...field} className="min-h-[250px] font-mono text-xs" />
                    </FormControl>
                     <p className="text-xs text-muted-foreground">Cole o texto bruto e clique em "Formatar Texto", extraia de um arquivo, ou edite o JSON diretamente.
                     </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {!isGenericCollection && (
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
              )}

              <Button type="submit" disabled={isSaving || isExtracting || isUploadingImage || isFormatting}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Salvar Alterações
              </Button>
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
