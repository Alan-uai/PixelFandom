'use client';

import { useCallback, useEffect, useState } from 'react';

export function useTenant() {
  const [slug, setSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const readCookie = () => {
      const match = document.cookie.match(/(?:^|;\s*)x-tenant-slug=([^;]*)/);
      setSlug(match ? decodeURIComponent(match[1]) : null);
      setLoading(false);
    };
    readCookie();
  }, []);

  return { slug, loading };
}

export function useTenantHeader(): Record<string, string> {
  const { slug } = useTenant();
  return slug ? { 'x-tenant-slug': slug } : {};
}
