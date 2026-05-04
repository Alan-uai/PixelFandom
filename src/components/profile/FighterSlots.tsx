'use client';

import { useState, useMemo, useEffect } from 'react';
import { useUser, useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Star } from 'lucide-react';
import { RarityBadge } from './RarityBadge';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/app-provider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { titansArticle } from '@/lib/wiki-articles/titans';
import { Slider } from '../ui/slider';
import { Label } from '../ui/label';

const enchantmentRarities = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Phantom', 'Supreme'];
const rarityMultipliers: Record<string, number> = {
    'Common': 1.0,    // 0% Bonus
    'Uncommon': 1.1,  // 10% Bonus
    'Rare': 1.2,      // 20% Bonus
    'Epic': 1.4,      // 40% Bonus
    'Legendary': 1.6, // 60% Bonus
    'Mythic': 1.8,    // 80% Bonus
    'Phantom': 2.0,   // 100% Bonus
    'Supreme': 2.0    // 100% Bonus (Corrected from 2.5)
};
const shadowRarities = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Phantom', 'Supreme'];

const getTitanDamage = (titanName: string, evolutionLevel: number): string => {
    const tables = [
        titansArticle.tables.baseTitans,
        titansArticle.tables.oneStarTitans,
        titansArticle.tables.twoStarTitans,
        titansArticle.tables.threeStarTitans,
    ];
    const titanKey = 'Titã (0 Estrelas)'.replace('0', evolutionLevel.toString());
    const table = tables[evolutionLevel];
    if (!table) return '5%';

    const titanRow = table.rows.find((row: any) => row[titanKey] === titanName);
    return titanRow ? titanRow['Dano de Ataque'] : 'N/A';
};

export function FighterSlots() {
    const { user, isUserLoading } = useUser();
    const { firestore } = useFirebase();
    const { allGameData } = useApp();
    const [open, setOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
    const [step, setStep] = useState<'type' | 'item' | 'rarity'>('type');
    const [fighterType, setFighterType] = useState<'Titan' | 'Stand' | 'Shadow' | null>(null);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const { toast } = useToast();

    const userDocRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);

    const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef);
    const [equippedFighters, setEquippedFighters] = useState<any>({});

    useEffect(() => {
        if (userData?.fighterSlots) {
            setEquippedFighters(userData.fighterSlots);
        } else {
            setEquippedFighters({});
        }
    }, [userData]);

    const fighterData = useMemo(() => {
        const titans = allGameData.flatMap(world => world.fighters?.filter((f: any) => f.type === 'Titan').map((f: any) => ({ ...f, rarity: 'Comum' })) || []);
        const stands = allGameData.flatMap(world => world.stands || []);
        const shadows = allGameData.flatMap(world => world.shadows || []);
        return {
            Titan: titans,
            Stand: stands,
            Shadow: shadows,
        };
    }, [allGameData]);

    const handleSlotClick = (slotIndex: number) => {
        setSelectedSlot(slotIndex);
        setStep('type');
        setFighterType(null);
        setSelectedItem(null);
        setOpen(true);
    };

    const handleTypeSelect = (type: 'Titan' | 'Stand' | 'Shadow') => {
        setFighterType(type);
        setStep('item');
    };

    const updateFighterData = async (slotIndex: number, newData: object) => {
        if (!userDocRef) return;

        const currentData = equippedFighters;
        const fighterToUpdate = currentData[slotIndex];

        if (!fighterToUpdate) {
            toast({ variant: "destructive", title: "Erro", description: "Nenhum lutador equipado neste slot." });
            return;
        }

        const updatedFighter = { ...fighterToUpdate, ...newData };
        const newSlots = { ...currentData, [slotIndex]: updatedFighter };

        setEquippedFighters(newSlots);

        try {
            await updateDoc(userDocRef, { fighterSlots: newSlots });
        } catch (error) {
            console.error("Error updating fighter data:", error);
            setEquippedFighters((userData as any)?.fighterSlots || {});
            toast({ variant: "destructive", title: "Erro", description: "Não foi possível atualizar os dados do lutador." });
        }
    };
    
    const handleItemSelect = async (item: any) => {
        setSelectedItem(item);
        if (fighterType === 'Shadow') {
            setStep('rarity');
        } else {
            await equipFighter(item, 'Common');
        }
    };

    const handleRaritySelect = async (rarity: string) => {
        if (!selectedItem) return;
        await equipFighter(selectedItem, rarity);
    }

    const equipFighter = async (item: any, rarity: string) => {
        if (selectedSlot === null || !userDocRef) return;

        const newFighterData: any = {
            id: item.id,
            name: item.name,
            type: fighterType,
            evolutionLevel: 0,
            rarity: item.rarity || 'Comum',
        };
        
        if (fighterType === 'Shadow') {
            newFighterData.level = 0;
            newFighterData.rarity = rarity; // Set rarity from selection
        } else {
            newFighterData.enchantment = rarity;
        }

        const newSlots = { ...equippedFighters, [selectedSlot]: newFighterData };
        setEquippedFighters(newSlots);

        try {
            await updateDoc(userDocRef, { fighterSlots: newSlots });
            toast({ title: "Lutador Equipado!", description: `${item.name} equipado no slot ${selectedSlot + 1}.` });
        } catch (error: any) {
            console.error(error);
            setEquippedFighters((userData as any)?.fighterSlots || {});
            toast({ variant: "destructive", title: "Erro", description: error.message || "Não foi possível equipar o lutador." });
        } finally {
            setOpen(false);
        }
    };

    const getStatForFighter = (item: any, equipped: any) => {
        if (!item || !equipped) return '0x';

        const level = equipped.evolutionLevel || 0;
        
        if (equipped.type === 'Titan') {
            const enchantment = equipped.enchantment || 'Common';
            const baseDamagePercent = parseFloat(getTitanDamage(equipped.name, level).replace('%',''));
            const finalDamage = baseDamagePercent * (rarityMultipliers[enchantment] || 1.0);
            return `Dano: ${finalDamage.toFixed(2)}%`;
        }

        if (equipped.type === 'Stand') {
            const enchantment = equipped.enchantment || 'Common';
            const baseBonus = parseFloat(item.energy_bonus.replace('%',''));
            const finalBonus = baseBonus * (rarityMultipliers[enchantment] || 1.0);
            return `Bônus: ${finalBonus.toFixed(2)}%`;
        }
        
        if (equipped.type === 'Shadow') {
            const shadowLevel = equipped.level || 0;
            const rarity = equipped.rarity || 'Common';
            const baseStat = item.stats?.find((s:any) => s.rarity === rarity);
            if (baseStat && baseStat.bonus) {
                const bonusValue = parseFloat(baseStat.bonus.replace('%', ''));
                const finalBonus = (bonusValue / 100) * shadowLevel;
                 return `Bônus: +${finalBonus.toFixed(2)}%`;
            }
            return 'Selecione a raridade';
        }

        return 'N/A';
    }

    const isLoading = isUserLoading || isUserDataLoading;
    const baseEvolutionStars = [1, 2, 3];
    const totalSlots = 6;

    return (
        <div className='grid grid-cols-3 md:grid-cols-6 gap-4 items-start justify-center'>
            {Array.from({ length: totalSlots }).map((_, slotIndex) => {
                const equipped = equippedFighters[slotIndex];
                const fullItemData = equipped
                    ? (fighterData[equipped.type as 'Titan' | 'Stand' | 'Shadow'] || []).find(i => i.id === equipped.id)
                    : null;

                const displayedStat = getStatForFighter(fullItemData, equipped);

                return (
                    <div key={slotIndex} className="flex flex-col items-center gap-2 w-full">
                        <Card
                            className="cursor-pointer hover:border-primary/50 transition-colors w-full h-24 flex flex-col justify-between flex-shrink-0"
                            onClick={() => handleSlotClick(slotIndex)}
                        >
                            <div className='p-2 text-center relative flex-grow flex flex-col items-center justify-center'>
                                {isLoading ? (
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                ) : equipped ? (
                                    <>
                                        {(equipped.type === 'Titan' || equipped.type === 'Stand') && (
                                            <Select
                                                value={equipped.enchantment || 'Common'}
                                                onValueChange={(newEnchantment) => updateFighterData(slotIndex, { enchantment: newEnchantment })}
                                            >
                                                <SelectTrigger className="absolute top-1 right-1 h-6 px-2 text-xs w-auto focus:ring-0 focus:ring-offset-0 border-0 bg-transparent">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent onClick={(e) => e.stopPropagation()}>
                                                    {enchantmentRarities.map(rarity => (
                                                        <SelectItem key={rarity} value={rarity}>{rarity}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                        {equipped.type === 'Shadow' && (
                                            <Select
                                                value={equipped.rarity || 'Common'}
                                                onValueChange={(newRarity) => updateFighterData(slotIndex, { rarity: newRarity })}
                                            >
                                                <SelectTrigger className="absolute top-1 right-1 h-6 px-2 text-xs w-auto focus:ring-0 focus:ring-offset-0 border-0 bg-transparent">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent onClick={(e) => e.stopPropagation()}>
                                                    {shadowRarities.map(rarity => (
                                                        <SelectItem key={rarity} value={rarity}>{rarity}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                        <p className="font-bold text-sm">{equipped.name}</p>
                                        <RarityBadge rarity={equipped.rarity} />
                                        <p className="text-xs mt-2">{displayedStat}</p>
                                    </>
                                ) : (
                                    <div className="text-muted-foreground">
                                        <PlusCircle className="mx-auto h-8 w-8" />
                                        <p className="text-xs mt-2">Equipar</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                        {equipped && equipped.type === 'Shadow' ? (
                             <div className='w-full px-1'>
                                <Label className='text-xs text-muted-foreground'>Lvl: {equipped.level || 0}</Label>
                                <Slider
                                    min={0}
                                    max={100}
                                    step={1}
                                    value={[equipped.level || 0]}
                                    onValueChange={(value) => updateFighterData(slotIndex, { level: value[0] })}
                                    className="h-3"
                                />
                             </div>
                        ) : (
                             <div className={cn(
                                'flex justify-center items-center gap-2 h-5',
                                equipped?.type === 'Stand' && 'invisible' // Hide stars for stands
                            )}>
                                {baseEvolutionStars.map(starLevel => (
                                    <Star
                                        key={starLevel}
                                        className={cn(
                                            'h-5 w-5 text-gray-500 transition-colors',
                                            equipped && equipped.type !== 'Stand' && 'cursor-pointer',
                                            equipped && (equipped.evolutionLevel || 0) >= starLevel ? 'text-red-500 fill-red-500' : 'text-gray-600'
                                        )}
                                        onClick={(e) => {
                                            if (!equipped || equipped.type === 'Stand') return;
                                            e.stopPropagation();
                                            const currentLevel = equipped.evolutionLevel || 0;
                                            const newLevel = currentLevel === starLevel ? starLevel - 1 : starLevel;
                                            updateFighterData(slotIndex, { evolutionLevel: newLevel });
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )
            })}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Equipar Lutador no Slot {selectedSlot !== null ? selectedSlot + 1 : ''}</DialogTitle>
                        <DialogDescription>
                            {step === 'type' && 'Selecione o tipo de lutador.'}
                            {step === 'item' && `Selecione um lutador do tipo ${fighterType}.`}
                             {step === 'rarity' && `Selecione a raridade para ${selectedItem?.name}.`}
                        </DialogDescription>
                    </DialogHeader>
                    {step === 'type' && (
                        <div className='grid grid-cols-1 gap-2 py-4'>
                            <Button variant="outline" onClick={() => handleTypeSelect('Titan')}>Titãs</Button>
                            <Button variant="outline" onClick={() => handleTypeSelect('Stand')}>Stands</Button>
                            <Button variant="outline" onClick={() => handleTypeSelect('Shadow')}>Shadows</Button>
                        </div>
                    )}
                    {step === 'item' && (
                        <ScrollArea className="h-72">
                            <div className="space-y-2 py-4">
                                {fighterType && fighterData[fighterType]
                                    .filter((item: any) => item.name)
                                    .map((item: any, index: number) => (
                                        <Button key={item.id || index} variant="ghost" className="w-full justify-start h-auto" onClick={() => handleItemSelect(item)}>
                                            <div className='flex flex-col items-start'>
                                                <p>{item.name}</p>
                                                {item.rarity && <RarityBadge rarity={item.rarity} />}
                                            </div>
                                        </Button>
                                    ))}
                            </div>
                        </ScrollArea>
                    )}
                    {step === 'rarity' && fighterType === 'Shadow' && (
                         <ScrollArea className="h-72">
                             <div className="space-y-2 py-4">
                                {(selectedItem?.stats || shadowRarities).map((rarityOrStat: any) => {
                                    const rarity = typeof rarityOrStat === 'string' ? rarityOrStat : rarityOrStat.rarity;
                                    return (
                                        <Button key={rarity} variant="ghost" className="w-full justify-start" onClick={() => handleRaritySelect(rarity)}>
                                            <RarityBadge rarity={rarity} />
                                        </Button>
                                    )
                                })}
                             </div>
                         </ScrollArea>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

    