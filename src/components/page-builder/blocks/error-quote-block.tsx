'use client';

import { useState, useEffect } from 'react';
import { Quote } from 'lucide-react';

export function ErrorQuoteBlock({ config }: { config: Record<string, unknown> }) {
  const quotes = (config.quotes as Array<{ text: string; author: string }>) || [];
  const showAuthor = config.showAuthor !== false;
  const rotation = (config.rotation as string) || 'random';

  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (quotes.length <= 1) return;
    if (rotation === 'sequential') {
      const id = setInterval(() => setIndex((i) => (i + 1) % quotes.length), 6000);
      return () => clearInterval(id);
    }
    const id = setInterval(() => setIndex(Math.floor(Math.random() * quotes.length)), 6000);
    return () => clearInterval(id);
  }, [quotes.length, rotation]);

  if (quotes.length === 0) {
    return null;
  }

  const quote = quotes[index] || quotes[0];
  if (!quote) return null;

  return (
    <div className="flex justify-center py-4">
      <div className="max-w-lg text-center space-y-3">
        <Quote className="h-8 w-8 mx-auto text-primary/40" />
        <blockquote className="text-lg italic text-foreground/90">
          &ldquo;{quote.text}&rdquo;
        </blockquote>
        {showAuthor && quote.author && (
          <p className="text-sm text-muted-foreground">&mdash; {quote.author}</p>
        )}
      </div>
    </div>
  );
}
