import { parseSmartNumber } from './sort-utils';

const SYSTEM_COLS = new Set([
  'id', 'tenant_id', 'created_at', 'updated_at', 'embedding', 'slug',
]);

const NON_CAT_RENDER_TYPES = new Set([
  'image', 'file', 'video', 'audio',
  'popover', 'color-palette', 'icon-set',
]);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HEX_COLOR_RE = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\//i;
const DATA_URL_RE = /^data:/i;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(T|\s)/;
const COMMA_SEP_RE = /^[^,]+(,\s*[^,]+)+$/;
const PIPE_SEP_RE = /^[^|]+(\|\s*[^|]+)+$/;
const PERCENTAGE_RE = /^-?\d+(\.\d+)?%$/;

export type ColumnValueType =
  | 'numeric' | 'text' | 'long-text' | 'url' | 'json'
  | 'date' | 'boolean' | 'uuid' | 'email' | 'color' | 'tags'
  | 'empty' | 'mixed';

export interface ColumnAnalysis {
  type: ColumnValueType;
  isNumeric: boolean;
  isDate: boolean;
  uniqueCount: number;
  uniqueRatio: number;
  avgLength: number;
  emptyRatio: number;
  boolLabels?: { asc: string; desc: string };
  sampleValues: string[];
}

export interface SortLabel {
  label: string;
  isNumeric: boolean;
  mode: 'alpha' | 'boolean' | 'color';
}

const BOOLEAN_PATTERNS: { match: string[]; asc: string; desc: string }[] = [
  { match: ['true', 'false'], asc: 'Y→N', desc: 'N→Y' },
  { match: ['sim', 'não', 'nao'], asc: 'S→N', desc: 'N→S' },
  { match: ['yes', 'no'], asc: 'Y→N', desc: 'N→Y' },
  { match: ['oui', 'non'], asc: 'O→N', desc: 'N→O' },
  { match: ['sí', 'no'], asc: 'S→N', desc: 'N→S' },
  { match: ['ja', 'nein'], asc: 'J→N', desc: 'N→J' },
  { match: ['da', 'net'], asc: 'D→N', desc: 'N→D' },
  { match: ['on', 'off'], asc: 'ON→OFF', desc: 'OFF→ON' },
  { match: ['0', '1'], asc: '0→1', desc: '1→0' },
  { match: ['是', '否'], asc: '是→否', desc: '否→是' },
  { match: ['はい', 'いいえ'], asc: 'はい→いいえ', desc: 'いいえ→はい' },
  { match: ['ano', 'ne'], asc: 'A→N', desc: 'N→A' },
  { match: ['evet', 'hayır'], asc: 'E→H', desc: 'H→E' },
  { match: ['tak', 'nie'], asc: 'T→N', desc: 'N→T' },
];

function detectBooleanLabels(values: string[]): { asc: string; desc: string } | null {
  const unique = [...new Set(values.map((v) => v.toLowerCase().trim()))];
  if (unique.length > 3) return null;
  const key = unique.sort().join(',');
  for (const p of BOOLEAN_PATTERNS) {
    if (p.match.sort().join(',') === key) return { asc: p.asc, desc: p.desc };
  }
  return { asc: 'Y→N', desc: 'N→Y' };
}

function tryParseJson(v: string): boolean {
  try { JSON.parse(v); return true; } catch { return false; }
}

function isIsoDate(v: string): boolean {
  if (ISO_DATE_RE.test(v)) return !isNaN(Date.parse(v));
  return false;
}

function isNumericValue(v: string): boolean {
  if (PERCENTAGE_RE.test(v)) return true;
  return parseSmartNumber(v) !== null;
}

const COLOR_NAMES: Record<string, string> = {
  '#000000': 'Black', '#0d0d0d': 'Jet Black', '#1a1a1a': 'Eerie Black',
  '#333333': 'Dark Gray', '#4d4d4d': 'Gray', '#666666': 'Medium Gray',
  '#808080': 'Gray', '#999999': 'Light Gray', '#b3b3b3': 'Silver',
  '#cccccc': 'Very Light Gray', '#e6e6e6': 'Gainsboro', '#f2f2f2': 'White Smoke',
  '#ffffff': 'White',
  '#ff0000': 'Red', '#cc0000': 'Dark Red', '#990000': 'Maroon',
  '#ff3333': 'Coral Red', '#ff6666': 'Salmon', '#ff9999': 'Light Salmon',
  '#ffcccc': 'Misty Rose', '#dc143c': 'Crimson', '#b22222': 'Firebrick',
  '#8b0000': 'Dark Red',
  '#ff4500': 'Orange Red', '#ff6347': 'Tomato', '#ff7f50': 'Coral',
  '#ff8c00': 'Dark Orange', '#ffa500': 'Orange', '#ffb347': 'Light Orange',
  '#ffcc80': 'Peach', '#ffe0b2': 'Navajo White',
  '#ffff00': 'Yellow', '#ffd700': 'Gold', '#ffcc00': 'Golden Yellow',
  '#fff44f': 'Lemon Chiffon', '#fffacd': 'Lemon', '#ffffe0': 'Light Yellow',
  '#f0e68c': 'Khaki', '#bdb76b': 'Dark Khaki',
  '#00ff00': 'Lime', '#32cd32': 'Lime Green', '#228b22': 'Forest Green',
  '#008000': 'Green', '#006400': 'Dark Green', '#00cc00': 'Vivid Green',
  '#66ff66': 'Light Green', '#98fb98': 'Pale Green', '#90ee90': 'Mint',
  '#00fa9a': 'Medium Spring Green', '#00ff7f': 'Spring Green',
  '#2e8b57': 'Sea Green', '#3cb371': 'Medium Sea Green',
  '#00ffff': 'Cyan', '#00ced1': 'Dark Turquoise', '#20b2aa': 'Light Sea Green',
  '#008b8b': 'Dark Cyan', '#008080': 'Teal',
  '#00bfff': 'Deep Sky Blue', '#87ceeb': 'Sky Blue', '#87cefa': 'Light Sky Blue',
  '#add8e6': 'Light Blue', '#b0e0e6': 'Powder Blue', '#b0c4de': 'Light Steel Blue',
  '#0000ff': 'Blue', '#0000cd': 'Medium Blue', '#00008b': 'Dark Blue',
  '#000080': 'Navy', '#191970': 'Midnight Blue',
  '#4169e1': 'Royal Blue', '#4682b4': 'Steel Blue', '#5b9bd5': 'Cornflower Blue',
  '#6495ed': 'Cornflower', '#6a5acd': 'Slate Blue',
  '#7b68ee': 'Medium Slate Blue', '#8a2be2': 'Blue Violet',
  '#9400d3': 'Dark Violet', '#9932cc': 'Dark Orchid',
  '#ff00ff': 'Magenta', '#ff1493': 'Deep Pink', '#ff69b4': 'Hot Pink',
  '#ffb6c1': 'Light Pink', '#ffc0cb': 'Pink', '#ffe4e1': 'Misty Rose',
  '#db7093': 'Pale Violet Red', '#c71585': 'Medium Violet Red',
  '#800080': 'Purple', '#8b008b': 'Dark Magenta', '#4b0082': 'Indigo',
  '#a020f0': 'Purple', '#dda0dd': 'Plum', '#ee82ee': 'Violet',
  '#800000': 'Maroon', '#a52a2a': 'Brown', '#8b4513': 'Saddle Brown',
  '#d2691e': 'Chocolate', '#cd853f': 'Peru', '#daa520': 'Goldenrod',
  '#b8860b': 'Dark Goldenrod', '#a0522d': 'Sienna', '#f4a460': 'Sandy Brown',
  '#d2b48c': 'Tan', '#deb887': 'Burlywood', '#f5deb3': 'Wheat',
  '#ffe4b5': 'Moccasin', '#ffdead': 'Navajo White', '#faebd7': 'Antique White',
  '#f5f5dc': 'Beige', '#fff8dc': 'Cornsilk', '#fffff0': 'Ivory',
  '#f0fff0': 'Honeydew', '#f5fffa': 'Mint Cream', '#f0f8ff': 'Alice Blue',
  '#f8f8ff': 'Ghost White', '#faf0e6': 'Linen', '#fff5ee': 'Seashell',
  '#fffaf0': 'Floral White', '#fdf5e6': 'Old Lace', '#fafad2': 'Light Goldenrod',
  '#e6e6fa': 'Lavender', '#fff0f5': 'Lavender Blush',
};

const RGB_COLORS: { name: string; r: number; g: number; b: number }[] = [
  { name: 'Black', r: 0, g: 0, b: 0 }, { name: 'White', r: 255, g: 255, b: 255 },
  { name: 'Red', r: 255, g: 0, b: 0 }, { name: 'Green', r: 0, g: 128, b: 0 },
  { name: 'Blue', r: 0, g: 0, b: 255 }, { name: 'Yellow', r: 255, g: 255, b: 0 },
  { name: 'Cyan', r: 0, g: 255, b: 255 }, { name: 'Magenta', r: 255, g: 0, b: 255 },
  { name: 'Orange', r: 255, g: 165, b: 0 }, { name: 'Purple', r: 128, g: 0, b: 128 },
  { name: 'Pink', r: 255, g: 192, b: 203 }, { name: 'Brown', r: 165, g: 42, b: 42 },
  { name: 'Gray', r: 128, g: 128, b: 128 }, { name: 'Navy', r: 0, g: 0, b: 128 },
  { name: 'Teal', r: 0, g: 128, b: 128 }, { name: 'Maroon', r: 128, g: 0, b: 0 },
  { name: 'Olive', r: 128, g: 128, b: 0 }, { name: 'Lime', r: 0, g: 255, b: 0 },
  { name: 'Silver', r: 192, g: 192, b: 192 }, { name: 'Gold', r: 255, g: 215, b: 0 },
  { name: 'Violet', r: 238, g: 130, b: 238 }, { name: 'Indigo', r: 75, g: 0, b: 130 },
  { name: 'Coral', r: 255, g: 127, b: 80 }, { name: 'Salmon', r: 250, g: 128, b: 114 },
  { name: 'Khaki', r: 240, g: 230, b: 140 }, { name: 'Turquoise', r: 64, g: 224, b: 208 },
  { name: 'Plum', r: 221, g: 160, b: 221 }, { name: 'Crimson', r: 220, g: 20, b: 60 },
  { name: 'Chocolate', r: 210, g: 105, b: 30 }, { name: 'Tomato', r: 255, g: 99, b: 71 },
  { name: 'Beige', r: 245, g: 245, b: 220 }, { name: 'Mint', r: 189, g: 252, b: 201 },
  { name: 'Lavender', r: 230, g: 230, b: 250 }, { name: 'Peach', r: 255, g: 218, b: 185 },
];

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.replace('#', '');
  if (h.length === 3) return hexToRgb('#' + h[0] + h[0] + h[1] + h[1] + h[2] + h[2]);
  const num = parseInt(h, 16);
  if (isNaN(num)) return null;
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function rgbToHue(r: number, g: number, b: number): number {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  if (max === min) return 0;
  let h = 0;
  const d = max - min;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return Math.round(h * 360);
}

function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

export function hexToColorName(hex: string): string {
  const normalized = hex.toLowerCase().trim();
  if (COLOR_NAMES[normalized]) return COLOR_NAMES[normalized];

  const rgb = hexToRgb(normalized);
  if (!rgb) return hex;

  let closest = hex;
  let minDist = Infinity;

  for (const c of RGB_COLORS) {
    const dist = colorDistance(rgb.r, rgb.g, rgb.b, c.r, c.g, c.b);
    if (dist < minDist) { minDist = dist; closest = c.name; }
  }

  return minDist < 100 ? closest : hex;
}

export function getHexHue(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  return rgbToHue(rgb.r, rgb.g, rgb.b);
}

function extractJsonbValue(raw: unknown): string {
  if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) {
    const keys = Object.keys(raw as Record<string, unknown>);
    if (keys.length > 0) return String((raw as Record<string, unknown>)[keys[0]] ?? '');
    return '';
  }
  if (Array.isArray(raw)) {
    if (raw.length > 0) return extractJsonbValue(raw[0]);
    return '';
  }
  return String(raw ?? '');
}

export function analyzeColumnValues(
  items: Record<string, unknown>[],
  col: string,
): ColumnAnalysis {
  const allValues = items
    .map((item) => extractJsonbValue(item[col]))
    .filter((v) => v !== '' && v !== 'none' && v !== 'undefined' && v !== 'null');

  const emptyRatio = items.length > 0 ? 1 - allValues.length / items.length : 1;

  if (allValues.length === 0) {
    return { type: 'empty', isNumeric: false, isDate: false, uniqueCount: 0, uniqueRatio: 1, avgLength: 0, emptyRatio, sampleValues: [] };
  }

  const uniqueSet = new Set(allValues);
  const uniqueCount = uniqueSet.size;
  const uniqueRatio = uniqueCount / allValues.length;
  const avgLength = allValues.reduce((sum, v) => sum + v.length, 0) / allValues.length;
  const sampleValues = Array.from(uniqueSet).slice(0, 10);

  // UUID
  const uuidCount = allValues.filter((v) => UUID_RE.test(v.trim())).length;
  if (uuidCount / allValues.length > 0.8)
    return { type: 'uuid', isNumeric: false, isDate: false, uniqueCount, uniqueRatio, avgLength, emptyRatio, sampleValues };

  // Email
  const emailCount = allValues.filter((v) => EMAIL_RE.test(v.trim())).length;
  if (emailCount / allValues.length > 0.8)
    return { type: 'email', isNumeric: false, isDate: false, uniqueCount, uniqueRatio, avgLength, emptyRatio, sampleValues };

  // URL
  const urlCount = allValues.filter((v) => URL_RE.test(v) || DATA_URL_RE.test(v)).length;
  if (urlCount / allValues.length > 0.5)
    return { type: 'url', isNumeric: false, isDate: false, uniqueCount, uniqueRatio, avgLength, emptyRatio, sampleValues };

  // JSON
  const jsonCount = allValues.filter((v) => tryParseJson(v)).length;
  if (jsonCount / allValues.length > 0.5)
    return { type: 'json', isNumeric: false, isDate: false, uniqueCount, uniqueRatio, avgLength, emptyRatio, sampleValues };

  // Numeric
  const numericCount = allValues.filter((v) => isNumericValue(v)).length;
  const isNumeric = numericCount / allValues.length > 0.8;
  if (isNumeric)
    return { type: 'numeric', isNumeric: true, isDate: false, uniqueCount, uniqueRatio, avgLength, emptyRatio, sampleValues };

  // Date
  const dateCount = allValues.filter((v) => isIsoDate(v)).length;
  if (dateCount / allValues.length > 0.8)
    return { type: 'date', isNumeric: false, isDate: true, uniqueCount, uniqueRatio, avgLength, emptyRatio, sampleValues };

  // Hex color
  const colorCount = allValues.filter((v) => HEX_COLOR_RE.test(v.trim())).length;
  if (colorCount / allValues.length > 0.8)
    return { type: 'color', isNumeric: false, isDate: false, uniqueCount, uniqueRatio, avgLength, emptyRatio, sampleValues };

  // Boolean (after color — hex could also look boolean with 2 values)
  if (uniqueCount <= 3 && uniqueRatio <= 0.3) {
    const lower = new Set(allValues.map((v) => v.toLowerCase().trim()));
    const boolVals = ['true', 'false', 'yes', 'no', 'sim', 'não', 'nao', 'oui', 'non',
      'sí', 'ja', 'nein', 'on', 'off', '0', '1', '是', '否', 'はい', 'いいえ',
      'da', 'net', 'ano', 'ne', 'evet', 'hayır', 'tak', 'nie'];
    if ([...lower].some((v) => boolVals.includes(v))) {
      const boolLabels = detectBooleanLabels(allValues) || undefined;
      return { type: 'boolean', isNumeric: false, isDate: false, uniqueCount, uniqueRatio, avgLength, emptyRatio, boolLabels, sampleValues };
    }
  }

  // Tags
  const tagCount = allValues.filter((v) => COMMA_SEP_RE.test(v) || PIPE_SEP_RE.test(v)).length;
  if (tagCount / allValues.length > 0.6)
    return { type: 'tags', isNumeric: false, isDate: false, uniqueCount, uniqueRatio, avgLength, emptyRatio, sampleValues };

  // Long text
  if (avgLength > 60 && uniqueRatio > 0.3)
    return { type: 'long-text', isNumeric: false, isDate: false, uniqueCount, uniqueRatio, avgLength, emptyRatio, sampleValues };

  return { type: 'text', isNumeric: false, isDate: false, uniqueCount, uniqueRatio, avgLength, emptyRatio, sampleValues };
}

export function getColumnSortLabel(
  values: string[],
  analysis?: ColumnAnalysis,
): SortLabel {
  if (analysis?.type === 'boolean' && analysis.boolLabels) {
    return { label: analysis.boolLabels.asc, isNumeric: false, mode: 'boolean' };
  }

  if (analysis?.type === 'color') {
    return { label: '🔵→A', isNumeric: false, mode: 'color' };
  }

  const nonEmpty = values.filter((v) => v !== '' && v !== 'none');

  if (nonEmpty.length === 0) {
    return { label: 'A→Z', isNumeric: false, mode: 'alpha' };
  }

  const numericCount = nonEmpty.filter((v) => isNumericValue(v)).length;
  const isNumeric = numericCount / nonEmpty.length > 0.8;

  if (isNumeric) {
    return { label: '0→1', isNumeric: true, mode: 'alpha' };
  }

  const dateCount = nonEmpty.filter((v) => isIsoDate(v)).length;
  if (dateCount / nonEmpty.length > 0.8) {
    return { label: 'A→Z', isNumeric: false, mode: 'alpha' };
  }

  return { label: 'A→Z', isNumeric: false, mode: 'alpha' };
}

export function getSortableColumns(
  columns: string[],
  options?: {
    columnTypes?: Record<string, string>;
    items?: Record<string, unknown>[];
    excludeColumn?: string | null;
  },
): string[] {
  const { columnTypes, items, excludeColumn } = options || {};
  return columns.filter((col) => {
    if (SYSTEM_COLS.has(col)) return false;
    if (col === excludeColumn) return false;
    const renderType = columnTypes?.[col];
    if (renderType && NON_CAT_RENDER_TYPES.has(renderType)) return false;
    if (!items || items.length === 0) return true;
    const analysis = analyzeColumnValues(items, col);
    if (analysis.type === 'url' || analysis.type === 'json' ||
        analysis.type === 'uuid' || analysis.type === 'email' ||
        analysis.type === 'empty') return false;
    if (analysis.type === 'long-text') return false;
    return true;
  });
}

export function getCategorizableColumns(
  columns: string[],
  options?: {
    columnTypes?: Record<string, string>;
    items?: Record<string, unknown>[];
    excludeColumn?: string | null;
  },
): string[] {
  const { columnTypes, items, excludeColumn } = options || {};

  return columns.filter((col) => {
    if (SYSTEM_COLS.has(col)) return false;
    if (col === excludeColumn) return false;

    const renderType = columnTypes?.[col];
    if (renderType && NON_CAT_RENDER_TYPES.has(renderType)) return false;

    if (!items || items.length === 0) return true;

    const analysis = analyzeColumnValues(items, col);

    if (analysis.type === 'url' || analysis.type === 'json' ||
        analysis.type === 'uuid' || analysis.type === 'email' ||
        analysis.type === 'empty') return false;

    if (analysis.type === 'long-text') return false;

    if (analysis.uniqueRatio > 0.4 && items.length > 10) return false;
    if (analysis.avgLength > 80) return false;

    return true;
  });
}
