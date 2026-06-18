export interface GameTableMeta {
  label: string;
  icon: string;
  keywords: string[];
}

export const GAME_TABLE_META: Record<string, GameTableMeta> = {
  weapons: { label: 'Armas', icon: 'Sword', keywords: ['arma', 'armas', 'weapon'] },
  armors: { label: 'Armaduras', icon: 'Shield', keywords: ['armadura', 'armaduras', 'armor'] },
  rings: { label: 'Anéis', icon: 'CircleDot', keywords: ['anel', 'anéis', 'aneis', 'ring'] },
  enemies: { label: 'Inimigos', icon: 'Skull', keywords: ['inimigo', 'inimigos', 'enemy'] },
  bosses: { label: 'Chefes', icon: 'Crown', keywords: ['chefe', 'chefes', 'boss'] },
  potions: { label: 'Poções', icon: 'Flask', keywords: ['poção', 'poções', 'pocao', 'pocoes', 'potion', 'flask'] },
  upgrades: { label: 'Upgrades/Banners', icon: 'ArrowUp', keywords: ['upgrade', 'banner', 'banners'] },
  worlds: { label: 'Mundos', icon: 'Globe', keywords: ['mundo', 'mundos', 'world'] },
  codes: { label: 'Códigos', icon: 'Code', keywords: ['código', 'códigos', 'codigo', 'codigos', 'code'] },
  crafting_recipes: { label: 'Receitas', icon: 'BookOpen', keywords: ['receita', 'receitas', 'recipe', 'craft'] },
  resources: { label: 'Materiais', icon: 'Package', keywords: ['recurso', 'recursos', 'resource', 'material', 'materiais'] },
  build_presets: { label: 'Builds/Presets', icon: 'Wrench', keywords: ['build', 'builds', 'preset', 'presets'] },
  update_logs: { label: 'Registros de Atualizações', icon: 'ScrollText', keywords: ['update', 'updates', 'log', 'logs', 'atualização', 'atualizações'] },
};
