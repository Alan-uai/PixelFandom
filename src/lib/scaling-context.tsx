'use client';

import { createContext, useContext } from 'react';
import { calculateScaledValue } from './scaling-engine';
import type { ScalingFormula } from './scaling-engine';

export interface ScalingInfo {
  enabled: boolean;
  copies: number;
  maxCopies: number;
  formula: ScalingFormula;
}

const ScalingContext = createContext<ScalingInfo>({
  enabled: false,
  copies: 0,
  maxCopies: 10000,
  formula: 'linear',
});

export function useScalingContext() {
  return useContext(ScalingContext);
}

export { ScalingContext };

export function ScaledValue({ base, max }: { base: number; max: number }) {
  const ctx = useScalingContext();

  if (!ctx.enabled) {
    return (
      <span className="font-mono text-sm font-medium text-foreground">
        {base} → {max}
      </span>
    );
  }

  const current = calculateScaledValue(base, max, ctx.copies, ctx.maxCopies, ctx.formula);
  const pct = max > 0 ? (current / max) * 100 : 0;

  return (
    <span className="flex flex-col gap-0.5 w-full">
      <span className="flex items-center gap-1.5">
        <span className="font-mono text-sm font-bold text-foreground">
          {Math.round(current)}
        </span>
        <span className="text-xs text-muted-foreground">/ {max}</span>
      </span>
      <span className="h-1 w-full rounded-full bg-muted overflow-hidden">
        <span
          className="block h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </span>
    </span>
  );
}
