# Pixel Blade Database Schema

## Visão Geral

Este documento descreve o schema do banco de dados para o jogo Pixel Blade, projetado para Supabase (PostgreSQL).

## Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `001_create_pixel_blade_tables.sql` | Cria todas as tabelas e índices |
| `002_seed_data.sql` | Popula as tabelas com dados da wiki |

## Tabelas Criadas

### 1. weapons
Armas do jogo (33 armas).
- **Campos**: name, rarity, weapon_type, damage_min/max, crit_chance, attack_speed, knockback, element, ability, tier
- **Índices**: rarity, tier, type, element

### 2. armors
Armaduras do jogo (15 armaduras).
- **Campos**: name, rarity, world_name, health_bonus, speed_bonus, energy_bonus, passive_ability, tier
- **Índices**: rarity, world, tier

### 3. rings
Anéis do jogo (12 anéis).
- **Campos**: name, tier, rarity, description, starting_banner, key_buffs, synergy, craftable
- **Índices**: tier, rarity, craftable

### 4. ring_quality_tiers
Sistema de qualidade dos anéis (8 níveis).
- **Campos**: tier_name, quality_min/max, description, aura_color, action

### 5. ring_stat_formulas
Fórmulas de stats por qualidade (Kennot's formulas).
- **Campos**: stat_type, formula, coefficients (a, b), highest_scaling_range, stardust_cost

### 6. potions
Poções do jogo (4 poções).
- **Campos**: name, effects, shop_price, crafting_cost, materials, unlock_level

### 7. upgrades
Upgrades de banners (13 upgrades).
- **Campos**: name, category, description, per_rank_effect, tier, priority_order, is_must_pick
- **Índices**: category, tier, priority

### 8. spirit_system_config
Configuração do sistema de spirits.
- **Campos**: default_capacity, max_capacity, per_spirit_bonus, boss_spirit_value

### 9. spirit_capacity_synergy
Tabela de sinergia capacidade spirits.
- **Campos**: capacity, max_damage_bonus, max_speed_bonus

### 10. worlds
Mundos do jogo (5 mundos).
- **Campos**: world_name, world_number, level_range, status, description, environment, chapters
- **Índices**: world_number, status

### 11. enemies
Inimigos do jogo.
- **Campos**: name, world_name, chapters, enemy_type, stats, attacks, effects, drops, weakness
- **Índices**: world, type, difficulty

### 12. bosses
Chefes do jogo (9 chefes).
- **Campos**: name, world_name, chapter, boss_type, stats, attacks, phase_mechanics, strategy, drops
- **Índices**: world, chapter, type

### 13. codes
Códigos do jogo (ativos e expirados).
- **Campos**: code, rewards, type, is_active, verified_date, is_expired
- **Índices**: active (where is_active = true), type

### 14. crafting_recipes
Receitas de crafting do ferreiro.
- **Campos**: item_name, item_type, rarity, gold_cost, materials, is_worth_crafting, worth_notes
- **Índices**: type, rarity

### 15. resources
Materiais e recursos.
- **Campos**: resource_name, resource_type, source_world, source_method, usage, items_crafted
- **Índices**: type, world

### 16. game_config
Configurações gerais do jogo.
- **Campos**: config_key, config_value (JSON), category, description

### 17. build_presets
Presets de builds populares.
- **Campos**: build_name, build_type, recommended_upgrades, recommended_gear, strategy, is_meta

### 18. weapon_abilities
Habilidades das armas.
- **Campos**: ability_name, description, effect_type, effect_details, weapons, energy_cost, cooldown

## Enums Criados

```sql
CREATE TYPE rarity_level AS ENUM ('common', 'rare', 'epic', 'legendary', 'vaulted');
CREATE TYPE attack_speed_type AS ENUM ('fast', 'medium', 'slow');
CREATE TYPE element_type AS ENUM ('fire', 'frost', 'poison', 'dark', 'ghost', 'void', 'earth', 'none');
CREATE TYPE tier_rank AS ENUM ('s_plus', 's', 'a', 'b', 'c', 'd');
```

## Triggers

Todos os registros têm `updated_at` atualizado automaticamente via trigger `update_updated_at()`.

## Como Executar

1. Execute `001_create_pixel_blade_tables.sql` primeiro
2. Execute `002_seed_data.sql` para popular os dados

```bash
# Via Supabase CLI
psql -h your-host -U postgres -d postgres -f supabase/migrations/001_create_pixel_blade_tables.sql
psql -h your-host -U postgres -d postgres -f supabase/migrations/002_seed_data.sql
```

## Contagem de Dados

| Tabela | Registros |
|--------|-----------|
| weapons | 31 |
| armors | 15 |
| rings | 12 |
| potions | 4 |
| upgrades | 13 |
| worlds | 5 |
| enemies | 10+ |
| bosses | 9 |
| crafting_recipes | 9 |
| ring_quality_tiers | 8 |
| ring_stat_formulas | 6 |
| build_presets | 5 |

## Notas

- UUIDs são gerados automaticamente para IDs
- Timestamps com timezone (`TIMESTAMP WITH TIME ZONE`)
- JSONB é usado para dados estruturados (buffs, materials, effects)
- Índices para otimização de queries frequentes