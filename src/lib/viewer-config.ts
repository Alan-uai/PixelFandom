import { z } from 'zod';
import { ALL_FORMATS } from './column-types/format-compatibility';

export const FilterColumnSchema = z.object({
  column: z.string(),
  label: z.string().optional(),
  mode: z.enum(['single', 'multiple']).default('multiple'),
  enabled: z.boolean().default(true),
});

export const ManualGroupSchema = z.object({
  label: z.string(),
  column: z.string().optional(),
  values: z.array(z.string()),
  icon: z.string().optional(),
  imageUrl: z.string().optional(),
});

export const BadgeEntrySchema = z.object({
  hover: z.boolean().default(false),
  clickAction: z.enum(['comparison', 'external-link', 'none']).default('none'),
  clickUrl: z.string().optional(),
  icon: z.string().optional(),
  iconSize: z.number().optional(),
  labelSize: z.number().optional(),
});

export const AllowedValueSchema = z.object({
  value: z.string(),
  label: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  imageUrl: z.string().optional(),
  linkedEntity: z.string().optional(),
  autoFill: z.record(z.string(), z.string()).optional(),
});

export const ViewerConfigSchema = z.object({
  header: z.object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
    backgroundImage: z.string().optional(),
    showBreadcrumb: z.boolean().default(true),
    icon: z.string().optional(),
    labelColor: z.string().optional(),
  }).optional(),
  display: z.object({
    format: z.enum(['grid', 'list', 'carousel', 'carousel_infinite']).optional(),
    columnsCount: z.number().int().min(1).max(5).optional(),
    itemsPerPage: z.number().int().min(1).max(200).optional(),
    pagination: z.boolean().default(false),
    paginationStyle: z.enum(['arrows', 'numbers', 'emoji']).default('arrows'),
    sortColumn: z.string().nullable().optional(),
    sortDirection: z.enum(['asc', 'desc']).default('asc'),
    gap: z.number().min(0).max(32).optional(),
  }).optional(),
  filters: z.object({
    enabled: z.boolean().default(true),
    columns: z.array(FilterColumnSchema).default([]),
    sortableColumns: z.array(z.object({ column: z.string(), label: z.string() })).default([]),
    showClearButton: z.boolean().default(true),
    autoDetect: z.boolean().default(true),
  }).optional(),
  categorization: z.object({
    enabled: z.boolean().default(true),
    column: z.string().nullable().default(null),
    style: z.enum(['tabs', 'accordion', 'headings', 'badges', 'none']).transform(v => {
      if (v === 'badges' || v === 'none') return 'headings';
      return v;
    }).default('headings'),
    groupEmpty: z.boolean().default(true),
    showEmptyCategories: z.boolean().default(false),
    defaultExpanded: z.boolean().default(true),
    order: z.array(z.string()).default([]),
    categorySortDirection: z.enum(['asc', 'desc']).default('asc'),
    categorySortColumn: z.string().nullable().default(null),
    autoDetect: z.boolean().default(true),
    manualGroups: z.array(ManualGroupSchema).default([]),
    secondaryColumn: z.string().nullable().default(null),
    categoryIcons: z.record(z.string(), z.string()).default({}),
    secondaryIcons: z.record(z.string(), z.record(z.string(), z.string())).default({}),
    spacingEnabled: z.boolean().default(true),
    spacingStyle: z.enum(['none', 'single-line', 'double-line', 'dashed']).default('none'),
    spacingValue: z.number().min(0).max(64).default(16),
    separatorWidth: z.number().min(0).max(16).default(2).optional(),
    subManualGroups: z.array(ManualGroupSchema).default([]),
    subOrder: z.array(z.string()).default([]),
    iconSize: z.number().min(12).max(64).default(16),
    labelSize: z.number().min(10).max(32).default(12),
    tabLabelDisplay: z.enum(['name', 'both', 'icon']).default('both'),
    categoryItemSortColumn: z.string().nullable().default(null),
    categoryItemSortDirection: z.enum(['asc', 'desc']).default('asc'),
    categoryItemOrder: z.array(z.string()).default([]),
    colorSortMode: z.enum(['value', 'name']).default('value'),
    subCategoryItemSortColumn: z.string().nullable().default(null),
    subCategoryItemSortDirection: z.enum(['asc', 'desc']).default('asc'),
    subCategoryItemOrder: z.array(z.string()).default([]),
  }).optional(),
  card: z.object({
    layout: z.enum(['card', 'accordion', 'list', 'table']).default('card'),
    size: z.enum(['sm', 'md', 'lg']).default('md'),
    showIcon: z.boolean().default(true),
    showImage: z.boolean().default(true),
    showLabel: z.boolean().default(true),
    badges: z.array(z.string()).default([]),
    badgeColors: z.record(z.string(), z.string()).default({}),
    badgeConfig: z.record(z.string(), BadgeEntrySchema).default({}),
    badgeDisplayMode: z.enum(['inline', 'lista', 'footer-heading']).default('inline'),
    hoverEffect: z.enum(['scale', 'glow', 'shadow', 'none']).default('scale'),
    visibleColumns: z.array(z.string()).default([]),
    columnOrder: z.array(z.string()).default([]),
    columnFormats: z.record(z.string(), z.enum(ALL_FORMATS)).default({}),
    columnFormatVariants: z.record(z.string(), z.number().min(1).max(5)).default({}),
    columnOpEnabled: z.record(z.string(), z.boolean()).default({}),
    columnOpFlipped: z.record(z.string(), z.boolean()).default({}),
    showComparison: z.boolean().default(true),
    showHeader: z.boolean().default(false),
    defaultExpanded: z.boolean().default(false),
    // ── Base → Max (baseXmax) slider config, stored nested under `card` ──
    // (the editor in table-viewer-config/card-config.tsx writes it here).
    baseXmax: z.object({
      enabled: z.boolean().optional(),
      mode: z.enum(['off', 'item', 'table', 'ambos']).optional(),
      levelColumn: z.string().optional(),
      /** Split parameter column/key (e.g. "max_copies" or "atributos.max") used as divisor. */
      paramColumn: z.string().optional(),
      /** Enable the base→max interpolation formula (base + (max − base) × copies/param). */
      formulaEnabled: z.boolean().optional(),
      /** Base value of the interpolation formula. */
      base: z.number().optional(),
      /** Max value of the interpolation formula. */
      max: z.number().optional(),
      /** Auto-derive the slider range from data instead of fixed bounds. */
      auto: z.boolean().optional(),
      axisLabel: z.string().optional(),
      axisMin: z.number().optional(),
      axisMax: z.number().optional(),
      step: z.number().optional(),
      defaultValue: z.number().optional(),
      /** Number of levels/tiers the axis range is divided into (drives the slider steps). */
      tiers: z.number().int().min(1).max(1000).optional(),
    }).optional(),
  }).optional(),
  search: z.object({
    enabled: z.boolean().default(true),
    placeholder: z.string().default('Buscar...'),
    searchableColumns: z.array(z.string()).default([]),
    debounceMs: z.number().int().min(150).max(2000).default(300),
    minChars: z.number().int().min(0).max(5).default(1),
  }).optional(),
  emptyState: z.object({
    message: z.string().default('Nenhum item encontrado'),
    imageUrl: z.string().optional(),
    ctaText: z.string().optional(),
    ctaUrl: z.string().optional(),
  }).optional(),
  loading: z.object({
    skeleton: z.enum(['shimmer', 'pulse', 'spinner', 'none']).default('shimmer'),
    skeletonCount: z.number().int().min(1).max(12).default(6),
  }).optional(),
  source: z.enum(['global', 'local']).default('local').optional(),
  uploadColumns: z.array(z.string()).default([]).optional(),
  columnTypes: z.record(z.string(), z.string()).default({}).optional(),
  columnConfig: z.record(z.string(), z.object({
    maxValue: z.number().optional(),
    displayName: z.string().optional(),
    labelIcon: z.string().optional(),
    labelColor: z.string().optional(),
    jsonbKeyTypes: z.record(z.string(), z.object({
      type: z.enum(['number', 'text', 'boolean']),
      suffix: z.string().optional(),
    })).optional(),
    jsonbKeyColors: z.record(z.string(), z.string()).optional(),
    valueColors: z.record(z.string(), z.string()).optional(),
    allowedValues: z.array(AllowedValueSchema).optional(),
    maxSelect: z.number().optional(),
    restrictToValues: z.boolean().optional(),
    dependentField: z.string().optional(),
    parentValueMap: z.record(z.string(), z.array(z.string())).optional(),
  })).default({}).optional(),
  scaling: z.object({
    enabled: z.boolean().default(false),
    maxCopies: z.number().default(10000),
    costPerCopy: z.number().optional(),
    formula: z.enum(['linear', 'diminishing']).default('linear'),
  }).optional(),
  // ── Base → Max (baseXmax) ranges inside JSONB columns ──────────
  // Lets a card expose a slider that sweeps a base/max range along an axis
  // (level / tier / copy count / rarity) and shows the interpolated result.
  baseXmax: z.object({
    enabled: z.boolean().default(false),
    /** Axis label shown next to the slider (e.g. "Nível", "Level"). */
    axisLabel: z.string().default('Nível'),
    axisMin: z.number().default(1),
    axisMax: z.number().default(100),
    step: z.number().min(0.0001).default(1),
    defaultValue: z.number().optional(),
    mode: z.enum(['continuous', 'tiers']).default('continuous'),
    /** Show an independent slider inside each card (or scalable sub-stat). */
    showPerCardSlider: z.boolean().default(false),
  }).optional(),
  rowHiddenFields: z.record(z.string(), z.array(z.string())).default({}).optional(),
}).default({});

export type ViewerConfig = z.infer<typeof ViewerConfigSchema>;

export function parseViewerConfig(raw: unknown): ViewerConfig {
  const result = ViewerConfigSchema.safeParse(raw);
  if (result.success) return result.data;
  console.warn('[viewer-config] parse failed, falling back to defaults:', result.error.flatten());
  return ViewerConfigSchema.parse({});
}
