const KNOWN_DOMAINS = [
  'fandom.com',
  'wikidot.com',
  'notion.so',
  'notion.site',
  'gamepedia.com',
  'wikia.com',
];

export function isExternalLink(href: string): boolean {
  try {
    const url = new URL(href);
    return KNOWN_DOMAINS.some((d) => url.hostname.endsWith(d));
  } catch {
    return false;
  }
}

export function rewriteLinks(
  html: string,
  slugMap: Map<string, string>,
  tenantSlug: string
): string {
  return html.replace(
    /<a\s+([^>]*?)href=["']([^"']+)["']([^>]*?)>/gi,
    (_match, before: string, href: string, after: string) => {
      const resolved = resolveLink(href, slugMap, tenantSlug);
      return `<a ${before}href="${resolved}"${after}>`;
    }
  );
}

export function resolveLink(
  href: string,
  slugMap: Map<string, string>,
  tenantSlug: string
): string {
  const trimmed = href.trim();

  if (!trimmed || trimmed.startsWith('http') || trimmed.startsWith('//')) {
    if (isExternalLink(trimmed)) {
      const pathPart = extractPathFromUrl(trimmed);
      if (pathPart) {
        const mappedSlug = slugMap.get(pathPart.toLowerCase());
        if (mappedSlug) {
          return `/w/${tenantSlug}/${mappedSlug}`;
        }
      }
    }
    return trimmed;
  }

  if (trimmed.startsWith('/w/')) return trimmed;

  const slug = trimmed.replace(/\.(md|html?)$/, '').replace(/\s+/g, '-').toLowerCase();
  const mapped = slugMap.get(slug) || slug;
  return `/w/${tenantSlug}/${mapped}`;
}

function extractPathFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/\/wiki\//, '').replace(/^\//, '').replace(/\.(md|html?)$/, '');
    return path || null;
  } catch {
    return null;
  }
}
