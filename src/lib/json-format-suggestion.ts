// Modular, keyword-driven JSON format suggestion.
// Given a column label (in any language), suggests a JSON shape and a
// human-friendly placeholder example. The suggestion is rendered as a hint
// and is never treated as a definitive schema until the user populates a value.

export interface JsonFormatSuggestion {
  shape: 'object' | 'array' | 'unknown';
  example: string;
  hint: string;
}

const RULES: { match: RegExp; build: () => JsonFormatSuggestion }[] = [
  {
    // drops / loot / dropped / rewards / items / inventory / material(s)
    match: /(loot|drop|reward|item|inventory|material|spawn|craft|recipe|chapter|difficult|notable|possible|attack|effect)/i,
    build: () => ({
      shape: 'array',
      example: '[\n  { "name": "", "chance": 0 },\n  { "name": "", "chance": 0 }\n]',
      hint: 'Lista de objetos — ex: [{ "name": "", "chance": 0 }]',
    }),
  },
  {
    // stats / buff / bonus / set / skill / attr / mod / tier
    match: /(stat|buff|bonus|set|skill|attr|mod|tier|power|resist|damage|defense|defence|speed|health|mana)/i,
    build: () => ({
      shape: 'object',
      example: '{\n  "hp": 0,\n  "atk": 0,\n  "def": 0\n}',
      hint: 'Objeto de valores — ex: { "hp": 0, "atk": 0 }',
    }),
  },
  {
    // key / map / config / settings / meta / flag
    match: /(key|map|config|setting|meta|flag|property|param)/i,
    build: () => ({
      shape: 'object',
      example: '{\n  "key": "value"\n}',
      hint: 'Objeto livre — ex: { "key": "value" }',
    }),
  },
];

const FALLBACK: JsonFormatSuggestion = {
  shape: 'object',
  example: '{\n  "key": "value"\n}',
  hint: 'Objeto JSON — ex: { "key": "value" }',
};

export function suggestJsonFormat(label: string): JsonFormatSuggestion | null {
  const trimmed = label.trim();
  if (!trimmed) return null;
  for (const rule of RULES) {
    if (rule.match.test(trimmed)) return rule.build();
  }
  return FALLBACK;
}
