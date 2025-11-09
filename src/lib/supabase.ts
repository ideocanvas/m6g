import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client only when needed
export function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  
  // During build time, return a mock client that won't be used
  if (typeof window === 'undefined' && process.env.NODE_ENV === 'production' && (!supabaseUrl || !supabaseKey)) {
    // Return a mock client for build time
    return {
      from: () => ({
        select: () => Promise.resolve({ data: [], error: null }),
        insert: () => ({
          select: () => Promise.resolve({ data: [], error: null })
        }),
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null })
        }),
        order: () => ({
          limit: () => Promise.resolve({ data: [], error: null })
        }),
        gte: () => ({
          lte: () => ({
            order: () => Promise.resolve({ data: [], error: null })
          })
        })
      })
    } as unknown as ReturnType<typeof createClient>;
  }
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase environment variables not configured');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}