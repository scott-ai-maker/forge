import { createClient } from '@supabase/supabase-js'

function resolveSupabaseConfig() {
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return null
  }

  if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
    supabaseUrl = `https://${supabaseUrl}`
  }

  try {
    const parsed = new URL(supabaseUrl)
    if (!parsed.protocol.startsWith('http')) {
      return null
    }
  } catch {
    return null
  }

  return { supabaseUrl, supabaseAnonKey }
}

function requireSupabaseConfig() {
  const config = resolveSupabaseConfig()

  if (!config) {
    throw new Error('Supabase environment variables are required (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)')
  }

  return config
}

function createBrowserSupabase() {
  const config = resolveSupabaseConfig()
  if (!config) return null
  try {
    return createClient(config.supabaseUrl, config.supabaseAnonKey)
  } catch {
    return null
  }
}

export const supabase = createBrowserSupabase()

// Server-side admin client (use only in API routes / server components)
export const supabaseAdmin = () => {
  const { supabaseUrl } = requireSupabaseConfig()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin Supabase client')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
