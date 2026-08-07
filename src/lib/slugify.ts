type SlugifyOptions = {
  separator?: string;
  keepCJK?: boolean;
};

const CHAR_MAP: Record<string, string> = {
  æ: 'ae',
  Æ: 'ae',
  œ: 'oe',
  Œ: 'oe',
  ß: 'ss',
  Ø: 'o',
  ø: 'o',
  đ: 'd',
  Đ: 'd',
  ł: 'l',
  Ł: 'l',
  þ: 'th',
  Þ: 'th',
  ð: 'd',
  Ð: 'd',
};

const CJK_IDEOGRAPHS = '\u4e00-\u9fff';

export function slugify(input: string, options: SlugifyOptions = {}): string {
  const separator = options.separator ?? '-';
  const keepCJK = options.keepCJK ?? false;
  const escapedSeparator = separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  return String(input ?? '')
    .replace(/[æÆœŒßØøđĐłŁþÞðÐ]/g, (ch) => CHAR_MAP[ch] ?? ch)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(new RegExp(`[^a-z0-9${keepCJK ? CJK_IDEOGRAPHS : ''}\\s_-]`, 'g'), '')
    .replace(/[\s_-]+/g, separator)
    .replace(new RegExp(`^${escapedSeparator}+|${escapedSeparator}+$`, 'g'), '');
}
