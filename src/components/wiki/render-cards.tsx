'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { micromark } from 'micromark';
import { gfmTable, gfmTableHtml } from 'micromark-extension-gfm-table';
import { processSlugLinks } from './streaming-accordion';
import { SECTION_META } from '@/lib/response-styles';

type Section = {
  sectionType: string;
  title: string;
  content: string;
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
      if (parsed.sectionType && parsed.title) sections.push(parsed);
    } catch {/* noop */}
  }
  return { sections, partial };
}

const CARD_COLORS: Record<string, string> = {
  resumo: 'from-blue-500/10 to-blue-600/5 border-blue-500/20',
  dicas: 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/20',
  topicos: 'from-purple-500/10 to-purple-600/5 border-purple-500/20',
  passos: 'from-amber-500/10 to-amber-600/5 border-amber-500/20',
  exemplos: 'from-pink-500/10 to-pink-600/5 border-pink-500/20',
  comparacao: 'from-cyan-500/10 to-cyan-600/5 border-cyan-500/20',
  analise: 'from-violet-500/10 to-violet-600/5 border-violet-500/20',
};

function getCardColors(sectionType: string): string {
  return CARD_COLORS[sectionType] || 'from-slate-500/10 to-slate-600/5 border-slate-500/20';
}

export default function RenderCards({ content, isStreaming, tenantSlug }: Props) {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({ 0: true });
  const { sections, partial } = useMemo(() => parseSections(content, isStreaming), [content, isStreaming]);

  const toggleCard = useCallback((idx: number) => {
    setExpanded(prev => ({ ...prev, [idx]: !prev[idx] }));
  }, []);

  if (sections.length === 0 && !isStreaming) {
    return <span className="text-muted-foreground italic">Aguardando resposta...</span>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <AnimatePresence mode="popLayout">
        {sections.map((section, idx) => {
          const meta = SECTION_META[section.sectionType] ?? { icon: '📌', label: section.sectionType };
          const isExpanded = expanded[idx] ?? idx === 0;
          let contentHtml = '';
          if (section.content) {
            try {
              const withLinks = processSlugLinks(section.content, tenantSlug);
              contentHtml = micromark(withLinks, { allowDangerousHtml: false, extensions: [gfmTable()], htmlExtensions: [gfmTableHtml()] });
            } catch {
              contentHtml = `<p>${section.content}</p>`;
            }
          }

          return (
            <motion.div
              key={idx}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, delay: idx * 0.08 }}
              className={`rounded-xl border bg-gradient-to-br ${getCardColors(section.sectionType)} overflow-hidden`}
            >
              <button
                onClick={() => toggleCard(idx)}
                className="flex items-center gap-2.5 w-full px-4 py-3 text-left text-sm font-medium"
              >
                <span className="text-lg">{meta.icon}</span>
                <span className="flex-1">{section.title}</span>
                <motion.span
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-muted-foreground text-xs"
                >
                  ▼
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-3 text-sm leading-relaxed">
                      <div
                        className="prose prose-invert prose-sm max-w-none prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground"
                        dangerouslySetInnerHTML={{ __html: contentHtml }}
                      />
                      {idx === sections.length - 1 && isStreaming && (
                        <span className="inline-block animate-pulse text-primary ml-0.5">▍</span>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </AnimatePresence>
      {partial && isStreaming && (
        <div className="rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground bg-muted/20 col-span-full">
          <span className="animate-pulse">▍</span>
        </div>
      )}
      {!isStreaming && sections.length === 0 && !content && (
        <div className="col-span-full text-center text-muted-foreground py-4">
          <span className="inline-block animate-pulse text-primary">▍</span>
        </div>
      )}
    </div>
  );
}
