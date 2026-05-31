'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';

const fieldLabels: Record<string, string> = {
  name: 'Nome',
  email: 'Email',
  message: 'Mensagem',
  subject: 'Assunto',
};

export function ContactFormBlock({ config }: { config: Record<string, unknown> }) {
  const title = (config.title as string) || '';
  const subtitle = (config.subtitle as string) || '';
  const fields = (config.fields as string[]) || ['name', 'email', 'message'];
  const submitText = (config.submitText as string) || 'Enviar';
  const successMessage = (config.successMessage as string) || 'Mensagem enviada com sucesso!';

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center space-y-3">
        <div className="mx-auto rounded-full bg-green-500/10 p-3 w-fit">
          <Send className="h-6 w-6 text-green-500" />
        </div>
        <p className="text-lg font-medium">{successMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {title && <h3 className="text-lg font-semibold">{title}</h3>}
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map((field) => {
          const label = fieldLabels[field] || field;
          const isTextarea = field === 'message';
          return (
            <div key={field} className="space-y-1.5">
              <label className="text-sm font-medium">{label}</label>
              {isTextarea ? (
                <textarea
                  className="flex min-h-[100px] w-full rounded-lg border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder={label}
                  value={formData[field] || ''}
                  onChange={(e) => handleChange(field, e.target.value)}
                  required
                />
              ) : (
                <input
                  className="flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder={label}
                  type={field === 'email' ? 'email' : 'text'}
                  value={formData[field] || ''}
                  onChange={(e) => handleChange(field, e.target.value)}
                  required
                />
              )}
            </div>
          );
        })}
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Send className="h-4 w-4" />
          {submitText}
        </button>
      </form>
    </div>
  );
}
