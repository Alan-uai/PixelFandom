export type ImportSource = 'markdown' | 'zip' | 'fandom' | 'wikidot' | 'notion';

export interface ImportArticle {
  title: string;
  summary?: string;
  content: string;
  tags: string[];
  slug?: string;
  imageUrl?: string;
  author?: string;
  createdAt?: string;
  updatedAt?: string;
  originalUrl?: string;
}

export interface ImportJob {
  id: string;
  tenant_id: string;
  source: ImportSource;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total_count: number;
  completed_count: number;
  failed_count: number;
  options: Record<string, unknown>;
  result: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface ImportLogEntry {
  id: string;
  job_id: string;
  article_title: string | null;
  original_slug: string | null;
  new_slug: string | null;
  status: 'imported' | 'skipped' | 'error';
  error: string | null;
  created_at: string;
}

export interface ImportPreview {
  articles: ImportArticle[];
  totalCount: number;
  source: ImportSource;
  detectedTags: string[];
  fileName: string;
}

export interface MappingConfig {
  tagMapping: Record<string, string>;
  defaultTags: string[];
  createSummaries: boolean;
  rewriteLinks: boolean;
  preserveHistory: boolean;
}
