'use client';

import { useState } from 'react';
import { Mail, Check } from 'lucide-react';

export function NewsletterBlock({ config }: { config: Record<string, unknown> }) {
  const title = (config.title as string) || 'Newsletter';
  const subtitle = (config.subtitle as string) || '';
  const placeholder = (config.placeholder as string) || 'seu@email.com';
  const buttonText = (config.buttonText as string) || 'Assinar';
  const successMessage = (config.successMessage as string) || 'Inscrito com sucesso!';
  const variant = (config.variant as string) || 'default';
  const align = (config.align as string) || 'center';

  const [subscribed, setSubscribed] = useState(false);

  const alignClass = align === 'left' ? 'text-left' : align === 'right' ? 'text-right' : 'text-center';
  const inputBorder = variant === 'outline' ? 'border-primary' : variant === 'ghost' ? 'border-transparent bg-muted' : 'border-border';

  if (subscribed) {
    return (
      <div className={`${alignClass} space-y-2`}>
        <div className="inline-flex items-center gap-2 text-sm text-green-500">
          <Check className="h-4 w-4" />
          {successMessage}
        </div>
      </div>
    );
  }

  return (
    <div className={`${alignClass} space-y-3`}>
      {title && <h3 className="text-base font-semibold">{title}</h3>}
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      <div className="flex gap-2 max-w-sm mx-auto">
        <div className="relative flex-1">
          <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="email"
            placeholder={placeholder}
            className={`w-full rounded-lg border bg-background pl-8 pr-3 py-2 text-sm outline-none focus:border-primary ${inputBorder}`}
          />
        </div>
        <button
          onClick={() => setSubscribed(true)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}
