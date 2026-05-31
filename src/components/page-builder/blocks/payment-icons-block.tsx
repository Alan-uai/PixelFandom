'use client';

import { CreditCard } from 'lucide-react';

const paymentLabels: Record<string, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'Amex',
  elo: 'Elo',
  hipercard: 'Hipercard',
  paypal: 'PayPal',
  pix: 'Pix',
  boleto: 'Boleto',
};

const paymentColors: Record<string, string> = {
  visa: 'text-blue-600',
  mastercard: 'text-orange-500',
  amex: 'text-blue-400',
  elo: 'text-yellow-600',
  hipercard: 'text-red-600',
  paypal: 'text-blue-500',
  pix: 'text-green-500',
  boleto: 'text-gray-500',
};

export function PaymentIconsBlock({ config }: { config: Record<string, unknown> }) {
  const icons = (config.icons as string[]) || ['visa', 'mastercard'];
  const size = (config.size as string) || 'md';
  const variant = (config.variant as string) || 'grayscale';
  const align = (config.align as string) || 'center';

  const alignClass = align === 'left' ? 'justify-start' : align === 'right' ? 'justify-end' : 'justify-center';
  const sizeClass = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-lg' : 'text-sm';

  return (
    <div className={`flex flex-wrap gap-3 items-center ${alignClass}`}>
      {icons.map((icon) => (
        <span
          key={icon}
          className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 ${sizeClass} ${
            variant === 'color' ? paymentColors[icon] || 'text-muted-foreground' : 'text-muted-foreground'
          }`}
        >
          <CreditCard className="h-3.5 w-3.5" />
          {paymentLabels[icon] || icon}
        </span>
      ))}
    </div>
  );
}
