'use client';

import React, { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useFirebase } from '@/firebase';
import { doc, writeBatch, collection, updateDoc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Bot, User, Send, Info, Loader2, Eye, Pencil, Database, PlusCircle, Trash2, Check, Sparkles, HelpCircle, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import type { WikiArticle } from '@/lib/types';
import { allWikiArticles } from '@/lib/wiki-data';
import { accessories } from '@/lib/accessory-data';
import Link from 'next/link';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { WorldSubcollections } from '@/components/world-subcollections';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useRouter } from 'next/navigation';
import { generateWikiArticleFromData } from '@/ai/flows/generate-wiki-from-data-flow';
import { allGameData } from '@/lib/game-data-context';
import { seedWorldData } from '@/ai/flows/seed-world-data-flow';
import { extractTextFromFile } from '@/ai/flows/extract-text-from-file-flow';
import { formatTextToJson } from '@/ai/flows/format-text-to-json-flow';


// Firestore doesn't have a native "list subcollections" API for clients.
// This is a workaround to get the subcollections by checking the backend.json.
// In a real app, this might be a dedicated metadata doc in Firestore.
import backendConfig from '@/../docs/backend.json';


const getSubcollectionsForWorld = (worldId: string): string[] => {
    if (!backendConfig.firestore || !backendConfig.firestore.structure) {
        return [];
    }
    const worldPathPrefix = `/worlds/${worldId}/`;
    const subcollections = new Set<string>();

    for (const item of backendConfig.firestore.structure) {
        if (item.path.startsWith(worldPathPrefix)) {
            const pathParts = item.path.substring(worldPathPrefix.length).split('/');
            if (pathParts[0]) {
                subcollections.add(pathParts[0]);
            }
        }
    }
    return Array.from(subcollections);
};


function SmartSeedDialog({ world, onOpenChange, open }: { world: { id: string, name: string }, onOpenChange: (open: boolean) => void, open: boolean }) {
    const { toast } = useToast();
    const firestore = useFirestore();
    const router = useRouter();
    const [isSeeding, setIsSeeding] = useState(false);
    const [fileCount, setFileCount] = useState(0);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        setFileCount(files ? files.length : 0);
    };

    const incrementDataVersion = async () => {
        if (!firestore) return;
        const metadataRef = doc(firestore, 'metadata', 'gameData');
        const docSnap = await getDoc(metadataRef);
        let newVersion = '1.0.1'; // Start with 1.0.1 if it doesn't exist

        if (docSnap.exists()) {
            const currentVersion = docSnap.data()?.version || '1.0.0';
            const versionParts = currentVersion.split('.').map(Number);
            versionParts[2]++; // Increment patch version
            newVersion = versionParts.join('.');
        }

        await setDoc(metadataRef, { version: newVersion, lastUpdatedAt: serverTimestamp() }, { merge: true });
    };

    const handleSeedData = async (e: React.FormEvent) => {
        e.preventDefault();
        const files = fileInputRef.current?.files;
        if (!files || files.length === 0) {
            toast({ variant: 'destructive', title: 'Nenhum Arquivo Selecionado', description: 'Por favor, selecione um ou mais arquivos para semear.' });
            return;
        }

        setIsSeeding(true);
        try {
            toast({ title: 'Processando Arquivos...', description: 'A IA está lendo e estruturando os dados. Isso pode levar um momento.' });

            let allExtractedText = '';
            for (const file of Array.from(files)) {
                const reader = new FileReader();
                const filePromise = new Promise<string>((resolve, reject) => {
                    reader.onload = async () => {
                        try {
                            const fileDataUri = reader.result as string;
                            const extractionType = file.type.startsWith('image/') || file.type === 'application/pdf' ? 'json' : 'markdown';
                            const rawTextResult = await extractTextFromFile({ fileDataUri, extractionType: 'markdown' });
                            if (!rawTextResult || typeof rawTextResult.extractedText === 'undefined') {
                                throw new Error(`A IA não conseguiu extrair texto do arquivo: ${file.name}`);
                            }
                            resolve(rawTextResult.extractedText);
                        } catch (error) {
                            reject(error);
                        }
                    };
                    reader.onerror = (error) => reject(error);
                    reader.readAsDataURL(file);
                });
                allExtractedText += (await filePromise) + '\n\n';
            }

            if (!allExtractedText.trim()) {
                throw new Error("A IA não conseguiu extrair nenhum texto dos arquivos fornecidos.");
            }

            const jsonResult = await formatTextToJson({ rawText: allExtractedText });
            if (!jsonResult || !jsonResult.jsonString || jsonResult.jsonString === '[]') {
                throw new Error("A IA não conseguiu formatar os dados para JSON a partir dos textos combinados.");
            }

            toast({ title: 'Semeando Dados...', description: 'Os dados foram estruturados. Agora, salvando no banco de dados.' });
            const seedResult = await seedWorldData({ worldName: world.name, worldDataJson: jsonResult.jsonString });
            
            if (seedResult) {
                await incrementDataVersion();
                toast({ title: 'Dados Semeados!', description: `Os novos dados para "${world.name}" foram adicionados com sucesso. A versão dos dados foi atualizada.` });
                onOpenChange(false);
            } else {
                throw new Error("Falha ao salvar os dados do mundo no Firestore.");
            }

        } catch (error: any) {
            console.error("Erro ao semear dados:", error);
            toast({ variant: 'destructive', title: "Erro na Semeadura", description: error.message });
        } finally {
            setIsSeeding(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Smart Seeding para "{world.name}"</DialogTitle>
                    <DialogDescription>
                        Envie arquivos (imagens de tabelas, PDFs, JSON) para adicionar ou atualizar dados neste mundo. A IA irá processá-los e salvá-los no Firestore.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSeedData}>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="world-data-file">Arquivos de Dados</Label>
                            <div className="relative">
                                <Input id="world-data-file" type="file" multiple className="pl-12 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" ref={fileInputRef} onChange={handleFileChange} />
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <UploadCloud className="h-5 w-5 text-gray-400" />
                                </div>
                            </div>
                            {fileCount > 0 && <p className="text-xs text-muted-foreground mt-2">{fileCount} arquivo(s) selecionado(s).</p>}
                        </div>
                    </div>
                    <DialogFooter>
                       <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button type="submit" disabled={isSeeding || fileCount === 0}>
                            {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                            {isSeeding ? 'Processando...' : 'Iniciar Semeadura'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}


export function WikiManagementView() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  
  const [viewingContent, setViewingContent] = useState<{ title: string; data: any, id?: string, isWorld: boolean } | null>(null);
  const [editingWorld, setEditingWorld] = useState<{ id: string, name: string } | null>(null);
  const [seedingWorld, setSeedingWorld] = useState<{ id: string, name: string } | null>(null);
  const [isPopulatingAll, setIsPopulatingAll] = useState(false);

  const [newWorldName, setNewWorldName] = useState('');
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [isGeneratingArticle, setIsGeneratingArticle] = useState(false);


  const worldsCollectionRef = useMemoFirebase(() => firestore ? collection(firestore, 'worlds') : null, [firestore]);
  const { data: worldsFromFirestore, isLoading: areWorldsLoading } = useCollection(worldsCollectionRef as any);

  const articlesCollectionRef = useMemoFirebase(() => firestore ? collection(firestore, 'wikiContent') : null, [firestore]);
  const { data: articlesFromFirestore, isLoading: areArticlesLoading } = useCollection<WikiArticle>(articlesCollectionRef as any);

  const combinedArticles = useMemo(() => {
    const firestoreIds = new Set(articlesFromFirestore?.map(a => a.id));
    const staticArticlesToAdd = allWikiArticles.filter(sa => !firestoreIds.has(sa.id));
    return [...(articlesFromFirestore || []), ...staticArticlesToAdd];
  }, [articlesFromFirestore]);

  const combinedWorlds = useMemo(() => {
    const firestoreIds = new Set(worldsFromFirestore?.map(w => w.id));
    const staticWorldsToAdd = allGameData.filter(sw => !firestoreIds.has(sw.id));
    const worlds = [...(worldsFromFirestore || []), ...staticWorldsToAdd];
    
    return worlds.sort((a, b) => {
        const idA = a.id ? parseInt(a.id, 10) : 0;
        const idB = b.id ? parseInt(b.id, 10) : 0;
        return idA - idB;
    });
  }, [worldsFromFirestore]);


    const handleViewContent = (title: string, data: any, id?: string, isWorld: boolean = false) => {
        let finalData = data;
        const staticWorldData = allGameData.find(w => w.id === id);
        if (id && staticWorldData) {
            finalData = { ...staticWorldData, ...data };
        }
        setViewingContent({ title, data: finalData, id, isWorld });
    };

  const handleOpenEditDialog = (world: { id: string, name: string }) => {
    setEditingWorld(world);
    setNewWorldName(world.name);
  };
  
  const handleCloseEditDialog = () => {
    setEditingWorld(null);
    setNewWorldName('');
  };
  
  const handleUpdateWorldName = async () => {
    if (!editingWorld || !newWorldName.trim() || !firestore) return;
  
    setIsUpdatingName(true);
    const worldRef = doc(firestore, 'worlds', editingWorld.id);
  
    try {
      await updateDoc(worldRef, { name: newWorldName });
      toast({
        title: 'Sucesso!',
        description: `O nome do mundo foi atualizado para "${newWorldName}".`
      });
      handleCloseEditDialog();
    } catch (error) {
      console.error('Erro ao atualizar o nome do mundo:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível atualizar o nome do mundo.'
      });
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleGenerateArticle = async (worldName: string, worldData: any) => {
    setIsGeneratingArticle(true);
    toast({ title: 'Gerando Artigo...', description: 'A IA está escrevendo o artigo da Wiki. Isso pode levar um momento.' });
    try {
        if (!firestore) throw new Error("Firestore não está disponível.");
        const worldRef = doc(firestore, 'worlds', worldData.id);
        const worldSnap = await getDoc(worldRef);
        const currentWorldName = worldSnap.exists() ? worldSnap.data().name : worldName;

        const result = await generateWikiArticleFromData({
            worldName: currentWorldName,
            worldDataJson: JSON.stringify(worldData)
        });

        if (result && result.wikiArticleJson) {
            sessionStorage.setItem('generated-wiki-article', result.wikiArticleJson);
            router.push('/wiki/edit/new?from-generation=true');
        } else {
            throw new Error('A IA não retornou um artigo válido.');
        }

    } catch (error: any) {
        console.error('Erro ao gerar artigo da wiki:', error);
        toast({ variant: 'destructive', title: 'Erro ao Gerar Artigo', description: error.message });
    } finally {
        setIsGeneratingArticle(false);
        setViewingContent(null);
    }
  };

    const incrementDataVersion = async () => {
        if (!firestore) return;
        const metadataRef = doc(firestore, 'metadata', 'gameData');
        const docSnap = await getDoc(metadataRef);
        let newVersion = '1.0.1';

        if (docSnap.exists()) {
            const currentVersion = docSnap.data()?.version || '1.0.0';
            const versionParts = currentVersion.split('.').map(Number);
            versionParts[2]++; 
            newVersion = versionParts.join('.');
        }

        await setDoc(metadataRef, { version: newVersion, lastUpdatedAt: serverTimestamp() }, { merge: true });
    };

  const handlePopulateAll = async () => {
    if (!firestore || !worldsFromFirestore || !articlesFromFirestore) return;
    setIsPopulatingAll(true);
    toast({ title: 'Iniciando população...', description: 'Apenas novos dados locais serão adicionados ao Firestore.' });

    try {
        const batch = writeBatch(firestore);

        // Filter for local data that is not in Firestore
        const firestoreWorldIds = new Set(worldsFromFirestore.map(w => w.id));
        const worldsToPopulate = allGameData.filter(w => w && w.id && !firestoreWorldIds.has(w.id));

        const firestoreArticleIds = new Set(articlesFromFirestore.map(a => a.id));
        const articlesToPopulate = allWikiArticles.filter(a => a && a.id && !firestoreArticleIds.has(a.id));

        if (worldsToPopulate.length === 0 && articlesToPopulate.length === 0) {
            toast({ title: 'Nenhum dado novo', description: 'Todos os dados locais já existem no Firestore.' });
            setIsPopulatingAll(false);
            return;
        }
        
        let populatedWorldsCount = 0;
        for (const worldData of worldsToPopulate) {
            await seedWorldData({ worldName: worldData.name, worldDataJson: JSON.stringify(worldData) });
            populatedWorldsCount++;
        }
        
        for (const article of articlesToPopulate) {
            const articleRef = doc(firestore, 'wikiContent', article.id);
            const articleWithTimestamp = { ...article, createdAt: serverTimestamp() };
            batch.set(articleRef, articleWithTimestamp);
        }
        
        await batch.commit();
        
        await incrementDataVersion();
        toast({ title: 'População Concluída!', description: `${populatedWorldsCount} mundos e ${articlesToPopulate.length} artigos foram adicionados.` });

    } catch (error: any) {
         console.error('Erro ao popular todos os dados:', error);
         toast({ variant: 'destructive', title: 'Erro na População em Massa', description: error.message });
    } finally {
        setIsPopulatingAll(false);
    }
  };

  return (
    <>
        <header className="space-y-2 mb-6">
            <h1 className="text-3xl font-bold tracking-tight font-headline">Gerenciar Conteúdo</h1>
            <p className="text-muted-foreground">Popule o banco de dados e gerencie os artigos da Wiki e os dados do jogo.</p>
        </header>

      <div className="p-1 md:p-4 space-y-6">
          <Card>
             <CardHeader className="flex flex-row items-start justify-between">
                <div>
                    <CardTitle>Controle Geral de Dados</CardTitle>
                    <CardDescription>
                    Utilize os botões de guia para entender como gerenciar os dados. O botão popular envia todos os dados locais para o Firestore.
                    </CardDescription>
                </div>
                <div className='flex items-center gap-2'>
                    <Button variant="outline" size="sm" onClick={handlePopulateAll} disabled={isPopulatingAll}>
                        {isPopulatingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
                        {isPopulatingAll ? 'Populando...' : 'Popular Tudo (Lib)'}
                    </Button>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="icon"><HelpCircle className="h-5 w-5"/></Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-xl">
                            <DialogHeader>
                            <DialogTitle>Guia de Gerenciamento de Mundos</DialogTitle>
                            <DialogDescription>
                                Entenda como os dados dos mundos alimentam a IA.
                            </DialogDescription>
                            </DialogHeader>
                            <div className="text-sm text-muted-foreground space-y-4">
                                <p>A seção **"Dados de Jogo por Mundo"** é a fonte da verdade para a IA quando se trata de estatísticas precisas. O Firestore é a única fonte da verdade.</p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li><strong className="text-foreground">O que são os dados?</strong> São os documentos e subcoleções (powers, npcs, pets) no Firestore. A IA usa a ferramenta `getGameData` para buscar esses dados brutos e fazer cálculos exatos.</li>
                                    <li><strong className="text-foreground">Renomear Mundo (Ícone de <Database className="inline h-4 w-4"/>):</strong> Esta ação permite que você altere o nome de exibição de um mundo diretamente no Firestore.</li>
                                    <li><strong className="text-foreground">Editar Itens:</strong> Você pode expandir cada mundo para ver suas subcoleções e editar cada item individualmente. Todas as alterações são salvas automaticamente no Firestore.</li>
                                    <li><strong className="text-foreground">Smart Seeding (Ícone de <UploadCloud className="inline h-4 w-4" />):</strong> Permite enviar arquivos (imagens de tabelas, PDFs) para popular ou atualizar em massa os dados de um mundo, poupando o trabalho manual.</li>
                                </ul>
                                <p>Manter esses dados estruturados e corretos é crucial para a IA fornecer respostas numéricas precisas.</p>
                            </div>
                        </DialogContent>
                    </Dialog>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="icon"><HelpCircle className="h-5 w-5"/></Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-xl">
                            <DialogHeader>
                            <DialogTitle>Guia de Gerenciamento da Wiki</DialogTitle>
                            <DialogDescription>
                                Entenda como os artigos da Wiki e os dados do jogo trabalham juntos.
                            </DialogDescription>
                            </DialogHeader>
                            <div className="text-sm text-muted-foreground space-y-4">
                                <p>As seções **"Artigos da Wiki"** e **"Dados de Jogo por Mundo"** são separadas, mas complementares.</p>
                                <h4 className="font-semibold text-foreground">Fluxo de Trabalho Recomendado:</h4>
                                <ol className="list-decimal pl-5 space-y-2">
                                    <li><strong className="text-foreground">Crie ou Edite um Mundo:</strong> Primeiro, certifique-se de que os dados estruturados de um mundo (ex: Mundo 23) existem no Firestore, seja criando via "Novo Mundo" ou editando um existente.</li>
                                    <li><strong className="text-foreground">Gere o Artigo (Ícone de <Sparkles className="inline h-4 w-4"/>):</strong> Visualize os dados do mundo recém-criado e clique no botão "Gerar Artigo da Wiki". A IA lerá todos os dados (poderes, npcs, etc.) e criará um artigo completo para você.</li>
                                    <li><strong className="text-foreground">Revise e Salve:</strong> Você será redirecionado para o editor da Wiki com o artigo gerado pela IA já preenchido. Revise, adicione qualquer contexto extra e salve.</li>
                                </ol>
                                <p>Este fluxo garante que sua Wiki seja um reflexo textual preciso dos dados do jogo, permitindo que a IA compreenda tanto o contexto (`wikiContent`) quanto os detalhes numéricos (`worlds` data).</p>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
          </Card>

          <Separator />

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Artigos da Wiki</CardTitle>
              <Link href="/wiki/edit/new" passHref>
                <Button variant="outline" size="sm">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Novo Artigo
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {areArticlesLoading ? (
                  <div className="col-span-full flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-3 text-muted-foreground">Carregando artigos...</span>
                  </div>
              ) : (
                combinedArticles?.map((article) => (
                  <div key={article.id} className="flex w-full">
                    <Link href={`/wiki/edit/${article.id}`} passHref className='w-full'>
                      <Button variant="outline" className="w-full justify-start">
                        {article.title}
                      </Button>
                    </Link>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                           <Button variant="ghost" size="icon" onClick={() => handleViewContent(article.title, article, article.id, false)}>
                            <Eye className="h-5 w-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Visualizar dados</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Separator />
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Dados Gerais</CardTitle>
              <Button variant="outline" size="sm" onClick={() => toast({title: "Em breve!", description: "A criação de novos dados gerais estará disponível em breve."})}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar
              </Button>
            </CardHeader>
             <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
               <div className="flex gap-2">
                  <Button disabled={true} className="w-full justify-start">
                    <Database className="mr-2 h-4 w-4" />
                    Acessórios
                  </Button>
                   <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => handleViewContent("Acessórios", accessories, undefined, false)}>
                                <Eye className="h-5 w-5" />
                            </Button>
                        </TooltipTrigger>
                         <TooltipContent>
                          <p>Visualizar dados estáticos</p>
                        </TooltipContent>
                      </Tooltip>
                   </TooltipProvider>
                </div>
            </CardContent>
          </Card>

          <Separator />

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Dados de Jogo por Mundo</CardTitle>
                <CardDescription>Clique em um mundo para ver e editar suas coleções de dados.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Link href="/admin/edit-collection/worlds/new" passHref>
                  <Button variant="outline" size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Novo Mundo
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {areWorldsLoading ? (
                <div className="col-span-full flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-3 text-muted-foreground">Carregando mundos...</span>
                </div>
              ) : (
                combinedWorlds?.map(world => {
                  const fetchedSubcollections = getSubcollectionsForWorld(world.id);
                  return (
                    <Collapsible key={world.id} className="space-y-2">
                      <div className="flex w-full items-center">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                               <Button variant="outline" size="icon" className="rounded-r-none pl-3 pr-2 border-r-0" onClick={() => handleOpenEditDialog(world)}>
                                <Database className="h-5 w-5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Renomear {world.name}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <CollapsibleTrigger asChild>
                            <Button variant="outline" className="w-full justify-start rounded-l-none rounded-r-none pl-2 border-l-0 border-r-0">
                                {world.name}
                            </Button>
                        </CollapsibleTrigger>
                         <TooltipProvider>
                           <Tooltip>
                            <TooltipTrigger asChild>
                               <Button variant="outline" size="icon" className="rounded-l-none pl-2 pr-2 border-l-0" onClick={() => setSeedingWorld(world)}>
                                <UploadCloud className="h-5 w-5" />
                              </Button>
                            </TooltipTrigger>
                             <TooltipContent>
                              <p>Smart Seed: Adicionar/Atualizar Dados para {world.name}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => handleViewContent(world.name, world, world.id, true)}>
                                  <Eye className="h-5 w-5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Visualizar dados do Firestore</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                      </div>
                      <CollapsibleContent>
                        <WorldSubcollections worldId={world.id} fetchedSubcollections={fetchedSubcollections} />
                      </CollapsibleContent>
                    </Collapsible>
                  )
                })
              )}
            </CardContent>
          </Card>
      </div>
      <Dialog open={!!viewingContent} onOpenChange={(isOpen) => !isOpen && setViewingContent(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
                <div>
                    <DialogTitle>{viewingContent?.title}</DialogTitle>
                    <DialogDescription>
                    Visualizando os dados JSON.
                    </DialogDescription>
                </div>
                 {viewingContent?.isWorld && (
                    <div className="flex items-center gap-2">
                         <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => handleGenerateArticle(viewingContent.title, viewingContent.data)} disabled={isGeneratingArticle}>
                                        {isGeneratingArticle ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                <p>Gerar Artigo da Wiki com IA</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                )}
            </div>
          </DialogHeader>
          <ScrollArea className="h-[70vh] mt-4">
            <pre className="bg-muted p-4 rounded-md text-xs whitespace-pre-wrap">
              {JSON.stringify(viewingContent?.data, null, 2)}
            </pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>
      <Dialog open={!!editingWorld} onOpenChange={(isOpen) => !isOpen && handleCloseEditDialog()}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
            <DialogTitle>Editar Nome do Mundo</DialogTitle>
            <DialogDescription>
                Altere o nome de "{editingWorld?.name}" e clique em salvar.
            </DialogDescription>
            </DialogHeader>
            <div className="flex items-center space-x-2 py-4">
                <div className="grid flex-1 gap-2">
                    <Label htmlFor="world-name" className="sr-only">
                    Nome
                    </Label>
                    <Input
                    id="world-name"
                    value={newWorldName}
                    onChange={(e) => setNewWorldName(e.target.value)}
                    />
                </div>
                <Button type="submit" size="icon" className="px-3" disabled={isUpdatingName} onClick={handleUpdateWorldName}>
                    {isUpdatingName ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Check className="h-4 w-4" />
                    )}
                    <span className="sr-only">Salvar</span>
                </Button>
            </div>
        </DialogContent>
    </Dialog>

    {seedingWorld && (
        <SmartSeedDialog
            open={!!seedingWorld}
            onOpenChange={(isOpen) => {
                if (!isOpen) setSeedingWorld(null);
            }}
            world={seedingWorld}
        />
    )}
    </>
  );
}
