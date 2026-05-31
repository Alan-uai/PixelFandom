'use client';

import { useState } from 'react';
import { Globe, ChevronDown } from 'lucide-react';

export function LanguageSwitcherBlock({ config }: { config: Record<string, unknown> }) {
  const languages = (config.languages as Array<{ code: string; label: string }>) || [];
  const defaultLanguage = (config.defaultLanguage as string) || '';
  const variant = (config.variant as string) || 'dropdown';
  const showLabel = config.showLabel as boolean | undefined;

  const [open, setOpen] = useState(false);
  const active = languages.find((l) => l.code === defaultLanguage) || languages[0];

  if (languages.length === 0) {
    return <span className="text-sm text-muted-foreground">Configure os idiomas</span>;
  }

  if (variant === 'flags') {
    return (
      <div className="flex justify-center gap-2">
        {languages.map((lang) => (
          <button
            key={lang.code}
            className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
              lang.code === defaultLanguage
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {showLabel ? lang.label : lang.code.toUpperCase()}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="relative flex justify-center">
      <button
        onClick={() => setOpen(!open)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
      >
        <Globe className="h-3.5 w-3.5" />
        {showLabel ? active?.label : active?.code.toUpperCase()}
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute bottom-full mb-1 z-50 min-w-[120px] rounded-md border bg-popover p-1 shadow-lg">
          {languages.map((lang) => (
            <button
              key={lang.code}
              className={`w-full rounded-sm px-2 py-1 text-left text-xs transition-colors ${
                lang.code === defaultLanguage
                  ? 'bg-primary/10 text-primary'
                  : 'text-popover-foreground hover:bg-muted'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
