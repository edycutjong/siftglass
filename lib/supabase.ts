import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured = url !== '' && key !== '';

// Only create the client when credentials are present — createClient throws on empty URL
let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_client) {
    if (!isSupabaseConfigured) throw new Error('Supabase not configured');
    _client = createClient(url, key);
  }
  return _client;
}

// Convenience re-export — safe to call only when isSupabaseConfigured is true
export const supabase = isSupabaseConfigured ? createClient(url, key) : null as unknown as SupabaseClient;
