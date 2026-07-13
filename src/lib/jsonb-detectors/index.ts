import { registerDetectors, findBestDetector, getDetectors } from './registry';
import { statBlockDetector } from './detectors/stat-block';
import { rangeDetector } from './detectors/range';
import { definitionDetector } from './detectors/definition';
import { priceDetector } from './detectors/price';
import { probabilityDetector } from './detectors/probability';
import { iconBadgeDetector } from './detectors/icon-badge';
import { linkDetector } from './detectors/link';
import { colorSwatchDetector } from './detectors/color-swatch';
import { imageDetector } from './detectors/image';
import { dateEventDetector } from './detectors/date-event';
import { numericDetector } from './detectors/numeric';
import { percentageDetector } from './detectors/percentage';
import { gradeDetector } from './detectors/grade';
import { coordinatesDetector } from './detectors/coordinates';
import { materialsDetector } from './detectors/materials';
import { fractionDetector } from './detectors/fraction';

const ALL_DETECTORS = [
  statBlockDetector,
  rangeDetector,
  definitionDetector,
  priceDetector,
  probabilityDetector,
  iconBadgeDetector,
  linkDetector,
  colorSwatchDetector,
  imageDetector,
  dateEventDetector,
  numericDetector,
  percentageDetector,
  gradeDetector,
  coordinatesDetector,
  materialsDetector,
  fractionDetector,
];

let registered = false;

export function ensureDetectorsRegistered(): void {
  if (registered) return;
  registerDetectors(ALL_DETECTORS);
  registered = true;
}

export { findBestDetector, getDetectors };
export type { ShapeDetector, DetectionContext } from './types';
