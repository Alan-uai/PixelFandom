'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

type Section = {
  sectionType: string;
  title: string;
  content: string;
};

type Props = {
  streamContent: string;
  isStreaming: boolean;
};

export default function StreamingAccordion({ streamContent, isStreaming }: Props) {
  const [expandedIndex, setExpandedIndex] = useState(0);
  const [sections, setSections] = useState<Section[]>([]);
  const [partialLine, setPartialLine] = useState('');
  const prevContentRef = useRef('');

  useEffect(() => {
    if (streamContent === prevContentRef.current && !isStreaming) return;
    prevContentRef.current = streamContent;

    const parts = streamContent.split('@@@SECTION@@@');
    const completeSections: Section[] = [];
    let leftover = '';

    for (let i = 0; i < parts.length; i++) {
      const p = parts[i].trim();
      if (!p) continue;

      if (i === parts.length - 1 && isStreaming) {
        leftover = p;
        continue;
      }

      try {
        const parsed = JSON.parse(p);
        if (parsed.sectionType && parsed.title) {
          completeSections.push(parsed);
        }
      } catch {
        if (i === parts.length - 1 && isStreaming) {
          leftover = p;
        }
      }
    }

    setSections(completeSections);
    setPartialLine(leftover);
    if (completeSections.length > 0 && expandedIndex === -1) {
      setExpandedIndex(0);
    }
  }, [streamContent, isStreaming, expandedIndex]);

  if (sections.length === 0 && !partialLine) {
    return (
      <div className="text-sm text-muted-foreground">
        {isStreaming ? (
          <span className="inline-block animate-pulse">▍</span>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sections.map((section, idx) => {
        const isExpanded = expandedIndex === idx;
        const iconMap: Record<string, string> = {
          resumo: '📋',
          detalhes: '📖',
          dicas: '💡',
        };

        return (
          <div
            key={idx}
            className="rounded-lg border overflow-hidden transition-all"
          >
            <button
              onClick={() => setExpandedIndex(isExpanded ? -1 : idx)}
              className="flex items-center gap-2 w-full px-4 py-3 text-left text-sm font-medium hover:bg-muted/50 transition-colors"
            >
              <span className="text-base">{iconMap[section.sectionType] || '📌'}</span>
              <span className="flex-1">{section.title}</span>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform ${
                  isExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>
            {isExpanded && (
              <div className="px-4 pb-3 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {idx === sections.length - 1 && partialLine && isStreaming ? (
                  <>
                    {section.content}
                    <span className="inline-block animate-pulse">▍</span>
                  </>
                ) : (
                  section.content
                )}
              </div>
            )}
          </div>
        );
      })}

      {sections.length === 0 && partialLine && (
        <div className="rounded-lg border px-4 py-3 text-sm text-muted-foreground">
          {partialLine}
          {isStreaming && <span className="inline-block animate-pulse ml-0.5">▍</span>}
        </div>
      )}

      {sections.length > 0 && partialLine && expandedIndex !== sections.length - 1 && (
        <div className="rounded-lg border px-4 py-3 text-sm text-muted-foreground">
          {partialLine}
          {isStreaming && <span className="inline-block animate-pulse ml-0.5">▍</span>}
        </div>
      )}
    </div>
  );
}
