'use client';

import { useState, useMemo, useEffect } from 'react';
import { useUser, useFirebase, useMemoFirebase, useDoc } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { energyGainPerRank } from '@/lib/energy-gain-data';
import { Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export function RankSelector() {
    const { user } = useUser();
    const { firestore } = useFirebase();
    const docRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid, 'rank', 'current');
    }, [firestore, user]);
    
    const { data: rankData, isLoading } = useDoc(docRef);
    const [rank, setRank] = useState<number>(0);

    useEffect(() => {
        if (rankData) {
            setRank((rankData as any).value || 0);
        }
    }, [rankData]);

    const handleRankChange = async (value: string) => {
        const numericValue = parseInt(value, 10);
        if (isNaN(numericValue) || !docRef) return;
        
        setRank(numericValue);
        await setDoc(docRef, { value: numericValue }, { merge: true });
    };

    const baseEnergyGain = useMemo(() => {
        return (energyGainPerRank as Record<string, string>)[rank.toString()] || '0';
    }, [rank]);

    if (isLoading) {
        return <div className="flex items-center justify-center h-full w-full"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
    }

    return (
         <div className="w-full p-2 space-y-2">
            <Label htmlFor='rank-selector'>Seu Rank Atual</Label>
            <Input 
                id="rank-selector"
                type="number"
                value={rank}
                onChange={(e) => handleRankChange(e.target.value)}
                min="0"
                max="115"
            />
            <p className="text-xs text-muted-foreground">Ganho de Energia Base: <span className="font-semibold text-primary">{baseEnergyGain}</span></p>
        </div>
    );
}
