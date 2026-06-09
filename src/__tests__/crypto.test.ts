import { describe, it, expect, beforeAll } from 'vitest';
import { encryptApiKey, decryptApiKey } from '@/lib/crypto';

const TEST_SECRET = 'db6f425a95b76cf2aab5e57541b16f8e8ebfdd9b9a31cb5215339b8275dab325';

beforeAll(() => {
  process.env.API_KEY_ENCRYPTION_SECRET = TEST_SECRET;
});

describe('encryptApiKey / decryptApiKey', () => {
  it('encrypts and decrypts a key correctly', () => {
    const original = 'sk-or-v1-test-key-12345';
    const encrypted = encryptApiKey(original);
    expect(encrypted).toBeTruthy();
    expect(encrypted).not.toBe(original);
    const decrypted = decryptApiKey(encrypted);
    expect(decrypted).toBe(original);
  });

  it('produces different ciphertext each time for same key', () => {
    const original = 'sk-or-v1-test-key';
    const a = encryptApiKey(original);
    const b = encryptApiKey(original);
    expect(a).not.toBe(b);
  });

  it('handles Gemini API keys', () => {
    const original = 'AIzaSyTestKey123456789';
    const encrypted = encryptApiKey(original);
    const decrypted = decryptApiKey(encrypted);
    expect(decrypted).toBe(original);
  });

  it('handles empty string', () => {
    expect(encryptApiKey('')).toBe('');
    expect(decryptApiKey('')).toBe('');
  });

  it('throws if API_KEY_ENCRYPTION_SECRET is missing', () => {
    delete process.env.API_KEY_ENCRYPTION_SECRET;
    expect(() => encryptApiKey('test')).toThrow();
    process.env.API_KEY_ENCRYPTION_SECRET = TEST_SECRET;
  });
});
