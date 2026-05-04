
interface EnchantmentValues {
    [level: number]: string;
}

interface RarityEnchantments {
    [rarity: string]: EnchantmentValues;
}

interface StoneEnchantments {
    [stoneRarity: string]: EnchantmentValues;
}

interface BreathingEnchantments {
    [breathingRarity: string]: StoneEnchantments;
}

interface WeaponPassives {
    [passiveName: string]: EnchantmentValues;
}

interface Weapon {
    name: string;
    type: 'damage' | 'scythe' | 'energy';
    rarity: string;
    base_damage?: string;
    one_star_damage?: string;
    two_star_damage?: string;
    three_star_damage?: string;
    base_stats?: string;
    one_star_stats?: string;
    two_star_stats?: string;
    three_star_stats?: string;
    enchantments?: BreathingEnchantments;
    passives?: WeaponPassives;
}

export const damageSwords: Weapon[] = [
    { 
        name: 'Bloodthorn', rarity: 'Comum', type: 'damage', 
        base_damage: '0.25x', one_star_damage: '0.5x', two_star_damage: '0.75x', three_star_damage: '1.25x',
        enchantments: {
            Phantom: {
                Phantom: { 0: '0.73x', 1: '1.46x', 2: '2.19x', 3: '3.65x' },
                Supreme: { 0: '0.9x', 1: '1.8x', 2: '2.7x', 3: '4.5x' }
            }
        }
    },
    { 
        name: 'Eclipse Warden', rarity: 'Incomum', type: 'damage', 
        base_damage: '0.45x', one_star_damage: '0.9x', two_star_damage: '1.35x', three_star_damage: '2.25x',
         enchantments: {
            Phantom: {
                Phantom: { 0: '1.31x', 1: '2.62x', 2: '3.93x', 3: '6.57x' },
                Supreme: { 0: '1.64x', 1: '3.28x', 2: '4.91x', 3: '8.19x' }
            }
        }
    },
    { 
        name: 'Obsidian Reaver', rarity: 'Raro', type: 'damage', 
        base_damage: '0.75x', one_star_damage: '1.5x', two_star_damage: '2.25x', three_star_damage: '3.75x',
        enchantments: {
            Phantom: {
                Phantom: { 0: '2.19x', 1: '4.37x', 2: '6.56x', 3: '10.95x' },
                Supreme: { 0: '2.7x', 1: '5.4x', 2: '8.1x', 3: '13.5x' }
            }
        }
    },
    { 
        name: 'Aquarius Edge', rarity: 'Lendário', type: 'damage', 
        base_damage: '1x', one_star_damage: '2x', two_star_damage: '3x', three_star_damage: '5x',
         enchantments: {
            Phantom: {
                Phantom: { 0: '2.92x', 1: '5.83x', 2: '8.75x', 3: '14.6x' },
                Supreme: { 0: '3.6x', 1: '7.2x', 2: '10.8x', 3: '18x' }
            }
        }
    },
    { 
        name: 'Doomsoul', rarity: 'Mítico', type: 'damage', 
        base_damage: '1.25x', one_star_damage: '2.5x', two_star_damage: '3.75x', three_star_damage: '6.25x',
        enchantments: {
            Phantom: {
                Phantom: { 0: '3.65x', 1: '7.29x', 2: '10.94x', 3: '18.25x' },
                Supreme: { 0: '4.5x', 1: '9x', 2: '13.5x', 3: '22.5x' }
            }
        }
    },
    { 
        name: 'Redmourne', rarity: 'Mítico', type: 'damage', 
        base_damage: '1.5x', one_star_damage: '3x', two_star_damage: '4.5x', three_star_damage: '7.5x',
        enchantments: {
            Phantom: {
                Phantom: { 0: '4.37x', 1: '8.75x', 2: '13.12x', 3: '21.9x' },
                Supreme: { 0: '5.4x', 1: '10.8x', 2: '16.2x', 3: '27x' }
            }
        }
    },
    { 
        name: 'Venomstrike', rarity: 'Phantom', type: 'damage', 
        base_damage: '2x', one_star_damage: '4x', two_star_damage: '6x', three_star_damage: '10x',
        enchantments: {
            Phantom: {
                Phantom: { 0: '5.83x', 1: '11.66x', 2: '17.5x', 3: '29.2x' },
                Supreme: { 0: '7.2x', 1: '14.4x', 2: '21.6x', 3: '36x' }
            }
        }
    },
    { 
        name: 'Golden Venom Strike', rarity: 'Evento', type: 'damage', 
        base_damage: '38x', one_star_damage: '38x', two_star_damage: '38x', three_star_damage: '38x' 
    },
];

export const scythes: Weapon[] = [
    { 
        name: 'Venomleaf', type: 'scythe', rarity: 'Comum', 
        base_damage: '0.75x', one_star_damage: '1.5x', two_star_damage: '2.25x', three_star_damage: '3.75x',
        passives: {
            Phantom: { 0: '1.35x', 1: '2.7x', 2: '4.05x', 3: '6.75x'},
            Supreme: { 0: '1.5x', 1: '3x', 2: '4.5x', 3: '7.5x'}
        }
    },
    { 
        name: 'Cryoscythe', type: 'scythe', rarity: 'Incomum', 
        base_damage: '1x', one_star_damage: '2x', two_star_damage: '3x', three_star_damage: '5x',
        passives: {
            Phantom: { 0: '1.8x', 1: '3.6x', 2: '5.4x', 3: '9x'},
            Supreme: { 0: '2x', 1: '4x', 2: '6x', 3: '10x'}
        }
    },
    { 
        name: 'Toxinfang', type: 'scythe', rarity: 'Raro', 
        base_damage: '1.75x', one_star_damage: '3.5x', two_star_damage: '5.25x', three_star_damage: '8.75x',
         passives: {
            Phantom: { 0: '3.15x', 1: '6.3x', 2: '9.45x', 3: '15.75x'},
            Supreme: { 0: '3.5x', 1: '7x', 2: '10.5x', 3: '17.5x'}
        }
    },
    { 
        name: 'Crimson Thorn', type: 'scythe', rarity: 'Lendário', 
        base_damage: '2.2x', one_star_damage: '4.4x', two_star_damage: '6.6x', three_star_damage: '11x',
         passives: {
            Phantom: { 0: '3.96x', 1: '7.92x', 2: '11.88x', 3: '19.8x'},
            Supreme: { 0: '4.4x', 1: '8.8x', 2: '13.2x', 3: '22x'}
        }
    },
    { 
        name: 'Bonehowl', type: 'scythe', rarity: 'Mítico', 
        base_damage: '2.75x', one_star_damage: '5.5x', two_star_damage: '8.25x', three_star_damage: '13.75x',
         passives: {
            Phantom: { 0: '4.95x', 1: '9.9x', 2: '14.85x', 3: '24.75x'},
            Supreme: { 0: '5.5x', 1: '11x', 2: '16.5x', 3: '27.5x'}
        }
    },
    { 
        name: 'Ashfang', type: 'scythe', rarity: 'Phantom', 
        base_damage: '3.5x', one_star_damage: '7x', two_star_damage: '10.5x', three_star_damage: '17.5x',
         passives: {
            Phantom: { 0: '6.3x', 1: '12.6x', 2: '18.9x', 3: '31.5x'},
            Supreme: { 0: '7x', 1: '14x', 2: '21x', 3: '35x'}
        }
    },
    { 
        name: 'Phantom Requiem', type: 'scythe', rarity: 'Phantom', 
        base_damage: '4.25x', one_star_damage: '8.5x', two_star_damage: '12.75x', three_star_damage: '21.25x',
         passives: {
            Phantom: { 0: '7.65x', 1: '15.3x', 2: '22.95x', 3: '38.25x'},
            Supreme: { 0: '8.5x', 1: '17x', 2: '25.5x', 3: '42.5x'}
        }
    },
    { 
        name: 'Stormreaver', type: 'scythe', rarity: 'Supremo', 
        base_damage: '5x', one_star_damage: '10x', two_star_damage: '15x', three_star_damage: '25x',
        passives: {
            Phantom: { 0: '9x', 1: '18x', 2: '27x', 3: '45x'},
            Supreme: { 0: '10x', 1: '20x', 2: '30x', 3: '50x'}
        }
    },
];

export const energySwords: Weapon[] = [
    // World 3
    { name: 'Zangetsu', rarity: 'Comum', type: 'energy', base_stats: '0.05x', one_star_stats: '0.1x', two_star_stats: '0.15x', three_star_stats: '0.25x' },
    // World 5
    { name: 'Yellow Nichirin', rarity: 'Comum', type: 'energy', base_stats: '0.075x', one_star_stats: '0.15x', two_star_stats: '0.225x', three_star_stats: '0.375x' },
    // World 15
    { name: 'Lucidator', rarity: 'Comum', type: 'energy', base_stats: '0.125x', one_star_stats: '0.250x', two_star_stats: '0.375x', three_star_stats: '0.625x' },
    // World 19
    { name: 'Excalibur', rarity: 'Comum', type: 'energy', base_stats: '0.2x', one_star_stats: '0.4x', two_star_stats: '0.6x', three_star_stats: '1x' },
];

