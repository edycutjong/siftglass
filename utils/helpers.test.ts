import { getURL } from '@/utils/helpers';

describe('getURL', () => {
  const savedEnv = process.env;

  beforeEach(() => {
    process.env = { ...savedEnv };
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.NEXT_PUBLIC_VERCEL_URL;
  });

  afterAll(() => {
    process.env = savedEnv;
  });

  describe('URL source selection', () => {
    it('uses NEXT_PUBLIC_SITE_URL when set', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com';
      expect(getURL()).toBe('https://example.com');
    });

    it('uses NEXT_PUBLIC_VERCEL_URL when SITE_URL is absent', () => {
      process.env.NEXT_PUBLIC_VERCEL_URL = 'my-app.vercel.app';
      expect(getURL()).toBe('https://my-app.vercel.app');
    });

    it('prefers SITE_URL over VERCEL_URL when both are set', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com';
      process.env.NEXT_PUBLIC_VERCEL_URL = 'my-app.vercel.app';
      expect(getURL()).toBe('https://example.com');
    });

    it('falls back to localhost when neither env var is set', () => {
      expect(getURL()).toBe('http://localhost:3000');
    });

    it('falls back to VERCEL_URL when SITE_URL is whitespace-only', () => {
      process.env.NEXT_PUBLIC_SITE_URL = '   ';
      process.env.NEXT_PUBLIC_VERCEL_URL = 'fallback.vercel.app';
      expect(getURL()).toBe('https://fallback.vercel.app');
    });

    it('falls back to localhost when SITE_URL is empty string', () => {
      process.env.NEXT_PUBLIC_SITE_URL = '';
      expect(getURL()).toBe('http://localhost:3000');
    });
  });

  describe('URL normalisation', () => {
    it('strips a single trailing slash', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com/';
      expect(getURL()).toBe('https://example.com');
    });

    it('strips multiple trailing slashes', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com///';
      expect(getURL()).toBe('https://example.com');
    });

    it('prepends https:// when the URL has no protocol', () => {
      process.env.NEXT_PUBLIC_VERCEL_URL = 'my-app.vercel.app';
      expect(getURL()).toMatch(/^https:\/\//);
    });

    it('does not double-prepend https:// when already present', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com';
      const result = getURL();
      expect(result).toBe('https://example.com');
      expect(result.startsWith('https://https://')).toBe(false);
    });
  });

  describe('path handling', () => {
    it('appends a plain path', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com';
      expect(getURL('auth/callback')).toBe('https://example.com/auth/callback');
    });

    it('strips leading slash from path', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com';
      expect(getURL('/auth/callback')).toBe('https://example.com/auth/callback');
    });

    it('strips multiple leading slashes from path', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com';
      expect(getURL('///api/test')).toBe('https://example.com/api/test');
    });

    it('returns base URL when path is empty string', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com';
      expect(getURL('')).toBe('https://example.com');
    });

    it('returns base URL when path is omitted', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com';
      expect(getURL()).toBe('https://example.com');
    });
  });
});
