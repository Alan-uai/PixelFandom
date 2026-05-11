import { supabase } from './client';

export async function getGameDataVersion(): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('game_config')
      .select('config_value')
      .eq('config_key', 'gameDataVersion')
      .single();

    if (!error && data) {
      return data.config_value as string;
    }
  } catch (e) {
    console.error('Failed to fetch game data version:', e);
  }
  return '1.0.0';
}

export async function getAllGameData(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('game_config')
      .select('config_value')
      .eq('config_key', 'allGameData')
      .single();

    if (!error && data) {
      return data.config_value as any[];
    }
  } catch (e) {
    console.error('Failed to fetch all game data:', e);
  }
  return [];
}

export async function getGameDataByWorld(worldName: string): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('worlds')
      .select('*')
      .ilike('world_name', `%${worldName}%`)
      .single();

    if (!error && data) {
      return data;
    }
  } catch (e) {
    console.error('Failed to fetch game data by world:', e);
  }
  return null;
}

export async function getUserProfileJson(): Promise<any> {
  return { levels: {} };
}
