'use client';

import { useMemo } from 'react';
import { MAIN_DOMAIN } from '@/lib/constants';

export function useWikiPath(tenantSlug: string) {
  const isSubdomain = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const host = window.location.hostname;
    return host !== MAIN_DOMAIN && host !== 'localhost' && host !== '127.0.0.1';
  }, []);

  const basePath = isSubdomain ? '' : `/w/${tenantSlug}`;

  return {
    basePath,
    homePath: isSubdomain ? '/' : `/w/${tenantSlug}`,
    articlePath: (articleSlug: string) =>
      isSubdomain ? `/${articleSlug}` : `/w/${tenantSlug}/${articleSlug}`,
    isSubdomain,
  };
}
