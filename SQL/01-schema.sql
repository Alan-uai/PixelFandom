-- =====================================================
-- PIXEL FANTASY - SUPABASE DATABASE SCHEMA
-- Novo jogo - Estrutura base de dados
-- =====================================================

-- =====================================================
-- EXTENSIONS
-- =====================================================

-- UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUMS
-- =====================================================

-- Raridade dos itens
CREATE TYPE rarity AS ENUM (
    'comum', 'incomum', 'raro', 'epico', 'lendario', 'mitico', 'phantom', 'supremo', 'divino'
);

-- Tipo de arma
CREATE TYPE weapon_type AS ENUM ('damage', 'scythe', 'energy');

-- Tipo de item
CREATE TYPE item_type AS ENUM (
    'sword', 'armor', 'potion', 'ring', 'accessory', 'aura', 'pet', 'chest', 'quest', 'fighter'
);

-- Tipo de fighter
CREATE TYPE fighter_type AS ENUM ('titan', 'stand', 'shadow', 'ghoul');

-- Tipo de bônus
CREATE TYPE bonus_type AS ENUM ('damage', 'energy', 'coins', 'exp', 'movespeed', 'luck');

-- Status da missão
CREATE TYPE quest_status AS ENUM ('available', 'in_progress', 'completed', 'failed');

-- =====================================================
-- TABELAS PÚBLICAS - DADOS DO JOGO
-- =====================================================

-- -------------------------------------------------
-- MUNDOS (Worlds)
-- -------------------------------------------------
CREATE TABLE worlds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    required_level INTEGER DEFAULT 1,
    image_url TEXT,
    is_unlocked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_worlds_name ON worlds(name);
CREATE INDEX idx_worlds_required_level ON worlds(required_level);

-- -------------------------------------------------
-- MASMORRAS (Dungeons)
-- -------------------------------------------------
CREATE TABLE dungeons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    world_id UUID REFERENCES worlds(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    boss_id UUID,
    required_level INTEGER DEFAULT 1,
    energy_cost INTEGER DEFAULT 0,
    reward_coins VARCHAR(50),
    reward_exp VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_dungeons_world ON dungeons(world_id);
CREATE INDEX idx_dungeons_required_level ON dungeons(required_level);

-- -------------------------------------------------
-- BOSSES
-- -------------------------------------------------
CREATE TABLE bosses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    world_id UUID REFERENCES worlds(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    rank VARCHAR(50),
    hp VARCHAR(100),
    exp_reward VARCHAR(50),
    coin_reward VARCHAR(50),
    drop_items JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bosses_world ON bosses(world_id);

-- -------------------------------------------------
-- ESPADAS (Swords)
-- -------------------------------------------------
CREATE TABLE swords (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type weapon_type NOT NULL,
    rarity rarity NOT NULL,
    base_damage VARCHAR(50),
    one_star_damage VARCHAR(50),
    two_star_damage VARCHAR(50),
    three_star_damage VARCHAR(50),
    enchantments JSONB,
    world_id UUID REFERENCES worlds(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_swords_name ON swords(name);
CREATE INDEX idx_swords_rarity ON swords(rarity);
CREATE INDEX idx_swords_type ON swords(type);
CREATE INDEX idx_swords_world ON swords(world_id);

-- -------------------------------------------------
-- ARMADURAS (Armors)
-- -------------------------------------------------
CREATE TABLE armors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    rarity rarity NOT NULL,
    world_id UUID REFERENCES worlds(id),
    drop_boss_id UUID REFERENCES bosses(id),
    damage_bonus VARCHAR(50),
    energy_bonus VARCHAR(50),
    coins_bonus VARCHAR(50),
    exp_bonus VARCHAR(50),
    movespeed_bonus VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_armors_name ON armors(name);
CREATE INDEX idx_armors_rarity ON armors(rarity);
CREATE INDEX idx_armors_world ON armors(world_id);

-- -------------------------------------------------
-- POÇÕES (Potions)
-- -------------------------------------------------
CREATE TABLE potions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    rarity rarity NOT NULL,
    effect_type VARCHAR(50),
    effect_value VARCHAR(50),
    duration VARCHAR(50),
    cost_coins VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_potions_name ON potions(name);
CREATE INDEX idx_potions_rarity ON potions(rarity);
CREATE INDEX idx_potions_effect_type ON potions(effect_type);

-- -------------------------------------------------
-- ANÉIS (Rings)
-- -------------------------------------------------
CREATE TABLE rings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    rarity rarity NOT NULL,
    material VARCHAR(50),
    bonus_type bonus_type NOT NULL,
    bonus_value VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_rings_name ON rings(name);
CREATE INDEX idx_rings_rarity ON rings(rarity);
CREATE INDEX idx_rings_material ON rings(material);
CREATE INDEX idx_rings_bonus_type ON rings(bonus_type);

-- -------------------------------------------------
-- ACESSÓRIOS (Accessories)
-- -------------------------------------------------
CREATE TABLE accessories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    rarity rarity NOT NULL,
    world_id UUID REFERENCES worlds(id),
    drop_boss_id UUID REFERENCES bosses(id),
    damage_bonus VARCHAR(50),
    energy_bonus VARCHAR(50),
    coins_bonus VARCHAR(50),
    exp_bonus VARCHAR(50),
    movespeed_bonus VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_accessories_name ON accessories(name);
CREATE INDEX idx_accessories_rarity ON accessories(rarity);
CREATE INDEX idx_accessories_world ON accessories(world_id);

-- -------------------------------------------------
-- AURAS
-- -------------------------------------------------
CREATE TABLE auras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    rarity rarity NOT NULL,
    bonus_type bonus_type NOT NULL,
    bonus_value VARCHAR(50),
    world_id UUID REFERENCES worlds(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_auras_name ON auras(name);
CREATE INDEX idx_auras_rarity ON auras(rarity);
CREATE INDEX idx_auras_bonus_type ON auras(bonus_type);

-- -------------------------------------------------
-- PETS
-- -------------------------------------------------
CREATE TABLE pets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    rarity rarity NOT NULL,
    rank VARCHAR(50),
    energy_bonus VARCHAR(50),
    world_id UUID REFERENCES worlds(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_pets_name ON pets(name);
CREATE INDEX idx_pets_rarity ON pets(rarity);
CREATE INDEX idx_pets_world ON pets(world_id);

-- -------------------------------------------------
-- FIGHTERS (Titans, Stands, Shadows, Ghouls)
-- -------------------------------------------------
CREATE TABLE fighters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type fighter_type NOT NULL,
    rarity rarity NOT NULL,
    world_id UUID REFERENCES worlds(id),
    energy_bonus VARCHAR(50),
    damage_bonus VARCHAR(50),
    stats JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_fighters_name ON fighters(name);
CREATE INDEX idx_fighters_type ON fighters(type);
CREATE INDEX idx_fighters_rarity ON fighters(rarity);
CREATE INDEX idx_fighters_world ON fighters(world_id);

-- -------------------------------------------------
-- GAMEPASSES
-- -------------------------------------------------
CREATE TABLE gamepasses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    bonus_type bonus_type NOT NULL,
    bonus_value VARCHAR(50),
    price_coins VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_gamepasses_name ON gamepasses(name);

-- -------------------------------------------------
-- CONQUISTAS (Achievements)
-- -------------------------------------------------
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    achievement_type VARCHAR(50),
    category VARCHAR(50),
    max_level INTEGER DEFAULT 1,
    requirement VARCHAR(100),
    progression_bonus VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_achievements_name ON achievements(name);
CREATE INDEX idx_achievements_category ON achievements(category);
CREATE INDEX idx_achievements_type ON achievements(achievement_type);

-- -------------------------------------------------
-- MISSÕES (Quests)
-- -------------------------------------------------
CREATE TABLE quests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    world_id UUID REFERENCES worlds(id),
    required_level INTEGER DEFAULT 1,
    reward_coins VARCHAR(50),
    reward_exp VARCHAR(50),
    reward_items JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_quests_world ON quests(world_id);
CREATE INDEX idx_quests_required_level ON quests(required_level);

-- -------------------------------------------------
-- BAÚS (Chests)
-- -------------------------------------------------
CREATE TABLE chests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    rarity rarity NOT NULL,
    world_id UUID REFERENCES worlds(id),
    cost_coins VARCHAR(50),
    cost_gems VARCHAR(50),
    possible_items JSONB,
    drop_rates JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_chests_name ON chests(name);
CREATE INDEX idx_chests_rarity ON chests(rarity);
CREATE INDEX idx_chests_world ON chests(world_id);

-- -------------------------------------------------
-- OBELISKOS
-- -------------------------------------------------
CREATE TABLE obelisks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    world_id UUID REFERENCES worlds(id),
    stat_type bonus_type NOT NULL,
    max_level INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_obelisks_world ON obelisks(world_id);
CREATE INDEX idx_obelisks_stat_type ON obelisks(stat_type);

-- -------------------------------------------------
-- PODERES (Powers)
-- -------------------------------------------------
CREATE TABLE powers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    world_id UUID REFERENCES worlds(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    power_type VARCHAR(50),
    stat_type bonus_type,
    max_level INTEGER DEFAULT 1,
    max_boost VARCHAR(50),
    unlock_cost VARCHAR(50),
    leveling JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_powers_world ON powers(world_id);
CREATE INDEX idx_powers_name ON powers(name);
CREATE INDEX idx_powers_stat_type ON powers(stat_type);

-- -------------------------------------------------
-- POWER STATS (Níveis dos poderes)
-- -------------------------------------------------
CREATE TABLE power_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    power_id UUID REFERENCES powers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    multiplier VARCHAR(50),
    rarity rarity,
    probability DECIMAL(5,2),
    stat_type bonus_type,
    energy_crit_bonus VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_power_stats_power ON power_stats(power_id);

-- =====================================================
-- TABELAS DE USUÁRIO (PRIVADAS)
-- =====================================================

-- -------------------------------------------------
-- PERFIL DO USUÁRIO
-- -------------------------------------------------
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(255),
    email VARCHAR(255),
    tag VARCHAR(50),
    reputation_points INTEGER DEFAULT 0,
    credits INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_profiles_id ON profiles(id);

-- -------------------------------------------------
-- ARMAZENAMENTO DO USUÁRIO (Armas equipadas)
-- -------------------------------------------------
CREATE TABLE user_weapons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    slot_index INTEGER NOT NULL,
    sword_id UUID REFERENCES swords(id),
    equipped_rarity rarity,
    evolution_level INTEGER DEFAULT 0,
    breathing_enchantment VARCHAR(50),
    stone_enchantment VARCHAR(50),
    passive_enchantment VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, slot_index)
);

CREATE INDEX idx_user_weapons_user ON user_weapons(user_id);

-- -------------------------------------------------
-- INVENTÁRIO DO USUÁRIO
-- -------------------------------------------------
CREATE TABLE user_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    item_type item_type NOT NULL,
    item_id UUID NOT NULL,
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_inventory_user ON user_inventory(user_id);
CREATE INDEX idx_user_inventory_type ON user_inventory(item_type);

-- -------------------------------------------------
-- LUTADORES EQUIPADOS DO USUÁRIO
-- -------------------------------------------------
CREATE TABLE user_fighters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    slot_index INTEGER NOT NULL,
    fighter_id UUID REFERENCES fighters(id),
    equipped_rarity rarity,
    evolution_level INTEGER DEFAULT 0,
    enchantment VARCHAR(50),
    level INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, slot_index)
);

CREATE INDEX idx_user_fighters_user ON user_fighters(user_id);

-- -------------------------------------------------
-- JOIAS EQUIPADAS DO USUÁRIO
-- -------------------------------------------------
CREATE TABLE user_jewelry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    slot_type VARCHAR(20) NOT NULL,
    ring_id UUID REFERENCES rings(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, slot_type)
);

CREATE INDEX idx_user_jewelry_user ON user_jewelry(user_id);

-- -------------------------------------------------
-- PROGRESSO DO USUÁRIO (Ranking)
-- -------------------------------------------------
CREATE TABLE user_rank (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    rank_value INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_user_rank_user ON user_rank(user_id);

-- -------------------------------------------------
-- CONQUISTAS DO USUÁRIO
-- -------------------------------------------------
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    achievement_id UUID REFERENCES achievements(id),
    current_level INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);

-- -------------------------------------------------
-- OBELISKOS DO USUÁRIO
-- -------------------------------------------------
CREATE TABLE user_obelisks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    obelisk_id UUID REFERENCES obelisks(id),
    current_level INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, obelisk_id)
);

CREATE INDEX idx_user_obelisks_user ON user_obelisks(user_id);

-- -------------------------------------------------
-- INDEX DO USUÁRIO (Tier)
-- -------------------------------------------------
CREATE TABLE user_index (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    avatar_tier INTEGER DEFAULT 0,
    pet_tier INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_user_index_user ON user_index(user_id);

-- -------------------------------------------------
-- GAMEPASSES DO USUÁRIO
-- -------------------------------------------------
CREATE TABLE user_gamepasses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    gamepass_id UUID REFERENCES gamepasses(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, gamepass_id)
);

CREATE INDEX idx_user_gamepasses_user ON user_gamepasses(user_id);

-- -------------------------------------------------
-- MISSÕES ATIVAS DO USUÁRIO
-- -------------------------------------------------
CREATE TABLE user_quests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    quest_id UUID REFERENCES quests(id),
    status quest_status DEFAULT 'available',
    progress INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_quests_user ON user_quests(user_id);
CREATE INDEX idx_user_quests_status ON user_quests(status);

-- =====================================================
-- TABELAS PÚBLICAS - CONTEÚDO DO WIKI
-- =====================================================

-- -------------------------------------------------
-- CONTEÚDO WIKI
-- -------------------------------------------------
CREATE TABLE wiki_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    summary TEXT,
    content TEXT,
    tags TEXT[],
    image_url TEXT,
    tables JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_wiki_content_title ON wiki_content(title);
CREATE INDEX idx_wiki_content_tags ON wiki_content USING GIN(tags);

-- =====================================================
-- TABELAS DE FEEDBACK
-- =====================================================

-- -------------------------------------------------
-- FEEDBACK NEGATIVO
-- -------------------------------------------------
CREATE TABLE negative_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    question TEXT NOT NULL,
    negative_response TEXT NOT NULL,
    ai_suggestion TEXT,
    reputation_points_awarded INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    reviewed_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_negative_feedback_status ON negative_feedback(status);
CREATE INDEX idx_negative_feedback_user ON negative_feedback(user_id);

-- =====================================================
-- METADADOS
-- =====================================================

-- -------------------------------------------------
-- METADADOS DO JOGO
-- -------------------------------------------------
CREATE TABLE game_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version VARCHAR(50) NOT NULL,
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- FUNÇÕES ÚTEIS
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at em todas as tabelas
CREATE TRIGGER update_worlds_updated_at BEFORE UPDATE ON worlds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dungeons_updated_at BEFORE UPDATE ON dungeons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bosses_updated_at BEFORE UPDATE ON bosses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_swords_updated_at BEFORE UPDATE ON swords
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_armors_updated_at BEFORE UPDATE ON armors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FIM DO SCHEMA
-- =====================================================