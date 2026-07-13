import type { ReactNode } from 'react';
import { MapPin } from 'lucide-react';
import type { ShapeDetector, DetectionContext } from '../types';

export const coordinatesDetector: ShapeDetector = {
  id: 'coordinates',
  label: 'Coordinates',
  detect({ value }: DetectionContext): number {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return 0;
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);
    if (keys.length < 1 || keys.length > 5) return 0;

    const xyKeys = ['x', 'y', 'z'];
    const latLonKeys = ['lat', 'lon', 'long', 'latitude', 'longitude'];
    const hasXY = xyKeys.some(k => k in obj) && ('x' in obj || 'y' in obj);
    const hasLatLon = latLonKeys.some(k => k in obj);

    if (hasLatLon && ('lat' in obj || 'latitude' in obj) && ('lon' in obj || 'long' in obj || 'longitude' in obj)) return 0.95;
    if (hasXY && keys.length <= 3) return 0.85;
    if (hasXY) return 0.7;
    return 0;
  },
  render({ value }: DetectionContext, variant = 1): ReactNode {
    const obj = value as Record<string, unknown>;
    const isLatLon = 'lat' in obj || 'latitude' in obj;
    let display = '';

    if (isLatLon) {
      const lat = obj.lat ?? obj.latitude;
      const lon = obj.lon ?? obj.long ?? obj.longitude;
      display = `${lat}, ${lon}`;
    } else {
      const parts: string[] = [];
      if ('x' in obj) parts.push(`x:${obj.x}`);
      if ('y' in obj) parts.push(`y:${obj.y}`);
      if ('z' in obj) parts.push(`z:${obj.z}`);
      display = parts.join(' ');
    }

    const label = String(obj.label ?? obj.name ?? '');

    if (variant === 2) {
      return (
        <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span>{display}</span>
          {label && <span className="text-foreground font-medium">({label})</span>}
        </div>
      );
    }
    if (variant === 3) {
      return (
        <div className="inline-flex items-center gap-2 rounded-lg border bg-card p-2 text-xs">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="font-mono font-medium text-foreground">{display}</span>
        </div>
      );
    }
    if (variant === 4) {
      return (
        <div className="flex items-start gap-2 rounded-lg border bg-card p-2.5 text-xs">
          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <MapPin className="h-3 w-3 text-primary" />
          </div>
          <div className="flex flex-col">
            {label && <span className="font-medium text-foreground">{label}</span>}
            <span className="font-mono text-muted-foreground">{display}</span>
          </div>
        </div>
      );
    }
    if (variant === 5) {
      return (
        <div className="rounded-xl border bg-card p-3 text-xs">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">{label || 'Coordenadas'}</span>
          </div>
          <span className="font-mono text-muted-foreground">{display}</span>
        </div>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground">
        <MapPin className="h-3 w-3" />{display}
      </span>
    );
  },
};
