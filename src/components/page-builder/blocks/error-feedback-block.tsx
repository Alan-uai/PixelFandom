'use client';

import { useState } from 'react';
import { BugOff, Send, Check } from 'lucide-react';

export function ErrorFeedbackBlock({ config }: { config: Record<string, unknown> }) {
  const title = (config.title as string) || 'Reportar Problema';
  const subtitle = (config.subtitle as string) || '';
  const placeholder = (config.placeholder as string) || 'Descreva o que você estava procurando...';
  const submitText = (config.submitText as string) || 'Enviar';
  const successMessage = (config.successMessage as string) || 'Obrigado!';
  const showEmail = config.showEmail === true;
  const emailPlaceholder = (config.emailPlaceholder as string) || 'Seu email (opcional)';

  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="text-center space-y-3 py-8">
        <Check className="h-10 w-10 mx-auto text-green-400" />
        <p className="text-sm text-muted-foreground">{successMessage}</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <BugOff className="h-5 w-5 text-primary" />
        <div>
          <h3 className="font-semibold text-sm">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary"
        />
        {showEmail && (
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={emailPlaceholder}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary"
          />
        )}
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Send className="h-4 w-4" />
          {submitText}
        </button>
      </form>
    </div>
  );
}
