'use client';

import Link from 'next/link';
import { ArrowLeft, Bug, Loader2 } from 'lucide-react';
import { useState } from 'react';

const PSYCHO_URL =
  process.env.NEXT_PUBLIC_PSYCHO_URL ||
  (typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:8000'
    : '/psycho/');

export default function PsychoPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <div className="relative w-full h-dvh flex flex-col bg-background">
      <header className="flex items-center gap-2 px-4 py-2 border-b shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
        <Link
          href="/"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <span className="text-sm font-medium mx-auto">Psycho</span>
        <a
          href={PSYCHO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Bug className="h-3.5 w-3.5" />
        </a>
      </header>

      {error && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-background/80 backdrop-blur-sm">
          <div className="text-center max-w-sm mx-auto p-8">
            <p className="text-destructive font-medium mb-2">
              Não foi possível carregar o Psycho.
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Certifique-se de que o servidor Python está rodando na porta 8000
              (<code className="text-xs bg-muted px-1 py-0.5 rounded">npm run dev:psycho</code>).
            </p>
            <Link href="/" className="text-sm text-primary hover:underline">
              Voltar para o início
            </Link>
          </div>
        </div>
      )}

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-background">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      <iframe
        src={PSYCHO_URL}
        className="w-full flex-1 border-0"
        onLoad={() => setLoading(false)}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
        allow="microphone; camera; autoplay"
      />
    </div>
  );
}
