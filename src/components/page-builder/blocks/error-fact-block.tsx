'use client';

import { useState, useEffect } from 'react';
import { Lightbulb } from 'lucide-react';

export function ErrorFactBlock({ config }: { config: Record<string, unknown> }) {
  const facts = (config.facts as Array<{ text: string; source: string }>) || [];
  const showSource = config.showSource !== false;
  const rotation = (config.rotation as string) || 'random';

  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (facts.length <= 1) return;
    const id = setInterval(() => {
      if (rotation === 'sequential') setIndex((i) => (i + 1) % facts.length);
      else setIndex(Math.floor(Math.random() * facts.length));
    }, 7000);
    return () => clearInterval(id);
  }, [facts.length, rotation]);

  if (facts.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground py-4">
        Nenhum fato configurado
      </div>
    );
  }

  const fact = facts[index] || facts[0];
  if (!fact) return null;

  return (
    <div className="rounded-xl border bg-card p-6 max-w-md mx-auto">
      <div className="flex items-start gap-3">
        <Lightbulb className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm italic text-foreground/90">{fact.text}</p>
          {showSource && fact.source && (
            <p className="text-xs text-muted-foreground">&mdash; {fact.source}</p>
          )}
        </div>
      </div>
    </div>
  );
}
