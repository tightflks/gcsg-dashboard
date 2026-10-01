// Tolerate common copy-paste mistakes in the dashboard env settings: surrounding
// whitespace/quotes, a trailing slash, or the REST path copied along with the URL.
const clean = (v: string | undefined) => (v ?? "").trim().replace(/^["']|["']$/g, "").trim();

export const SUPABASE_URL = clean(process.env.NEXT_PUBLIC_SUPABASE_URL)
  .replace(/\/rest\/v1\/?$/, "")
  .replace(/\/+$/, "");
export const SUPABASE_ANON_KEY = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/**
 * Without Supabase, local `next dev` runs in a read-only demo mode backed by
 * src/data/seed.json. Production never opens the staff dashboard without auth.
 */
export const isDemoMode = !isSupabaseConfigured && process.env.NODE_ENV !== "production";
