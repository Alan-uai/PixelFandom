'use client';

import { useState, useEffect, useCallback } from 'react';
import { Gamepad2, Zap, RefreshCw } from 'lucide-react';

function ClickerGame({ redirectUrl, redirectSeconds }: { redirectUrl?: string; redirectSeconds?: number }) {
  const [clicks, setClicks] = useState(0);
  const target = 100;

  if (clicks >= target) {
    return (
      <div className="text-center space-y-3 py-4">
        <Zap className="h-8 w-8 mx-auto text-yellow-400" />
        <p className="font-semibold text-lg">Você venceu!</p>
        {redirectUrl && (
          <a href={redirectUrl} className="text-primary text-sm underline underline-offset-4">
            Clique aqui para continuar
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="text-center space-y-3 py-4">
      <p className="text-sm text-muted-foreground">Clique {target - clicks} vezes para liberar o acesso!</p>
      <button
        onClick={() => setClicks((c) => c + 1)}
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-lg font-bold text-primary-foreground hover:scale-105 transition-all"
      >
        <Zap className="h-6 w-6" />
        {clicks} / {target}
      </button>
    </div>
  );
}

function TriviaGame({ question, options, answer }: { question?: string; options?: string[]; answer?: string }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [shuffled, setShuffled] = useState<string[]>([]);

  useEffect(() => {
    if (options) {
      setShuffled([...options].sort(() => Math.random() - 0.5));
    }
  }, [options]);

  if (!question || !options || !answer) {
    return <p className="text-sm text-muted-foreground text-center py-4">Pergunta não configurada</p>;
  }

  return (
    <div className="space-y-3 py-4 max-w-md mx-auto">
      <p className="font-medium text-center">{question}</p>
      <div className="space-y-2">
        {shuffled.map((opt) => {
          const isCorrect = opt === answer;
          const isSelected = selected === opt;
          let cls = 'border bg-card hover:border-primary/50';
          if (isSelected && isCorrect) cls = 'border-green-500 bg-green-500/10';
          else if (isSelected) cls = 'border-red-500 bg-red-500/10';
          return (
            <button
              key={opt}
              disabled={!!selected}
              onClick={() => setSelected(opt)}
              className={`w-full rounded-lg border px-4 py-2.5 text-sm text-left transition-colors ${cls}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {selected && selected !== answer && (
        <p className="text-sm text-red-400 text-center">Resposta errada! Tente novamente.</p>
      )}
    </div>
  );
}

export function ErrorFunBlock({ config }: { config: Record<string, unknown> }) {
  const gameType = (config.gameType as string) || 'clicker';
  const redirectUrl = config.redirectUrl as string | undefined;
  const redirectSeconds = config.redirectSeconds as number | undefined;
  const question = config.triviaQuestion as string | undefined;
  const options = config.triviaOptions as string[] | undefined;
  const answer = config.triviaAnswer as string | undefined;

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Gamepad2 className="h-5 w-5 text-primary" />
        <span className="font-semibold text-sm">Mini Game</span>
      </div>
      {gameType === 'trivia' ? (
        <TriviaGame question={question} options={options} answer={answer} />
      ) : (
        <ClickerGame redirectUrl={redirectUrl} redirectSeconds={redirectSeconds} />
      )}
    </div>
  );
}
