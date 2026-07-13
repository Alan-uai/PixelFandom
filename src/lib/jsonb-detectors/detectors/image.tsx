import type { ReactNode } from 'react';
import Image from 'next/image';
import type { ShapeDetector, DetectionContext } from '../types';

export const imageDetector: ShapeDetector = {
  id: 'image',
  label: 'Image',
  detect({ value }: DetectionContext): number {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return 0;
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);
    if (keys.length < 1 || keys.length > 4) return 0;

    const srcKeys = ['src', 'url', 'image', 'image_url', 'img', 'icon', 'icon_url', 'thumbnail'];
    const hasSrc = srcKeys.some(k => k in obj && typeof obj[k] === 'string');
    if (!hasSrc) return 0;

    const src = String(obj.src ?? obj.url ?? obj.image ?? obj.image_url ?? obj.img ?? obj.icon ?? obj.icon_url ?? obj.thumbnail ?? '');
    const isValid = src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:');
    if (!isValid) return 0;

    return 0.85;
  },
  render({ value }: DetectionContext, variant = 1): ReactNode {
    const obj = value as Record<string, unknown>;
    const src = String(obj.src ?? obj.url ?? obj.image ?? obj.image_url ?? obj.img ?? obj.icon ?? obj.icon_url ?? obj.thumbnail ?? '');
    const alt = String(obj.alt ?? obj.label ?? obj.title ?? obj.name ?? 'image');

    if (variant === 2) {
      return (
        <div className="relative w-14 h-14 rounded-full overflow-hidden border shrink-0">
          <Image src={src} alt={alt} fill className="object-cover" />
        </div>
      );
    }
    if (variant === 3) {
      return (
        <div className="relative w-20 h-20 rounded-lg overflow-hidden border shadow-lg">
          <Image src={src} alt={alt} fill className="object-cover" />
        </div>
      );
    }
    if (variant === 4) {
      return (
        <div className="relative w-20 h-20 rounded overflow-hidden border bg-white p-1 shadow-md">
          <div className="relative w-full h-full">
            <Image src={src} alt={alt} fill className="object-cover" />
          </div>
        </div>
      );
    }
    if (variant === 5) {
      return (
        <div className="relative w-full h-32 rounded-lg overflow-hidden border">
          <Image src={src} alt={alt} fill className="object-cover" />
        </div>
      );
    }
    return (
      <div className="relative w-20 h-20 rounded-lg overflow-hidden border">
        <Image src={src} alt={alt} fill className="object-cover" />
      </div>
    );
  },
};
