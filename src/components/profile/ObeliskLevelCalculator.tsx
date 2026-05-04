'use client';

import { useState, useMemo, useEffect } from 'react';
import { useUser, useFirebase, useMemoFirebase, useDoc } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function ObeliskLevelCalculator() {
    const { user } = useUser();
    const { firestore } = useFirebase();

    const docRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid, 'obelisks', 'levels');
    }, [firestore, user]);

    const { data: obeliskData, isLoading } = useDoc(docRef);

    const [damageLevel, setDamageLevel] = useState<number>(0);
    const [energyLevel, setEnergyLevel] = useState<number>(0);
    const [luckyLevel, setLuckyLevel] = useState<number>(0);

    const damageEnergyOptions = Array.from({ length: 21 }, (_, i) => i); // 0 to 20
    const luckyOptions = Array.from({ length: 11 }, (_, i) => i); // 0 to 10

    useEffect(() => {
        if (obeliskData) {
            setDamageLevel((obeliskData as any).damage || 0);
            setEnergyLevel((obeliskData as any).energy || 0);
            setLuckyLevel((obeliskData as any).lucky || 0);
        }
    }, [obeliskData]);

    const handleLevelChange = async (type: 'damage' | 'energy' | 'lucky', value: string) => {
        if (!docRef) return;
        const numericValue = parseInt(value, 10);
        if (isNaN(numericValue)) return;

        let newLevels = {
            damage: damageLevel,
            energy: energyLevel,
            lucky: luckyLevel,
        };

        if (type === 'damage') {
            setDamageLevel(numericValue);
            newLevels.damage = numericValue;
        } else if (type === 'energy') {
            setEnergyLevel(numericValue);
            newLevels.energy = numericValue;
        } else if (type === 'lucky') {
            setLuckyLevel(numericValue);
            newLevels.lucky = numericValue;
        }
        
        await setDoc(docRef, newLevels, { merge: true });
    };

    const damageBonus = useMemo(() => (damageLevel * 0.02).toFixed(2), [damageLevel]); // Example: 2% per level
    const energyBonus = useMemo(() => (energyLevel * 0.02).toFixed(2), [energyLevel]); // Example: 2% per level
    const luckyBonus = useMemo(() => (luckyLevel * 0.01).toFixed(2), [luckyLevel]); // Example: 1% per level

    if (isLoading) {
      return (
          <div className="flex items-center justify-center h-full w-full">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
      );
    }

    return (
        <div className="w-full p-2 grid grid-cols-3 gap-4">
            <div className='space-y-2'>
                <Label htmlFor='damage-obelisk'>Dano</Label>
                <Select value={damageLevel.toString()} onValueChange={(value) => handleLevelChange('damage', value)}>
                    <SelectTrigger id="damage-obelisk">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {damageEnergyOptions.map(level => (
                            <SelectItem key={level} value={level.toString()}>Lvl {level}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                 <p className="text-xs text-muted-foreground">Bônus: <span className="font-semibold text-primary">+{damageBonus}x</span></p>
            </div>
            <div className='space-y-2'>
                <Label htmlFor='energy-obelisk'>Energia</Label>
                 <Select value={energyLevel.toString()} onValueChange={(value) => handleLevelChange('energy', value)}>
                    <SelectTrigger id="energy-obelisk">
                         <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {damageEnergyOptions.map(level => (
                            <SelectItem key={level} value={level.toString()}>Lvl {level}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Bônus: <span className="font-semibold text-primary">+{energyBonus}x</span></p>
            </div>
             <div className='space-y-2'>
                <Label htmlFor='lucky-obelisk'>Sorte</Label>
                 <Select value={luckyLevel.toString()} onValueChange={(value) => handleLevelChange('lucky', value)}>
                    <SelectTrigger id="lucky-obelisk">
                         <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {luckyOptions.map(level => (
                            <SelectItem key={level} value={level.toString()}>Lvl {level}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Bônus: <span className="font-semibold text-primary">+{luckyBonus}%</span></p>
            </div>
        </div>
    );
}
