import sharp, { type Sharp } from 'sharp';

export interface StripResult {
  cleaned: boolean;
  buffer: Buffer;
  format: string;
  width?: number;
  height?: number;
}

/**
 * Strips all metadata from an image buffer using Sharp.
 * Re-encodes to clean PNG or WebP to remove any embedded data,
 * EXIF, XMP, IPTC, comments, thumbnails, etc.
 */
export async function stripImageMetadata(buffer: Buffer, mimeType: string): Promise<StripResult> {
  try {
    const image = sharp(buffer);

    const metadata = await image.metadata();

    let cleaned: Sharp;

    if (mimeType === 'image/png') {
      cleaned = image.png({ compressionLevel: 9 });
    } else if (mimeType === 'image/gif') {
      cleaned = image.png({ compressionLevel: 9 });
    } else if (mimeType === 'image/webp') {
      cleaned = image.webp({ effort: 6 });
    } else if (mimeType === 'image/avif') {
      cleaned = image.avif({ effort: 6 });
    } else {
      cleaned = image.jpeg({ quality: 95, mozjpeg: true });
    }

    const output = await cleaned.toBuffer();
    const outMeta = await sharp(output).metadata();

    return {
      cleaned: true,
      buffer: output,
      format: outMeta.format || 'jpeg',
      width: outMeta.width,
      height: outMeta.height,
    };
  } catch (err) {
    throw new Error(`Failed to strip image metadata: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

/**
 * Re-encodes image to a safe format, removing all hidden data.
 * Semantically equivalent to stripImageMetadata but guarantees
 * re-encoding even for formats sharp handles natively.
 */
export async function sanitizeImage(buffer: Buffer): Promise<StripResult> {
  const image = sharp(buffer);
  const meta = await image.metadata();

  const sanitized = image
    .rotate()
    .jpeg({ quality: 92, mozjpeg: true });

  const output = await sanitized.toBuffer();
  const outMeta = await sharp(output).metadata();

  return {
    cleaned: true,
    buffer: output,
    format: outMeta.format || 'jpeg',
    width: outMeta.width,
    height: outMeta.height,
  };
}
