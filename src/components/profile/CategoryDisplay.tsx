'use client';

import { useMemo } from 'react';
import { useFirebase, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { query, collection, orderBy } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { BonusDisplay } from './BonusDisplay';
import { IndexTierCalculator } from './IndexTierCalculator';
import { ObeliskLevelCalculator } from './ObeliskLevelCalculator';
import { AchievementCalculator } from './AchievementCalculator';
import { RankSelector } from './RankSelector';
import { WeaponSlots } from './WeaponSlots';
import { InteractiveGridCategory } from './InteractiveGridCategory';
import { allGamepasses } from '@/lib/gamepass-data';
import { accessories } from '@/lib/accessory-data';
import { FighterSlots } from './FighterSlots';
import { JewelryItemSlots } from './JewelryItemSlots';

export function CategoryDisplay({ subcollectionName, isInteractiveGrid, isWeaponSlots, isFighterSlots, isJewelrySlots, itemTypeFilter }: { subcollectionName: string; isInteractiveGrid?: boolean; isWeaponSlots?: boolean; isFighterSlots?: boolean; isJewelrySlots?: boolean; itemTypeFilter?: string; }) {
    const { user } = useUser();
    const { firestore } = useFirebase();

    if (subcollectionName === 'index') return <IndexTierCalculator />;
    if (subcollectionName === 'obelisks') return <ObeliskLevelCalculator />;
    if (subcollectionName === 'achievements') return <AchievementCalculator />;
    if (subcollectionName === 'rank') return <RankSelector />;
    if (isWeaponSlots) return <WeaponSlots />;
    if (isFighterSlots) return <FighterSlots />;
    if (isJewelrySlots) return <JewelryItemSlots />;
    if (isInteractiveGrid) {
        let gridData;
        if (subcollectionName === 'gamepasses') gridData = allGamepasses;
        else if (subcollectionName === 'accessories') gridData = accessories;
        return <InteractiveGridCategory subcollectionName={subcollectionName} gridData={gridData} itemTypeFilter={itemTypeFilter} />;
    }

    const itemsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'users', user.uid, subcollectionName), orderBy('name', 'asc'));
    }, [firestore, user, subcollectionName]);

    const { data: items, isLoading } = useCollection(itemsQuery);
    
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full w-full">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        );
    }
    
    if (!items || items.length === 0) {
         return (
            <div className='flex items-center justify-center h-full w-full text-muted-foreground'>
                <p className="text-xs">Nenhum item salvo.</p>
            </div>
        );
    }

    return (
        <>
            <BonusDisplay items={items} category={subcollectionName} />
            <div className="grid grid-cols-5 gap-2 w-full">
                {items.map(item => (
                     <div key={(item as any).id || (item as any).name} className="aspect-square bg-muted/50 rounded-md flex flex-col items-center justify-center p-1 relative overflow-hidden border">
                        <p className="text-[10px] font-bold leading-tight text-center z-10">{(item as any).name}</p>
                        {/* <RarityBadge rarity={(item as any).rarity} className="absolute bottom-1 right-1 text-[8px] px-1 py-0 h-4" /> */}
                    </div>
                ))}
            </div>
        </>
    );
}

