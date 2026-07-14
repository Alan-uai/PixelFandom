import type { ReactNode } from 'react';
import { formatNumber } from '@/lib/format-number';
import type { ShapeDetector, DetectionContext } from '../types';

export const priceDetector: ShapeDetector = {
  id: 'price',
  label: 'Price',
  detect({ value }: DetectionContext): number {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return 0;
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);
    if (keys.length < 1 || keys.length > 5) return 0;

    const hasPrice = 'price' in obj || 'cost' in obj || 'amount' in obj || 'value' in obj || 'fee' in obj || 'total' in obj;
    if (!hasPrice) return 0;

    const priceVal = Number(obj.price ?? obj.cost ?? obj.amount ?? obj.value ?? obj.fee ?? obj.total);
    if (isNaN(priceVal)) return 0;

    const hasCurrency = 'currency' in obj || 'unit' in obj || 'symbol' in obj;
    if (hasCurrency) return 0.9;
    if (keys.length <= 2 && hasPrice) return 0.8;
    return hasPrice ? 0.7 : 0;
  },
  render({ value, useSuffix }: DetectionContext, variant = 1): ReactNode {
    const obj = value as Record<string, unknown>;
    const price = Number(obj.price ?? obj.cost ?? obj.amount ?? obj.value ?? obj.fee ?? obj.total);
    const currency = String(obj.currency ?? obj.unit ?? obj.symbol ?? '');
    const discount = obj.discount ? Number(obj.discount) : undefined;
    const discountedPrice = discount ? price - (price * discount) / 100 : undefined;

    const displayPrice = currency ? `${formatNumber(price, !!useSuffix)} ${currency}` : formatNumber(price, !!useSuffix);

    if (variant === 2) {
      return (
        <div className="flex items-center gap-2 rounded-lg border bg-card p-2 text-xs">
          <span className="font-bold text-foreground">{displayPrice}</span>
          {discount != null && (
            <span className="text-[10px] text-primary bg-primary/10 rounded-full px-1.5">-{discount}%</span>
          )}
        </div>
      );
    }
    if (variant === 3) {
      return (
        <div className="inline-flex items-center gap-1.5 rounded-full border bg-primary/5 px-3 py-1 text-xs font-medium">
          <span className="text-muted-foreground">💰</span>
          {discount != null && discountedPrice != null ? (
            <>
              <span className="line-through text-muted-foreground">{displayPrice}</span>
              <span className="font-bold text-primary">{formatNumber(discountedPrice, !!useSuffix)} {currency}</span>
            </>
          ) : (
            <span className="font-bold text-foreground">{displayPrice}</span>
          )}
        </div>
      );
    }
    if (variant === 4) {
      return (
        <div className="flex items-center justify-between rounded-lg border bg-card p-2.5 text-xs">
          <span className="text-muted-foreground">Preço</span>
          <div className="flex items-center gap-2">
            {discount != null && (
              <span className="text-[10px] line-through text-muted-foreground">{displayPrice}</span>
            )}
            <span className={`font-bold ${discount ? 'text-primary' : 'text-foreground'}`}>
              {discount && discountedPrice != null ? `${formatNumber(discountedPrice, !!useSuffix)} ${currency}` : displayPrice}
            </span>
          </div>
        </div>
      );
    }
    if (variant === 5) {
      return (
        <div className="flex items-center gap-2 rounded-xl border-2 border-primary/20 bg-card p-3 text-sm">
          <span className="text-2xl">{currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '🪙'}</span>
          <div>
            <span className="text-lg font-bold text-foreground">{formatNumber(price, !!useSuffix)}</span>
            {currency && <span className="text-xs text-muted-foreground ml-1">{currency}</span>}
            {discount != null && (
              <span className="text-[10px] text-primary ml-2">-{discount}% OFF</span>
            )}
          </div>
        </div>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
        {displayPrice}
      </span>
    );
  },
};
