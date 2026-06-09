import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_BYTES = 32;
const NONCE_BYTES = 12;
const TAG_BYTES = 16;

function getMasterKey(): Buffer {
  const hex = process.env.API_KEY_ENCRYPTION_SECRET;
  if (!hex) throw new Error(`${ALGORITHM}: API_KEY_ENCRYPTION_SECRET env var not set (64 hex chars for 32 bytes)`);
  return Buffer.from(hex.slice(0, KEY_BYTES * 2), 'hex');
}

export function encryptApiKey(plaintext: string): string {
  if (!plaintext) return '';
  const key = getMasterKey();
  const nonce = randomBytes(NONCE_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, nonce);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const combined = Buffer.concat([nonce, encrypted, tag]);
  return combined.toString('base64');
}

export function decryptApiKey(encoded: string): string {
  if (!encoded) return '';
  const key = getMasterKey();
  const combined = Buffer.from(encoded, 'base64');
  const nonce = combined.subarray(0, NONCE_BYTES);
  const tag = combined.subarray(combined.length - TAG_BYTES);
  const encrypted = combined.subarray(NONCE_BYTES, combined.length - TAG_BYTES);
  const decipher = createDecipheriv(ALGORITHM, key, nonce);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final('utf8');
}
