'use client';

import { useMemo } from 'react';
import { micromark } from 'micromark';
import { gfmTable, gfmTableHtml } from 'micromark-extension-gfm-table';
import { processWikiLinks } from './streaming-accordion';
import { SECTION_META } from '@/lib/response-styles';

type Section = {
  sectionType: string;
  title: string;
  content: string;
  headers?: string[];
  rows?: string[][];
};

type Props = {
  content: string;
  isStreaming: boolean;
  tenantSlug?: string;
};

function parseSections(content: string, isStreaming: boolean): { sections: Section[]; partial: string | null } {
  const parts = content.split('@@@SECTION@@@');
  const sections: Section[] = [];
  let partial: string | null = null;

  for (let i = 0; i < parts.length; i++) {
    const p = parts[i].trim();
    if (!p) continue;
    if (i === parts.length - 1 && isStreaming) {
      partial = p;
      break;
    }
    try {
      const parsed = JSON.parse(p);
      if (parsed.sectionType) sections.push(parsed);
    } catch {}
  }
  return { sections, partial };
}

function TableSection({ section }: { section: Section }) {
  const meta = SECTION_META[section.sectionType] ?? { icon: '📌', label: section.sectionType };

  let contentHtml = '';
  if (section.content) {
    try {
      contentHtml = micromark(section.content, { allowDangerousHtml: false, extensions: [gfmTable()], htmlExtensions: [gfmTableHtml()] });
    } catch {
      contentHtml = `<p>${section.content}</p>`;
    }
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/30 border-b text-sm font-medium text-foreground">
        <span className="text-base">{meta.icon}</span>
        <span>{section.title}</span>
      </div>
      <div className="p-3">
        {section.content && (
          <div
            className="prose prose-invert prose-sm max-w-none prose-a:text-primary prose-strong:text-foreground mb-3"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        )}
        {section.headers && section.rows && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/50">
                  {section.headers.map((h, i) => (
                    <th key={i} className="px-3 py-2 text-left font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {section.rows.map((row, ri) => (
                  <tr key={ri} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-3 py-2">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export function renderSectionTable(section: Section, tenantSlug?: string): string {
  if (!section.headers || !section.rows) return '';

  let html = '<div class="overflow-x-auto rounded-lg border"><table class="w-full text-xs border-collapse">';
  html += '<thead><tr>';
  for (const h of section.headers) {
    html += `<th class="px-3 py-2 text-left font-medium text-muted-foreground border-b border-border/50">${h}</th>`;
  }
  html += '</tr></thead><tbody>';
  for (const row of section.rows) {
    html += '<tr class="border-b border-border/30">';
    for (const cell of row) {
      html += `<td class="px-3 py-2">${cell}</td>`;
    }
    html += '</tr>';
  }
  html += '</tbody></table></div>';
  return processWikiLinks(html, tenantSlug);
}

export default function RenderTabela({ content, isStreaming, tenantSlug }: Props) {
  const { sections, partial } = useMemo(() => parseSections(content, isStreaming), [content, isStreaming]);

  if (!content && !isStreaming) {
    return <span className="text-muted-foreground italic">Nenhum dado</span>;
  }

  if (sections.length === 0) {
    const rendered = useMemo(() => {
      try {
        const html = micromark(content, { allowDangerousHtml: false, extensions: [gfmTable()], htmlExtensions: [gfmTableHtml()] });
        return processWikiLinks(html, tenantSlug);
      } catch {
        return `<p>${content?.replace(/</g, '&lt;').replace(/>/g, '&gt;') || ''}</p>`;
      }
    }, [content, tenantSlug]);

    return (
      <div>
        <div className="prose prose-invert prose-sm max-w-none prose-a:text-primary" dangerouslySetInnerHTML={{ __html: rendered }} />
        {isStreaming && <span className="inline-block animate-pulse text-primary ml-0.5">▍</span>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sections.map((section, idx) => (
        <TableSection key={idx} section={section} />
      ))}
      {partial && isStreaming && (
        <div className="rounded-lg border px-4 py-3 text-sm text-muted-foreground">
          <span className="animate-pulse">▍</span>
        </div>
      )}
    </div>
  );
}
