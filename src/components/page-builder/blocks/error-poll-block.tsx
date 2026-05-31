'use client';

import { useState } from 'react';
import { Vote, BarChart3 } from 'lucide-react';

export function ErrorPollBlock({ config }: { config: Record<string, unknown> }) {
  const question = (config.question as string) || 'O que você estava procurando?';
  const initialOptions = (config.options as Array<{ label: string; votes: number }>) || [];
  const showResults = config.showResults !== false;

  const [options, setOptions] = useState(initialOptions);
  const [voted, setVoted] = useState(false);
  const totalVotes = options.reduce((s, o) => s + o.votes, 0);

  const handleVote = (index: number) => {
    if (voted) return;
    setOptions((prev) => prev.map((o, i) => (i === index ? { ...o, votes: o.votes + 1 } : o)));
    setVoted(true);
  };

  if (options.length === 0) return null;

  return (
    <div className="rounded-xl border bg-card p-6 space-y-4 max-w-md mx-auto">
      <div className="flex items-center gap-2">
        <Vote className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-sm">{question}</h3>
      </div>
      <div className="space-y-2">
        {options.map((opt, i) => {
          const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
          return (
            <button
              key={i}
              disabled={voted}
              onClick={() => handleVote(i)}
              className="relative w-full rounded-lg border bg-background px-4 py-3 text-sm text-left overflow-hidden transition-colors hover:border-primary/50 disabled:cursor-default"
            >
              {showResults && voted && (
                <div
                  className="absolute inset-0 bg-primary/10 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              )}
              <span className="relative z-10 flex items-center justify-between">
                <span>{opt.label}</span>
                {showResults && voted && (
                  <span className="text-xs text-muted-foreground">{pct}%</span>
                )}
              </span>
            </button>
          );
        })}
      </div>
      {voted && (
        <div className="flex items-center gap-1 justify-center text-xs text-muted-foreground">
          <BarChart3 className="h-3 w-3" />
          {totalVotes} voto(s)
        </div>
      )}
    </div>
  );
}
