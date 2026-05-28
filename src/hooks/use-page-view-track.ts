'use client';

import { useEffect, useRef } from 'react';

export function usePageViewTrack(tenantSlug?: string, articleId?: string, pagePath?: string, pageTitle?: string) {
  const tracked = useRef(false);

  useEffect(() => {
    if (!tenantSlug || tracked.current) return;
    tracked.current = true;

    const timeout = setTimeout(() => {
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'pageview',
          tenantSlug,
          articleId: articleId || null,
          pagePath: pagePath || window.location.pathname,
          pageTitle: pageTitle || document.title,
        }),
      }).catch(() => {});
    }, 1000);

    return () => clearTimeout(timeout);
  }, [tenantSlug, articleId, pagePath, pageTitle]);
}
