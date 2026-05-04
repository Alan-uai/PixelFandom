'use server';

import { supabase } from './client';

export async function getAllGameData() {
  try {
    const { data: worlds, error: worldsError } = await supabase
      .from('worlds')
      .select('*')
      .order('world_number');

    if (worldsError) throw worldsError;

    const tableNames = ['weapons', 'armors', 'potions', 'rings', 'upgrades', 'enemies', 'bosses', 'crafting_recipes', 'resources', 'codes'];

    const allDataPromises = worlds.map(async (world: any) => {
      const worldWithSubcollections: any = { ...world };
      
      for (const tableName of tableNames) {
        const { data: tableData, error: tableError } = await supabase
          .from(tableName)
          .select('*')
          .eq('world_name', world.world_name);

        if (!tableError && tableData && tableData.length > 0) {
          const key = tableName === 'weapons' ? 'swords' : 
                      tableName === 'armors' ? 'accessories' :
                      tableName === 'potions' ? 'powers' :
                      tableName === 'enemies' ? 'npcs' :
                      tableName === 'bosses' ? 'dungeons' :
                      tableName;
          worldWithSubcollections[key] = tableData;
        }
      }
      return worldWithSubcollections;
    });

    const allData = await Promise.all(allDataPromises);
    return allData;

  } catch (error) {
    console.error('Error fetching all game data from Supabase:', error);
    return { error: 'An error occurred while fetching all game data from Supabase.' };
  }
}

export async function getGameDataByWorld(worldName: string, category: string, itemName?: string) {
  try {
    const tableMap: Record<string, string> = {
      'swords': 'weapons',
      'accessories': 'armors',
      'powers': 'potions',
      'rings': 'rings',
      'upgrades': 'upgrades',
      'npcs': 'enemies',
      'dungeons': 'bosses',
    };

    const tableName = tableMap[category] || category;
    
    let query = supabase.from(tableName).select('*').eq('world_name', worldName);

    if (itemName) {
      query = query.ilike('name', `%${itemName}%`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];

  } catch (error) {
    console.error('Error fetching game data:', error);
    return { error: 'An error occurred while fetching data from Supabase.' };
  }
}

export async function getUserProfileJson() {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error || !profile) {
      return [];
    }

    return profile;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return [];
  }
}

export async function getGameDataVersion(): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('game_config')
      .select('config_value')
      .eq('config_key', 'gameDataVersion')
      .single();

    if (error || !data) {
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
      return today;
    }

    return data.config_value?.version || new Date().toISOString().split('T')[0].replace(/-/g, '');
  } catch {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    return today;
  }
}