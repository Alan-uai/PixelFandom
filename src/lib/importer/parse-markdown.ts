import * as yaml from 'js-yaml';
import type { ImportArticle } from './types';

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/;

export function parseMarkdownFile(content: string, fileName?: string): ImportArticle | null {
  const match = content.match(FRONTMATTER_RE);
  if (!match) return null;

  const rawFrontmatter = match[1];
  const body = match[2].trim();

  let frontmatter: Record<string, unknown>;
  try {
    frontmatter = yaml.load(rawFrontmatter) as Record<string, unknown> || {};
  } catch {
    frontmatter = {};
  }

  const title = String(frontmatter.title || frontmatter.Title || frontmatter.name || fileName || 'Untitled');
  const tags = parseTags(frontmatter.tags || frontmatter.categories || frontmatter.tag || []);
  const summary = String(frontmatter.summary || frontmatter.description || frontmatter.excerpt || '').slice(0, 500);
  const author = frontmatter.author ? String(frontmatter.author) : undefined;
  const createdAt = frontmatter.date
    ? String(frontmatter.date)
    : frontmatter.created_at
    ? String(frontmatter.created_at)
    : undefined;
  const updatedAt = frontmatter.updated_at
    ? String(frontmatter.updated_at)
    : frontmatter.last_modified
    ? String(frontmatter.last_modified)
    : undefined;
  const imageUrl = frontmatter.image
    ? String(frontmatter.image)
    : frontmatter.cover_image
    ? String(frontmatter.cover_image)
    : frontmatter.imageUrl
    ? String(frontmatter.imageUrl)
    : undefined;

  const slug = frontmatter.slug
    ? String(frontmatter.slug)
    : title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const htmlBody = markdownToHtmlBasic(body);

  return {
    title,
    summary,
    content: htmlBody,
    tags,
    slug,
    imageUrl,
    author,
    createdAt,
    updatedAt,
  };
}

function parseTags(tags: unknown): string[] {
  if (Array.isArray(tags)) {
    return tags.map(String);
  }
  if (typeof tags === 'string') {
    return tags.split(',').map((t) => t.trim()).filter(Boolean);
  }
  return [];
}

export function extractTagsFromArticles(articles: ImportArticle[]): string[] {
  const tagSet = new Set<string>();
  for (const a of articles) {
    for (const t of a.tags) {
      tagSet.add(t);
    }
  }
  return Array.from(tagSet).sort();
}

function markdownToHtmlBasic(md: string): string {
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  const lines = html.split('\n');
  const result: string[] = [];
  let inParagraph = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (inParagraph) {
        result.push('</p>');
        inParagraph = false;
      }
      continue;
    }
    if (
      trimmed.startsWith('<h') ||
      trimmed.startsWith('<pre') ||
      trimmed.startsWith('<img') ||
      trimmed.startsWith('<ul') ||
      trimmed.startsWith('<li') ||
      trimmed.startsWith('<table')
    ) {
      if (inParagraph) {
        result.push('</p>');
        inParagraph = false;
      }
      result.push(trimmed);
      continue;
    }
    if (!inParagraph) {
      result.push('<p>');
      inParagraph = true;
    }
    result.push(trimmed);
  }
  if (inParagraph) result.push('</p>');

  return result.map((l) => (l.startsWith('<') ? l : l)).join('\n');
}
