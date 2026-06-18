'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { micromark } from 'micromark';
import { gfmTable, gfmTableHtml } from 'micromark-extension-gfm-table';
import { ChevronDown } from 'lucide-react';
import { processSlugLinks } from './streaming-accordion';
import { SECTION_META } from '@/lib/response-styles';
import { renderSectionTable } from './render-tabela';

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

const COMPACT_TYPES = new Set(['resumo', 'dicas', 'conclusao', 'recomendacao', 'veredito']);
const LIST_TYPES = new Set(['topicos', 'passos', 'exemplos', 'pros', 'contras', 'resultados', 'observacoes']);

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
    } catch {/* noop */}
  }
  return { sections, partial };
}

function renderContent(text: string, tenantSlug?: string): string {
  if (!text) return '';
  try {
    const withLinks = processSlugLinks(text, tenantSlug);
    return micromark(withLinks, { allowDangerousHtml: false, extensions: [gfmTable()], htmlExtensions: [gfmTableHtml()] });
  } catch {
    return `<p>${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`;
  }
}

function CompactSection({ section }: { section: Section }) {
  const meta = SECTION_META[section.sectionType] ?? { icon: '📌', label: section.sectionType };
  return (
    <div className="flex items-start gap-2.5 px-1 py-1.5">
      <span className="text-base mt-0.5 shrink-0">{meta.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground mb-0.5">{section.title}</p>
        <div
          className="prose prose-invert prose-sm max-w-none prose-a:text-primary text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: renderContent(section.content) }}
        />
      </div>
    </div>
  );
}

function ExpandableSection({ section, isOpen, onToggle, isLast, isStreaming }: {
  section: Section; isOpen: boolean; onToggle: () => void; isLast: boolean; isStreaming: boolean;
}) {
  const meta = SECTION_META[section.sectionType] ?? { icon: '📌', label: section.sectionType };
  return (
    <div className="rounded-lg border overflow-hidden transition-all">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 w-full px-4 py-3 text-left text-sm font-medium hover:bg-muted/50 transition-colors"
      >
        <span className="text-base">{meta.icon}</span>
        <span className="flex-1">{section.title}</span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 text-sm leading-relaxed">
              <div
                className="prose prose-invert prose-sm max-w-none prose-a:text-primary"
                dangerouslySetInnerHTML={{ __html: renderContent(section.content) }}
              />
              {isLast && isStreaming && (
                <span className="inline-block animate-pulse text-primary ml-0.5">▍</span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ListSection({ section }: { section: Section }) {
  const meta = SECTION_META[section.sectionType] ?? { icon: '📌', label: section.sectionType };
  return (
    <div className="rounded-lg border px-4 py-3 bg-muted/10">
      <div className="flex items-center gap-2 mb-2 text-sm font-medium">
        <span className="text-base">{meta.icon}</span>
        <span>{section.title}</span>
      </div>
      <div
        className="prose prose-invert prose-sm max-w-none prose-a:text-primary"
        dangerouslySetInnerHTML={{ __html: renderContent(section.content) }}
      />
    </div>
  );
}

function TableHybridSection({ section, tenantSlug }: { section: Section; tenantSlug?: string }) {
  const meta = SECTION_META[section.sectionType] ?? { icon: '📌', label: section.sectionType };
  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/30 border-b text-sm font-medium">
        <span className="text-base">{meta.icon}</span>
        <span>{section.title}</span>
      </div>
      <div className="p-3">
        {section.content && (
          <div
            className="prose prose-invert prose-sm max-w-none prose-a:text-primary mb-3"
            dangerouslySetInnerHTML={{ __html: renderContent(section.content, tenantSlug) }}
          />
        )}
        {section.headers && section.rows && (
          <div
            className="text-xs"
            dangerouslySetInnerHTML={{ __html: renderSectionTable(section, tenantSlug) }}
          />
        )}
      </div>
    </div>
  );
}

export default function RenderHibrido({ content, isStreaming, tenantSlug }: Props) {
  const [expandedIndex, setExpandedIndex] = useState<number>(0);
  const { sections, partial } = useMemo(() => parseSections(content, isStreaming), [content, isStreaming]);

  if (sections.length === 0 && !partial) {
    return (
      <div className="text-sm text-muted-foreground">
        {isStreaming ? <span className="inline-block animate-pulse">▍</span> : null}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sections.map((section, idx) => {
        const st = section.sectionType;

        if (st === 'tabela') {
          return <TableHybridSection key={idx} section={section} tenantSlug={tenantSlug} />;
        }

        if (COMPACT_TYPES.has(st)) {
          return <CompactSection key={idx} section={section} />;
        }

        if (LIST_TYPES.has(st)) {
          return <ListSection key={idx} section={section} />;
        }

        return (
          <ExpandableSection
            key={idx}
            section={section}
            isOpen={expandedIndex === idx}
            onToggle={() => setExpandedIndex(expandedIndex === idx ? -1 : idx)}
            isLast={idx === sections.length - 1}
            isStreaming={isStreaming}
          />
        );
      })}
      {partial && isStreaming && (
        <div className="rounded-lg border px-4 py-3 text-sm">
          <span className="inline-block animate-pulse text-primary ml-0.5">▍</span>
        </div>
      )}
    </div>
  );
}
