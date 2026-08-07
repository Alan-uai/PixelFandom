'use client';

import { Icon, addCollection } from '@iconify/react';
import { type SVGProps, type CSSProperties, useEffect, useState } from 'react';

// Lazy-loaded offline Iconify bundle (generated from src/data/icons.ts).
// Once registered, Icon renders these icons fully offline — no runtime network
// round-trip to api.iconify.design, so icons always render even when that API is
// blocked by CSP, an ad-blocker, or restricted networks. Icons not present in the
// bundle still fall back to the regular on-demand Iconify API fetch.

let bundleLoaded = false;
let bundleLoading: Promise<void> | null = null;

function loadBundle(): Promise<void> {
  if (bundleLoaded) return Promise.resolve();
  if (!bundleLoading) {
    bundleLoading = import('@/data/iconify-icons')
      .then((mod) => {
        for (const collection of mod.ICONIFY_COLLECTIONS) {
          try {
            addCollection(collection as Parameters<typeof addCollection>[0]);
          } catch {
            // Ignore a single malformed collection; the rest still register.
          }
        }
        bundleLoaded = true;
      })
      .catch(() => {
        // Fall back to dynamic Iconify API loading if the bundle fails.
      });
  }
  return bundleLoading;
}

interface IconifyIconProps {
  icon: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  style?: CSSProperties;
}

export function IconifyIcon({ icon, className, width, height, style }: IconifyIconProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    loadBundle().then(() => {
      if (mounted) setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const dim = (width ?? height ?? 16) as number | string;

  if (!ready) {
    return <span aria-hidden style={{ display: 'inline-block', width: dim, height: dim, ...style }} className={className} />;
  }

  return <Icon icon={icon} width={width} height={height} style={style} className={className as SVGProps<SVGSVGElement>['className']} />;
}