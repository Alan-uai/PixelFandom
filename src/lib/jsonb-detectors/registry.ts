import type { ShapeDetector } from './types';

let detectors: ShapeDetector[] = [];

export function registerDetector(d: ShapeDetector): void {
  detectors.push(d);
}

export function registerDetectors(ds: ShapeDetector[]): void {
  detectors.push(...ds);
}

export function getDetectors(): ShapeDetector[] {
  return detectors;
}

export function findBestDetector(value: unknown, columnName?: string): ShapeDetector | null {
  let best: ShapeDetector | null = null;
  let bestScore = 0;
  for (const d of detectors) {
    const score = d.detect({ value, columnName });
    if (score > 0.5 && score > bestScore) {
      bestScore = score;
      best = d;
    }
  }
  return best;
}

export function clearDetectors(): void {
  detectors = [];
}
