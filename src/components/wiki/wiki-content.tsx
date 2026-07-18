'use client';

import { useEffect, useMemo, useRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { micromark } from 'micromark';
import { gfmTable, gfmTableHtml } from 'micromark-extension-gfm-table';
import { sanitizeHtml } from '@/lib/sanitize';
import { escapeHtml } from '@/lib/content-utils';
import { UserMentionHydrator } from './user-mention-popover';
import { IconRenderer } from '@/components/ui/icon-renderer';
import { getTableCatalog, getTableItem } from '@/lib/data-access';

type WikiContentProps = {
  content: string | null;
  className?: string;
  wikiSlug?: string;
};

// Default icon per mention type (used when no custom icon is defined)
const DEFAULT_MENTION_ICON: Record<string, string> = {
  table: 'Database',
  item: 'Package',
  article: 'FileText',
  link: 'Link',
};

// Resolves the user-defined (custom) icon for a mention, falling back to the default.
async function resolveMentionIcon(
  type: string,
  slug: string,
  tableName: string | undefined,
  wikiSlug: string | undefined,
): Promise<string | null> {
  if (!wikiSlug) return null;
  try {
    if (type === 'table') {
      const catalog = await getTableCatalog(wikiSlug, false);
      const entry = catalog.find((e) => e.table_name === slug);
      return entry?.icon || null;
    }
    if (type === 'item' && tableName) {
      const item = await getTableItem(wikiSlug, tableName, slug);
      if (!item) return null;
      const icon = (item as Record<string, unknown>).icon;
      if (typeof icon === 'string' && icon) return icon;
      const iconUrl = (item as Record<string, unknown>).icon_url;
      if (typeof iconUrl === 'string' && iconUrl) return iconUrl;
      return null;
    }
  } catch {
    return null;
  }
  return null;
}

export function WikiContent({ content, className = '', wikiSlug }: WikiContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const html = useMemo(() => {
    if (!content) return null;

    const trimmed = content.trim();

    // Detect TipTap JSON (backward compat)
    if (trimmed.startsWith('{"type":"doc"') || trimmed.startsWith('{ "type": "doc"') || trimmed.startsWith('{"type":"doc')) {
      return sanitizeHtml(renderTipTapJSON(trimmed));
    }

    // Detect raw JSON (non-TipTap) — from seed collection items
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === 'object') {
          return sanitizeHtml(renderRawJson(parsed));
        }
      } catch {
        // not JSON, fall through
      }
    }

    // Pre-process smart mentions before markdown
    const preprocessed = preprocessSmartMentions(trimmed, wikiSlug);

    // Default: render as markdown
    try {
      const html = micromark(preprocessed, { allowDangerousHtml: true, extensions: [gfmTable()], htmlExtensions: [gfmTableHtml()] });
      return sanitizeHtml(html);
    } catch {
      return `<p>${escapeHtml(content)}</p>`;
    }
  }, [content, wikiSlug]);

  const iconRoots = useRef<Map<HTMLElement, Root>>(new Map());

  useEffect(() => {
    const root = contentRef.current;
    if (!root || !html) return;

    // Unmount any previously mounted icon roots
    iconRoots.current.forEach((r) => r.unmount());
    iconRoots.current.clear();

    const spans = Array.from(root.querySelectorAll<HTMLElement>('.mention-icon[data-type]'));
    if (spans.length === 0) return;

    let cancelled = false;

    Promise.all(
      spans.map(async (el) => {
        const type = el.dataset.type || '';
        const slug = el.dataset.slug || '';
        const tableName = el.dataset.table || undefined;
        let iconId: string | null = await resolveMentionIcon(type, slug, tableName, wikiSlug);
        if (!iconId) iconId = DEFAULT_MENTION_ICON[type] || 'Link';
        if (cancelled) return;

        while (el.firstChild) el.removeChild(el.firstChild);

        const IconNode =
          iconId.startsWith('http://') || iconId.startsWith('https://') ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={iconId} alt="" style={{ width: '0.85em', height: '0.85em', objectFit: 'contain' }} />
          ) : (
            <IconRenderer icon={iconId} size={14} />
          );

        const r = createRoot(el);
        r.render(IconNode);
        iconRoots.current.set(el, r);
        el.classList.add('inline-flex', 'items-center', 'justify-center', 'shrink-0');
      }),
    );

    const roots = iconRoots.current;
    return () => {
      cancelled = true;
      roots.forEach((r) => r.unmount());
      roots.clear();
    };
  }, [html, wikiSlug]);

  if (!html) {
    return <p className="text-muted-foreground">Esta página ainda não tem conteúdo.</p>;
  }

  return (
    <>
      <UserMentionHydrator />
      <div
        ref={contentRef}
        className={`prose prose-invert max-w-none prose-headings:scroll-mt-20 prose-a:text-primary prose-img:rounded-lg prose-pre:bg-muted prose-pre:border ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </>
  );
}

function preprocessSmartMentions(text: string, wikiSlug?: string): string {
  let result = text;

  // $l<url> → external link (must be before other patterns to avoid conflicts)
  result = result.replace(
    /\$l<([^>]+)>/g,
    (_, url: string) => {
      const sanitized = url.trim();
      if (!sanitized) return '';
      const href = sanitized.startsWith('http://') || sanitized.startsWith('https://')
        ? sanitized
        : `https://${sanitized}`;
      return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" class="smart-mention link-mention"><span class="mention-icon" data-icon="Link"></span>${escapeHtml(sanitized)}</a>`;
    },
  );

  // $t<slug> → table link
  result = result.replace(
    /\$t<([^>]+)>/g,
    (_, slug: string) => {
      const s = slug.trim().toLowerCase();
      if (!s) return '';
      const href = wikiSlug ? `/w/${wikiSlug}/${s}` : `/${s}`;
      return `<a href="${escapeHtml(href)}" class="smart-mention table-mention" data-type="table" data-slug="${escapeHtml(s)}"><span class="mention-icon" data-icon="Database"></span>${escapeHtml(s)}</a>`;
    },
  );

  // $i<table:slug> or legacy $i<name> → item link (navigates to parent table, selects item)
  result = result.replace(
    /\$i<([^>]+)>/g,
    (_, raw: string) => {
      const n = raw.trim();
      if (!n) return '';
      const nLow = n.toLowerCase();
      if (n.includes(':')) {
        const idx = n.indexOf(':');
        const tableName = n.slice(0, idx).trim().toLowerCase();
        const itemSlug = n.slice(idx + 1).trim();
        if (tableName && itemSlug) {
          const href = wikiSlug ? `/w/${wikiSlug}/${tableName}?item=${encodeURIComponent(itemSlug)}` : `/${tableName}?item=${encodeURIComponent(itemSlug)}`;
          return `<a href="${escapeHtml(href)}" class="smart-mention item-mention" data-type="item" data-slug="${escapeHtml(itemSlug)}" data-table="${escapeHtml(tableName)}"><span class="mention-icon" data-icon="Package"></span>${escapeHtml(itemSlug)}</a>`;
        }
      }
      const href = wikiSlug ? `/w/${wikiSlug}?search=${encodeURIComponent(nLow)}` : `/?search=${encodeURIComponent(nLow)}`;
      return `<a href="${escapeHtml(href)}" class="smart-mention item-mention" data-type="item" data-slug="${escapeHtml(nLow)}"><span class="mention-icon" data-icon="Package"></span>${escapeHtml(n)}</a>`;
    },
  );

  // $a<slug> → article link
  result = result.replace(
    /\$a<([^>]+)>/g,
    (_, slug: string) => {
      const s = slug.trim().toLowerCase();
      if (!s) return '';
      const href = wikiSlug ? `/w/${wikiSlug}/${s}` : `/${s}`;
      return `<a href="${escapeHtml(href)}" class="smart-mention article-mention" data-type="article" data-slug="${escapeHtml(s)}"><span class="mention-icon" data-icon="FileText"></span>${escapeHtml(s)}</a>`;
    },
  );

  // $@<username> → user mention
  result = result.replace(
    /\$@<([^>]+)>/g,
    (_, username: string) => {
      const u = username.trim();
      if (!u) return '';
      return `<span class="user-mention" data-username="${escapeHtml(u)}">@${escapeHtml(u)}</span>`;
    },
  );

  return result;
}

function renderTipTapJSON(json: string): string {
  try {
    const doc = JSON.parse(json);
    return renderProseMirrorNode(doc);
  } catch {
    return '<p>Erro ao renderizar conteúdo.</p>';
  }
}

function renderRawJson(data: unknown): string {
  if (typeof data !== 'object' || data === null) {
    return `<p>${escapeHtml(String(data))}</p>`;
  }

  if (Array.isArray(data)) {
    return data.map((item) => `<div class="mb-4">${renderRawJson(item)}</div>`).join('');
  }

  const obj = data as Record<string, unknown>;
  const skipKeys = new Set(['id', 'image', 'image_url', 'code']);

  const parts: string[] = [];

  const name = (obj.name || obj.title || obj.world_name || '') as string;
  if (name) {
    parts.push(`<h2 class="text-xl font-bold mb-2">${escapeHtml(name)}</h2>`);
  }

  if (obj.description) {
    parts.push(
      `<p class="text-muted-foreground border-l-2 border-primary/40 pl-4 mb-4">${escapeHtml(String(obj.description))}</p>`,
    );
  }

  const fields = Object.entries(obj).filter(
    ([key, val]) => !skipKeys.has(key) && val != null && val !== '',
  );

  if (fields.length > 0) {
    parts.push('<div class="overflow-x-auto">');
    parts.push('<table class="min-w-full border-collapse">');
    parts.push('<tbody>');
    for (const [key, val] of fields) {
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      let display: string;
      if (typeof val === 'object' && val !== null) {
        display = renderRawJson(val);
      } else {
        display = escapeHtml(String(val));
      }
      parts.push(
        `<tr class="border-b border-border"><td class="py-2 pr-4 font-medium text-sm align-top whitespace-nowrap">${label}</td><td class="py-2 text-sm">${display}</td></tr>`,
      );
    }
    parts.push('</tbody></table>');
    parts.push('</div>');
  }

  return parts.join('\n');
}

function renderProseMirrorNode(node: any): string {
  if (!node || typeof node !== 'object') return '';

  switch (node.type) {
    case 'doc':
      return (node.content || []).map(renderProseMirrorNode).join('\n');

    case 'paragraph':
      return `<p>${renderInline(node)}</p>`;

    case 'heading': {
      const level = node.attrs?.level || 2;
      return `<h${level}>${renderInline(node)}</h${level}>`;
    }

    case 'bulletList':
      return `<ul>${(node.content || []).map(renderProseMirrorNode).join('\n')}</ul>`;

    case 'orderedList':
      return `<ol>${(node.content || []).map(renderProseMirrorNode).join('\n')}</ol>`;

    case 'listItem':
      return `<li>${renderInline(node)}</li>`;

    case 'codeBlock': {
      const lang = node.attrs?.language ? ` class="language-${node.attrs.language}"` : '';
      return `<pre><code${lang}>${escapeHtml(node.content?.[0]?.text || '')}</code></pre>`;
    }

    case 'blockquote':
      return `<blockquote>${(node.content || []).map(renderProseMirrorNode).join('\n')}</blockquote>`;

    case 'horizontalRule':
      return '<hr />';

    case 'image':
      return `<img src="${escapeHtml(node.attrs?.src || '')}" alt="${escapeHtml(node.attrs?.alt || '')}" />`;

    case 'hardBreak':
      return '<br />';

    case 'gameItemEmbed':
      return renderGameItemEmbed(node);

    case 'tierlistBlock':
      return renderTierlistBlock(node);

    case 'table':
      return `<div class="overflow-x-auto my-4"><table class="min-w-full border-collapse border border-border"><tbody>${(node.content || []).map(renderProseMirrorNode).join('\n')}</tbody></table></div>`;

    case 'tableRow':
      return `<tr>${(node.content || []).map(renderProseMirrorNode).join('\n')}</tr>`;

    case 'tableHeader':
      return `<th class="border border-border px-3 py-2 text-left text-sm font-semibold bg-muted/50">${renderInline(node)}</th>`;

    case 'tableCell':
      return `<td class="border border-border px-3 py-2 text-sm">${renderInline(node)}</td>`;

    default:
      if (node.content) {
        return (node.content || []).map(renderProseMirrorNode).join('\n');
      }
      if (node.text) {
        return renderMarks(node.text, node.marks);
      }
      return '';
  }
}

function renderInline(node: any): string {
  if (!node) return '';
  if (node.text) {
    return renderMarks(node.text, node.marks);
  }
  if (node.content) {
    return node.content.map(renderInline).join('');
  }
  return '';
}

function renderMarks(text: string, marks?: any[]): string {
  if (!marks || marks.length === 0) return escapeHtml(text);

  let result = escapeHtml(text);
  for (const mark of marks) {
    switch (mark.type) {
      case 'bold':
        result = `<strong>${result}</strong>`;
        break;
      case 'italic':
        result = `<em>${result}</em>`;
        break;
      case 'underline':
        result = `<u>${result}</u>`;
        break;
      case 'code':
        result = `<code>${result}</code>`;
        break;
      case 'link': {
        const href = escapeHtml(mark.attrs?.href || '#');
        result = `<a href="${href}">${result}</a>`;
        break;
      }
      case 'strike':
        result = `<s>${result}</s>`;
        break;
      case 'highlight':
        result = `<mark>${result}</mark>`;
        break;
    }
  }
  return result;
}

function renderGameItemEmbed(node: any): string {
  const table = node.attrs?.table || '';
  const itemName = node.attrs?.itemName || '';
  const itemId = node.attrs?.itemId || '';

  const tableLabels: Record<string, string> = {
    weapons: 'Arma', armors: 'Armadura', rings: 'Anel', enemies: 'Inimigo',
    bosses: 'Chefe', potions: 'Poção', upgrades: 'Upgrade', worlds: 'Mundo',
    codes: 'Código', crafting_recipes: 'Receita', resources: 'Recurso', build_presets: 'Build',
  };

  const label = tableLabels[table] || table;

  return `<div class="game-item-embed rounded-lg border border-primary/20 bg-primary/5 p-4 my-3 flex items-center gap-3">
    <div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">${label.charAt(0)}</div>
    <div>
      <div class="font-medium text-sm">${escapeHtml(itemName)}</div>
      <div class="text-xs text-muted-foreground">${escapeHtml(label)} · ID: ${escapeHtml(itemId)}</div>
    </div>
  </div>`;
}

function renderTierlistBlock(node: any): string {
  const title = node.attrs?.title || 'Tierlist';
  let tiers: { label: string; color: string; itemIds: string[] }[] = [];
  try {
    if (node.attrs?.tiers) {
      tiers = typeof node.attrs.tiers === 'string'
        ? JSON.parse(node.attrs.tiers)
        : node.attrs.tiers;
    }
  } catch {/* noop */}

  const tierColors: Record<string, string> = {
    S: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
    A: 'bg-green-500/20 border-green-500/30 text-green-400',
    B: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
    C: 'bg-purple-500/20 border-purple-500/30 text-purple-400',
    D: 'bg-gray-500/20 border-gray-500/30 text-gray-400',
    F: 'bg-red-500/20 border-red-500/30 text-red-400',
  };

  const parts: string[] = [
    `<div class="tierlist-block rounded-xl border border-border overflow-hidden my-4">`,
    `<div class="px-4 py-2 font-semibold text-sm bg-muted/50 border-b border-border">${escapeHtml(title)}</div>`,
  ];

  for (const tier of tiers) {
    const tc = tierColors[tier.label] || 'bg-muted border-border text-muted-foreground';
    parts.push(`<div class="flex items-stretch border-b border-border/50 last:border-0">
      <div class="flex items-center justify-center w-12 font-bold text-sm ${tc} border-r border-inherit">${escapeHtml(tier.label)}</div>
      <div class="flex-1 px-3 py-2 text-xs text-muted-foreground">
        ${tier.itemIds.length > 0 ? tier.itemIds.join(', ') : '<span class="italic">Vazio</span>'}
      </div>
      <div class="flex items-center px-3 text-xs text-muted-foreground">${tier.itemIds.length} itens</div>
    </div>`);
  }

  parts.push('</div>');
  return parts.join('\n');
}
