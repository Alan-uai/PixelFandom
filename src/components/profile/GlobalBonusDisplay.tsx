'use client';

import { useGlobalBonuses } from '@/hooks/use-global-bonuses';
import { Loader2, Zap, Flame, Coins, Star, Wind, Shield } from 'lucide-react';
import { format } from 'path';

function formatNumber(num: number): string {
    if (num === 0) return '0.00';
    if (num < 1000) {
        return num.toFixed(2);
    }
    const suffixes = ["", "k", "M", "B", "T", "qd", "Qn", "sx", "Sp", "O", "N", "de", "Ud", "dD", "tD", "qdD", "QnD", "sxD", "SpD", "OcD", "NvD", "Vgn", "UVg", "DVg", "TVg", "qtV", "QnV", "SeV", "SPG", "OVG", "NVG", "TGN", "UTG", "DTG", "tsTG", "qTG", "QnTG", "ssTG", "SpTG", "OcTG", "NoTG", "QDR", "uQDR", "dQDR", "tQDR"];
    const i = Math.floor(Math.log10(num) / 3);
    const value = (num / Math.pow(1000, i));
    return `${value.toFixed(2)}${suffixes[i] || ''}`;
}


export function GlobalBonusDisplay({ currentEnergy }: { currentEnergy: string }) {
    const { bonuses, isLoading } = useGlobalBonuses(currentEnergy);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full w-full">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        );
    }
    
    const bonusConfig = [
        { key: 'damage', label: 'Dano Total', icon: Flame, color: 'text-red-500', value: formatNumber(bonuses.damage), suffix: '' },
        { key: 'energyGain', label: 'Ganho de Energia', icon: Zap, color: 'text-blue-500', value: formatNumber(bonuses.energyGain), suffix: '/clique' },
        { key: 'coins', label: 'Bônus Moedas', icon: Coins, color: 'text-yellow-500', value: bonuses.coins.toFixed(2), suffix: 'x' },
        { key: 'exp', label: 'Bônus EXP', icon: Star, color: 'text-green-500', value: bonuses.exp.toFixed(2), suffix: '%' },
        { key: 'movespeed', label: 'Bônus Velocidade', icon: Wind, color: 'text-sky-500', value: bonuses.movespeed.toFixed(2), suffix: '%' },
        { key: 'luck', label: 'Bônus Sorte', icon: Shield, color: 'text-purple-500', value: bonuses.luck.toFixed(2), suffix: '%' },
    ] as const;


    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 w-full text-center">
            {bonusConfig.map(({ key, label, icon: Icon, color, value, suffix }) => (
                <div key={key} className={`flex flex-col items-center p-2 rounded-md bg-muted/50 border`}>
                    <Icon className={`h-6 w-6 mb-1 ${color}`} />
                    <span className="text-xs font-medium text-muted-foreground">{label}</span>
                    <span className="text-sm font-bold">{`${value}${suffix}`}</span>
                </div>
            ))}
        </div>
    );
}
