'use client';

import { useState } from 'react';
import { Search, SearchX } from 'lucide-react';

export function ErrorSearchBlock({ config }: { config: Record<string, unknown> }) {
  const placeholder = (config.placeholder as string) || 'Buscar na wiki...';
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearched(true);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="relative max-w-md mx-auto">
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSearched(false); }}
          placeholder={placeholder}
          className="flex h-12 w-full rounded-xl border-2 bg-background/80 pl-12 pr-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary transition-colors"
        />
        <button
          type="submit"
          className="absolute left-0 top-0 flex h-12 w-12 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <Search className="h-5 w-5" />
        </button>
      </form>
      {searched && (
        <div className="text-center space-y-2">
          <SearchX className="h-8 w-8 mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nenhum resultado encontrado para &ldquo;{query}&rdquo;</p>
        </div>
      )}
    </div>
  );
}
