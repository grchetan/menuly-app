import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env['VITE_SUPABASE_URL'] as string;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] as string;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  const missing = [
    ...(!SUPABASE_URL ? ['VITE_SUPABASE_URL'] : []),
    ...(!SUPABASE_PUBLISHABLE_KEY ? ['VITE_SUPABASE_PUBLISHABLE_KEY'] : []),
  ];
  throw new Error(`Missing Supabase environment variable(s): ${missing.join(', ')}. Add them to your .env file.`);
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
