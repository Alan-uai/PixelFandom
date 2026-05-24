import { SupabaseClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key not found in environment variables');
}

export const supabase: SupabaseClient = createBrowserClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      weapons: {
        Row: {
          id: string;
          name: string;
          rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'vaulted';
          weapon_type: string;
          damage_min: number;
          damage_max: number;
          crit_chance_min: number;
          crit_chance_max: number;
          attack_speed: 'fast' | 'medium' | 'slow';
          knockback: number;
          element: 'fire' | 'frost' | 'poison' | 'dark' | 'ghost' | 'void' | 'earth' | 'none';
          ability_name: string | null;
          ability_description: string | null;
          ability_energy_cost: number | null;
          ability_cooldown: number | null;
          ability_effect: string | null;
          obtain_method: string | null;
          craft_cost: number | null;
          craft_materials: Json | null;
          is_worth_crafting: boolean;
          drop_rate_multiplier: number | null;
          drop_rate_percentage: number | null;
          tier: 's_plus' | 's' | 'a' | 'b' | 'c' | 'd';
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'vaulted';
          weapon_type: string;
          damage_min: number;
          damage_max: number;
          crit_chance_min: number;
          crit_chance_max: number;
          attack_speed: 'fast' | 'medium' | 'slow';
          knockback: number;
          element: 'fire' | 'frost' | 'poison' | 'dark' | 'ghost' | 'void' | 'earth' | 'none';
          ability_name?: string | null;
          ability_description?: string | null;
          ability_energy_cost?: number | null;
          ability_cooldown?: number | null;
          ability_effect?: string | null;
          obtain_method?: string | null;
          craft_cost?: number | null;
          craft_materials?: Json | null;
          is_worth_crafting?: boolean;
          drop_rate_multiplier?: number | null;
          drop_rate_percentage?: number | null;
          tier?: 's_plus' | 's' | 'a' | 'b' | 'c' | 'd';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          rarity?: 'common' | 'rare' | 'epic' | 'legendary' | 'vaulted';
          weapon_type?: string;
          damage_min?: number;
          damage_max?: number;
          crit_chance_min?: number;
          crit_chance_max?: number;
          attack_speed?: 'fast' | 'medium' | 'slow';
          knockback?: number;
          element?: 'fire' | 'frost' | 'poison' | 'dark' | 'ghost' | 'void' | 'earth' | 'none';
          ability_name?: string | null;
          ability_description?: string | null;
          ability_energy_cost?: number | null;
          ability_cooldown?: number | null;
          ability_effect?: string | null;
          obtain_method?: string | null;
          craft_cost?: number | null;
          craft_materials?: Json | null;
          is_worth_crafting?: boolean;
          drop_rate_multiplier?: number | null;
          drop_rate_percentage?: number | null;
          tier?: 's_plus' | 's' | 'a' | 'b' | 'c' | 'd';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      armors: {
        Row: {
          id: string;
          name: string;
          rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'vaulted';
          world_name: string | null;
          health_bonus: number;
          speed_bonus: number;
          energy_bonus: number;
          passive_ability: string | null;
          passive_ability_level: number | null;
          obtain_method: string | null;
          craft_cost: number | null;
          craft_materials: Json | null;
          set_bonus: Json | null;
          is_worth_crafting: boolean;
          tier: 's_plus' | 's' | 'a' | 'b' | 'c' | 'd';
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'vaulted';
          world_name?: string | null;
          health_bonus: number;
          speed_bonus: number;
          energy_bonus: number;
          passive_ability?: string | null;
          passive_ability_level?: number | null;
          obtain_method?: string | null;
          craft_cost?: number | null;
          craft_materials?: Json | null;
          set_bonus?: Json | null;
          is_worth_crafting?: boolean;
          tier?: 's_plus' | 's' | 'a' | 'b' | 'c' | 'd';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          rarity?: 'common' | 'rare' | 'epic' | 'legendary' | 'vaulted';
          world_name?: string | null;
          health_bonus?: number;
          speed_bonus?: number;
          energy_bonus?: number;
          passive_ability?: string | null;
          passive_ability_level?: number | null;
          obtain_method?: string | null;
          craft_cost?: number | null;
          craft_materials?: Json | null;
          set_bonus?: Json | null;
          is_worth_crafting?: boolean;
          tier?: 's_plus' | 's' | 'a' | 'b' | 'c' | 'd';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      rings: {
        Row: {
          id: string;
          name: string;
          tier: 's_plus' | 's' | 'a' | 'b' | 'c' | 'd';
          rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'vaulted';
          description: string | null;
          starting_banner: string | null;
          key_buffs: Json | null;
          possible_stats: Json | null;
          synergy: string | null;
          is_craftable: boolean;
          craft_cost: number | null;
          craft_materials: Json | null;
          is_worth_crafting: boolean;
          obtain_method: string | null;
          drop_wave_requirement: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          tier: 's_plus' | 's' | 'a' | 'b' | 'c' | 'd';
          rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'vaulted';
          description?: string | null;
          starting_banner?: string | null;
          key_buffs?: Json | null;
          possible_stats?: Json | null;
          synergy?: string | null;
          is_craftable?: boolean;
          craft_cost?: number | null;
          craft_materials?: Json | null;
          is_worth_crafting?: boolean;
          obtain_method?: string | null;
          drop_wave_requirement?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          tier?: 's_plus' | 's' | 'a' | 'b' | 'c' | 'd';
          rarity?: 'common' | 'rare' | 'epic' | 'legendary' | 'vaulted';
          description?: string | null;
          starting_banner?: string | null;
          key_buffs?: Json | null;
          possible_stats?: Json | null;
          synergy?: string | null;
          is_craftable?: boolean;
          craft_cost?: number | null;
          craft_materials?: Json | null;
          is_worth_crafting?: boolean;
          obtain_method?: string | null;
          drop_wave_requirement?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      worlds: {
        Row: {
          id: string;
          world_name: string;
          world_number: number;
          world_type: string | null;
          level_range: string | null;
          status: string | null;
          description: string | null;
          environment: string | null;
          chapters: number;
          levels_per_chapter: number;
          difficulties: Json | null;
          is_coming_soon: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          world_name: string;
          world_number: number;
          world_type?: string | null;
          level_range?: string | null;
          status?: string | null;
          description?: string | null;
          environment?: string | null;
          chapters?: number;
          levels_per_chapter?: number;
          difficulties?: Json | null;
          is_coming_soon?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          world_name?: string;
          world_number?: number;
          world_type?: string | null;
          level_range?: string | null;
          status?: string | null;
          description?: string | null;
          environment?: string | null;
          chapters?: number;
          levels_per_chapter?: number;
          difficulties?: Json | null;
          is_coming_soon?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      bosses: {
        Row: {
          id: string;
          name: string;
          world_name: string | null;
          chapter: number | null;
          boss_type: string | null;
          description: string | null;
          hp_level: string | null;
          difficulty: string | null;
          attacks: Json | null;
          phase_mechanics: string | null;
          weakness: string[] | null;
          strategy: string | null;
          tips: string[] | null;
          xp_drop: string | null;
          items_dropped: Json | null;
          notable_loot: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          world_name?: string | null;
          chapter?: number | null;
          boss_type?: string | null;
          description?: string | null;
          hp_level?: string | null;
          difficulty?: string | null;
          attacks?: Json | null;
          phase_mechanics?: string | null;
          weakness?: string[] | null;
          strategy?: string | null;
          tips?: string[] | null;
          xp_drop?: string | null;
          items_dropped?: Json | null;
          notable_loot?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          world_name?: string | null;
          chapter?: number | null;
          boss_type?: string | null;
          description?: string | null;
          hp_level?: string | null;
          difficulty?: string | null;
          attacks?: Json | null;
          phase_mechanics?: string | null;
          weakness?: string[] | null;
          strategy?: string | null;
          tips?: string[] | null;
          xp_drop?: string | null;
          items_dropped?: Json | null;
          notable_loot?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      enemies: {
        Row: {
          id: string;
          name: string;
          world_name: string | null;
          chapters: Json | null;
          enemy_type: string | null;
          description: string | null;
          health_level: string | null;
          speed_level: string | null;
          strength_level: string | null;
          difficulty: string | null;
          attacks: Json | null;
          effects: Json | null;
          xp_drop: string | null;
          coin_drop: string | null;
          items_dropped: Json | null;
          weakness: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          world_name?: string | null;
          chapters?: Json | null;
          enemy_type?: string | null;
          description?: string | null;
          health_level?: string | null;
          speed_level?: string | null;
          strength_level?: string | null;
          difficulty?: string | null;
          attacks?: Json | null;
          effects?: Json | null;
          xp_drop?: string | null;
          coin_drop?: string | null;
          items_dropped?: Json | null;
          weakness?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          world_name?: string | null;
          chapters?: Json | null;
          enemy_type?: string | null;
          description?: string | null;
          health_level?: string | null;
          speed_level?: string | null;
          strength_level?: string | null;
          difficulty?: string | null;
          attacks?: Json | null;
          effects?: Json | null;
          xp_drop?: string | null;
          coin_drop?: string | null;
          items_dropped?: Json | null;
          weakness?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      upgrades: {
        Row: {
          id: string;
          name: string;
          category: string;
          description: string | null;
          effect: string;
          per_rank_effect: string | null;
          max_ranks: number;
          damage_per_spirit: number | null;
          speed_per_spirit: number | null;
          tier: 's_plus' | 's' | 'a' | 'b' | 'c' | 'd';
          priority_order: number | null;
          is_must_pick: boolean;
          notes: string | null;
          important_notes: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category: string;
          description?: string | null;
          effect: string;
          per_rank_effect?: string | null;
          max_ranks?: number;
          damage_per_spirit?: number | null;
          speed_per_spirit?: number | null;
          tier: 's_plus' | 's' | 'a' | 'b' | 'c' | 'd';
          priority_order?: number | null;
          is_must_pick?: boolean;
          notes?: string | null;
          important_notes?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string;
          description?: string | null;
          effect?: string;
          per_rank_effect?: string | null;
          max_ranks?: number;
          damage_per_spirit?: number | null;
          speed_per_spirit?: number | null;
          tier?: 's_plus' | 's' | 'a' | 'b' | 'c' | 'd';
          priority_order?: number | null;
          is_must_pick?: boolean;
          notes?: string | null;
          important_notes?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      potions: {
        Row: {
          id: string;
          name: string;
          effects: Json;
          shop_price: number | null;
          crafting_cost: number | null;
          crafting_materials: Json | null;
          savings_percentage: number | null;
          unlock_level: number | null;
          second_slot_unlock_level: number | null;
          max_uses_per_run: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          effects: Json;
          shop_price?: number | null;
          crafting_cost?: number | null;
          crafting_materials?: Json | null;
          savings_percentage?: number | null;
          unlock_level?: number | null;
          second_slot_unlock_level?: number | null;
          max_uses_per_run?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          effects?: Json;
          shop_price?: number | null;
          crafting_cost?: number | null;
          crafting_materials?: Json | null;
          savings_percentage?: number | null;
          unlock_level?: number | null;
          second_slot_unlock_level?: number | null;
          max_uses_per_run?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      codes: {
        Row: {
          id: string;
          code: string;
          rewards: Json;
          reward_type: string | null;
          code_type: string | null;
          is_active: boolean;
          verified_date: string | null;
          verified_by: string | null;
          is_expired: boolean;
          expired_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          rewards: Json;
          reward_type?: string | null;
          code_type?: string | null;
          is_active?: boolean;
          verified_date?: string | null;
          verified_by?: string | null;
          is_expired?: boolean;
          expired_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          rewards?: Json;
          reward_type?: string | null;
          code_type?: string | null;
          is_active?: boolean;
          verified_date?: string | null;
          verified_by?: string | null;
          is_expired?: boolean;
          expired_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      // =========================================
      // Multi-Tenant Tables
      // =========================================
      tenants: {
        Row: {
          id: string;
          name: string;
          slug: string;
          custom_domain: string | null;
          logo_url: string | null;
          description: string | null;
          theme: Json;
          ai_enabled: boolean;
          ai_config: Json;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          custom_domain?: string | null;
          logo_url?: string | null;
          description?: string | null;
          theme?: Json;
          ai_enabled?: boolean;
          ai_config?: Json;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          custom_domain?: string | null;
          logo_url?: string | null;
          description?: string | null;
          theme?: Json;
          ai_enabled?: boolean;
          ai_config?: Json;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      tenant_members: {
        Row: {
          tenant_id: string;
          user_id: string;
          role: 'owner' | 'admin' | 'editor' | 'viewer';
          invited_by: string | null;
          created_at: string;
        };
        Insert: {
          tenant_id: string;
          user_id: string;
          role?: 'owner' | 'admin' | 'editor' | 'viewer';
          invited_by?: string | null;
          created_at?: string;
        };
        Update: {
          tenant_id?: string;
          user_id?: string;
          role?: 'owner' | 'admin' | 'editor' | 'viewer';
          invited_by?: string | null;
          created_at?: string;
        };
      };
      discord_guilds: {
        Row: {
          guild_id: string;
          tenant_id: string | null;
          channel_id: string | null;
          bot_enabled: boolean;
          created_at: string;
        };
        Insert: {
          guild_id: string;
          tenant_id?: string | null;
          channel_id?: string | null;
          bot_enabled?: boolean;
          created_at?: string;
        };
        Update: {
          guild_id?: string;
          tenant_id?: string | null;
          channel_id?: string | null;
          bot_enabled?: boolean;
          created_at?: string;
        };
      };
      custom_collections: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          slug: string;
          description: string | null;
          schema: Json;
          icon: string | null;
          item_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          slug: string;
          description?: string | null;
          schema?: Json;
          icon?: string | null;
          item_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          schema?: Json;
          icon?: string | null;
          item_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      collection_items: {
        Row: {
          id: string;
          collection_id: string;
          data: Json;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          collection_id: string;
          data?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          collection_id?: string;
          data?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};

export type Weapon = Database['public']['Tables']['weapons']['Row'];
export type Armor = Database['public']['Tables']['armors']['Row'];
export type Ring = Database['public']['Tables']['rings']['Row'];
export type World = Database['public']['Tables']['worlds']['Row'];
export type Boss = Database['public']['Tables']['bosses']['Row'];
export type Enemy = Database['public']['Tables']['enemies']['Row'];
export type Upgrade = Database['public']['Tables']['upgrades']['Row'];
export type Potion = Database['public']['Tables']['potions']['Row'];
export type Code = Database['public']['Tables']['codes']['Row'];
export type Tenant = Database['public']['Tables']['tenants']['Row'];
export type TenantMember = Database['public']['Tables']['tenant_members']['Row'];
export type DiscordGuild = Database['public']['Tables']['discord_guilds']['Row'];
export type CustomCollection = Database['public']['Tables']['custom_collections']['Row'];
export type CollectionItem = Database['public']['Tables']['collection_items']['Row'];
