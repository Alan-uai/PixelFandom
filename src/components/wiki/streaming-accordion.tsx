'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { micromark } from 'micromark';
import { gfmTable, gfmTableHtml } from 'micromark-extension-gfm-table';
import { ChevronDown, FileText, ExternalLink } from 'lucide-react';
import { SECTION_META } from '@/lib/response-styles';

type Section = {
  sectionType: string;
  title: string;
  content: string;
};

type Props = {
  streamContent: string;
  isStreaming: boolean;
  tenantSlug?: string;
};

function extractPartialContent(raw: string): { title?: string; content?: string } {
  const titleMatch = raw.match(/"title"\s*:\s*"((?:\\.|[^"\\])*)/);
  const contentMatch = raw.match(/"content"\s*:\s*"((?:\\.|[^"\\])*)/);
  return {
    title: titleMatch?.[1] || undefined,
    content: contentMatch?.[1] || undefined,
  };
}

function tryParseLastPart(raw: string): Section | null {
  const trimmed = raw.trim();

  try {
    const parsed = JSON.parse(trimmed);
    if (parsed.sectionType && parsed.title) return parsed;
   } catch {/* noop */}


  try {
    const fixed = trimmed.endsWith('"') ? trimmed + '}' : trimmed + '"}';
    const parsed = JSON.parse(fixed);
    if (parsed.sectionType && parsed.title) return parsed;
   } catch {/* noop */}


  return null;
}

export function processSlugLinks(markdown: string, tenantSlug?: string): string {
  if (!tenantSlug || !markdown) return markdown;
  return markdown.replace(
    /([^@]+)@([\w\/.-]+)@/g,
    (_, text, path) => {
      const href = path.includes('/')
        ? `/w/${tenantSlug}/item:${path}`
        : `/w/${tenantSlug}/${path}`;
      return `[${text.trim()}](${href})`;
    }
  );
}

function renderContent(content: string, tenantSlug?: string): string {
  try {
    const withLinks = processSlugLinks(content, tenantSlug);
    const rawHtml = micromark(withLinks, { allowDangerousHtml: false, extensions: [gfmTable()], htmlExtensions: [gfmTableHtml()] });
    return rawHtml;
  } catch {
    return `<p>${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`;
  }
}

export default function StreamingAccordion({ streamContent, isStreaming, tenantSlug }: Props) {
  const [expandedIndex, setExpandedIndex] = useState(0);
  const [sections, setSections] = useState<Section[]>([]);
  const [partialSection, setPartialSection] = useState<{ title?: string; content?: string } | null>(
    null
  );
  const prevContentRef = useRef('');
  const prevStreamingRef = useRef(false);

  useEffect(() => {
    if (
      streamContent === prevContentRef.current &&
      isStreaming === prevStreamingRef.current
    ) {
      return;
    }
    prevContentRef.current = streamContent;
    prevStreamingRef.current = isStreaming;

    const parts = streamContent.split('@@@SECTION@@@');
    const completeSections: Section[] = [];
    let partial: { title?: string; content?: string } | null = null;

    for (let i = 0; i < parts.length; i++) {
      const p = parts[i].trim();
      if (!p) continue;

      if (i === parts.length - 1 && isStreaming) {
        const extracted = extractPartialContent(p);
        if (extracted.content || extracted.title) {
          partial = extracted;
        }
        continue;
      }

      try {
        const parsed = JSON.parse(p);
        if (parsed.sectionType && parsed.title) {
          completeSections.push(parsed);
        }
      } catch {
        if (i === parts.length - 1 && isStreaming) {
          const extracted = extractPartialContent(p);
          if (extracted.content || extracted.title) {
            partial = extracted;
          }
        }
      }
    }

    if (!isStreaming && !partial && parts.length > 0) {
      const lastPart = parts[parts.length - 1].trim();
      if (lastPart) {
        const parsed = tryParseLastPart(lastPart);
        if (parsed) {
          const exists = completeSections.some(
            (s) => s.sectionType === parsed.sectionType && s.title === parsed.title
          );
          if (!exists) {
            completeSections.push(parsed);
          }
        }
      }
    }

    setSections(completeSections);
    setPartialSection(partial);
    if (completeSections.length > 0 && expandedIndex === -1) {
      setExpandedIndex(0);
    }
  }, [streamContent, isStreaming, expandedIndex]);

  if (sections.length === 0 && !partialSection) {
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
        const meta = SECTION_META[section.sectionType] ?? { icon: '📌', label: section.sectionType };

        return (
          <div
            key={idx}
            className="rounded-lg border overflow-hidden transition-all"
          >
            <button
              onClick={() => setExpandedIndex(isExpanded ? -1 : idx)}
              className="flex items-center gap-2 w-full px-4 py-3 text-left text-sm font-medium hover:bg-muted/50 transition-colors"
            >
              <span className="text-base">{meta.icon}</span>
              <span className="flex-1">{section.title}</span>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform ${
                  isExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>
            {isExpanded && (
              <div className="px-4 pb-3 text-sm leading-relaxed">
                <div
                  className="prose prose-invert prose-sm max-w-none prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-headings:text-foreground"
                  dangerouslySetInnerHTML={{
                    __html: renderContent(section.content, tenantSlug),
                  }}
                />
                {idx === sections.length - 1 && partialSection && isStreaming && (
                  <span className="inline-block animate-pulse text-primary ml-0.5">▍</span>
                )}
              </div>
            )}
          </div>
        );
      })}

      {sections.length > 0 && partialSection && expandedIndex !== sections.length - 1 && (
        <div className="rounded-lg border px-4 py-3 text-sm">
          {partialSection.title && (
            <p className="font-medium text-foreground mb-1">{partialSection.title}</p>
          )}
          {partialSection.content && (
            <p className="text-muted-foreground">{partialSection.content}</p>
          )}
          {isStreaming && (
            <span className="inline-block animate-pulse text-primary ml-0.5">▍</span>
          )}
        </div>
      )}
    </div>
  );
}
