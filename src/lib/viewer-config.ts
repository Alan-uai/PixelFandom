import { z } from 'zod';

export const FilterColumnSchema = z.object({
  column: z.string(),
  label: z.string().optional(),
  mode: z.enum(['single', 'multiple']).default('multiple'),
});

export const ManualGroupSchema = z.object({
  label: z.string(),
  values: z.array(z.string()),
});

export const ViewerConfigSchema = z.object({
  header: z.object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
    backgroundImage: z.string().optional(),
    showBreadcrumb: z.boolean().default(true),
    icon: z.string().optional(),
  }).optional(),
  display: z.object({
    format: z.enum(['grid', 'list', 'carousel', 'carousel_infinite']).optional(),
    columnsCount: z.number().int().min(1).max(5).optional(),
    itemsPerPage: z.number().int().min(1).max(200).optional(),
    pagination: z.enum(['paginated', 'infinite-scroll', 'none']).optional(),
    sortColumn: z.string().nullable().optional(),
    sortDirection: z.enum(['asc', 'desc']).default('asc'),
    gap: z.number().min(0).max(16).optional(),
    overrideGlobal: z.boolean().default(false),
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
    style: z.enum(['tabs', 'accordion', 'headings', 'badges', 'none']).default('headings'),
    groupEmpty: z.boolean().default(true),
    showEmptyCategories: z.boolean().default(false),
    defaultExpanded: z.boolean().default(true),
    order: z.array(z.string()).default([]),
    autoDetect: z.boolean().default(true),
    manualGroups: z.array(ManualGroupSchema).default([]),
    secondaryColumn: z.string().nullable().default(null),
    categoryIcons: z.record(z.string(), z.string()).default({}),
  }).optional(),
  card: z.object({
    size: z.enum(['sm', 'md', 'lg']).default('md'),
    showIcon: z.boolean().default(true),
    showImage: z.boolean().default(true),
    showLabel: z.boolean().default(true),
    badges: z.array(z.string()).default([]),
    badgeColors: z.record(z.string(), z.string()).default({}),
    hoverEffect: z.enum(['scale', 'glow', 'shadow', 'none']).default('scale'),
    compactMode: z.boolean().default(false),
  }).optional(),
  detail: z.object({
    visibleColumns: z.array(z.string()).default([]),
    columnOrder: z.array(z.string()).default([]),
    columnFormats: z.record(z.string(), z.enum(['text', 'badge', 'color', 'icon', 'link', 'image', 'rating', 'progress'])).default({}),
    showComparison: z.boolean().default(true),
    showHeader: z.boolean().default(false),
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
  uploadColumns: z.array(z.string()).default([]).optional(),
  columnTypes: z.record(z.string(), z.string()).default({}).optional(),
}).default({});

export type ViewerConfig = z.infer<typeof ViewerConfigSchema>;

export function parseViewerConfig(raw: unknown): ViewerConfig {
  const result = ViewerConfigSchema.safeParse(raw);
  if (result.success) return result.data;
  return {};
}
