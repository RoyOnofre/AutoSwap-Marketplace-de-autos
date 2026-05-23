import { createClient } from '@supabase/supabase-js';

// Load env vars – Expo loads .env locally. Ensure you have SUPABASE_URL and SUPABASE_ANON_KEY defined.
const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
