import type { ReactNode } from 'react';

export interface DetectionContext {
  value: unknown;
  columnName?: string;
}

export interface ShapeDetector {
  id: string;
  label: string;
  detect(ctx: DetectionContext): number;
  render(ctx: DetectionContext, variant?: number): ReactNode;
}
