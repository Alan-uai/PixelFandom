import { describe, it, expect } from 'vitest';
import { sanitizeHtml, sanitizeUrl, sanitizeBlockConfig } from '@/lib/sanitize';

describe('sanitizeHtml', () => {
  it('removes script tags', () => {
    expect(sanitizeHtml('<script>alert("xss")</script>')).toBe('');
  });

  it('removes event handlers', () => {
    expect(sanitizeHtml('<p onclick="alert(1)">text</p>')).toBe('<p>text</p>');
  });

  it('allows safe HTML', () => {
    const html = '<p><strong>hello</strong> <a href="https://example.com">link</a></p>';
    expect(sanitizeHtml(html)).toContain('<strong>hello</strong>');
  });

  it('strips iframe tags', () => {
    expect(sanitizeHtml('<iframe src="https://evil.com"></iframe>')).toBe('');
  });
});

describe('sanitizeUrl', () => {
  it('blocks javascript: URLs', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('#');
  });

  it('blocks data: URLs', () => {
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('#');
  });

  it('allows https URLs', () => {
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
  });

  it('returns empty string unchanged', () => {
    expect(sanitizeUrl('')).toBe('');
  });
});

describe('sanitizeBlockConfig', () => {
  it('sanitizes HTML content fields', () => {
    const config = { html: '<script>alert(1)</script><p>text</p>' };
    const result = sanitizeBlockConfig(config);
    expect(result.html).not.toContain('<script>');
    expect(result.html).toContain('<p>text</p>');
  });

  it('sanitizes URL fields', () => {
    const config = { ctaUrl: 'javascript:alert(1)' };
    const result = sanitizeBlockConfig(config);
    expect(result.ctaUrl).toBe('#');
  });

  it('passes non-HTML/URL strings through', () => {
    const config = { title: 'Hello', description: 'World' };
    expect(sanitizeBlockConfig(config)).toEqual(config);
  });
});
