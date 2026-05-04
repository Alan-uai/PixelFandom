'use client';

import { useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, deleteDoc, updateDoc, setDoc } from 'firebase/firestore';
import Link from 'next/link';
import { Button } from './ui/button';
import { Loader2, PlusCircle, Trash2, ChevronRight, Check } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { useToast } from '@/hooks/use-toast';
import { useState, useMemo, useEffect } from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useRouter } from 'next/navigation';
import { Textarea } from './ui/textarea';
import backendSchema from '@/../docs/backend.json';
import { ScrollArea } from './ui/scroll-area';
import { nanoid } from 'nanoid';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { useCollection } from '@/firebase/firestore/use-collection';


const DEFAULT_SUBCOLLECTIONS = ['powers', 'npcs', 'pets', 'dungeons', 'shadows', 'stands', 'accessories'];

function getEntitySchemaForSubcollection(subcollectionName: string) {
    // If the subcollection is 'stats', we know its entity is 'PowerStat'
    if (subcollectionName === 'stats') {
        return (backendSchema.entities as Record<string, any>)['PowerStat'];
    }

    if (!backendSchema.firestore || !backendSchema.firestore.structure) return null;
    
    // Find the definition in the firestore structure
    const structureDef = backendSchema.firestore.structure.find(s => {
        const pathEnd = s.path.split('/').slice(-2)[0];
        // e.g. /worlds/{worldId}/powers/{powerId} -> 'powers'
        return pathEnd === subcollectionName;
    });

    const entityName = structureDef?.definition.entityName;

    if (!entityName || !(entityName in backendSchema.entities)) {
        return null;
    }

    return (backendSchema.entities as Record<string, any>)[entityName];
}

function InlineItemEditor({ item, itemRef, subcollectionName }: { item: any, itemRef: any, subcollectionName: string }) {
    const { toast } = useToast();
    const [localData, setLocalData] = useState(item);
    
    const [isCustomFieldOpen, setIsCustomFieldOpen] = useState(false);
    const [newFieldKey, setNewFieldKey] = useState('');
    const [newFieldValue, setNewFieldValue] = useState('');
    
    const entitySchema = useMemo(() => getEntitySchemaForSubcollection(subcollectionName), [subcollectionName]);
    
    const suggestedFields = useMemo(() => {
        if (!entitySchema || !entitySchema.properties) return [];
        const existingKeys = Object.keys(localData);
        return Object.keys(entitySchema.properties).filter(propKey => !existingKeys.includes(propKey));
    }, [entitySchema, localData]);

    // Update local state if the external item data changes
    useEffect(() => {
      setLocalData(item);
    }, [item]);

    const handleFieldChange = (key: string, value: any) => {
        const keys = key.split('.');
        setLocalData((prev: any) => {
            const newData = { ...prev };
            let current = newData;
            for (let i = 0; i < keys.length - 1; i++) {
                if (current[keys[i]] === undefined || typeof current[keys[i]] !== 'object') {
                    // This part is tricky if the path doesn't exist. For now, assume it does for simplicity.
                    return prev;
                }
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
            return newData;
        });
    };
    
    const handleSaveField = async (key: string, valueToSave: any) => {
        try {
            await updateDoc(itemRef, { [key]: valueToSave });
            toast({
                title: 'Campo Atualizado!',
                description: `O campo "${key}" foi salvo com sucesso.`,
            });
        } catch (error: any) {
            console.error("Erro ao atualizar campo:", error);
            toast({ variant: 'destructive', title: "Erro ao Salvar", description: error.message });
            setLocalData(item); // Revert on error
        }
    };

    const handleAddNewField = async (keyToAdd: string, defaultValue: any = '') => {
        if (!keyToAdd.trim()) {
            toast({ variant: 'destructive', title: 'Erro', description: 'O nome do campo não pode ser vazio.' });
            return;
        }
        try {
            await updateDoc(itemRef, { [keyToAdd]: defaultValue });
            toast({ title: 'Campo Adicionado!', description: `O campo "${keyToAdd}" foi adicionado.` });
            setLocalData({ ...localData, [keyToAdd]: defaultValue });
            
            // Close popover if it was used for custom field
            setIsCustomFieldOpen(false);
            setNewFieldKey('');
            setNewFieldValue('');

        } catch (error: any) {
             console.error("Erro ao adicionar campo:", error);
            toast({ variant: 'destructive', title: "Erro ao Adicionar", description: error.message });
        }
    };


    const renderField = (key: string, value: any, prefix = '') => {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        const propertySchema = entitySchema?.properties?.[key];

        if (key === 'boosts' && Array.isArray(value)) {
            return (
                <div key={fullKey} className="space-y-3">
                    <Label className="capitalize font-semibold text-primary">{key}</Label>
                    <div className="pl-4 space-y-3 border-l-2">
                        {value.map((boost, index) => (
                            <div key={index} className="p-2 border rounded-md bg-background/50 space-y-2">
                                <p className="text-xs font-medium text-muted-foreground">Boost {index + 1}</p>
                                <div className="space-y-2">
                                    <Label htmlFor={`${fullKey}.${index}.type`} className='text-xs'>Type</Label>
                                    <Input
                                        id={`${fullKey}.${index}.type`}
                                        value={boost.type}
                                        onChange={(e) => handleFieldChange(`${fullKey}.${index}.type`, e.target.value)}
                                        onBlur={(e) => handleSaveField(fullKey, localData[key])}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`${fullKey}.${index}.value`} className='text-xs'>Value</Label>
                                    <Input
                                        id={`${fullKey}.${index}.value`}
                                        value={boost.value}
                                        onChange={(e) => handleFieldChange(`${fullKey}.${index}.value`, e.target.value)}
                                        onBlur={(e) => handleSaveField(fullKey, localData[key])}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )
        }

        if (propertySchema?.enum) {
            return (
                 <div key={fullKey} className="space-y-2">
                    <Label htmlFor={fullKey} className="capitalize">{key}</Label>
                    <Select
                        value={value}
                        onValueChange={(newValue) => {
                            handleFieldChange(fullKey, newValue);
                            handleSaveField(fullKey, newValue);
                        }}
                    >
                        <SelectTrigger id={fullKey}>
                            <SelectValue placeholder={`Selecione um(a) ${key}`} />
                        </SelectTrigger>
                        <SelectContent>
                            {propertySchema.enum.map((option: string) => (
                                <SelectItem key={option} value={option}>{option}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                 </div>
            )
        }

        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
             return (
                <div key={fullKey} className="space-y-2 p-2 border rounded-md bg-background/50">
                    <Label className="font-semibold capitalize text-primary">{key}</Label>
                    <div className="pl-4 space-y-2">
                        {Object.entries(value).map(([subKey, subValue]) => renderField(subKey, subValue, fullKey))}
                    </div>
                </div>
             )
        }
        
        if (typeof value === 'object' && value !== null && Array.isArray(value)) {
            const jsonString = JSON.stringify(value, null, 2);
             return (
                <div key={fullKey} className="space-y-2">
                    <Label htmlFor={fullKey} className="capitalize">{key}</Label>
                    <Textarea
                        id={fullKey}
                        value={jsonString}
                        className="font-mono text-xs min-h-[100px]"
                        onChange={(e) => {
                             try {
                                const parsed = JSON.parse(e.target.value);
                                handleFieldChange(fullKey, parsed);
                            } catch (err) {
                               // Silently ignore invalid JSON during typing
                            }
                        }}
                        onBlur={() => handleSaveField(fullKey, value)}
                    />
                </div>
            )
        }
        
        const isLongText = typeof value === 'string' && value.length > 70;
        return (
            <div key={fullKey} className="space-y-2">
                <Label htmlFor={fullKey} className="capitalize">{key}</Label>
                 {isLongText ? (
                    <Textarea
                        id={fullKey}
                        value={value}
                        onChange={(e) => handleFieldChange(fullKey, e.target.value)}
                        onBlur={(e) => handleSaveField(fullKey, e.target.value)}
                    />
                ) : (
                    <Input
                        id={fullKey}
                        type={typeof value === 'number' ? 'number' : 'text'}
                        value={value}
                        onChange={(e) => handleFieldChange(fullKey, e.target.value)}
                        onBlur={(e) => handleSaveField(fullKey, e.target.value)}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="p-3 bg-muted/50 rounded-md border space-y-4">
             {Object.entries(localData).filter(([key]) => key !== 'id').map(([key, value]) => renderField(key, value))}
             
             <div className='pt-4 border-t border-dashed'>
                <p className="text-xs text-muted-foreground mb-2">Sugestões de Campos:</p>
                <div className="flex flex-wrap gap-2">
                    {suggestedFields.map(field => {
                        const propertySchema = entitySchema?.properties?.[field];
                        let defaultValue: any = '';
                        if (propertySchema?.enum) {
                            defaultValue = propertySchema.enum[0];
                        } else if (propertySchema?.type === 'array') {
                            defaultValue = [];
                        } else if (propertySchema?.type === 'object') {
                             defaultValue = {};
                        }
                        return (
                            <Button key={field} variant="outline" size="sm" onClick={() => handleAddNewField(field, defaultValue)}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar {field}
                            </Button>
                        )
                    })}
                </div>
            </div>

             <Popover open={isCustomFieldOpen} onOpenChange={setIsCustomFieldOpen}>
                <PopoverTrigger asChild>
                    <Button variant="ghost" className="w-full justify-center text-xs text-muted-foreground" onClick={() => setIsCustomFieldOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4"/> Adicionar Campo Personalizado
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <h4 className="font-medium leading-none">Campo Personalizado</h4>
                            <p className="text-sm text-muted-foreground">
                            Adicione um campo que não está nas sugestões.
                            </p>
                        </div>
                        <div className="grid gap-2">
                            <div className="grid grid-cols-3 items-center gap-4">
                            <Label htmlFor="width">Chave</Label>
                            <Input
                                id="width"
                                value={newFieldKey}
                                onChange={(e) => setNewFieldKey(e.target.value)}
                                className="col-span-2 h-8"
                                placeholder='ex: cooldown'
                            />
                            </div>
                            <div className="grid grid-cols-3 items-center gap-4">
                            <Label htmlFor="maxWidth">Valor</Label>
                            <Input
                                id="maxWidth"
                                value={newFieldValue}
                                onChange={(e) => setNewFieldValue(e.target.value)}
                                className="col-span-2 h-8"
                                placeholder='ex: 2s'
                            />
                            </div>
                        </div>
                         <Button onClick={() => handleAddNewField(newFieldKey, newFieldValue)}>Salvar Campo</Button>
                    </div>
                </PopoverContent>
            </Popover>

        </div>
    );
}

function AddNewItemDialog({ subcollectionName, subcollectionRef, triggerButton }: { subcollectionName: string; subcollectionRef: any; triggerButton: React.ReactNode; }) {
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
  
    const handleCreateItem = async () => {
      if (!newItemName.trim() || !subcollectionRef) return;
  
      setIsCreating(true);
      const newItemId = newItemName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

      if (!newItemId) {
        toast({ variant: 'destructive', title: 'Nome Inválido', description: 'Por favor, insira um nome que possa ser convertido em um ID.' });
        setIsCreating(false);
        return;
      }

      const newItemRef = doc(subcollectionRef, newItemId);
  
      try {
        await setDoc(newItemRef, { name: newItemName, id: newItemId });
        toast({ title: "Item Criado!", description: `O item "${newItemName}" foi adicionado a ${subcollectionName}.` });
        setNewItemName('');
        setIsOpen(false);
      } catch (error: any) {
        console.error("Erro ao criar item:", error);
        toast({ variant: "destructive", title: "Erro ao Criar", description: error.message });
      } finally {
        setIsCreating(false);
      }
    };
  
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <div onClick={() => setIsOpen(true)}>
          {triggerButton}
        </div>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar em <span className='capitalize text-primary'>{subcollectionName}</span></DialogTitle>
            <DialogDescription>
              Dê um nome para o novo item. Você poderá adicionar mais detalhes depois.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="item-name">Nome do Item</Label>
            <Input
              id="item-name"
              placeholder={`ex: Poder do Trovão`}
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateItem()}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
            <Button type="submit" onClick={handleCreateItem} disabled={isCreating}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

export function WorldSubcollections({ worldId, fetchedSubcollections }: { worldId: string, fetchedSubcollections: string[] }) {
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);

    const handleDelete = async (collectionPath: string, itemId: string) => {
        if (!firestore) return;
        const itemRef = doc(firestore, collectionPath, itemId);
        try {
            await deleteDoc(itemRef);
            toast({ title: "Item Removido", description: "O item foi removido com sucesso." });
        } catch (error: any) {
            console.error("Erro ao remover item:", error);
            toast({ variant: 'destructive', title: "Erro ao Remover", description: error.message });
        }
    };
    
    const handleCreateCategory = () => {
      if (!newCategoryName.trim()) {
        toast({ variant: 'destructive', title: 'Nome Inválido', description: 'O nome da categoria não pode estar vazio.' });
        return;
      }
      setIsCreatingCategory(true);
      const slug = newCategoryName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const newPath = `/wiki/edit/new?collectionPath=worlds/${worldId}/${slug}`;
      // Instead of navigating, we'll just close the dialog. The new category will appear.
      // We might need a way to refresh the subcollection list though. For now, let's keep it simple.
      toast({ title: "Ação necessária", description: `Agora adicione um item à sua nova categoria "${slug}" para que ela apareça.` });
      router.push(newPath);
      setIsAddCategoryOpen(false);
      setNewCategoryName('');
      setIsCreatingCategory(false);
    }

    const allSubcollections = Array.from(new Set([...DEFAULT_SUBCOLLECTIONS, ...fetchedSubcollections]));

    return (
        <div className="pl-4 pt-2 space-y-2">
            {allSubcollections.map(subcollectionName => (
                <SubcollectionItems 
                    key={subcollectionName} 
                    worldId={worldId} 
                    subcollectionName={subcollectionName}
                    onDelete={(itemId) => handleDelete(`worlds/${worldId}/${subcollectionName}`, itemId)}
                />
            ))}
             <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
                <Button variant="ghost" className="w-full justify-start text-sm capitalize text-muted-foreground" onClick={() => setIsAddCategoryOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Nova Categoria
                </Button>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                    <DialogTitle>Criar Nova Categoria</DialogTitle>
                    <DialogDescription>
                        Dê um nome para a nova categoria de dados dentro deste mundo (ex: "missões", "itens").
                    </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center space-x-2 py-4">
                        <div className="grid flex-1 gap-2">
                            <Label htmlFor="category-name" className="sr-only">
                                Nome da Categoria
                            </Label>
                            <Input
                                id="category-name"
                                placeholder="ex: missoes"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsAddCategoryOpen(false)}>Cancelar</Button>
                        <Button type="submit" onClick={handleCreateCategory} disabled={isCreatingCategory}>
                          {isCreatingCategory && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Criar e Adicionar Item
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

interface SubcollectionItemsProps {
    worldId: string;
    subcollectionName: string;
    onDelete: (itemId: string) => void;
}

function SubcollectionItems({ worldId, subcollectionName, onDelete }: SubcollectionItemsProps) {
    const firestore = useFirestore();
    const subcollectionRef = useMemoFirebase(() => firestore ? collection(firestore, 'worlds', worldId, subcollectionName) : null, [firestore, worldId, subcollectionName]);
    const { data: items, isLoading } = useCollection(subcollectionRef as any);

    if (isLoading) {
        return (
            <div className="flex items-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Carregando {subcollectionName}...
            </div>
        );
    }

    if (!items || items.length === 0) {
        return (
            <AddNewItemDialog
                subcollectionName={subcollectionName}
                subcollectionRef={subcollectionRef}
                triggerButton={
                    <Button variant="ghost" className="w-full justify-start text-sm capitalize text-muted-foreground">
                        + Adicionar em {subcollectionName}
                    </Button>
                }
            />
        );
    }

    const hasStatsSubcollection = (item: any) => {
        // This is a heuristic. In a real app, you might have this in metadata.
        return subcollectionName === 'powers' && item.type === 'gacha';
    };

    return (
        <Collapsible>
            <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between text-sm capitalize">
                   <span>{subcollectionName} ({items.length})</span>
                   <ChevronRight className="h-4 w-4 transform transition-transform duration-200 group-data-[state=open]:rotate-90"/>
                </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-4 pt-2 space-y-2">
                {items.map((item: any) => {
                    const itemRef = doc(firestore!, 'worlds', worldId, subcollectionName, item.id);
                    return (
                        <Collapsible key={item.id}>
                             <div className="flex items-center justify-between group">
                                <CollapsibleTrigger asChild>
                                   <Button variant="ghost" className="w-full justify-start text-xs h-8">
                                       <ChevronRight className="mr-2 h-3 w-3 transform transition-transform duration-200 group-data-[state=open]:rotate-90"/>
                                       {item.name || item.id}
                                   </Button>
                                </CollapsibleTrigger>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive transition-opacity data-[state=open]:opacity-100 md:opacity-0 md:group-hover:opacity-100">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Esta ação não pode ser desfeita. Isso excluirá permanentemente o item
                                        <span className='font-bold text-foreground'> {item.name || item.id} </span>
                                        do banco de dados.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => onDelete(item.id)}>Excluir</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                            </div>
                            <CollapsibleContent className="pl-6 pr-2 py-2">
                                <div className='space-y-4'>
                                    <InlineItemEditor item={item} itemRef={itemRef} subcollectionName={subcollectionName} />

                                    {hasStatsSubcollection(item) && (
                                        <div className='pl-4 border-l-2 border-dashed'>
                                            <SubcollectionItems
                                                worldId={worldId}
                                                subcollectionName={`${subcollectionName}/${item.id}/stats`}
                                                onDelete={(statId) => onDelete(statId)} // Pass the onDelete down
                                            />
                                        </div>
                                    )}
                                </div>
                            </CollapsibleContent>
                        </Collapsible>
                    )
                })}
                <AddNewItemDialog
                    subcollectionName={subcollectionName}
                    subcollectionRef={subcollectionRef}
                    triggerButton={
                        <Button variant="ghost" className="w-full justify-start text-xs text-muted-foreground">
                            <PlusCircle className="mr-2 h-4 w-4"/> Adicionar Novo
                        </Button>
                    }
                />
            </CollapsibleContent>
        </Collapsible>
    );
}
