
'use client';

import { useState, useMemo, useRef } from 'react';
import { useUser, useFirebase, useMemoFirebase, useCollection } from '@/firebase';
import { doc, setDoc, deleteDoc, collection } from 'firebase/firestore';
import { useApp } from '@/context/app-provider';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { RarityBadge, getRarityClass } from './RarityBadge';
import { BonusDisplay } from './BonusDisplay';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Loader2, Trash2 } from 'lucide-react';
import { Separator } from '../ui/separator';
import { allGamepasses } from '@/lib/gamepass-data';
import { accessories } from '@/lib/accessory-data';

export function InteractiveGridCategory({ subcollectionName, itemTypeFilter }: { subcollectionName: string; gridData?: any[]; itemTypeFilter?: string; }) {
    const { user } = useUser();
    const { firestore } = useFirebase();
    const { allGameData } = useApp();
    const { toast } = useToast();
    
    const itemsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return collection(firestore, 'users', user.uid, subcollectionName);
    }, [firestore, user, subcollectionName]);

    const { data: equippedItems, isLoading } = useCollection(itemsQuery);
    
    const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
    const [levelingPopover, setLevelingPopover] = useState<string | null>(null);
    const [currentLevelingValue, setCurrentLevelingValue] = useState(0);
    
    const allItems = useMemo(() => {
        if (subcollectionName === 'gamepasses') return allGamepasses;
        if (subcollectionName === 'accessories') return accessories;

        let items;
        const nonEquippablePowerNames = [
            'Weapon Evolution', 'Stand Evolution', 'Titan Evolution', 'Chakra Progression', 'Breathings', 'Bankai'
        ];

        if (subcollectionName === 'powers') {
            items = allGameData.flatMap(world => world.powers || [])
            .filter(power => 
                power && 
                power.id && 
                !nonEquippablePowerNames.includes(power.name)
             );
        } else if (itemTypeFilter) {
            items = allGameData.flatMap(world => (world.fighters || [])).filter(item => item && item.id && item.type === itemTypeFilter);
        }
        else {
            items = allGameData.flatMap(world => world[subcollectionName] || []).filter(item => item && item.id);
        }
        return items;

    }, [allGameData, subcollectionName, itemTypeFilter]);

    const handleEquipItem = async (item: any, rarityOrLevel?: string | number) => {
        if (!itemsQuery) return;
        
        // Aura limit check
        if (subcollectionName === 'auras' && equippedItems && equippedItems.length >= 2) {
             toast({
                variant: 'destructive',
                title: 'Limite de Auras Atingido',
                description: 'Você só pode equipar no máximo 2 auras.',
            });
            setOpenPopoverId(null);
            return;
        }

        let dataToSave: any = { id: item.id, name: item.name };
        
        if (typeof rarityOrLevel === 'string') {
            dataToSave.rarity = rarityOrLevel;
        } else if (typeof rarityOrLevel === 'number') {
            dataToSave.leveling = rarityOrLevel;
        }

        if (item.bonus_type && item.bonus_value) {
            dataToSave[item.bonus_type + '_bonus'] = item.bonus_value;
        }

        const itemRef = doc(itemsQuery, item.id);

        try {
            await setDoc(itemRef, dataToSave, { merge: true });
            toast({ title: 'Item Equipado!', description: `${item.name} foi equipado/atualizado.` });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erro', description: `Não foi possível equipar ${item.name}.` });
        } finally {
            setOpenPopoverId(null);
        }
    };

    const handleUnequipItem = async (itemId: string) => {
        if (!itemsQuery) return;
        const itemRef = doc(itemsQuery, itemId);
        try {
            await deleteDoc(itemRef);
            toast({ title: 'Item Removido' });
        } catch (error) {
             toast({ variant: 'destructive', title: 'Erro', description: `Não foi possível remover o item.` });
        } finally {
             setOpenPopoverId(null);
        }
    }
    
    const handleLevelingChange = async (itemId: string, level: number) => {
        if (!itemsQuery) return;
        const itemRef = doc(itemsQuery, itemId);
        try {
            await setDoc(itemRef, { leveling: level }, { merge: true });
        } catch (error) {
            console.error(error);
        }
    };

    const handleItemClick = (item: any, isEquipped: boolean) => {
        if (isEquipped) {
            handleUnequipItem(item.id);
        } else {
            handleEquipItem(item);
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-full w-full"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
    }

    const uniqueItems = allItems.filter((item, index, self) =>
        index === self.findIndex((t) => (t.id === item.id))
    );
    
    return (
        <div className="w-full">
            <BonusDisplay items={equippedItems} category={subcollectionName} />
            <div className="grid grid-cols-5 gap-2 w-full">
                {uniqueItems.map((item) => {
                    const equippedItemData = equippedItems?.find(i => i.id === item.id);
                    const isEquipped = !!equippedItemData;
                    
                    const popoverOptions = item.stats || item.rarity_options || [];
                    const isProgressionPower = item.type === 'progression' && item.maxLevel;

                    let selectedRarity = 'Common'; // Default rarity if not specified
                    let displayText = item.name;

                    if (isEquipped) {
                        if (isProgressionPower) {
                            const currentLevel = (equippedItemData as any)?.leveling || 0;
                            displayText = `${currentLevel}/${item.maxLevel}`;
                            selectedRarity = 'Rare'; // Placeholder
                        } else if (subcollectionName === 'gamepasses' || subcollectionName === 'auras') {
                            selectedRarity = 'Epic'; // Placeholder for equipped gamepass/aura color
                            displayText = item.name;
                        } else if (popoverOptions.length > 0) {
                            const equippedRarity = (equippedItemData as any)?.rarity;
                            const selectedOption = popoverOptions.find((opt: any) => opt.rarity === equippedRarity);
                             if (selectedOption) {
                                selectedRarity = selectedOption.rarity;
                                displayText = selectedOption.name || item.name;
                            } else {
                                selectedRarity = equippedRarity || 'Common';
                                displayText = item.name;
                            }
                        } else {
                            selectedRarity = item.rarity || 'Common';
                            displayText = item.name;
                        }
                    }

                    const cardBgClass = isEquipped ? getRarityClass(selectedRarity) : 'bg-muted/30';
                    const hasLeveling = item.leveling && typeof item.leveling.maxLevel !== 'undefined';
                    const currentLeveling = (equippedItemData as any)?.leveling || 0;
                    
                    const isSingleClickItem = subcollectionName === 'gamepasses' || subcollectionName === 'auras';
                    const isSpecialRarity = selectedRarity === 'Supreme' || selectedRarity === 'Phantom';

                    return (
                        <Popover key={item.id} open={!isSingleClickItem && openPopoverId === item.id} onOpenChange={(isOpen) => !isOpen && setOpenPopoverId(null)}>
                            <PopoverTrigger asChild>
                                <button
                                    onClick={() => isSingleClickItem ? handleItemClick(item, isEquipped) : setOpenPopoverId(item.id)}
                                    className={cn(
                                        'aspect-square flex flex-col items-center justify-center p-1 text-center relative overflow-hidden border-2 transition-all duration-200 group rounded-md',
                                        isEquipped ? 'border-primary/50' : 'border-transparent hover:border-primary/50',
                                        cardBgClass,
                                        isEquipped && isSpecialRarity && 'border-solid' 
                                    )}
                                >
                                     {hasLeveling && isEquipped && (
                                         <Popover open={levelingPopover === item.id} onOpenChange={(isOpen) => !isOpen && setLevelingPopover(null)}>
                                            <PopoverTrigger asChild>
                                                 <div 
                                                    className="absolute top-1 right-1 h-5 w-5 flex items-center justify-center bg-black/50 rounded-full text-white text-[10px] font-bold z-20 cursor-pointer"
                                                    onClick={(e) => { e.stopPropagation(); setCurrentLevelingValue(currentLeveling); setLevelingPopover(item.id); }}
                                                 >
                                                    {currentLeveling}
                                                </div>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-56 p-4">
                                                <div className="space-y-4">
                                                    <Label htmlFor="leveling-slider" className='text-sm'>Leveling ({currentLevelingValue}/{item.leveling.maxLevel})</Label>
                                                    <Slider
                                                        id="leveling-slider"
                                                        min={0}
                                                        max={item.leveling.maxLevel}
                                                        step={1}
                                                        value={[currentLevelingValue]}
                                                        onValueChange={(value) => setCurrentLevelingValue(value[0])}
                                                        onValueCommit={(value) => handleLevelingChange(item.id, value[0])}
                                                    />
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    )}

                                    <p className="text-[10px] lg:text-xs font-bold leading-tight z-10 group-hover:scale-105 transition-transform">{displayText}</p>

                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <div className="flex flex-col">
                                    {popoverOptions && popoverOptions.length > 0 && popoverOptions.map((opt: any) => (
                                        <Button key={opt.id || opt.rarity} variant="ghost" className={cn("rounded-none justify-start", getRarityClass(opt.rarity))} onClick={() => handleEquipItem(item, opt.rarity)}>
                                            <span className='font-semibold'>{opt.name || opt.rarity}</span>
                                        </Button>
                                    ))}
                                    {isProgressionPower && (
                                        <div className="p-4 space-y-4">
                                            <Label htmlFor="level-slider" className='text-sm'>{item.name} Level ({(equippedItemData as any)?.leveling || 0}/{item.maxLevel})</Label>
                                            <Slider
                                                id="level-slider"
                                                min={0}
                                                max={item.maxLevel}
                                                step={1}
                                                defaultValue={[(equippedItemData as any)?.leveling || 0]}
                                                onValueCommit={(value) => handleEquipItem(item, value[0])}
                                            />
                                        </div>
                                    )}
                                    {isEquipped && (
                                        <>
                                            <Separator />
                                            <Button variant="ghost" className="w-full justify-center text-destructive rounded-none" onClick={() => handleUnequipItem(item.id)}>
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Remover
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </PopoverContent>
                        </Popover>
                    );
                })}
            </div>
        </div>
    );
}
