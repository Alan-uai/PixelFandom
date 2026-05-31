'use client';

import { Check } from 'lucide-react';

export function PricingTableBlock({ config }: { config: Record<string, unknown> }) {
  const title = (config.title as string) || '';
  const plans = (config.plans as Array<{
    name: string;
    price: string;
    currency?: string;
    period?: string;
    description?: string;
    features?: string[];
    ctaText?: string;
    ctaUrl?: string;
    highlighted?: boolean;
    highlightColor?: string;
  }>) || [];
  const columns = (config.columns as 2 | 3 | 4) || 3;

  const gridCols = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-3',
    4: 'sm:grid-cols-4',
  };

  return (
    <div className="space-y-6">
      {title && <h2 className="text-2xl font-bold text-center">{title}</h2>}
      {plans.length > 0 ? (
        <div className={`grid grid-cols-1 ${gridCols[columns]} gap-4`}>
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`relative flex flex-col rounded-lg border bg-card p-6 transition-transform ${
                plan.highlighted ? 'scale-105 border-primary shadow-lg' : ''
              }`}
              style={
                plan.highlighted && plan.highlightColor
                  ? { borderColor: plan.highlightColor }
                  : undefined
              }
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                  Popular
                </span>
              )}
              <div className="mb-4">
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                {plan.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                )}
              </div>
              <div className="mb-4">
                <span className="text-3xl font-bold">
                  {plan.currency || ''}{plan.price}
                </span>
                {plan.period && (
                  <span className="text-sm text-muted-foreground ml-1">/{plan.period}</span>
                )}
              </div>
              {plan.features && plan.features.length > 0 && (
                <ul className="mb-6 flex-1 space-y-2">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              )}
              {plan.ctaText && (
                <a
                  href={plan.ctaUrl || '#'}
                  className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    plan.highlighted
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'border bg-background hover:bg-accent'
                  }`}
                >
                  {plan.ctaText}
                </a>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center">
          Adicione planos nas configurações
        </p>
      )}
    </div>
  );
}
