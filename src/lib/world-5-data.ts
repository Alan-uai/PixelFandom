
export const world5Data = {
    id: '005',
    name: 'World 5 - Slayer Village',
    npcs: [
        { id: 'nazuki-npc', name: 'Nazuki', rank: 'E', exp: 75, hp: '100sx', world: 'World 5', drops: { coins: { amount: '500k', probability: 1 }, breathing_token: { amount: '1-5', probability: 0.1 }, avatar_soul: { amount: 1, probability: 0.1 } } },
        { id: 'tenjaro-npc', name: 'Tenjaro', rank: 'D', exp: 78, hp: '500sx', world: 'World 5', drops: { coins: { amount: '1M', probability: 1 }, breathing_token: { amount: '1-5', probability: 0.1 }, avatar_soul: { amount: 1, probability: 0.11 } } },
        { id: 'zentsu-npc', name: 'Zentsu', rank: 'C', exp: 82, hp: '2.5Sp', world: 'World 5', drops: { coins: { amount: '1.5M', probability: 1 }, breathing_token: { amount: '1-5', probability: 0.1 }, avatar_soul: { amount: 1, probability: 0.125 }, weapon: { name: 'Yellow Nichirin', rarity: 'Lendária', probability: 0.1 } } },
        { id: 'insake-npc', name: 'Insake', rank: 'B', exp: 86, hp: '12.5Sp', world: 'World 5', drops: { coins: { amount: '2M', probability: 1 }, breathing_token: { amount: '1-5', probability: 0.1 }, avatar_soul: { amount: 1, probability: 0.15 } } },
        { id: 'tamoka-npc', name: 'Tamoka', rank: 'A', exp: 91, hp: '62.5Sp', world: 'World 5', drops: { coins: { amount: '2.5M', probability: 1 }, demon_arts_token: { amount: '1-5', probability: 0.1 }, avatar_soul: { amount: 1, probability: 0.2 } } },
        { id: 'shinabe-npc', name: 'Shinabe', rank: 'S', exp: 95, hp: '312Sp', world: 'World 5', drops: { coins: { amount: '3M', probability: 1 }, demon_arts_token: { amount: '1-5', probability: 0.1 }, avatar_soul: { amount: 1, probability: 0.25 } } },
        { id: 'rangoki-boss', name: 'Rangaki', rank: 'SS', exp: 240, hp: '31.2de', world: 'World 5', drops: { coins: { amount: '7M', probability: 1 }, demon_arts_token: { amount: '3-5', probability: 0.1 }, breathing_token: { amount: '3-5', probability: 0.1 }, avatar_soul: { amount: 1, probability: 0.5 }, aura: { name: 'Flaming Aura', probability: 0.01 } }, videoUrl: 'https://medal.tv/de/games/roblox/clips/kurSF4mSLH55pKNls?invite=cr-MSxMOGQsMzA5MTAxNTU4' },
    ],
    powers: [
        {
            id: 'demon-arts',
            name: 'Demon Arts',
            type: 'gacha',
            statType: 'damage',
            unlockCost: '2M',
            stats: [
                { id: 'dream-manipulation', name: 'Dream Manipulation', multiplier: '2x', rarity: 'Common', probability: 40.55 },
                { id: 'blood-scythes', name: 'Blood Scythes', multiplier: '3x', rarity: 'Uncommon', probability: 33 },
                { id: 'vase-teleportation', name: 'Vase Teleportation', multiplier: '4x', rarity: 'Rare', probability: 19.9 },
                { id: 'emotion-splitting', name: 'Emotion Splitting', multiplier: '5x', rarity: 'Epic', probability: 5 },
                { id: 'destructive-death', name: 'Destructive Death', multiplier: '8x', rarity: 'Legendary', probability: 1 },
                { id: 'cryokinesis', name: 'Cryokinesis', multiplier: '10x', rarity: 'Mythic', probability: 0.5 },
                { id: 'blood-control', name: 'Blood Control', multiplier: '12x', rarity: 'Phantom', probability: 0.05 },
            ]
        },
        {
            id: 'breathings',
            name: 'Breathings',
            type: 'progression',
            unlockCost: 'N/A',
            statType: 'mixed',
            description: 'Um sistema para encantar armas. Role com a arma desequipada. O custo e as raridades variam.'
        },
        {
            id: 'weapon-evolution',
            name: 'Weapon Evolution',
            type: 'progression',
            unlockCost: 'N/A',
            statType: 'mixed',
            description: 'Evolua suas armas. Evolve 2: 4 armas iguais + 400M de moedas. Evolve 3: 2 armas iguais + 2B de moedas.'
        }
    ],
    pets: [
        { id: 'nazuki-pet', name: 'Nazuki', rank: 'E', rarity: 'Common', energy_bonus: '117' },
        { id: 'tenjaro-pet', name: 'Tenjaro', rank: 'D', rarity: 'Uncommon', energy_bonus: '234' },
        { id: 'zentsu-pet', name: 'Zentsu', rank: 'C', rarity: 'Rare', energy_bonus: '352' },
        { id: 'insake-pet', name: 'Insake', rank: 'B', rarity: 'Epic', energy_bonus: '469' },
        { id: 'tamoka-pet', name: 'Tamoka', rank: 'A', rarity: 'Legendary', energy_bonus: '586' },
        { id: 'shinabe-pet', name: 'Shinabe', rank: 'S', rarity: 'Mythic', energy_bonus: '781' },
        { id: 'rangaki-pet', name: 'Rangaki', rank: 'SS', rarity: 'Phantom', energy_bonus: '2.43k' }
    ],
    avatars: [
        { id: 'nazuki-avatar', name: 'Nazuki', rank: 'E', rarity: 'Common', energy_bonus: '117', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '702', stats_lv_150: '994' } },
        { id: 'tenjaro-avatar', name: 'Tenjaro', rank: 'D', rarity: 'Uncommon', energy_bonus: '234', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '1.40k', stats_lv_150: '1.98k' } },
        { id: 'zentsu-avatar', name: 'Zentsu', rank: 'C', rarity: 'Rare', energy_bonus: '352', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '2.11k', stats_lv_150: '2.99k' } },
        { id: 'insake-avatar', name: 'Insake', rank: 'B', rarity: 'Epic', energy_bonus: '469', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '2.81k', stats_lv_150: '3.98k' } },
        { id: 'tamoka-avatar', name: 'Tamoka', rank: 'A', rarity: 'Legendary', energy_bonus: '586', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '3.51k', stats_lv_150: '4.98k' } },
        { id: 'shinabe-avatar', name: 'Shinabe', rank: 'S', rarity: 'Mythic', energy_bonus: '781', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '4.68k', stats_lv_150: '6.63k' } },
        { id: 'rangaki-avatar', name: 'Rangaki', rank: 'SS', rarity: 'Phantom', energy_bonus: '2.43k', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '14k', stats_lv_150: '19.9k' } }
    ],
    dungeons: [],
    shadows: [],
    stands: []
};
    
    
    