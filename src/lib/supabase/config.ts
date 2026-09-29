export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/**
 * Without Supabase, local `next dev` runs in a read-only demo mode backed by
 * src/data/seed.json. Production never opens the staff dashboard without auth.
 */
export const isDemoMode = !isSupabaseConfigured && process.env.NODE_ENV !== "production";
