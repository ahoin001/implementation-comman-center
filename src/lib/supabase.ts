import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

/** Fixed owner for solo mode (no auth UI). Matches auth.users for ahoin001@gmail.com */
export const SOLO_USER_ID =
  (import.meta.env.VITE_SUPABASE_USER_ID as string) || 'd2435367-b124-48f3-bca0-f0dc47340896'

export const ICC_SCHEMA = 'app_implementation_center_v1'

if (!url || !anonKey) {
  console.warn('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — Supabase sync disabled')
}

export const supabase = createClient(url ?? '', anonKey ?? '', {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  db: {
    schema: ICC_SCHEMA,
  },
})

export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey)
}

/** Typed helper for ICC schema tables */
export function icc() {
  return supabase.schema(ICC_SCHEMA)
}
