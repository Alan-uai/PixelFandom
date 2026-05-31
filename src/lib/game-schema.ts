export interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: boolean;
  column_default: string | null;
  is_system: boolean;
}

export interface TableSchema {
  table_name: string;
  columns: ColumnInfo[];
}

export interface GameSchema {
  tables: TableSchema[];
}

interface SchemaResponse {
  ok: boolean;
  tables?: TableSchema[];
  error?: string;
}

type CategoryEntry = {
  table: string;
  sourceType: string;
};

type CategoryMap = Record<string, CategoryEntry>;

const KEYWORD_OVERRIDES: Record<string, string[]> = {
  weapons: ['arma', 'armas', 'weapon'],
  armors: ['armadura', 'armaduras', 'armor'],
  rings: ['anel', 'anéis', 'aneis', 'ring'],
  enemies: ['inimigo', 'inimigos', 'enemy'],
  bosses: ['chefe', 'chefes', 'boss'],
  potions: ['poção', 'poções', 'pocao', 'pocoes', 'potion', 'flask'],
  upgrades: ['upgrade', 'banner', 'banners'],
  worlds: ['mundo', 'mundos', 'world'],
  codes: ['código', 'códigos', 'codigo', 'codigos', 'code'],
  crafting_recipes: ['receita', 'receitas', 'recipe', 'craft'],
  resources: ['recurso', 'recursos', 'resource', 'material', 'materiais'],
  build_presets: ['build', 'builds', 'preset', 'presets'],
};

const TABLE_LABELS: Record<string, string> = {
  weapons: 'Armas',
  armors: 'Armaduras',
  rings: 'Anéis',
  enemies: 'Inimigos',
  bosses: 'Chefes',
  potions: 'Poções',
  upgrades: 'Upgrades/Banners',
  worlds: 'Mundos',
  codes: 'Códigos',
  crafting_recipes: 'Receitas',
  resources: 'Materiais',
  build_presets: 'Builds/Presets',
};

const TABLE_DESCRIPTIONS: Record<string, string> = {
  weapons: 'name, rarity (common/rare/epic/legendary/vaulted), weapon_type, damage_min, damage_max, crit_chance_min, crit_chance_max, attack_speed (fast/medium/slow), knockback, element (fire/frost/poison/dark/ghost/void/earth/none), ability_name, ability_description, ability_energy_cost, ability_cooldown, ability_effect, obtain_method (COMO OBTER), craft_cost, craft_materials, is_worth_crafting, drop_rate_multiplier, drop_rate_percentage, tier (s_plus/s/a/b/c/d), notes',
  armors: 'name, rarity, world_name, health_bonus, speed_bonus, energy_bonus, passive_ability, passive_ability_level, obtain_method (COMO OBTER), craft_cost, craft_materials, set_bonus, is_worth_crafting, tier, notes',
  rings: 'name, tier, rarity, description, starting_banner, key_buffs, possible_stats, synergy, is_craftable, craft_cost, craft_materials, is_worth_crafting, obtain_method (COMO OBTER), drop_wave_requirement',
  enemies: 'name, world_name, chapters, enemy_type, description, health_level, speed_level, strength_level, difficulty, attacks, effects, xp_drop, coin_drop, items_dropped, weakness',
  bosses: 'name, world_name, chapter, boss_type, description, hp_level, difficulty, attacks, phase_mechanics, weakness, strategy, tips, xp_drop, items_dropped, notable_loot',
  potions: 'name, slug, effects, shop_price, crafting_cost, crafting_materials, savings_percentage, unlock_level, second_slot_unlock_level, max_uses_per_run',
  upgrades: 'name, category (offensive/defensive/utility), description, effect, per_rank_effect, max_ranks, tier, is_must_pick, notes',
  worlds: 'world_name, world_number, world_type, level_range, description, environment, chapters, levels_per_chapter, is_coming_soon',
  codes: 'code, reward, description, active, uses_remaining, expires_at',
  crafting_recipes: 'item_name, item_type, rarity, gold_cost, materials, is_worth_crafting, worth_notes',
  resources: 'resource_name, resource_type, source_world, source_method, usage_description',
  build_presets: 'name, weapon_slot, armor_slot, ring_slot, potion_slot, description, is_meta',
};

let cachedSchema: GameSchema | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

function deriveSingular(tableName: string): string {
  if (tableName.endsWith('ies')) return tableName.slice(0, -3) + 'y';
  if (tableName.endsWith('sses')) return tableName.slice(0, -2);
  if (tableName.endsWith('ches')) return tableName.slice(0, -2);
  if (tableName.endsWith('shes')) return tableName.slice(0, -2);
  if (tableName.endsWith('xes')) return tableName.slice(0, -2);
  if (tableName.endsWith('s')) return tableName.slice(0, -1);
  return tableName;
}

export function buildSchemaPrompt(schema: GameSchema): string {
  const parts = schema.tables.map((t) => {
    const label = TABLE_LABELS[t.table_name] || t.table_name;
    const desc = TABLE_DESCRIPTIONS[t.table_name] || '';
    const nonSystem = t.columns.filter((c) => !c.is_system);
    const cols = desc || nonSystem.map((c) => c.column_name).join(', ');
    return `### ${t.table_name} (${label})\n${cols}`;
  });

  return [
    '## ESTRUTURA DO BANCO DE DADOS',
    '',
    'Você tem acesso a um banco de dados PostgreSQL com as seguintes tabelas e colunas para itens do jogo:',
    '',
    parts.join('\n\n'),
    '',
    '## REGRAS DE BUSCA INTELIGENTE',
    '1. NÃO faça busca com a pergunta completa do usuário. Extraia os termos-chave primeiro.',
    '2. Exemplo: "como obter a espada noturna" → busque por "espada noturna" (nome do item)',
    '3. Exemplo: "qual a fraqueza do goblin rei" → busque por "goblin rei" e procure na coluna "weakness" ou "strategy"',
    '4. Se o termo exato não funcionar, tente variações: singular/plural, partes da palavra, sinônimos',
    '5. Exemplo: "necro flash" → mesmo que o banco tenha "Necro Flask", a busca fuzzy encontra',
    '6. A busca agora varre TODAS as tabelas e TODAS as colunas de texto automaticamente',
    '7. Os resultados incluem TODOS os atributos do item — leia os números reais, não invente',
  ].join('\n');
}

export function buildCategoryMap(schema: GameSchema): CategoryMap {
  const map: CategoryMap = {};

  for (const t of schema.tables) {
    const table = t.table_name;
    const sourceType = deriveSingular(table);

    const overrides = KEYWORD_OVERRIDES[table] || [];
    for (const kw of overrides) {
      map[kw.toLowerCase()] = { table, sourceType };
    }

    const defs: string[] = [];
    defs.push(table.toLowerCase());
    defs.push(sourceType.toLowerCase());
    defs.push(sourceType.toLowerCase() + 's');
    for (const d of defs) {
      if (!map[d]) {
        map[d] = { table, sourceType };
      }
    }
  }

  return map;
}

export async function getGameSchema(): Promise<GameSchema> {
  const now = Date.now();
  if (cachedSchema && now - cacheTime < CACHE_TTL) {
    return cachedSchema;
  }

  const { supabase } = await import('@/supabase');
  const { data, error } = await supabase.rpc('get_game_schema');

  if (error) {
    console.error('Failed to fetch game schema:', error);
    if (cachedSchema) return cachedSchema;
    return { tables: [] };
  }

  const response = data as unknown as SchemaResponse;
  if (!response.ok || !response.tables) {
    if (cachedSchema) return cachedSchema;
    return { tables: [] };
  }

  cachedSchema = { tables: response.tables };
  cacheTime = now;
  return cachedSchema;
}

export async function getSchemaPrompt(): Promise<string> {
  const schema = await getGameSchema();
  return buildSchemaPrompt(schema);
}

export async function getCategoryMap(): Promise<CategoryMap> {
  const schema = await getGameSchema();
  return buildCategoryMap(schema);
}

export function invalidateCache(): void {
  cachedSchema = null;
  cacheTime = 0;
}
