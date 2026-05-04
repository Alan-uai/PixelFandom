
'use client';

import { useMemo } from 'react';
import { useUser, useFirebase, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { accessories, RarityOption as AccessoryRarityOption } from '@/lib/accessory-data';
import { allGamepasses } from '@/lib/gamepass-data';
import { generalAchievements } from '@/lib/achievements-data';
import { damageSwords, scythes, energySwords, Weapon as WeaponData } from '@/lib/weapon-data';
import { energyGainPerRank } from '@/lib/energy-gain-data';
import { allGameData } from '@/lib/game-data-context';
import { useApp } from '@/context/app-provider';
import { allAuras } from '@/lib/aura-data';
import { allJewelry } from '@/lib/jewelry-data';

// Helper function to safely parse bonus values which can be strings like '1.5x' or '10%'
const parseBonusValue = (value: string | undefined): { value: number; isMultiplier: boolean } => {
    if (typeof value !== 'string') return { value: 0, isMultiplier: false };
    const isMultiplier = value.includes('x');
    const number = parseFloat(value.replace(/x|%/g, ''));
    if (isNaN(number)) return { value: 0, isMultiplier: false };
    // If it's a percentage, divide by 100 to get the decimal value for addition
    return { value: isMultiplier ? number : number / 100, isMultiplier };
};


// Helper to calculate weapon-specific bonuses
const getWeaponBonus = (weapon: any, allWeapons: any[]) => {
    const totals: { damage: { multipliers: number[], bonuses: number[] }, energy: { multipliers: number[], bonuses: number[] } } = { damage: { multipliers: [], bonuses: [] }, energy: { multipliers: [], bonuses: [] } };
    if (!weapon) return totals;

    const weaponData = allWeapons.find(w => w.name === weapon.name);
    if (!weaponData) return totals;

    const level = weapon.evolutionLevel || 0;

    if (weapon.type === 'energy') {
        const statKey = ['base_stats', 'one_star_stats', 'two_star_stats', 'three_star_stats'][level] as keyof typeof weaponData;
        const { value, isMultiplier } = parseBonusValue(weaponData[statKey]);
        if (isMultiplier) totals.energy.multipliers.push(value);
        else totals.energy.bonuses.push(value);
    } else { // damage or scythe
        let finalDamageBonus = '0x';
        if (weapon.type === 'damage' && weapon.breathingEnchantment && weapon.stoneEnchantment && weaponData.enchantments?.[weapon.breathingEnchantment]?.[weapon.stoneEnchantment]?.[level]) {
            finalDamageBonus = weaponData.enchantments[weapon.breathingEnchantment][weapon.stoneEnchantment][level];
        } else if (weapon.type === 'scythe' && weapon.passiveEnchantment && weaponData.passives?.[weapon.passiveEnchantment]?.[level]) {
            finalDamageBonus = weaponData.passives[weapon.passiveEnchantment][level];
        } else {
            const baseDamageKey = ['base_damage', 'one_star_damage', 'two_star_damage', 'three_star_damage'][level] as keyof typeof weaponData;
            finalDamageBonus = weaponData[baseDamageKey] || '0x';
        }
        
        const { value, isMultiplier } = parseBonusValue(finalDamageBonus);
        if (isMultiplier) totals.damage.multipliers.push(value);
        else totals.damage.bonuses.push(value);
    }
    
    return totals;
};

// New function to parse user-entered energy with abbreviations
const parseUserEnergy = (energyStr: string): number => {
    if (!energyStr || typeof energyStr !== 'string') return 0;
    const lowerStr = energyStr.toLowerCase().trim();
    const suffixes: { [key: string]: number } = {
        k: 1e3, m: 1e6, b: 1e9, t: 1e12, qd: 1e15, qn: 1e18, sx: 1e21, sp: 1e24,
        o: 1e27, n: 1e30, de: 1e33, ud: 1e36, dd: 1e39, td: 1e42, qdd: 1e45, qnd: 1e48,
        sxd: 1e51, spd: 1e54, ocd: 1e57, nvd: 1e60, vgn: 1e63, uvg: 1e66, dvg: 1e69,
        tvg: 1e72, qtv: 1e75, qnv: 1e78, sev: 1e81, spg: 1e84, ovg: 1e87, nvg: 1e90,
        tgn: 1e93, utg: 1e96, dtg: 1e99, tstg: 1e102, qtg: 1e105, qntg: 1e108, sstg: 1e111,
        sptg: 1e114, octg: 1e117, notg: 1e120, qdr: 1e123, uqdr: 1e126, dqdr: 1e129,
        tqdr: 1e132
    };

    const suffixKey = Object.keys(suffixes).reverse().find(s => lowerStr.endsWith(s));
    if (suffixKey) {
        const numberPart = parseFloat(lowerStr.replace(suffixKey, ''));
        if (isNaN(numberPart)) return 0;
        return numberPart * suffixes[suffixKey];
    }

    const numberValue = parseFloat(lowerStr);
    return isNaN(numberValue) ? 0 : numberValue;
}


export function useGlobalBonuses(currentEnergyInput: string, calculateForMax: boolean = false) {
    const { user, isUserLoading } = useUser();
    const { firestore } = useFirebase();
    const { isGameDataLoading } = useApp();


    // Define all queries at the top level
    const accessoryItems = useCollection(useMemoFirebase(() => firestore && user ? collection(firestore, 'users', user.uid, 'accessories') : null, [firestore, user]));
    const gamepassItems = useCollection(useMemoFirebase(() => firestore && user ? collection(firestore, 'users', user.uid, 'gamepasses') : null, [firestore, user]));
    const auraItems = useCollection(useMemoFirebase(() => firestore && user ? collection(firestore, 'users', user.uid, 'auras') : null, [firestore, user]));
    const { data: achievementItems, isLoading: achievementsLoading } = useDoc(useMemoFirebase(() => firestore && user ? doc(firestore, 'users', user.uid, 'achievements', 'levels') : null, [firestore, user]));
    const { data: indexItems, isLoading: indexLoading } = useDoc(useMemoFirebase(() => firestore && user ? doc(firestore, 'users', user.uid, 'index', 'tiers') : null, [firestore, user]));
    const { data: obeliskItems, isLoading: obelisksLoading } = useDoc(useMemoFirebase(() => firestore && user ? doc(firestore, 'users', user.uid, 'obelisks', 'levels') : null, [firestore, user]));
    const powerItems = useCollection(useMemoFirebase(() => firestore && user ? collection(firestore, 'users', user.uid, 'powers') : null, [firestore, user]));
    const petItems = useCollection(useMemoFirebase(() => firestore && user ? collection(firestore, 'users', user.uid, 'pets') : null, [firestore, user]));
    const fighterItems = useCollection(useMemoFirebase(() => firestore && user ? collection(firestore, 'users', user.uid, 'fighters') : null, [firestore, user]));
    
    const { data: userDocData, isLoading: weaponsLoading } = useDoc(useMemoFirebase(() => firestore && user ? doc(firestore, `users/${user.uid}`) : null, [firestore, user]));
    const { data: rankData, isLoading: rankLoading } = useDoc(useMemoFirebase(() => firestore && user ? doc(firestore, 'users', user.uid, 'rank', 'current') : null, [firestore, user]));

    const isLoading = isUserLoading || isGameDataLoading || weaponsLoading || rankLoading || accessoryItems.isLoading || gamepassItems.isLoading || auraItems.isLoading || achievementsLoading || indexLoading || obelisksLoading || powerItems.isLoading || petItems.isLoading || fighterItems.isLoading;

    const totalBonuses = useMemo(() => {
        const bonuses: {
            [key in 'damage' | 'energy' | 'coins' | 'exp' | 'movespeed' | 'luck']: { multipliers: number[], bonuses: number[] }
        } = {
            damage: { multipliers: [], bonuses: [] },
            energy: { multipliers: [], bonuses: [] },
            coins: { multipliers: [], bonuses: [] },
            exp: { multipliers: [], bonuses: [] },
            movespeed: { multipliers: [], bonuses: [] },
            luck: { multipliers: [], bonuses: [] },
        };

        const addBonus = (category: keyof typeof bonuses, valueStr: string | undefined) => {
            if (!valueStr) return;
            const { value, isMultiplier } = parseBonusValue(valueStr);
            if (value === 0) return;
            if (isMultiplier) {
                 bonuses[category].multipliers.push(value);
            } else {
                 bonuses[category].bonuses.push(value);
            }
        };
        
        // Data processing logic
        const processData = (calculateForMaxFlag: boolean) => {
            // Accessories
            const accItems = calculateForMaxFlag ? accessories.map(acc => ({ ...acc, rarity: acc.rarity_options.slice(-1)[0].rarity })) : accessoryItems.data;
            accItems?.forEach((item: any) => {
                const fullAccessory = accessories.find(a => a.id === item.id);
                const rarityOption = fullAccessory?.rarity_options.find(ro => ro.rarity === item.rarity);
                if (!rarityOption) return;
                addBonus('damage', rarityOption.damage_bonus);
                addBonus('energy', rarityOption.energy_bonus);
                addBonus('coins', rarityOption.coins_bonus);
                addBonus('exp', rarityOption.exp_bonus);
                addBonus('movespeed', rarityOption.movespeed_bonus);
            });

            // Jewelry
            const jewelrySlots = (userDocData as any)?.jewelrySlots;
            if (jewelrySlots) {
                Object.values(jewelrySlots).forEach((jewel: any) => {
                    if (jewel) {
                        const jewelryData = allJewelry.find(j => j.id === jewel.id);
                        if (jewelryData) {
                            addBonus(jewelryData.bonusType, jewelryData.bonus);
                        }
                    }
                });
            }

            // Gamepasses
            const gpItems = calculateForMaxFlag ? allGamepasses : gamepassItems.data;
            gpItems?.forEach((item: any) => {
                const gamepassData = allGamepasses.find(gp => gp.id === item.id);
                if (gamepassData?.bonus_type && gamepassData.bonus_value) {
                    // Gamepass bonuses are multipliers, not additive
                    bonuses[gamepassData.bonus_type].multipliers.push(gamepassData.bonus_value);
                }
            });

            // Auras
            const equippedAuras = calculateForMaxFlag ? allAuras : auraItems.data;
            equippedAuras?.forEach((item: any) => {
                 const auraData = allAuras.find(a => a.id === item.id);
                 if (auraData?.bonus_type && auraData.bonus_value) {
                    if (auraData.bonus_type !== 'drops') {
                        addBonus(auraData.bonus_type, auraData.bonus_value);
                    }
                 }
            });

             // Achievements
            const achievementLevels = calculateForMaxFlag ? generalAchievements.reduce((acc, ach) => ({...acc, [ach.id]: ach.maxLevel}), {}) : achievementItems;
            if (achievementLevels) {
                generalAchievements.forEach(ach => {
                    const currentLevel = (achievementLevels as any)[ach.id] || 0;
                    if (ach.progressionBonus.includes('energia')) bonuses.energy.bonuses.push(currentLevel * 0.05);
                    if (ach.progressionBonus.includes('damage')) bonuses.damage.bonuses.push(currentLevel * 0.05);
                    if (ach.progressionBonus.includes('coins')) bonuses.coins.bonuses.push(currentLevel * 0.05);
                });
            }

            // Index Tiers
            const indexTiers = calculateForMaxFlag ? { avatarTier: 23, petTier: 23 } : indexItems;
            if (indexTiers) {
                bonuses.damage.bonuses.push(((indexTiers as any).avatarTier || 0) * 0.05);
                bonuses.energy.bonuses.push(((indexTiers as any).petTier || 0) * 0.05);
            }

            // Obelisks
            const obeliskLevels = calculateForMaxFlag ? { damage: 20, energy: 20, lucky: 10 } : obeliskItems;
            if(obeliskLevels) {
                bonuses.damage.bonuses.push(((obeliskLevels as any).damage || 0) * 0.02);
                bonuses.energy.bonuses.push(((obeliskLevels as any).energy || 0) * 0.02);
                bonuses.luck.bonuses.push(((obeliskLevels as any).lucky || 0) * 0.01);
            }

            // Weapons
            const allWeaponsData = [...damageSwords, ...scythes, ...energySwords];
            const equippedWeapons = calculateForMaxFlag ? 
                { 
                  '0': { id: 'Venomstrike', name: 'Venomstrike', rarity: 'Phantom', type: 'damage', evolutionLevel: 3, breathingEnchantment: 'Supreme', stoneEnchantment: 'Supreme'},
                  '1': { id: 'Stormreaver', name: 'Stormreaver', rarity: 'Supremo', type: 'scythe', evolutionLevel: 3, passiveEnchantment: 'Supreme' },
                  '2': { id: 'Excalibur', name: 'Excalibur', rarity: 'Comum', type: 'energy', evolutionLevel: 3 }
                } : (userDocData as any)?.weaponSlots;
            
            if(equippedWeapons) {
                Object.values(equippedWeapons).forEach((weapon: any) => {
                    const weaponBonuses = getWeaponBonus(weapon, allWeaponsData);
                    bonuses.damage.multipliers.push(...weaponBonuses.damage.multipliers);
                    bonuses.energy.multipliers.push(...weaponBonuses.energy.multipliers);
                });
            }
            
            // Powers, Auras, Pets, Fighters
            const itemCollections = [
                { data: powerItems.data, name: 'powers'},
                { data: petItems.data, name: 'pets'},
                { data: fighterItems.data, name: 'fighters'},
            ];
            
            if (calculateForMaxFlag) {
              const allItemCategories = ['powers', 'auras', 'pets', 'fighters'];
              allGameData.forEach(world => {
                allItemCategories.forEach(category => {
                  if(world[category]) {
                    world[category].forEach((item: any) => {
                       const itemToProcess = item.stats && item.stats.length > 0 ? item.stats.slice(-1)[0] : item;
                        addBonus('damage', itemToProcess.multiplier && itemToProcess.statType === 'damage' ? itemToProcess.multiplier : itemToProcess.damage_bonus);
                        addBonus('energy', itemToProcess.multiplier && itemToProcess.statType === 'energy' ? itemToProcess.multiplier : itemToProcess.energy_bonus);
                        addBonus('coins', itemToProcess.multiplier && itemToProcess.statType === 'coin' ? itemToProcess.multiplier : itemToProcess.coins_bonus);
                    });
                  }
                });
              });
            } else {
              itemCollections.forEach(collectionInfo => {
                  collectionInfo.data?.forEach((item: any) => {
                      if (collectionInfo.name === 'pets' && item.energy_bonus) {
                         const numericBonus = parseUserEnergy(item.energy_bonus);
                         bonuses.energy.bonuses.push(numericBonus / 100); 
                      } else {
                        addBonus('damage', item.multiplier && item.statType === 'damage' ? item.multiplier : item.damage_bonus);
                        addBonus('energy', item.multiplier && item.statType === 'energy' ? item.multiplier : item.energy_bonus);
                        addBonus('coins', item.multiplier && item.statType === 'coin' ? item.multiplier : item.coins_bonus);
                      }
                  });
              });
            }
        };

        processData(calculateForMax);
        
        // Final Calculation
        const rankValue = calculateForMax ? 205 : (rankData as any)?.value || 0;
        const baseEnergyGainStr = (energyGainPerRank as Record<string, string>)[rankValue.toString()] || '0';
        const baseEnergyGain = parseUserEnergy(baseEnergyGainStr);

        const totalEnergyMultiplier = bonuses.energy.multipliers.reduce((a, b) => a * b, 1);
        const totalEnergyBonus = bonuses.energy.bonuses.reduce((a, b) => a + b, 0);
        const finalEnergyGain = baseEnergyGain * totalEnergyMultiplier * (1 + totalEnergyBonus);
        
        const baseDamage = parseUserEnergy(currentEnergyInput); // Use user's current accumulated energy
        const totalDamageMultiplier = bonuses.damage.multipliers.reduce((a, b) => a * b, 1);
        const totalDamageBonus = bonuses.damage.bonuses.reduce((a, b) => a + b, 0);
        const finalDamage = baseDamage * totalDamageMultiplier * (1 + totalDamageBonus);

        const totalCoinsMultiplier = bonuses.coins.multipliers.reduce((a, b) => a * b, 1);
        const totalCoinsBonus = bonuses.coins.bonuses.reduce((a, b) => a + b, 0);
        
        const totalExpBonus = bonuses.exp.bonuses.reduce((a, b) => a + b, 0);
        const totalMovespeedBonus = bonuses.movespeed.bonuses.reduce((a, b) => a + b, 0);
        const totalLuckBonus = bonuses.luck.bonuses.reduce((a, b) => a + b, 0);


        return {
            damage: finalDamage,
            energyGain: finalEnergyGain,
            coins: totalCoinsMultiplier * (1 + totalCoinsBonus), // Presented as a multiplier
            exp: totalExpBonus * 100, // Presented as percentage
            movespeed: totalMovespeedBonus * 100, // Presented as percentage
            luck: totalLuckBonus * 100, // Presented as percentage
        };

    }, [
        accessoryItems.data, gamepassItems.data, auraItems.data, achievementItems, indexItems, obeliskItems,
        powerItems.data, petItems.data, fighterItems.data, userDocData, rankData, currentEnergyInput, calculateForMax, isGameDataLoading, allGameData
    ]);

    return {
        bonuses: totalBonuses,
        isLoading
    };
}
