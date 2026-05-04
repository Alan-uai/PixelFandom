'use client';
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export const RarityBadge = ({ rarity, className, children }: { rarity: string, className?: string, children?: React.ReactNode }) => {
    const rarityClasses: Record<string, string> = {
        'C-Rank': 'bg-gray-500 text-white border-gray-600',
        'B-Rank': 'bg-green-500 text-white border-green-600',
        'A-Rank': 'bg-blue-500 text-white border-blue-600',
        'S-Rank': 'bg-purple-500 text-white border-purple-600',
        'SS-Rank': 'bg-yellow-500 text-black border-yellow-600',
        'SSS-Rank': 'bg-red-600 text-white border-red-700',
        'Common': 'bg-gray-500 text-white border-gray-600',
        'Uncommon': 'bg-green-500 text-white border-green-600',
        'Rare': 'bg-blue-500 text-white border-blue-600',
        'Epic': 'bg-purple-500 text-white border-purple-600',
        'Legendary': 'bg-yellow-500 text-black border-yellow-600',
        'Mythic': 'bg-red-600 text-white border-red-700',
        'Phantom': 'bg-fuchsia-700 text-white border-fuchsia-800',
        'Supreme': 'bg-gradient-to-r from-orange-400 to-rose-400 text-white border-transparent',
    };
    const finalClassName = rarityClasses[rarity] || 'bg-gray-400';
    return (
        <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 whitespace-nowrap', finalClassName, className)}>
            {children || rarity}
        </Badge>
    );
};

export const getRarityClass = (rarity: string): string => {
     const rarityClasses: Record<string, string> = {
        'C-Rank': 'bg-gray-500/10 text-white border-gray-600/50',
        'B-Rank': 'bg-green-500/10 text-white border-green-600/50',
        'A-Rank': 'bg-blue-500/10 text-white border-blue-600/50',
        'S-Rank': 'bg-purple-500/10 text-white border-purple-600/50',
        'SS-Rank': 'bg-yellow-500/10 text-yellow-300 border-yellow-600/50',
        'SSS-Rank': 'bg-red-600/10 text-white border-red-700/50',
        'Common': 'bg-gray-500/10 text-white border-gray-600/50',
        'Uncommon': 'bg-green-500/10 text-white border-green-600/50',
        'Rare': 'bg-blue-500/10 text-white border-blue-600/50',
        'Epic': 'bg-purple-500/10 text-white border-purple-600/50',
        'Legendary': 'bg-yellow-500/10 text-yellow-300 border-yellow-600/50',
        'Mythic': 'bg-red-600/10 text-white border-red-700/50',
        'Phantom': 'bg-fuchsia-700/10 text-white border-fuchsia-800/50',
        'Supreme': 'bg-gradient-to-r from-orange-400/20 to-rose-400/20 text-white',
    };
    return rarityClasses[rarity] || 'bg-muted/30';
};
