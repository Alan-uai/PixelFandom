'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';

export function SearchBlock({ config }: { config: Record<string, unknown> }) {
  const placeholder = (config.placeholder as string) || 'Pesquisar...';
  const variant = (config.variant as string) || 'default';
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Search query:', query);
  };

  if (variant === 'minimal') {
    return (
      <div className="flex justify-center">
        <button
          onClick={() => console.log('Search clicked')}
          className="rounded-full border bg-background p-2 hover:bg-muted transition-colors"
        >
          <Search className="h-5 w-5" />
        </button>
      </div>
    );
  }

  const widthClass = variant === 'full-width' ? 'w-full' : 'max-w-md mx-auto';

  return (
    <form onSubmit={handleSubmit} className={widthClass}>
      <div className="relative">
        <input
          className="flex h-10 w-full rounded-full border bg-background pl-10 pr-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          type="submit"
          className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <Search className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
