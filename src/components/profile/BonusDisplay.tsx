'use client';

import { useMemo } from 'react';
import { Flame, Zap, Coins, Star, Wind } from 'lucide-react';
import { accessories, type Accessory, type RarityOption } from '@/lib/accessory-data';

export function BonusDisplay({ items, category }: { items: any[], category: string }) {
    const totals = useMemo(() => {
        const bonusTotals = {
            damage: 0,
            energy: 0,
            coins: 0,
            exp: 0,
            movespeed: 0,
        };

        if (!items) return bonusTotals;

        const parseBonus = (value: string | undefined): number => {
            if (typeof value !== 'string') return 0;
            return parseFloat(value.replace(/x|%/g, ''));
        };

        items.forEach(item => {
            let data: any = item;
            if(category === 'accessories') {
                const fullAccessory: Accessory | undefined = accessories.find(a => a.id === item.id);
                const rarityOption: RarityOption | undefined = fullAccessory?.rarity_options.find(ro => ro.rarity === item.rarity);
                if (!rarityOption) return;
                data = rarityOption;
            }
            
            if (data.damage_bonus) bonusTotals.damage += parseBonus(data.damage_bonus);
            if (data.energy_bonus) bonusTotals.energy += parseBonus(data.energy_bonus);
            if (data.coins_bonus) bonusTotals.coins += parseBonus(data.coins_bonus);
            if (data.exp_bonus) bonusTotals.exp += parseBonus(data.exp_bonus);
            if (data.movespeed_bonus) bonusTotals.movespeed += parseBonus(data.movespeed_bonus);

            if (item.statType === 'damage' && item.multiplier) bonusTotals.damage += parseBonus(item.multiplier);
            if (item.statType === 'energy' && item.multiplier) bonusTotals.energy += parseBonus(item.multiplier);
            if (item.statType === 'coin' && item.multiplier) bonusTotals.coins += parseBonus(item.multiplier);
        });
        
        return bonusTotals;

    }, [items, category]);

    const bonusConfig = [
        { key: 'damage', label: 'Dano', icon: Flame, color: 'text-red-500', suffix: 'x' },
        { key: 'energy', label: 'Energia', icon: Zap, color: 'text-blue-500', suffix: 'x' },
        { key: 'coins', label: 'Moedas', icon: Coins, color: 'text-yellow-500', suffix: 'x' },
        { key: 'exp', label: 'EXP', icon: Star, color: 'text-green-500', suffix: '%' },
        { key: 'movespeed', label: 'Velocidade', icon: Wind, color: 'text-sky-500', suffix: '%' },
    ] as const;

    const hasAnyBonus = Object.values(totals).some(val => val > 0);

    if (!hasAnyBonus) {
        return null;
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 w-full text-center mb-4">
            {bonusConfig.map(({ key, label, icon: Icon, color, suffix }) => {
                if (totals[key] > 0) {
                    return (
                        <div key={key} className={`flex flex-col items-center p-2 rounded-md bg-muted/50 border`}>
                            <Icon className={`h-5 w-5 mb-1 ${color}`} />
                            <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
                            <span className="text-xs font-bold">{`+${totals[key].toFixed(2)}${suffix}`}</span>
                        </div>
                    );
                }
                return null;
            })}
        </div>
    )
}
