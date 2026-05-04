
export const world12Data = {
    id: '012',
    name: 'World 12 - Village of Sins',
    powers: [
        {
            id: 'sins-power',
            name: 'Sins',
            type: 'gacha',
            statType: 'energy',
            unlockCost: 'N/A',
            stats: [
                { id: 'lust-sin', name: 'Lust', multiplier: '2x', rarity: 'Common', probability: 40.55 },
                { id: 'envy-sin', name: 'Envy', multiplier: '3x', rarity: 'Uncommon', probability: 33 },
                { id: 'sloth-sin', name: 'Sloth', multiplier: '4x', rarity: 'Rare', probability: 19.9 },
                { id: 'greed-sin', name: 'Greed', multiplier: '6x', rarity: 'Epic', probability: 5 },
                { id: 'gluttony-sin', name: 'Gluttony', multiplier: '8x', rarity: 'Legendary', probability: 1 },
                { id: 'wrath-sin', name: 'Wrath', multiplier: '12x', rarity: 'Mythic', probability: 0.5 },
                { id: 'pride-sin', name: 'Pride', multiplier: '15x', rarity: 'Phantom', probability: 0.05 },
            ]
        },
        {
            id: 'commandments-power',
            name: 'Commandments',
            type: 'gacha',
            statType: 'mixed',
            unlockCost: 'N/A',
            stats: [
                { id: 'selflessness-cmd', name: 'Selflessness', multiplier: '2x', statType: 'energy', rarity: 'Common' },
                { id: 'pacifism-cmd', name: 'Pacifism', multiplier: '3x', statType: 'energy', rarity: 'Uncommon' },
                { id: 'patience-cmd', name: 'Patience', multiplier: '0.5x', statType: 'damage', rarity: 'Rare' },
                { id: 'repose-cmd', name: 'Repose', multiplier: '6x', statType: 'energy', rarity: 'Epic' },
                { id: 'purity-cmd', name: 'Purity', multiplier: '1x', statType: 'damage', rarity: 'Legendary' },
                { id: 'reticence-cmd', name: 'Reticence', multiplier: '8x', statType: 'energy', rarity: 'Legendary' },
                { id: 'truth-cmd', name: 'Truth', multiplier: '1x', statType: 'damage', rarity: 'Mythic' },
                { id: 'faith-cmd', name: 'Faith', multiplier: '2x', statType: 'damage', rarity: 'Mythic' },
                { id: 'love-cmd', name: 'Love', multiplier: '1.1x', statType: 'damage', rarity: 'Supreme' },
                { id: 'piety-cmd', name: 'Piety', multiplier: '10x', statType: 'energy', rarity: 'Phantom' },
            ]
        },
        {
            id: 'sins-energy-progression',
            name: 'Energy Progression',
            type: 'progression',
            statType: 'energy',
            unlockCost: 'N/A',
            maxLevel: 50,
            maxBoost: '+12x Energy'
        },
        {
            id: 'sins-coins-progression',
            name: 'Coins Progression',
            type: 'progression',
            statType: 'coin',
            unlockCost: 'N/A',
            maxLevel: 20,
            maxBoost: '+100% Coins'
        },
        {
            id: 'sins-star-luck-progression',
            name: 'Star Luck Progression',
            type: 'progression',
            statType: 'luck',
            unlockCost: 'N/A',
            maxLevel: 10,
            maxBoost: '+0.5 Luck'
        }
    ],
    dungeons: [
        {
            id: 'raid-sins',
            name: 'Raid Sins',
            description: 'Vai até a wave 1000 (w1k). Dropa tokens para os Sin Upgrades.'
        }
    ],
    npcs: [
        { id: 'world12-e-rank', name: 'E Rank NPC', rank: 'E', exp: 19083, hp: '6.5Vgn', world: 'World 12', drops: { coins: { amount: '650NvD', probability: 0.8 } } },
        { id: 'world12-d-rank', name: 'D Rank NPC', rank: 'D', exp: 20942, hp: '32Vgn', world: 'World 12', drops: { coins: { amount: '3.2Vgn', probability: 0.8 } } },
        { id: 'world12-c-rank', name: 'C Rank NPC', rank: 'C', exp: 23037, hp: '164Vgn', world: 'World 12', drops: { coins: { amount: '16Vgn', probability: 0.8 } } },
        { id: 'world12-b-rank', name: 'B Rank NPC', rank: 'B', exp: 25340, hp: '824Vgn', world: 'World 12', drops: { coins: { amount: '82Vgn', probability: 0.8 } } },
        { id: 'world12-a-rank', name: 'A Rank NPC', rank: 'A', exp: 27874, hp: '4.1UVg', world: 'World 12', drops: { coins: { amount: '410Vgn', probability: 0.8 } } },
        { id: 'world12-s-rank', name: 'S Rank NPC', rank: 'S', exp: 30662, hp: '20UVg', world: 'World 12', drops: { coins: { amount: '2UVg', probability: 0.8 } } },
        { id: 'escanor-boss', name: 'Esanor', rank: 'SS', exp: 46080, hp: '104UVg', world: 'World 12', drops: { coins: { amount: '10UVg', probability: 1 }, tokens: { amount: 5, probability: 0.5 } }, videoUrl: 'https://medal.tv/de/games/roblox/clips/kMz3fVnxWSwEHOWbH?invite=cr-MSxPY2YsMzA5MTAxNTU4' },
    ],
    shadows: [
        {
            id: 'escanor-shadow',
            name: 'Escanor',
            type: 'Damage',
            stats: [
                {
                    rank: 'Rank SS',
                    rarity: 'Phantom',
                    bonus: '19.6% Damage',
                    cooldown: '2s',
                },
                {
                    rank: 'Rank SSS',
                    rarity: 'Supremo',
                    bonus: '21% Damage',
                    cooldown: '2s',
                }
            ]
        }
    ]
};
