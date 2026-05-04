'use client';

import { useState, useMemo, useEffect } from 'react';
import { useUser, useFirebase, useMemoFirebase, useDoc } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { generalAchievements } from '@/lib/achievements-data';
import { Loader2, Zap, Flame, Coins } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function toRoman(num: number): string {
  if (num === 0) return '0';
  if (num < 1 || num > 49) return num.toString();
  const roman: [number, string][] = [
    [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]
  ];
  let result = '';
  for (const [value, symbol] of roman) {
    while (num >= value) {
      result += symbol;
      num -= value;
    }
  }
  return result;
}

export function AchievementCalculator() {
    const { user } = useUser();
    const { firestore } = useFirebase();

    const docRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid, 'achievements', 'levels');
    }, [firestore, user]);

    const { data: savedLevels, isLoading } = useDoc(docRef);
    const [levels, setLevels] = useState<Record<string, number>>({});

    useEffect(() => {
        if (savedLevels) {
            setLevels(savedLevels as Record<string, number>);
        }
    }, [savedLevels]);

    const handleLevelChange = async (achievementId: string, value: string) => {
        const numericValue = parseInt(value, 10);
        if (isNaN(numericValue) || !docRef) return;

        const updatedLevels = { ...levels, [achievementId]: numericValue };
        setLevels(updatedLevels);
        await setDoc(docRef, updatedLevels, { merge: true });
    };

    const totalBonuses = useMemo(() => {
        return generalAchievements.reduce((acc, ach) => {
            const currentLevel = levels[ach.id] || 0;
            if (ach.progressionBonus.includes('energia')) {
                acc.energy += currentLevel * 0.05;
            } else if (ach.progressionBonus.includes('damage')) {
                acc.damage += currentLevel * 0.05;
            } else if (ach.progressionBonus.includes('coins')) {
                acc.coins += currentLevel * 0.05;
            }
            return acc;
        }, { energy: 0, damage: 0, coins: 0 });
    }, [levels]);

    if (isLoading) {
        return <div className="flex items-center justify-center h-full w-full"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
    }

    return (
        <div className="w-full p-2 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {generalAchievements.map(ach => (
                    <div key={ach.id} className="space-y-2">
                        <Label htmlFor={ach.id} className="text-xs truncate">{ach.name}</Label>
                        <Select value={(levels[ach.id] || 0).toString()} onValueChange={(value) => handleLevelChange(ach.id, value)}>
                            <SelectTrigger id={ach.id}>
                                <SelectValue placeholder="Lvl" />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: ach.maxLevel + 1 }, (_, i) => i).map(lvl => (
                                    <SelectItem key={lvl} value={lvl.toString()}>Lvl {toRoman(lvl)}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                ))}
            </div>
            <div className="border-t pt-4">
                 <h4 className="text-sm font-semibold mb-2">Bônus Totais de Conquistas</h4>
                 <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-md bg-muted/50 border">
                        <Zap className="h-5 w-5 mb-1 mx-auto text-blue-500" />
                        <span className="text-xs font-bold">{`+${totalBonuses.energy.toFixed(2)}x`}</span>
                    </div>
                     <div className="p-2 rounded-md bg-muted/50 border">
                        <Flame className="h-5 w-5 mb-1 mx-auto text-red-500" />
                        <span className="text-xs font-bold">{`+${totalBonuses.damage.toFixed(2)}x`}</span>
                    </div>
                     <div className="p-2 rounded-md bg-muted/50 border">
                        <Coins className="h-5 w-5 mb-1 mx-auto text-yellow-500" />
                        <span className="text-xs font-bold">{`+${totalBonuses.coins.toFixed(2)}x`}</span>
                    </div>
                 </div>
            </div>
        </div>
    );
}
