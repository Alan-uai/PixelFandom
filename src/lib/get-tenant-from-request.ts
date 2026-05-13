import { NextRequest } from 'next/server';

export type RequestTenant = {
  slug: string;
  id: string;
} | null;

export function getTenantFromRequest(request: NextRequest): RequestTenant {
  const slug =
    request.nextUrl.searchParams.get('__tenant_slug') ||
    request.cookies.get('x-tenant-slug')?.value ||
    null;

  const id =
    request.nextUrl.searchParams.get('__tenant_id') ||
    request.cookies.get('x-tenant-id')?.value ||
    null;

  if (!slug) return null;
  return { slug, id: id || slug };
}

export function getTenantSlugFromPath(pathname: string): string | null {
  if (!pathname.startsWith('/w/')) return null;
  return pathname.split('/')[2] || null;
}
