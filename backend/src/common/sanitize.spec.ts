import { stripHtml, sanitizeText, sanitizeTitle, sanitizeName } from './sanitize';

describe('sanitize utilities', () => {
  describe('stripHtml', () => {
    it('removes script tags and content', () => {
      expect(stripHtml('<script>alert("xss")</script>Hello')).toBe('Hello');
      expect(stripHtml('Before<script>evil()</script>After')).toBe('BeforeAfter');
    });

    it('removes style tags and content', () => {
      expect(stripHtml('<style>body { display: none; }</style>Content')).toBe('Content');
    });

    it('removes all HTML tags', () => {
      expect(stripHtml('<p>Hello</p>')).toBe('Hello');
      expect(stripHtml('<div><span>Nested</span></div>')).toBe('Nested');
      expect(stripHtml('<img src="x" onerror="alert(1)">')).toBe('');
    });

    it('removes javascript: URLs', () => {
      expect(stripHtml('javascript:alert(1)')).toBe('alert(1)');
      expect(stripHtml('JAVASCRIPT:evil()')).toBe('evil()');
    });

    it('removes vbscript: URLs', () => {
      expect(stripHtml('vbscript:msgbox(1)')).toBe('msgbox(1)');
    });

    it('removes data: URLs', () => {
      expect(stripHtml('data:text/html,<script>alert(1)</script>')).toBe('text/html,');
    });

    it('removes on* event handlers', () => {
      expect(stripHtml('onclick=alert(1)')).toBe('alert(1)');
      expect(stripHtml('ONERROR = evil()')).toBe('evil()');
    });

    it('removes HTML entities that could bypass filters', () => {
      expect(stripHtml('&#60;script&#62;')).toBe('script');
      expect(stripHtml('&#x3c;script&#x3e;')).toBe('script');
    });

    it('normalizes whitespace', () => {
      expect(stripHtml('Hello   World')).toBe('Hello World');
      expect(stripHtml('Hello\n\nWorld')).toBe('Hello World');
    });

    it('handles empty/null input', () => {
      expect(stripHtml('')).toBe('');
      expect(stripHtml(null as unknown as string)).toBe('');
      expect(stripHtml(undefined as unknown as string)).toBe('');
    });

    it('preserves normal text', () => {
      expect(stripHtml('Hello World')).toBe('Hello World');
      expect(stripHtml('Test 123!')).toBe('Test 123!');
    });

    it('preserves emojis', () => {
      expect(stripHtml('Hello 👋 World 🌍')).toBe('Hello 👋 World 🌍');
    });
  });

  describe('sanitizeText', () => {
    it('sanitizes and respects max length', () => {
      const longText = 'a'.repeat(200);
      expect(sanitizeText(longText, 100).length).toBe(100);
    });

    it('removes XSS attempts', () => {
      expect(sanitizeText('<script>alert("xss")</script>')).toBe('');
      expect(sanitizeText('<img src=x onerror=alert(1)>')).toBe('');
    });

    it('preserves safe content with emojis', () => {
      expect(sanitizeText('Hello! 🤖 I am an AI agent.')).toBe('Hello! 🤖 I am an AI agent.');
    });

    it('uses default max length of 10000', () => {
      const veryLongText = 'a'.repeat(15000);
      expect(sanitizeText(veryLongText).length).toBe(10000);
    });
  });

  describe('sanitizeTitle', () => {
    it('removes newlines', () => {
      expect(sanitizeTitle('Title\nWith\nNewlines')).toBe('Title With Newlines');
    });

    it('respects max length', () => {
      const longTitle = 'a'.repeat(300);
      expect(sanitizeTitle(longTitle).length).toBe(200);
    });

    it('removes XSS attempts', () => {
      expect(sanitizeTitle('<script>alert(1)</script>Title')).toBe('Title');
    });
  });

  describe('sanitizeName', () => {
    it('only allows alphanumeric, underscore, and hyphen', () => {
      expect(sanitizeName('Valid_Name-123')).toBe('Valid_Name-123');
      expect(sanitizeName('Invalid Name!')).toBe('InvalidName');
      expect(sanitizeName('<script>evil</script>')).toBe('scriptevilscript');
    });

    it('respects max length', () => {
      const longName = 'a'.repeat(100);
      expect(sanitizeName(longName).length).toBe(50);
    });

    it('handles empty input', () => {
      expect(sanitizeName('')).toBe('');
      expect(sanitizeName(null as unknown as string)).toBe('');
    });
  });
});
