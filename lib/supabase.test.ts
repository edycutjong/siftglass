import { createClient } from '@supabase/supabase-js';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({ _type: 'mock-supabase-client' })),
}));

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

const ENV_URL = 'NEXT_PUBLIC_SUPABASE_URL';
const ENV_KEY = 'NEXT_PUBLIC_SUPABASE_ANON_KEY';

describe('lib/supabase', () => {
  const savedEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    mockCreateClient.mockClear();
    process.env = { ...savedEnv };
    delete process.env[ENV_URL];
    delete process.env[ENV_KEY];
  });

  afterAll(() => {
    process.env = savedEnv;
  });

  describe('when both env vars are absent', () => {
    it('isSupabaseConfigured is false', () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { isSupabaseConfigured } = require('@/lib/supabase');
      expect(isSupabaseConfigured).toBe(false);
    });

    it('supabase export is null', () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { supabase } = require('@/lib/supabase');
      expect(supabase).toBeNull();
    });

    it('getSupabase throws "Supabase not configured"', () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getSupabase } = require('@/lib/supabase');
      expect(() => getSupabase()).toThrow('Supabase not configured');
    });

    it('createClient is never called when unconfigured', () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('@/lib/supabase');
      expect(mockCreateClient).not.toHaveBeenCalled();
    });
  });

  describe('when only URL is set', () => {
    beforeEach(() => {
      process.env[ENV_URL] = 'https://test.supabase.co';
    });

    it('isSupabaseConfigured is false', () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { isSupabaseConfigured } = require('@/lib/supabase');
      expect(isSupabaseConfigured).toBe(false);
    });
  });

  describe('when only KEY is set', () => {
    beforeEach(() => {
      process.env[ENV_KEY] = 'anon-key-123';
    });

    it('isSupabaseConfigured is false', () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { isSupabaseConfigured } = require('@/lib/supabase');
      expect(isSupabaseConfigured).toBe(false);
    });
  });

  describe('when both env vars are configured', () => {
    beforeEach(() => {
      process.env[ENV_URL] = 'https://test.supabase.co';
      process.env[ENV_KEY] = 'anon-key-123';
    });

    it('isSupabaseConfigured is true', () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { isSupabaseConfigured } = require('@/lib/supabase');
      expect(isSupabaseConfigured).toBe(true);
    });

    it('supabase export is non-null', () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { supabase } = require('@/lib/supabase');
      expect(supabase).not.toBeNull();
      expect(supabase).toBeDefined();
    });

    it('createClient is called once at module load for the supabase export', () => {
      // Re-require both modules in the same reset cycle so they share the same jest.fn instance
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { createClient: freshCreate } = require('@supabase/supabase-js');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('@/lib/supabase');
      expect(freshCreate).toHaveBeenCalledTimes(1);
      expect(freshCreate).toHaveBeenCalledWith('https://test.supabase.co', 'anon-key-123');
    });

    it('getSupabase returns a client', () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getSupabase } = require('@/lib/supabase');
      const client = getSupabase();
      expect(client).toBeDefined();
      expect(client).not.toBeNull();
    });

    it('getSupabase caches its client (singleton)', () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getSupabase } = require('@/lib/supabase');
      const c1 = getSupabase();
      const c2 = getSupabase();
      expect(c1).toBe(c2);
    });

    it('createClient is called a second time when getSupabase first runs', () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { createClient: freshCreate } = require('@supabase/supabase-js');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getSupabase } = require('@/lib/supabase');
      // 1st call: module-level supabase export
      expect(freshCreate).toHaveBeenCalledTimes(1);
      getSupabase();
      // 2nd call: getSupabase singleton creation
      expect(freshCreate).toHaveBeenCalledTimes(2);
      getSupabase();
      // 3rd call: cached — no more createClient calls
      expect(freshCreate).toHaveBeenCalledTimes(2);
    });
  });
});
