
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
import { damageSwords, scythes, energySwords } from '@/lib/weapon-data';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';


const breathingEnchantments = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Phantom'];
const stoneEnchantments = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Phantom', 'Supreme'];
const passiveEnchantments = ['Lifesteal', 'Cooldown', 'AoE', 'Phantom', 'Supreme'];

const parseMultiplier = (value?: string): number => {
    if (typeof value !== 'string') return 1;
    const parsed = parseFloat(value.replace(/x/g, ''));
    return isNaN(parsed) ? 1 : parsed;
};


export function WeaponSlots() {
    const { user, isUserLoading } = useUser();
    const { firestore } = useFirebase();
    const [open, setOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
    const [step, setStep] = useState<'type' | 'item'>('type');
    const [weaponType, setWeaponType] = useState<'damage' | 'scythe' | 'energy' | null>(null);
    const { toast } = useToast();

    const userDocRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);
    
    const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef);
    const [equippedWeapons, setEquippedWeapons] = useState<any>({});
    
    useEffect(() => {
        if (userData?.weaponSlots) {
            setEquippedWeapons(userData.weaponSlots);
        } else {
            setEquippedWeapons({});
        }
    }, [userData]);


    const weaponData = useMemo(() => {
        return {
            damage: damageSwords,
            scythe: scythes,
            energy: energySwords,
        };
    }, []);

    const handleSlotClick = (slotIndex: number) => {
        setSelectedSlot(slotIndex);
        setStep('type');
        setWeaponType(null);
        setOpen(true);
    };

    const handleTypeSelect = (type: 'damage' | 'scythe' | 'energy') => {
        setWeaponType(type);
        setStep('item');
    };

     const updateWeaponData = async (slotIndex: number, newData: object) => {
        if (!userDocRef) return;
        
        const currentData = equippedWeapons;
        const weaponToUpdate = currentData[slotIndex];

        if (!weaponToUpdate) {
            toast({ variant: "destructive", title: "Erro", description: "Nenhuma arma equipada neste slot." });
            return;
        }

        const updatedWeapon = { ...weaponToUpdate, ...newData };
        
        if (updatedWeapon.type === 'damage') {
            if ('breathingEnchantment' in newData && !updatedWeapon.stoneEnchantment) {
                updatedWeapon.stoneEnchantment = 'Common';
            }
            if ('stoneEnchantment' in newData && !updatedWeapon.breathingEnchantment) {
                updatedWeapon.breathingEnchantment = 'Common';
            }
        }


        const newSlots = { ...currentData, [slotIndex]: updatedWeapon };

        setEquippedWeapons(newSlots);

        try {
            await updateDoc(userDocRef, { weaponSlots: newSlots });
        } catch (error) {
            console.error("Error updating weapon data:", error);
            setEquippedWeapons((userData as any)?.weaponSlots || {});
            toast({ variant: "destructive", title: "Erro", description: "Não foi possível atualizar os dados da arma." });
        }
    };


    const handleItemSelect = async (item: any) => {
        if (selectedSlot === null || !userDocRef) return;
        
        const typeOfWeapon = item.type;
        if(!typeOfWeapon) {
            toast({ variant: "destructive", title: "Erro", description: "Tipo de arma inválido."});
            return;
        }

        const newWeaponData: any = {
            id: item.name, 
            name: item.name,
            rarity: item.rarity,
            type: typeOfWeapon,
            evolutionLevel: 0,
        };

        if (typeOfWeapon === 'damage') {
            newWeaponData.breathingEnchantment = null;
            newWeaponData.stoneEnchantment = null;
        } else if (typeOfWeapon === 'scythe') {
             newWeaponData.passiveEnchantment = null;
        }

        const newSlots = {
            ...equippedWeapons,
            [selectedSlot]: newWeaponData
        };

        setEquippedWeapons(newSlots);

        try {
            await updateDoc(userDocRef, { weaponSlots: newSlots });
            toast({ title: "Arma Equipada!", description: `${item.name} equipada no slot ${selectedSlot + 1}.` });
        } catch (error) {
            console.error(error);
            setEquippedWeapons((userData as any)?.weaponSlots || {});
            toast({ variant: "destructive", title: "Erro", description: "Não foi possível equipar a arma." });
        } finally {
            setOpen(false);
        }
    };
    
    const getStatForLevel = (item: any, equipped: any) => {
        if (!item || !equipped) return equipped?.stats || '0x';

        const level = equipped.evolutionLevel || 0;
        
        if (equipped.type === 'damage') {
            const breathing = equipped.breathingEnchantment;
            const stone = equipped.stoneEnchantment;

            if (breathing && stone && item.enchantments?.[breathing]?.[stone]?.[level]) {
                return item.enchantments[breathing][stone][level];
            }
             const evolutionKey = ['base_damage', 'one_star_damage', 'two_star_damage', 'three_star_damage'][level] as keyof typeof item;
             return item[evolutionKey] || item.base_damage || '0x';
        }

        if(equipped.type === 'scythe') {
            const passive = equipped.passiveEnchantment;
            if(passive && item.passives?.[passive]?.[level]) {
                return item.passives[passive][level];
            }
             const evolutionKey = ['base_damage', 'one_star_damage', 'two_star_damage', 'three_star_damage'][level] as keyof typeof item;
             return item[evolutionKey] || item.base_damage || '0x';
        }

        if(equipped.type === 'energy') {
            const statKey = ['base_stats', 'one_star_stats', 'two_star_stats', 'three_star_stats'][level] as keyof typeof item;
            return item[statKey] || item.base_stats || '0x';
        }
        
        const evolutionKey = ['base_damage', 'one_star_damage', 'two_star_damage', 'three_star_damage'][level] as keyof typeof item;
        return item[evolutionKey] || '0x';
    }

    const isLoading = isUserLoading || isUserDataLoading;
    const baseEvolutionStars = [1, 2, 3];

    return (
        <div className='flex w-full flex-row gap-4 items-start justify-center'>
            {[0, 1, 2].map(slotIndex => {
                const equipped = equippedWeapons[slotIndex];
                const fullItemData = equipped ? 
                    (weaponData[equipped.type as 'damage' | 'scythe' | 'energy'] || []).find(i => i.name === equipped.name) 
                    : null;
                
                const displayedStat = getStatForLevel(fullItemData, equipped);

                return (
                    <div key={slotIndex} className="flex flex-col items-center gap-2">
                        <Card 
                            className="cursor-pointer hover:border-primary/50 transition-colors w-22 h-22 flex flex-col justify-between flex-shrink-0"
                            onClick={() => handleSlotClick(slotIndex)}
                        >
                            <div className='p-4 text-center relative flex-grow flex flex-col items-center justify-center'>
                                {isLoading ? (
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                ) : equipped ? (
                                    <>
                                        {equipped.type === 'damage' && (
                                            <>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="absolute top-1 left-1 h-6 px-2 text-xs" onClick={(e) => e.stopPropagation()}>
                                                            {equipped.stoneEnchantment || 'Stone'}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-1">
                                                        {stoneEnchantments.map(enchant => (
                                                            <Button key={enchant} variant="ghost" size="sm" className="w-full justify-start" onClick={(e) => { e.stopPropagation(); updateWeaponData(slotIndex, { stoneEnchantment: enchant }) }}>
                                                                {enchant}
                                                            </Button>
                                                        ))}
                                                    </PopoverContent>
                                                </Popover>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="absolute top-1 right-1 h-6 px-2 text-xs" onClick={(e) => e.stopPropagation()}>
                                                            {equipped.breathingEnchantment || 'Breathing'}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-1">
                                                        {breathingEnchantments.map(enchant => (
                                                            <Button key={enchant} variant="ghost" size="sm" className="w-full justify-start" onClick={(e) => { e.stopPropagation(); updateWeaponData(slotIndex, { breathingEnchantment: enchant }) }}>
                                                                {enchant}
                                                            </Button>
                                                        ))}
                                                    </PopoverContent>
                                                </Popover>
                                            </>
                                        )}
                                        {equipped.type === 'scythe' && (
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="absolute top-1 right-1 h-6 px-2 text-xs" onClick={(e) => e.stopPropagation()}>
                                                        {equipped.passiveEnchantment || 'Passive'}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-1">
                                                    {passiveEnchantments.map(enchant => (
                                                        <Button key={enchant} variant="ghost" size="sm" className="w-full justify-start" onClick={(e) => { e.stopPropagation(); updateWeaponData(slotIndex, { passiveEnchantment: enchant }) }}>
                                                                {enchant}
                                                        </Button>
                                                    ))}
                                                </PopoverContent>
                                            </Popover>
                                        )}
                                        <p className="font-bold text-sm">{equipped.name}</p>
                                        <RarityBadge rarity={equipped.rarity} />
                                        <p className="text-xs mt-2">{displayedStat}</p>
                                    </>
                                ) : (
                                    <div className="text-muted-foreground">
                                        <PlusCircle className="mx-auto h-8 w-8" />
                                        <p className="text-sm mt-2">Equipar Arma</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                        <div className='flex justify-center items-center gap-2 h-5'>
                            {baseEvolutionStars.map(starLevel => (
                                <Star
                                    key={starLevel}
                                    className={cn(
                                        'h-5 w-5 text-gray-500 transition-colors',
                                        equipped && 'cursor-pointer',
                                        equipped && (equipped.evolutionLevel || 0) >= starLevel ? 'text-red-500 fill-red-500' : 'text-gray-600'
                                    )}
                                    onClick={(e) => {
                                        if (!equipped) return;
                                        e.stopPropagation();
                                        const currentLevel = equipped.evolutionLevel || 0;
                                        const newLevel = currentLevel === starLevel ? starLevel - 1 : starLevel;
                                        updateWeaponData(slotIndex, { evolutionLevel: newLevel });
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                )
            })}
             <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Equipar Arma no Slot {selectedSlot !== null ? selectedSlot + 1 : ''}</DialogTitle>
                        <DialogDescription>
                            {step === 'type' ? 'Selecione o tipo de arma.' : `Selecione uma arma do tipo ${weaponType}.`}
                        </DialogDescription>
                    </DialogHeader>
                    {step === 'type' ? (
                        <div className='grid grid-cols-1 gap-2 py-4'>
                            <Button variant="outline" onClick={() => handleTypeSelect('damage')}>Dano (Espadas de Dano)</Button>
                            <Button variant="outline" onClick={() => handleTypeSelect('scythe')}>Foices</Button>
                            <Button variant="outline" onClick={() => handleTypeSelect('energy')}>Energia (Espadas de Energia)</Button>
                        </div>
                    ) : (
                        <ScrollArea className="h-72">
                            <div className="space-y-2 py-4">
                                {weaponType && weaponData[weaponType]
                                    .filter(item => item.name)
                                    .map((item: any, index: number) => (
                                     <Button key={index} variant="ghost" className="w-full justify-start h-auto" onClick={() => handleItemSelect(item)}>
                                        <div className='flex flex-col items-start'>
                                            <p>{item.name}</p>
                                            {item.rarity && <RarityBadge rarity={item.rarity} />}
                                        </div>
                                    </Button>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
