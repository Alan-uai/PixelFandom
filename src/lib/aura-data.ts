
export interface Aura {
    id: string;
    name: string;
    world: string;
    bonus_type: 'luck' | 'damage' | 'energy' | 'exp' | 'drops';
    bonus_value: string;
}

export const allAuras: Aura[] = [
    { id: 'luck-aura', name: 'Luck Aura', world: 'World 1', bonus_type: 'luck', bonus_value: '10%' },
    { id: 'red-emperor-aura', name: 'Red Emperor Aura', world: 'World 2', bonus_type: 'damage', bonus_value: '0.1x' },
    { id: 'purple-traitor-aura', name: 'Purple Traitor Aura', world: 'World 3', bonus_type: 'damage', bonus_value: '0.25x' },
    { id: 'fire-king-aura', name: 'Fire King Aura', world: 'World 4', bonus_type: 'drops', bonus_value: '25%' },
    { id: 'flaming-aura', name: 'Flaming Aura', world: 'World 5', bonus_type: 'damage', bonus_value: '0.15x' },
    { id: 'statue-aura', name: 'Statue Aura', world: 'World 6', bonus_type: 'damage', bonus_value: '0.75x' },
    { id: 'leafy-aura', name: 'Leafy Aura', world: 'World 8', bonus_type: 'luck', bonus_value: '25%' },
    { id: 'energetic-aura', name: 'Energetic Aura', world: 'World 10', bonus_type: 'energy', bonus_value: '1.5x' },
    { id: 'titanic-aura', name: 'Titanic Aura', world: 'World 11', bonus_type: 'damage', bonus_value: '0.5x' },
    { id: 'monster-aura', name: 'Monster Aura', world: 'World 13', bonus_type: 'damage', bonus_value: '2.0x' },
    { id: 'virtual-aura', name: 'Virtual Aura', world: 'World 15', bonus_type: 'drops', bonus_value: '35%' },
    { id: 'hamon-aura', name: 'Hamon Aura', world: 'World 16', bonus_type: 'exp', bonus_value: '10%' },
    { id: 'ghoul-aura', name: 'Ghoul Aura', world: 'World 17', bonus_type: 'damage', bonus_value: '1.0x' },
    { id: 'fire-captain-aura', name: 'Fire Captain Aura', world: 'World 19', bonus_type: 'damage', bonus_value: '1.5x' },
];
