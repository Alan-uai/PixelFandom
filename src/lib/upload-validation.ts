import { createHash } from 'crypto';

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  detectedMime?: string;
  fileHash?: string;
  sanitizedFilename?: string;
}

const MAGIC_BYTES: Record<string, string[]> = {
  'image/jpeg': ['ffd8ffe0', 'ffd8ffe1', 'ffd8ffe2', 'ffd8ffe3', 'ffd8ffe8'],
  'image/png': ['89504e47'],
  'image/gif': ['47494638'],
  'image/webp': ['52494646'],
  'image/avif': ['0000001c66747970', '0000002066747970'],
  'image/svg+xml': ['3c737667', '3c3f786d6c'],
  'video/mp4': ['0000001866747970', '0000002066747970'],
  'video/webm': ['1a45dfa3'],
  'video/ogg': ['4f676753'],
  'audio/mpeg': ['494433', 'fff3', 'fff2'],
  'audio/ogg': ['4f676753'],
  'audio/wav': ['52494646'],
  'audio/mp4': ['0000001866747970'],
  'application/pdf': ['25504446'],
  'application/zip': ['504b0304'],
};

const MAX_FILE_SIZES: Record<string, number> = {
  image: 25 * 1024 * 1024,
  video: 100 * 1024 * 1024,
  audio: 50 * 1024 * 1024,
  file: 25 * 1024 * 1024,
};

const PATH_TRAVERSAL = /\.\.(\/|\\)/;
// eslint-disable-next-line no-control-regex
const INVALID_FILENAME_CHARS = /[<>:"/\\|?*\x00-\x1f]/g;

function detectMimeType(buffer: Buffer): string | null {
  const hex = buffer.toString('hex').toLowerCase();
  for (const [mime, sigs] of Object.entries(MAGIC_BYTES)) {
    for (const sig of sigs) {
      if (hex.startsWith(sig)) return mime;
    }
  }
  return null;
}

export function sanitizeFilename(name: string): string {
  let clean = name.replace(INVALID_FILENAME_CHARS, '_');
  clean = clean.replace(/\s+/g, '_');
  clean = clean.replace(/_{2,}/g, '_');
  clean = clean.replace(/^[_.]+|[_.]+$/g, '');
  if (!clean || clean === '.') clean = 'unnamed';
  return clean;
}

export function sanitizePathPrefix(prefix: string): string {
  return prefix
    .split('/')
    .map((segment) => sanitizeFilename(segment))
    .filter(Boolean)
    .join('/');
}

export function getMediaCategory(mime: string): 'image' | 'video' | 'audio' | 'file' {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  return 'file';
}

export function getMaxFileSize(mime: string): number {
  return MAX_FILE_SIZES[getMediaCategory(mime)] || MAX_FILE_SIZES.file;
}

export function validateFile(
  buffer: Buffer,
  filename: string,
  _declaredType: string,
): FileValidationResult {
  const sanitizedFilename = sanitizeFilename(filename);

  if (PATH_TRAVERSAL.test(filename)) {
    return { valid: false, error: 'Invalid filename: path traversal detected', sanitizedFilename };
  }

  if (sanitizedFilename.length > 255) {
    return { valid: false, error: 'Filename too long (max 255 chars)', sanitizedFilename };
  }

  const detectedMime = detectMimeType(buffer);
  if (!detectedMime) {
    return { valid: false, error: 'Unknown file type: could not detect magic bytes', sanitizedFilename };
  }

  const category = getMediaCategory(detectedMime);
  const maxSize = getMaxFileSize(detectedMime);

  if (buffer.length > maxSize) {
    return { valid: false, error: `File too large for ${category} (max ${Math.round(maxSize / 1024 / 1024)}MB)`, sanitizedFilename, detectedMime };
  }

  if (detectedMime === 'image/svg+xml') {
    const content = buffer.toString('utf8');
    const lower = content.toLowerCase();
    
    const disallowedPatterns = [
      '<script', '<!doctype', '<!entity', '<?xml-stylesheet',
      '<foreignobject',
      'onload=', 'onerror=', 'onclick=', 'onmouseover=', 'onfocus=',
      'onblur=', 'onsubmit=', 'onreset=', 'onchange=', 'oninput=',
      'onpointerdown=', 'onpointerup=', 'onpointermove=',
      'ontouchstart=', 'ontouchend=', 'ontouchmove=',
      'xlink:href=', 'xlink="http',
    ];
    
    for (const pattern of disallowedPatterns) {
      if (lower.includes(pattern)) {
        return { valid: false, error: 'SVG contains disallowed elements', sanitizedFilename, detectedMime };
      }
    }
    
    const useHrefMatch = lower.match(/<use[^>]+href\s*=\s*["'](https?:|data:)/i);
    if (useHrefMatch) {
      return { valid: false, error: 'SVG contains external resources', sanitizedFilename, detectedMime };
    }
  }

  const fileHash = createHash('sha256').update(buffer).digest('hex');

  return {
    valid: true,
    detectedMime,
    fileHash,
    sanitizedFilename,
  };
}

const EXTENSION_MAP: Record<string, string[]> = {
  jpeg: ['image/jpeg'],
  jpg: ['image/jpeg'],
  png: ['image/png'],
  gif: ['image/gif'],
  webp: ['image/webp'],
  avif: ['image/avif'],
  svg: ['image/svg+xml'],
  mp4: ['video/mp4'],
  webm: ['video/webm'],
  ogg: ['video/ogg', 'audio/ogg'],
  mp3: ['audio/mpeg'],
  wav: ['audio/wav'],
  m4a: ['audio/mp4'],
  pdf: ['application/pdf'],
  zip: ['application/zip'],
};

export function validateExtension(filename: string, detectedMime: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (!ext) return false;
  const allowedMimes = EXTENSION_MAP[ext];
  if (!allowedMimes) return false;
  return allowedMimes.includes(detectedMime);
}
