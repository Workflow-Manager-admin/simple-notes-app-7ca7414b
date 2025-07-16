import { createClient } from '@supabase/supabase-js';

// PUBLIC_INTERFACE
/**
 * Initializes the Supabase client with project url and public anon key from environment variables.
 * These must be provided securely at build time or runtime via appropriate mechanisms.
 */
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase credentials are not set. Please check SUPABASE_URL and SUPABASE_ANON_KEY env variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
