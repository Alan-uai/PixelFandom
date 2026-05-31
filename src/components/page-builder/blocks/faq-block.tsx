'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export function FaqBlock({ config }: { config: Record<string, unknown> }) {
  const title = (config.title as string) || '';
  const items = (config.items as Array<{ question: string; answer: string }>) || [];
  const layout = (config.layout as 'accordion' | 'list') || 'accordion';
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  return (
    <div className="space-y-4">
      {title && <h2 className="text-2xl font-bold">{title}</h2>}
      {items.length > 0 ? (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div
              key={i}
              className="rounded-lg border bg-card overflow-hidden"
            >
              {layout === 'accordion' ? (
                <>
                  <button
                    onClick={() => toggle(i)}
                    className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium hover:bg-accent transition-colors"
                  >
                    <span>{item.question}</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                        openIndex === i ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {openIndex === i && (
                    <div className="px-4 pb-3 text-sm text-muted-foreground border-t pt-3">
                      {item.answer}
                    </div>
                  )}
                </>
              ) : (
                <div className="px-4 py-3">
                  <p className="text-sm font-medium">{item.question}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center">
          Adicione perguntas frequentes nas configurações
        </p>
      )}
    </div>
  );
}
