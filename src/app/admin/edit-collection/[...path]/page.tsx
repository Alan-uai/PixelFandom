'use client';

import { useParams, useRouter, redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAdmin } from '@/hooks/use-admin';
import { Loader2, ShieldAlert, ChevronRight, Files, PlusCircle, Pencil, Trash2, Save, Upload } from 'lucide-react';
import { useFirestore, useDoc, useCollection, useMemoFirebase, useFirebase } from '@/firebase';
import { doc, collection, deleteDoc, setDoc } from 'firebase/firestore';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { extractTextFromFile } from '@/ai/flows/extract-text-from-file-flow';
import { formatTextToJson } from '@/ai/flows/format-text-to-json-flow';
import { seedWorldData } from '@/ai/flows/seed-world-data-flow';

function NewWorldForm() {
    const router = useRouter();
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const [worldName, setWorldName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [fileCount, setFileCount] = useState(0);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        setFileCount(files ? files.length : 0);
    };

    const handleCreateWorld = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!worldName.trim() || !firestore) return;

        setIsCreating(true);
        const files = fileInputRef.current?.files;

        try {
            // Case 1: No files, just create the world document
            if (!files || files.length === 0) {
                const worldId = worldName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                if (!worldId) {
                    toast({ variant: 'destructive', title: 'Nome Inválido', description: 'Por favor, insira um nome de mundo válido.' });
                    setIsCreating(false);
                    return;
                }
                const worldRef = doc(firestore, 'worlds', worldId);
                await setDoc(worldRef, { name: worldName });
                toast({ title: 'Mundo Criado!', description: `O mundo "${worldName}" foi criado. Você pode adicionar coleções a ele agora.` });
                router.push(`/admin/manage-content`);
                return;
            }

            // Case 2: Files provided, start the Smart Seeding process
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

            // Step 2: Format the combined extracted text into a structured JSON
            const jsonResult = await formatTextToJson({ rawText: allExtractedText });
             if (!jsonResult || !jsonResult.jsonString || jsonResult.jsonString === '[]') {
                throw new Error("A IA não conseguiu formatar os dados para JSON a partir dos textos combinados.");
            }

            // Step 3: Seed the data into Firestore using the new flow
            toast({ title: 'Semeando Dados...', description: 'Os dados foram estruturados. Agora, salvando no banco de dados.' });
            const seedResult = await seedWorldData({ worldName, worldDataJson: jsonResult.jsonString });
            
            if (seedResult) {
                toast({ title: 'Mundo Criado e Populado!', description: `O mundo "${worldName}" e seus dados foram criados com sucesso.` });
                router.push('/admin/manage-content');
            } else {
                throw new Error("Falha ao salvar os dados do mundo no Firestore.");
            }

        } catch (error: any) {
            console.error("Erro ao criar mundo:", error);
            toast({ variant: 'destructive', title: "Erro ao Criar", description: error.message });
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Criar Novo Mundo</CardTitle>
                    <CardDescription>
                       Dê um nome ao seu novo mundo. Opcionalmente, envie um ou mais arquivos de dados (.json, imagem, pdf) para populá-lo automaticamente (Smart Seeding).
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleCreateWorld}>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="world-name">Nome do Mundo</Label>
                            <Input
                                id="world-name"
                                value={worldName}
                                onChange={(e) => setWorldName(e.target.value)}
                                placeholder="ex: Ilha da Sombra"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="world-data-file">Arquivos de Dados (Opcional)</Label>
                            <div className="relative">
                                <Input id="world-data-file" type="file" multiple className="pl-12 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" ref={fileInputRef} onChange={handleFileChange} />
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <Upload className="h-5 w-5 text-gray-400" />
                                </div>
                            </div>
                             {fileCount > 0 && <p className="text-xs text-muted-foreground mt-2">{fileCount} arquivo(s) selecionado(s).</p>}
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={isCreating}>
                            {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            {isCreating ? 'Processando...' : 'Criar Mundo'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}

export default function EditCollectionPage() {
  const params = useParams();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { isAdmin, isLoading: isAdminLoading } = useAdmin();

  const pathSegments = Array.isArray(params.path) ? params.path : [params.path];
  const isNew = pathSegments.at(-1) === 'new';
  
  const queryPath = isNew ? pathSegments.slice(0, -1) : pathSegments;
  const collectionPath = queryPath.join('/');
  
  const isSubCollection = queryPath.length > 2;
  const subCollectionName = isSubCollection ? queryPath[2] : null;

  const isWorldContext = queryPath[0] === 'worlds';
  const worldId = isWorldContext && queryPath.length > 1 ? queryPath[1] : null;
  
  // Special view for creating a new world
  if (isNew && queryPath.length === 1 && queryPath[0] === 'worlds') {
    return <NewWorldForm />;
  }

  const worldRef = useMemoFirebase(() => {
    if (!firestore || !worldId) return null;
    return doc(firestore, 'worlds', worldId);
  }, [firestore, worldId]);

  const subCollectionRef = useMemoFirebase(() => {
    if (!firestore || !worldId || !subCollectionName) return null;
    return collection(firestore, 'worlds', worldId, subCollectionName);
  }, [firestore, worldId, subCollectionName]);

  const { data: worldData, isLoading: isWorldLoading } = useDoc(worldRef);
  const { data: subCollectionData, isLoading: isSubCollectionLoading } = useCollection(subCollectionRef as any);

  const handleDelete = async (itemId: string) => {
    if (!subCollectionRef) return;
    try {
      await deleteDoc(doc(subCollectionRef, itemId));
      toast({ title: "Item Removido", description: "O item foi removido com sucesso da coleção." });
    } catch (error: any) {
      console.error("Erro ao remover item:", error);
      toast({ variant: 'destructive', title: "Erro ao Remover", description: error.message });
    }
  };

  const isLoading = isAdminLoading || isWorldLoading || isSubCollectionLoading;

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

  // Fallback for any other path
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
        <ShieldAlert className="h-16 w-16 mb-4 text-destructive" />
        <h1 className="text-2xl font-bold">Caminho Inválido</h1>
        <p className="text-muted-foreground mt-2">O caminho <code className="bg-muted px-1 py-0.5 rounded text-sm font-semibold">{collectionPath}</code> não é uma rota de edição válida.</p>
    </div>
  );
}

    