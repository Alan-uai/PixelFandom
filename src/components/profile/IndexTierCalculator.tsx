'use client';

import { useState, useMemo, useEffect } from 'react';
import { useUser, useFirebase, useMemoFirebase, useDoc } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function IndexTierCalculator() {
    const { user } = useUser();
    const { firestore } = useFirebase();

    const docRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid, 'index', 'tiers');
    }, [firestore, user]);

    const { data: tierData, isLoading } = useDoc(docRef);

    const [avatarTier, setAvatarTier] = useState<number>(0);
    const [petTier, setPetTier] = useState<number>(0);

    const tierOptions = Array.from({ length: 24 }, (_, i) => i); // 0 to 23

    useEffect(() => {
        if (tierData) {
            setAvatarTier((tierData as any).avatarTier || 0);
            setPetTier((tierData as any).petTier || 0);
        }
    }, [tierData]);

    const handleTierChange = async (type: 'avatar' | 'pet', value: string) => {
        if (!docRef) return;
        const numericValue = parseInt(value, 10);
        if (isNaN(numericValue)) return;

        const newAvatarTier = type === 'avatar' ? numericValue : avatarTier;
        const newPetTier = type === 'pet' ? numericValue : petTier;

        if (type === 'avatar') {
            setAvatarTier(numericValue);
        } else {
            setPetTier(numericValue);
        }
        
        await setDoc(docRef, { avatarTier: newAvatarTier, petTier: newPetTier }, { merge: true });
    };

    const avatarBonus = useMemo(() => (avatarTier * 0.05).toFixed(2), [avatarTier]);
    const petBonus = useMemo(() => (petTier * 0.05).toFixed(2), [petTier]);

    if (isLoading) {
      return (
          <div className="flex items-center justify-center h-full w-full">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
      );
    }

    return (
        <div className="w-full p-2 space-y-4">
            <div className='space-y-2'>
                <Label htmlFor='avatar-tier'>Tier de Avatar</Label>
                <Select value={avatarTier.toString()} onValueChange={(value) => handleTierChange('avatar', value)}>
                    <SelectTrigger id="avatar-tier">
                        <SelectValue placeholder="Selecione o tier" />
                    </SelectTrigger>
                    <SelectContent>
                        {tierOptions.map(tier => (
                            <SelectItem key={tier} value={tier.toString()}>{tier}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                 <p className="text-xs text-muted-foreground">Bônus de Dano: <span className="font-semibold text-primary">{avatarBonus}x</span></p>
            </div>
            <div className='space-y-2'>
                <Label htmlFor='pet-tier'>Tier de Pet</Label>
                 <Select value={petTier.toString()} onValueChange={(value) => handleTierChange('pet', value)}>
                    <SelectTrigger id="pet-tier">
                        <SelectValue placeholder="Selecione o tier" />
                    </SelectTrigger>
                    <SelectContent>
                        {tierOptions.map(tier => (
                            <SelectItem key={tier} value={tier.toString()}>{tier}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Bônus de Energia: <span className="font-semibold text-primary">{petBonus}x</span></p>
            </div>
        </div>
    );
}
