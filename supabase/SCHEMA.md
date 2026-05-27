# PixelFandom Database Schema

## Visão Geral

Schema do banco de dados PostgreSQL no Supabase, com migrations de 001 a 007.

## Arquivos de Migração

| Migration | Descrição |
|-----------|-----------|
| `001` | Tabelas do jogo Pixel Blade (weapons, armors, rings, etc.) |
| `002` | Seed data inicial do Pixel Blade |
| `003` | Tabelas de app (wiki_articles, content_suggestions, feedback, saved_answers) |
| `004` | Profiles + RLS policies + auto-create profile trigger |
| `005` | **Multi-tenant**: tenants, tenant_members, discord_guilds, custom_collections, collection_items |
| `006` | Adiciona `tenant_id` às tabelas de app + atualiza RLS |
| `007` | Seed do tenant Pixel Blade com collections + dados de jogo |
| `021` | Cleanup, game images |
| `022` | Tabela user_preferences para sincronizar configurações de voz |

---

## Multi-Tenant Tables (migrations 005-007)

### tenants
Wikis individuais (espaços multi-tenant).
- **PK**: id (UUID)
- **UK**: slug, custom_domain
- **Campos**: name, slug, custom_domain, logo_url, description, theme (JSONB), ai_enabled, ai_config (JSONB), is_public, created_at, updated_at
- **Índices**: slug, domain, is_public (partial)

### tenant_members
Mapeamento usuário → tenant com role.
- **PK**: (tenant_id, user_id)
- **FK**: tenant_id → tenants(id), user_id → auth.users(id)
- **Campos**: role ('owner', 'admin', 'editor', 'viewer'), invited_by
- **Índices**: user_id, (tenant_id, role)

### discord_guilds
Mapeamento servidor Discord → tenant.
- **PK**: guild_id (TEXT)
- **FK**: tenant_id → tenants(id) ON DELETE SET NULL
- **Campos**: channel_id, bot_enabled

### custom_collections
Coleções flexíveis por tenant (ex: weapons, characters, items).
- **PK**: id (UUID)
- **FK**: tenant_id → tenants(id) ON DELETE CASCADE
- **UK**: (tenant_id, slug)
- **Campos**: name, slug, description, schema (JSONB - definição de campos), icon, item_count
- **Índices**: tenant_id

### collection_items
Items de dados dentro de coleções, armazenados como JSONB.
- **PK**: id (UUID)
- **FK**: collection_id → custom_collections(id) ON DELETE CASCADE, created_by → auth.users(id)
- **Campos**: data (JSONB)
- **Índices**: collection_id, created_by

---

## App Tables (migrations 003-004, com tenant_id via 006)

### wiki_articles
Artigos de wiki com suporte a TipTap/JSON.
- **PK**: id (UUID)
- **FK**: tenant_id → tenants(id)
- **Campos**: title, summary, content (TEXT), tags (TEXT[]), image_url, tables (JSONB)
- **tenant_id**: adicionado na migration 006

### content_suggestions
Sugestões de conteúdo enviadas por usuários.
- **FK**: tenant_id → tenants(id)
- **Campos**: user_id, user_email, title, content, attachment_urls, status ('pending', 'approved', 'rejected')

### negative_feedback
Feedback negativo de respostas da IA.
- **FK**: tenant_id → tenants(id)
- **Campos**: user_id, user_email, question, negative_response, ai_suggestion, reputation_points_awarded, status, reviewed_by

### saved_answers
Respostas salvas pelos usuários.
- **FK**: tenant_id → tenants(id)
- **Campos**: user_id, question, answer

### profiles
Perfis de usuário vinculados ao Supabase Auth.
- **PK**: id → auth.users(id) ON DELETE CASCADE
- **Campos**: username (UK), display_name, email, avatar_url, role ('user', 'admin', 'moderator'), reputation_points
- **Trigger**: `handle_new_user()` cria profile automaticamente no signup

### user_preferences (migration 022)
Preferências de usuário sincronizadas entre dispositivos.
- **PK**: id (UUID)
- **FK**: user_id → auth.users(id) ON DELETE CASCADE
- **UK**: user_id
- **Campos**: preferences (JSONB), created_at, updated_at
- **RLS**: cada usuário vê/apenas suas próprias preferências

---

## Game Data Tables (migrations 001-002)

Tabelas originais do Pixel Blade. Mantidas para compatibilidade. Os dados foram copiados para `custom_collections` na migration 007.

| Tabela | Registros | Descrição |
|--------|-----------|-----------|
| weapons | 31 | Armas com stats, abilities, drop rates |
| armors | 15 | Armaduras com bônus |
| rings | 12 | Anéis com tiers e buffs |
| potions | 4 | Poções e efeitos |
| upgrades | 13 | Upgrades de banner |
| worlds | 5 | Mundos do jogo |
| enemies | 10+ | Inimigos |
| bosses | 9 | Chefes |
| codes | - | Códigos promocionais |
| crafting_recipes | 9 | Receitas de crafting |
| resources | - | Materiais |
| game_config | - | Configurações gerais |
| build_presets | 5 | Presets de builds |
| weapon_abilities | - | Habilidades de armas |
| ring_quality_tiers | 8 | Qualidade dos anéis |
| ring_stat_formulas | 6 | Fórmulas de stats |
| spirit_system_config | - | Configuração de espíritos |
| spirit_capacity_synergy | - | Sinergia de capacidade |

---

## Enums

```sql
rarity_level  : ENUM ('common', 'rare', 'epic', 'legendary', 'vaulted')
attack_speed  : ENUM ('fast', 'medium', 'slow')
element_type  : ENUM ('fire', 'frost', 'poison', 'dark', 'ghost', 'void', 'earth', 'none')
tier_rank     : ENUM ('s_plus', 's', 'a', 'b', 'c', 'd')
```

## RLS Policies

- **Tenants**: público lê tenants públicos, membros atualizam
- **tenant_members**: membros leem, owners/admins gerenciam
- **custom_collections/collection_items**: escopo por tenant com roles
- **wiki_articles**: leitura pública se tenant público, escrita por editors+
- **content_suggestions/negative_feedback**: admins do tenant
- **saved_answers**: próprio usuário

## Seed Data

- **Tenant Pixel Blade**: `00000000-0000-0000-0000-000000000001`
- **Collections**: weapons, armors, rings, potions, upgrades, worlds, enemies, bosses, codes, crafting-recipes
- **AI config**: modelo gpt-4o-mini, system prompt em português, contexto das tabelas de jogo
