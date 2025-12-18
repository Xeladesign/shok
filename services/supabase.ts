import { createClient } from '@supabase/supabase-js';

// Configuration updated with user provided credentials
const SUPABASE_URL = 'https://tgbyiguwyxekmwrkdiuz.supabase.co';
// Using the specific publishable key provided
const SUPABASE_KEY = 'sb_publishable_DevBvKZ_VvzhtoxgWGi74A_kMcSMwGM';

// Initialize the Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);