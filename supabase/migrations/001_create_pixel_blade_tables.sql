-- =====================================================
-- PIXEL BLADE DATABASE - TABLES FOR SUPABASE
-- =====================================================
-- Generated from wiki data extraction
-- NOTE: Uses DROP TABLE IF EXISTS to overwrite old data
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- DROP EXISTING TABLES AND TYPES (for overwrite)
-- =====================================================

DROP TABLE IF EXISTS weapon_abilities CASCADE;
DROP TABLE IF EXISTS build_presets CASCADE;
DROP TABLE IF EXISTS game_config CASCADE;
DROP TABLE IF EXISTS resources CASCADE;
DROP TABLE IF EXISTS crafting_recipes CASCADE;
DROP TABLE IF EXISTS codes CASCADE;
DROP TABLE IF EXISTS bosses CASCADE;
DROP TABLE IF EXISTS enemies CASCADE;
DROP TABLE IF EXISTS worlds CASCADE;
DROP TABLE IF EXISTS spirit_capacity_synergy CASCADE;
DROP TABLE IF EXISTS spirit_system_config CASCADE;
DROP TABLE IF EXISTS upgrades CASCADE;
DROP TABLE IF EXISTS potions CASCADE;
DROP TABLE IF EXISTS rings CASCADE;
DROP TABLE IF EXISTS ring_stat_formulas CASCADE;
DROP TABLE IF EXISTS ring_quality_tiers CASCADE;
DROP TABLE IF EXISTS armors CASCADE;
DROP TABLE IF EXISTS weapons CASCADE;

DROP TYPE IF EXISTS tier_rank;
DROP TYPE IF EXISTS element_type;
DROP TYPE IF EXISTS attack_speed_type;
DROP TYPE IF EXISTS rarity_level;

-- =====================================================
-- ENUMS (Recreate after drop)
-- =====================================================

CREATE TYPE rarity_level AS ENUM ('common', 'rare', 'epic', 'legendary', 'vaulted');
CREATE TYPE attack_speed_type AS ENUM ('fast', 'medium', 'slow');
CREATE TYPE element_type AS ENUM ('fire', 'frost', 'poison', 'dark', 'ghost', 'void', 'earth', 'none');
CREATE TYPE tier_rank AS ENUM ('s_plus', 's', 'a', 'b', 'c', 'd');

-- =====================================================
-- WEAPONS TABLE
-- =====================================================

CREATE TABLE weapons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    rarity rarity_level NOT NULL,
    weapon_type VARCHAR(50) NOT NULL,
    
    -- Stats
    damage_min INTEGER NOT NULL,
    damage_max INTEGER NOT NULL,
    crit_chance_min DECIMAL(5,2) NOT NULL,
    crit_chance_max DECIMAL(5,2) NOT NULL,
    attack_speed attack_speed_type NOT NULL,
    knockback DECIMAL(4,2) NOT NULL,
    element element_type DEFAULT 'none',
    
    -- Ability
    ability_name VARCHAR(100),
    ability_description TEXT,
    ability_energy_cost INTEGER,
    ability_cooldown INTEGER,
    ability_effect TEXT,
    
    -- Source
    obtain_method VARCHAR(100),
    craft_cost INTEGER,
    craft_materials JSONB,
    is_worth_crafting BOOLEAN DEFAULT false,
    
    -- Drop rates
    drop_rate_multiplier DECIMAL(6,4),
    drop_rate_percentage DECIMAL(6,4),
    
    -- Tier ranking
    tier tier_rank DEFAULT 'c',
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_weapons_rarity ON weapons(rarity);
CREATE INDEX idx_weapons_tier ON weapons(tier);
CREATE INDEX idx_weapons_type ON weapons(weapon_type);
CREATE INDEX idx_weapons_element ON weapons(element);

-- =====================================================
-- ARMORS TABLE
-- =====================================================

CREATE TABLE armors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    rarity rarity_level NOT NULL,
    world_name VARCHAR(50),
    
    -- Stats
    health_bonus INTEGER NOT NULL,
    speed_bonus INTEGER NOT NULL,
    energy_bonus INTEGER NOT NULL,
    
    -- Passive abilities (Legendary+)
    passive_ability TEXT,
    passive_ability_level INTEGER,
    
    -- Source
    obtain_method VARCHAR(100),
    craft_cost INTEGER,
    craft_materials JSONB,
    set_bonus JSONB,
    is_worth_crafting BOOLEAN DEFAULT false,
    
    -- Tier ranking
    tier tier_rank DEFAULT 'c',
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_armors_rarity ON armors(rarity);
CREATE INDEX idx_armors_world ON armors(world_name);
CREATE INDEX idx_armors_tier ON armors(tier);

-- =====================================================
-- RINGS TABLE
-- =====================================================

CREATE TABLE rings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    tier tier_rank NOT NULL,
    rarity rarity_level NOT NULL,
    
    -- Stats
    description TEXT,
    starting_banner VARCHAR(50),
    key_buffs JSONB,
    possible_stats JSONB,
    synergy TEXT,
    
    -- Crafting
    is_craftable BOOLEAN DEFAULT false,
    craft_cost INTEGER,
    craft_materials JSONB,
    is_worth_crafting BOOLEAN DEFAULT false,
    
    -- Drop
    obtain_method VARCHAR(100),
    drop_wave_requirement INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_rings_tier ON rings(tier);
CREATE INDEX idx_rings_rarity ON rings(rarity);
CREATE INDEX idx_rings_craftable ON rings(is_craftable);

-- =====================================================
-- RING QUALITY SYSTEM
-- =====================================================

CREATE TABLE ring_quality_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tier_name VARCHAR(50) NOT NULL UNIQUE,
    quality_min INTEGER NOT NULL,
    quality_max INTEGER NOT NULL,
    description TEXT,
    aura_color VARCHAR(50),
    action VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- RING STAT FORMULAS (Kennot's formulas)
-- =====================================================

CREATE TABLE ring_stat_formulas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stat_type VARCHAR(50) NOT NULL,
    formula VARCHAR(100) NOT NULL,
    coefficient_a DECIMAL(10,4),
    coefficient_b DECIMAL(10,4),
    highest_scaling_range VARCHAR(20),
    stardust_to_level_8 INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- POTIONS TABLE
-- =====================================================

CREATE TABLE potions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    
    -- Effects stored as JSON
    effects JSONB NOT NULL,
    
    -- Pricing
    shop_price INTEGER,
    crafting_cost INTEGER,
    crafting_materials JSONB,
    savings_percentage INTEGER,
    
    -- Unlocks
    unlock_level INTEGER,
    second_slot_unlock_level INTEGER,
    max_uses_per_run INTEGER DEFAULT 3,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- UPGRADES / BANNERS TABLE
-- =====================================================

CREATE TABLE upgrades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    
    -- Categories: offensive, defensive, utility
    category VARCHAR(50) NOT NULL,
    
    -- Description
    description TEXT,
    effect TEXT NOT NULL,
    per_rank_effect VARCHAR(200),
    
    -- Scaling
    max_ranks INTEGER DEFAULT 4,
    damage_per_spirit DECIMAL(5,2),
    speed_per_spirit DECIMAL(5,2),
    
    -- Priority
    tier tier_rank NOT NULL,
    priority_order INTEGER,
    is_must_pick BOOLEAN DEFAULT false,
    
    -- Notes
    notes TEXT,
    important_notes TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_upgrades_category ON upgrades(category);
CREATE INDEX idx_upgrades_tier ON upgrades(tier);
CREATE INDEX idx_upgrades_priority ON upgrades(priority_order);

-- =====================================================
-- SPIRIT SYSTEM
-- =====================================================

CREATE TABLE spirit_system_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    default_capacity INTEGER DEFAULT 2,
    max_capacity INTEGER DEFAULT 10,
    recommended_minimum INTEGER DEFAULT 6,
    
    per_spirit_speed_bonus DECIMAL(5,2) DEFAULT 5.0,
    per_spirit_damage_bonus DECIMAL(5,2) DEFAULT 8.0,
    
    boss_spirit_value INTEGER DEFAULT 2,
    boss_spirit_speed_multiplier DECIMAL(4,2) DEFAULT 2.0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE spirit_capacity_synergy (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    capacity INTEGER NOT NULL,
    max_damage_bonus VARCHAR(20),
    max_speed_bonus VARCHAR(20),
    notes VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- WORLDS TABLE
-- =====================================================

CREATE TABLE worlds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    world_name VARCHAR(100) NOT NULL UNIQUE,
    world_number INTEGER NOT NULL,
    world_type VARCHAR(50),
    level_range VARCHAR(20),
    status VARCHAR(20) DEFAULT 'available',
    description TEXT,
    environment TEXT,
    chapters INTEGER DEFAULT 3,
    levels_per_chapter INTEGER DEFAULT 5,
    difficulties JSONB,
    is_coming_soon BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_worlds_number ON worlds(world_number);
CREATE INDEX idx_worlds_status ON worlds(status);

-- =====================================================
-- ENEMIES TABLE
-- =====================================================

CREATE TABLE enemies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    
    -- World/Chapter association
    world_name VARCHAR(50),
    chapters JSONB,
    
    -- Stats
    enemy_type VARCHAR(50),
    description TEXT,
    health_level VARCHAR(30),
    speed_level VARCHAR(30),
    strength_level VARCHAR(30),
    difficulty VARCHAR(30),
    
    -- Attacks
    attacks JSONB,
    effects JSONB,
    
    -- Drops
    xp_drop VARCHAR(20),
    coin_drop VARCHAR(20),
    items_dropped JSONB,
    
    -- Weakness
    weakness element_type[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_enemies_world ON enemies(world_name);
CREATE INDEX idx_enemies_type ON enemies(enemy_type);
CREATE INDEX idx_enemies_difficulty ON enemies(difficulty);

-- =====================================================
-- BOSSES TABLE
-- =====================================================

CREATE TABLE bosses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    
    -- World association
    world_name VARCHAR(50),
    chapter INTEGER,
    boss_type VARCHAR(50) DEFAULT 'boss',
    
    -- Description
    description TEXT,
    hp_level VARCHAR(30),
    difficulty VARCHAR(30),
    
    -- Attacks/Mechanics
    attacks JSONB,
    phase_mechanics TEXT,
    weakness element_type[],
    
    -- Strategy
    strategy TEXT,
    tips TEXT[],
    
    -- Drops
    xp_drop VARCHAR(20),
    items_dropped JSONB,
    notable_loot JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bosses_world ON bosses(world_name);
CREATE INDEX idx_bosses_chapter ON bosses(chapter);
CREATE INDEX idx_bosses_type ON bosses(boss_type);

-- =====================================================
-- CODES TABLE
-- =====================================================

CREATE TABLE codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    
    -- Rewards
    rewards JSONB NOT NULL,
    reward_type VARCHAR(50),
    
    -- Code type
    code_type VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    
    -- Verification
    verified_date DATE,
    verified_by VARCHAR(100),
    
    -- Expiration
    is_expired BOOLEAN DEFAULT false,
    expired_date DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_codes_active ON codes(is_active) WHERE is_active = true;
CREATE INDEX idx_codes_type ON codes(code_type);

-- =====================================================
-- CRAFTING RECIPES TABLE
-- =====================================================

CREATE TABLE crafting_recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_name VARCHAR(100) NOT NULL,
    item_type VARCHAR(50) NOT NULL,
    rarity rarity_level,
    
    -- Cost
    gold_cost INTEGER NOT NULL,
    
    -- Materials
    materials JSONB NOT NULL,
    
    -- Recommendation
    is_worth_crafting BOOLEAN DEFAULT false,
    worth_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_crafting_type ON crafting_recipes(item_type);
CREATE INDEX idx_crafting_rarity ON crafting_recipes(rarity);

-- =====================================================
-- RESOURCES / MATERIALS TABLE
-- =====================================================

CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_name VARCHAR(100) NOT NULL UNIQUE,
    resource_type VARCHAR(50) NOT NULL,
    
    -- Source
    source_world VARCHAR(50),
    source_method VARCHAR(100),
    
    -- Usage
    usage_description TEXT,
    items_crafted JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_resources_type ON resources(resource_type);
CREATE INDEX idx_resources_world ON resources(source_world);

-- =====================================================
-- GAME INFO / CONFIGURATION
-- =====================================================

CREATE TABLE game_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value JSONB NOT NULL,
    category VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- BUILD PRESETS TABLE
-- =====================================================

CREATE TABLE build_presets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    build_name VARCHAR(100) NOT NULL UNIQUE,
    build_type VARCHAR(50) NOT NULL,
    
    -- Recommended upgrades
    recommended_upgrades JSONB NOT NULL,
    
    -- Recommended gear
    recommended_armor VARCHAR(100),
    recommended_weapon VARCHAR(100),
    
    -- Strategy
    strategy TEXT,
    difficulty_level VARCHAR(50),
    is_meta BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLES FOR ABILITIES (from weapons)
-- =====================================================

CREATE TABLE weapon_abilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ability_name VARCHAR(100) NOT NULL UNIQUE,
    
    -- Effect
    description TEXT NOT NULL,
    effect_type VARCHAR(50),
    effect_details JSONB,
    
    -- Weapons that have this ability
    weapons JSONB,
    
    -- Stats
    energy_cost INTEGER,
    cooldown_seconds INTEGER,
    duration_seconds INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- UPDATE TIMESTAMP FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to tables with updated_at
CREATE TRIGGER update_weapons_updated_at BEFORE UPDATE ON weapons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_armors_updated_at BEFORE UPDATE ON armors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_rings_updated_at BEFORE UPDATE ON rings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_potions_updated_at BEFORE UPDATE ON potions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_upgrades_updated_at BEFORE UPDATE ON upgrades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_worlds_updated_at BEFORE UPDATE ON worlds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_enemies_updated_at BEFORE UPDATE ON enemies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_bosses_updated_at BEFORE UPDATE ON bosses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_codes_updated_at BEFORE UPDATE ON codes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_crafting_recipes_updated_at BEFORE UPDATE ON crafting_recipes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_game_config_updated_at BEFORE UPDATE ON game_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_build_presets_updated_at BEFORE UPDATE ON build_presets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- SUMMARY
-- =====================================================

COMMENT ON TABLE weapons IS 'All weapons in Pixel Blade with stats, abilities, and drop rates';
COMMENT ON TABLE armors IS 'All armors with health/speed/energy bonuses';
COMMENT ON TABLE rings IS 'Rings with tiers, buffs, and crafting info';
COMMENT ON TABLE potions IS 'Consumable potions with effects and costs';
COMMENT ON TABLE upgrades IS 'Banner upgrades (Rage Spirits, Spirit Capacity, etc)';
COMMENT ON TABLE worlds IS 'Game worlds and their configurations';
COMMENT ON TABLE enemies IS 'Enemy types with stats and weaknesses';
COMMENT ON TABLE bosses IS 'Boss enemies with mechanics and strategies';
COMMENT ON TABLE codes IS 'Redeemable codes (active and expired)';
COMMENT ON TABLE crafting_recipes IS 'Blacksmith crafting recipes';
COMMENT ON TABLE resources IS 'Crafting materials and resources';
COMMENT ON TABLE game_config IS 'General game configuration and settings';
COMMENT ON TABLE build_presets IS 'Popular build presets and recommendations';