// Denúncias de Wiki — motivos fechados e limiares

export const WIKI_REPORT_REASONS = [
  { value: 'spam', label: 'Spam ou conteúdo enganoso' },
  { value: 'illegal', label: 'Conteúdo ilegal' },
  { value: 'hate', label: 'Discurso de ódio ou preconceito' },
  { value: 'harassment', label: 'Assédio ou bullying' },
  { value: 'nsfw', label: 'Conteúdo impróprio (NSFW)' },
  { value: 'copyright', label: 'Violação de direitos autorais' },
  { value: 'scam', label: 'Golpe ou fraude' },
  { value: 'other', label: 'Outro motivo' },
] as const;

export type WikiReportReason = (typeof WIKI_REPORT_REASONS)[number]['value'];

export const WIKI_REPORT_REASON_VALUES: string[] = WIKI_REPORT_REASONS.map((r) => r.value);

export function isWikiReportReason(value: string): value is WikiReportReason {
  return WIKI_REPORT_REASON_VALUES.includes(value);
}

// Limiar de restrição automática: denunciada por mais de 500 usuários diferentes
export const WIKI_REPORT_AUTO_RESTRICT_THRESHOLD = 500;

// Status da wiki
export type WikiStatus = 'active' | 'restricted_review';

export const WIKI_RESTRICTED_LABEL = 'Acesso restrito para análise de denúncias';
