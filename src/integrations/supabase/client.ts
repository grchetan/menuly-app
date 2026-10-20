import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.['VITE_SUPABASE_URL']) ||
  (typeof process !== 'undefined' && (process.env['VITE_SUPABASE_URL'] || process.env['SUPABASE_URL'])) ||
  '';

const SUPABASE_PUBLISHABLE_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.['VITE_SUPABASE_PUBLISHABLE_KEY']) ||
  (typeof process !== 'undefined' && (process.env['VITE_SUPABASE_PUBLISHABLE_KEY'] || process.env['SUPABASE_PUBLISHABLE_KEY'])) ||
  '';

export const supabase = createClient<Database>(
  SUPABASE_URL || 'https://tbiipcyvlizkhjzhcfft.supabase.co',
  SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder',
  {
    auth: {
      persistSession: typeof window !== 'undefined',
      autoRefreshToken: typeof window !== 'undefined',
    },
  }
);
