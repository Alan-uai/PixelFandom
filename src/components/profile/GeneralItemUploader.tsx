'use client';

import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useApp } from '@/context/app-provider';
import { identifyPowersFromImage } from '@/ai/flows/identify-powers-from-image-flow';
import { findItemInGameData } from '@/lib/profile-utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PlusCircle, Sparkles, Upload, Loader2 } from 'lucide-react';

export function GeneralItemUploader({ asShortcut = false }: { asShortcut?: boolean }) {
    const { toast } = useToast();
    const { user } = useUser();
    const { firestore } = useFirebase();
    const { allGameData } = useApp();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    useEffect(() => {
        if (isDialogOpen) {
            setSelectedFiles([]);
             if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    }, [isDialogOpen]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setSelectedFiles(Array.from(event.target.files));
        }
    };

    const handleAnalyzeClick = async () => {
        if (selectedFiles.length === 0) {
            toast({
                variant: 'destructive',
                title: 'Nenhum arquivo selecionado',
                description: `Por favor, selecione um ou mais screenshots.`,
            });
            return;
        }
        if (!firestore || !user) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Usuário não autenticado.' });
            return;
        }

        setIsAnalyzing(true);
        toast({
            title: 'Analisando Imagens...',
            description: `A IA está identificando seus itens. Isso pode levar um momento.`,
        });

        try {
            const dataUris = await Promise.all(
                selectedFiles.map(file => {
                    return new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result as string);
                        reader.onerror = reject;
                        reader.readAsDataURL(file);
                    });
                })
            );
            
            const result = await identifyPowersFromImage({ images: dataUris });

            if (result && result.items) {
                let savedCount = 0;
                const notFound: string[] = [];

                for (const identifiedItem of result.items) {
                    const fullItemData = findItemInGameData(identifiedItem.name, identifiedItem.category, allGameData);

                    if (fullItemData) {
                        const itemRef = doc(firestore, 'users', user.uid, identifiedItem.category, fullItemData.id);
                        await setDoc(itemRef, fullItemData, { merge: true });
                        savedCount++;
                    } else {
                        notFound.push(`${identifiedItem.name} (${identifiedItem.category})`);
                    }
                }
                
                if (savedCount > 0) {
                  toast({
                      title: `${savedCount} ${savedCount > 1 ? 'Itens Salvos' : 'Item Salvo'}!`,
                      description: `Itens foram identificados e salvos em seu perfil.`,
                  });
                }
                
                if (notFound.length > 0) {
                    toast({
                        variant: 'destructive',
                        title: `${notFound.length} ${notFound.length > 1 ? 'itens não encontrados' : 'item não encontrado'}`,
                        description: `Não foi possível encontrar dados para: ${notFound.join(', ')}`,
                    });
                }

                 if (savedCount === 0 && notFound.length > 0) {
                     toast({
                        variant: 'destructive',
                        title: 'Nenhum item salvo',
                        description: 'A busca no cache falhou para todos os itens identificados. Verifique os nomes e os dados do jogo.',
                    });
                 }


            } else {
                 throw new Error('A IA não conseguiu identificar nenhum item.');
            }

        } catch (error: any) {
            console.error(`Erro ao analisar e salvar itens:`, error);
            toast({
                variant: 'destructive',
                title: 'Erro na Análise',
                description: error.message || `Não foi possível identificar e salvar os itens.`,
            });
        } finally {
            setIsAnalyzing(false);
            setIsDialogOpen(false); 
        }
    };

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                {asShortcut ? (
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                        <PlusCircle className="h-4 w-4" />
                    </Button>
                ) : (
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Adicionar Itens com IA
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Adicionar Itens ao seu Perfil</DialogTitle>
                    <DialogDescription>
                        Envie screenshots dos seus poderes, auras, pets, armas, etc. A IA irá identificá-los e adicioná-los automaticamente ao seu perfil na categoria correta.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <input
                        type="file"
                        ref={fileInputRef}
                        multiple
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        id="general-item-upload"
                    />
                    <label htmlFor="general-item-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted/50">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Clique para enviar</span> ou arraste e solte</p>
                            <p className="text-xs text-muted-foreground">PNG, JPG, etc.</p>
                        </div>
                    </label>

                    {selectedFiles.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                            <p>{selectedFiles.length} arquivo(s) selecionado(s):</p>
                            <ul className="list-disc pl-4">
                                {selectedFiles.map(f => <li key={f.name}>{f.name}</li>)}
                            </ul>
                        </div>
                    )}
                </div>
                <Button onClick={handleAnalyzeClick} disabled={isAnalyzing || selectedFiles.length === 0} className="w-full">
                    {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Analisar e Salvar
                </Button>
            </DialogContent>
        </Dialog>
    )
}
