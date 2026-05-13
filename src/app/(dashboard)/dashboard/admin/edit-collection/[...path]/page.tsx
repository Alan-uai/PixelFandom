'use client';

import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAdmin } from '@/hooks/use-admin';
import { Loader2, ShieldAlert, Upload, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/supabase';

function NewWorldForm() {
    const router = useRouter();
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
        if (!worldName.trim()) return;

        setIsCreating(true);
        toast({ title: 'Funcionalidade em desenvolvimento', description: 'A funcionalidade de criação de mundo será implementada em breve.' });
        setIsCreating(false);
        router.push('/admin/manage-content');
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
  
  const worldData = null;
  const isWorldLoading = false;
  const subCollectionData = null;
  const isSubCollectionLoading = false;
  
  const handleDelete = async (itemId: string) => {
    try {
      const table = isWorldContext ? 'worlds' : collectionPath;
      const { error } = await supabase.from(table).delete().eq('id', itemId);
      if (error) throw error;
      toast({ title: "Item excluído", description: "O item foi removido com sucesso." });
      router.refresh();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast({ variant: 'destructive', title: 'Erro ao Excluir', description: 'Não foi possível excluir o item.' });
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

    