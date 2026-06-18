export const MAIN_DOMAIN = 'pixelfandom.vercel.app';
export const MAIN_URL = `https://${MAIN_DOMAIN}`;

export const GENERIC_ERROR_MESSAGE = 'Desculpe não pude te responder, porém acredito que @suporte pode te ajudar';

export function isCustomDomain(host: string | null): boolean {
  if (!host) return false;
  return host !== MAIN_DOMAIN && host !== 'localhost' && host !== '127.0.0.1';
}
