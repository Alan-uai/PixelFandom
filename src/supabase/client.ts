import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key not found in environment variables');
}

export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export type Database = {
  public: {
    Tables: {
      worlds: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          required_level: number;
          image_url: string | null;
          is_unlocked: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          required_level?: number;
          image_url?: string | null;
          is_unlocked?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          required_level?: number;
          image_url?: string | null;
          is_unlocked?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      swords: {
        Row: {
          id: string;
          name: string;
          type: 'damage' | 'scythe' | 'energy';
          rarity: 'comum' | 'incomum' | 'raro' | 'epico' | 'lendario' | 'mitico' | 'phantom' | 'supremo' | 'divino';
          base_damage: string | null;
          one_star_damage: string | null;
          two_star_damage: string | null;
          three_star_damage: string | null;
          enchantments: Json | null;
          world_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: 'damage' | 'scythe' | 'energy';
          rarity: 'comum' | 'incomum' | 'raro' | 'epico' | 'lendario' | 'mitico' | 'phantom' | 'supremo' | 'divino';
          base_damage?: string | null;
          one_star_damage?: string | null;
          two_star_damage?: string | null;
          three_star_damage?: string | null;
          enchantments?: Json | null;
          world_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: 'damage' | 'scythe' | 'energy';
          rarity?: 'comum' | 'incomum' | 'raro' | 'epico' | 'lendario' | 'mitico' | 'phantom' | 'supremo' | 'divino';
          base_damage?: string | null;
          one_star_damage?: string | null;
          two_star_damage?: string | null;
          three_star_damage?: string | null;
          enchantments?: Json | null;
          world_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          username: string | null;
          email: string | null;
          tag: string | null;
          reputation_points: number;
          credits: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          email?: string | null;
          tag?: string | null;
          reputation_points?: number;
          credits?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          email?: string | null;
          tag?: string | null;
          reputation_points?: number;
          credits?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_inventory: {
        Row: {
          id: string;
          user_id: string;
          item_type: 'sword' | 'armor' | 'potion' | 'ring' | 'accessory' | 'aura' | 'pet' | 'chest' | 'quest' | 'fighter';
          item_id: string;
          quantity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          item_type: 'sword' | 'armor' | 'potion' | 'ring' | 'accessory' | 'aura' | 'pet' | 'chest' | 'quest' | 'fighter';
          item_id: string;
          quantity?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          item_type?: 'sword' | 'armor' | 'potion' | 'ring' | 'accessory' | 'aura' | 'pet' | 'chest' | 'quest' | 'fighter';
          item_id?: string;
          quantity?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_weapons: {
        Row: {
          id: string;
          user_id: string;
          slot_index: number;
          sword_id: string | null;
          equipped_rarity: string | null;
          evolution_level: number;
          breathing_enchantment: string | null;
          stone_enchantment: string | null;
          passive_enchantment: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          slot_index: number;
          sword_id?: string | null;
          equipped_rarity?: string | null;
          evolution_level?: number;
          breathing_enchantment?: string | null;
          stone_enchantment?: string | null;
          passive_enchantment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          slot_index?: number;
          sword_id?: string | null;
          equipped_rarity?: string | null;
          evolution_level?: number;
          breathing_enchantment?: string | null;
          stone_enchantment?: string | null;
          passive_enchantment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      dungeons: {
        Row: {
          id: string;
          world_id: string | null;
          name: string;
          description: string | null;
          boss_id: string | null;
          required_level: number;
          energy_cost: number;
          reward_coins: string | null;
          reward_exp: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          world_id?: string | null;
          name: string;
          description?: string | null;
          boss_id?: string | null;
          required_level?: number;
          energy_cost?: number;
          reward_coins?: string | null;
          reward_exp?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          world_id?: string | null;
          name?: string;
          description?: string | null;
          boss_id?: string | null;
          required_level?: number;
          energy_cost?: number;
          reward_coins?: string | null;
          reward_exp?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      bosses: {
        Row: {
          id: string;
          world_id: string | null;
          name: string;
          rank: string | null;
          hp: string | null;
          exp_reward: string | null;
          coin_reward: string | null;
          drop_items: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          world_id?: string | null;
          name: string;
          rank?: string | null;
          hp?: string | null;
          exp_reward?: string | null;
          coin_reward?: string | null;
          drop_items?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          world_id?: string | null;
          name?: string;
          rank?: string | null;
          hp?: string | null;
          exp_reward?: string | null;
          coin_reward?: string | null;
          drop_items?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      armors: {
        Row: {
          id: string;
          name: string;
          rarity: string;
          world_id: string | null;
          drop_boss_id: string | null;
          damage_bonus: string | null;
          energy_bonus: string | null;
          coins_bonus: string | null;
          exp_bonus: string | null;
          movespeed_bonus: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          rarity: string;
          world_id?: string | null;
          drop_boss_id?: string | null;
          damage_bonus?: string | null;
          energy_bonus?: string | null;
          coins_bonus?: string | null;
          exp_bonus?: string | null;
          movespeed_bonus?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          rarity?: string;
          world_id?: string | null;
          drop_boss_id?: string | null;
          damage_bonus?: string | null;
          energy_bonus?: string | null;
          coins_bonus?: string | null;
          exp_bonus?: string | null;
          movespeed_bonus?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      rings: {
        Row: {
          id: string;
          name: string;
          rarity: string;
          material: string | null;
          bonus_type: 'damage' | 'energy' | 'coins' | 'exp' | 'movespeed' | 'luck';
          bonus_value: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          rarity: string;
          material?: string | null;
          bonus_type: 'damage' | 'energy' | 'coins' | 'exp' | 'movespeed' | 'luck';
          bonus_value?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          rarity?: string;
          material?: string | null;
          bonus_type?: 'damage' | 'energy' | 'coins' | 'exp' | 'movespeed' | 'luck';
          bonus_value?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      quests: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          world_id: string | null;
          required_level: number;
          reward_coins: string | null;
          reward_exp: string | null;
          reward_items: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          world_id?: string | null;
          required_level?: number;
          reward_coins?: string | null;
          reward_exp?: string | null;
          reward_items?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          world_id?: string | null;
          required_level?: number;
          reward_coins?: string | null;
          reward_exp?: string | null;
          reward_items?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      chests: {
        Row: {
          id: string;
          name: string;
          rarity: string;
          world_id: string | null;
          cost_coins: string | null;
          cost_gems: string | null;
          possible_items: Json | null;
          drop_rates: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          rarity: string;
          world_id?: string | null;
          cost_coins?: string | null;
          cost_gems?: string | null;
          possible_items?: Json | null;
          drop_rates?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          rarity?: string;
          world_id?: string | null;
          cost_coins?: string | null;
          cost_gems?: string | null;
          possible_items?: Json | null;
          drop_rates?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type User = Database['public']['Tables']['profiles']['Row'];
export type World = Database['public']['Tables']['worlds']['Row'];
export type Sword = Database['public']['Tables']['swords']['Row'];
export type Dungeon = Database['public']['Tables']['dungeons']['Row'];
export type Boss = Database['public']['Tables']['bosses']['Row'];
export type Armor = Database['public']['Tables']['armors']['Row'];
export type Ring = Database['public']['Tables']['rings']['Row'];
export type Quest = Database['public']['Tables']['quests']['Row'];
export type Chest = Database['public']['Tables']['chests']['Row'];