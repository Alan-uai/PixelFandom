export interface Jewelry {
    id: string;
    name: string;
    itemType: 'bracelet' | 'ring' | 'necklace' | 'earring';
    bonusType: 'energy' | 'coin' | 'damage' | 'luck';
    level: 'bronze' | 'silver' | 'gold' | 'rose-gold';
    bonus: string;
}

const jewelryTypes: { name: string; type: Jewelry['itemType'] }[] = [
    { name: "Bracelet", type: "bracelet" },
    { name: "Ring", type: "ring" },
    { name: "Necklace", type: "necklace" },
    { name: "Earring", type: "earring" }
];

const bonusLevels: { level: Jewelry['level'], bonuses: Record<Jewelry['bonusType'], string> }[] = [
    { level: 'bronze', bonuses: { energy: '0.1x', coin: '0.1x', damage: '0.1x', luck: '5.00%' } },
    { level: 'silver', bonuses: { energy: '0.25x', coin: '0.25x', damage: '0.25x', luck: '10.00%' } },
    { level: 'gold', bonuses: { energy: '0.5x', coin: '0.5x', damage: '0.5x', luck: '20.00%' } },
    { level: 'rose-gold', bonuses: { energy: '0.75x', coin: '0.75x', damage: '0.75x', luck: '35.00%' } }
];

export const allJewelry: Jewelry[] = jewelryTypes.flatMap(item => 
    bonusLevels.flatMap(levelInfo => 
        (Object.keys(levelInfo.bonuses) as Jewelry['bonusType'][]).map(bonusType => ({
            id: `${levelInfo.level}-${bonusType}-${item.type}`,
            name: `${levelInfo.level.charAt(0).toUpperCase() + levelInfo.level.slice(1)} ${bonusType.charAt(0).toUpperCase() + bonusType.slice(1)} ${item.name}`,
            itemType: item.type,
            bonusType: bonusType,
            level: levelInfo.level,
            bonus: levelInfo.bonuses[bonusType],
        }))
    )
);
