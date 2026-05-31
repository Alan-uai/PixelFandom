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

type TableMeta = {
  label: string;
  keywords: string[];
};

const TABLE_META: Record<string, TableMeta> = {
  weapons: { label: 'Armas', keywords: ['arma', 'armas', 'weapon'] },
  armors: { label: 'Armaduras', keywords: ['armadura', 'armaduras', 'armor'] },
  rings: { label: 'Anéis', keywords: ['anel', 'anéis', 'aneis', 'ring'] },
  enemies: { label: 'Inimigos', keywords: ['inimigo', 'inimigos', 'enemy'] },
  bosses: { label: 'Chefes', keywords: ['chefe', 'chefes', 'boss'] },
  potions: { label: 'Poções', keywords: ['poção', 'poções', 'pocao', 'pocoes', 'potion', 'flask'] },
  upgrades: { label: 'Upgrades/Banners', keywords: ['upgrade', 'banner', 'banners'] },
  worlds: { label: 'Mundos', keywords: ['mundo', 'mundos', 'world'] },
  codes: { label: 'Códigos', keywords: ['código', 'códigos', 'codigo', 'codigos', 'code'] },
  crafting_recipes: { label: 'Receitas', keywords: ['receita', 'receitas', 'recipe', 'craft'] },
  resources: { label: 'Materiais', keywords: ['recurso', 'recursos', 'resource', 'material', 'materiais'] },
  build_presets: { label: 'Builds/Presets', keywords: ['build', 'builds', 'preset', 'presets'] },
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

function autoLabel(tableName: string): string {
  const meta = TABLE_META[tableName];
  if (meta) return meta.label;
  return tableName
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function getTableMeta(tableName: string): TableMeta {
  const existing = TABLE_META[tableName];
  if (existing) return existing;
  const singular = deriveSingular(tableName);
  return {
    label: autoLabel(tableName),
    keywords: [tableName, singular, singular + 's'],
  };
}

export function buildSchemaPrompt(schema: GameSchema): string {
  const parts = schema.tables.map((t) => {
    const label = getTableMeta(t.table_name).label;
    const nonSystem = t.columns.filter((c) => !c.is_system);
    const cols = nonSystem.map((c) => c.column_name).join(', ');
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
    const meta = getTableMeta(table);

    for (const kw of meta.keywords) {
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
