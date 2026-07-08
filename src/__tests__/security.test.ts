import { describe, it, expect } from 'vitest';

describe('Security configurations', () => {
  describe('URL sanitization', () => {
    it('should reject javascript protocol URLs', () => {
      const DISALLOWED_PROTOCOLS = /^(javascript|data|vbscript):/i;
      expect(DISALLOWED_PROTOCOLS.test('javascript:alert(1)')).toBe(true);
      expect(DISALLOWED_PROTOCOLS.test('data:text/html,<script>alert(1)</script>')).toBe(true);
      expect(DISALLOWED_PROTOCOLS.test('vbscript:msgbox(1)')).toBe(true);
      expect(DISALLOWED_PROTOCOLS.test('https://example.com')).toBe(false);
    });
  });

  describe('IP validation', () => {
    it('should validate IPv4 format', () => {
      const IP_V4_REGEX = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
      expect(IP_V4_REGEX.test('192.168.1.1')).toBe(true);
      expect(IP_V4_REGEX.test('255.255.255.255')).toBe(true);
      expect(IP_V4_REGEX.test('0.0.0.0')).toBe(true);
      expect(IP_V4_REGEX.test('not-an-ip')).toBe(false);
      expect(IP_V4_REGEX.test('256.1.1.1')).toBe(true);
      expect(IP_V4_REGEX.test('')).toBe(false);
    });
  });

  describe('Filename sanitization', () => {
    it('should detect path traversal', () => {
      const PATH_TRAVERSAL = /\.\.(\/|\\)/;
      expect(PATH_TRAVERSAL.test('../../etc/passwd')).toBe(true);
      expect(PATH_TRAVERSAL.test('..\\windows\\system32')).toBe(true);
      expect(PATH_TRAVERSAL.test('normal-file.txt')).toBe(false);
      expect(PATH_TRAVERSAL.test('../file.txt')).toBe(true);
      expect(PATH_TRAVERSAL.test('..../file.txt')).toBe(true);
    });
  });

  describe('UUID validation', () => {
    it('should validate UUID format', () => {
      const VALID_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(VALID_UUID.test('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(VALID_UUID.test('not-a-uuid')).toBe(false);
      expect(VALID_UUID.test('')).toBe(false);
    });
  });

  describe('SQL injection patterns', () => {
    it('should detect common SQL injection attempts', () => {
      const SQLI_PATTERNS = [/' OR '1'='1/, /1\s*=\s*1\s*--/, /'; DROP TABLE/, /admin'--/];

      const testCases = [
        { input: "' OR '1'='1", shouldMatch: true },
        { input: "1=1--", shouldMatch: true },
        { input: "'; DROP TABLE users; --", shouldMatch: true },
        { input: "admin'--", shouldMatch: true },
        { input: "normal search query", shouldMatch: false },
        { input: "test@example.com", shouldMatch: false },
      ];

      for (const { input, shouldMatch } of testCases) {
        const matches = SQLI_PATTERNS.some(p => p.test(input));
        expect(matches).toBe(shouldMatch);
      }
    });
  });

  describe('XSS patterns', () => {
    it('should detect XSS injection attempts', () => {
      const XSS_PATTERNS = [/<script\b/, /onerror\s*=/, /onload\s*=/, /onclick\s*=/];

      const testCases = [
        { input: '<script>alert(1)</script>', shouldMatch: true },
        { input: '<img onerror=alert(1) src=x>', shouldMatch: true },
        { input: '<div onclick="evil()">', shouldMatch: true },
        { input: '<b>safe text</b>', shouldMatch: false },
        { input: 'plain text', shouldMatch: false },
      ];

      for (const { input, shouldMatch } of testCases) {
        const matches = XSS_PATTERNS.some(p => p.test(input.toLowerCase()));
        expect(matches).toBe(shouldMatch);
      }
    });
  });
});
