import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  if (supabaseUrl && !supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
    supabaseUrl = `https://${supabaseUrl}`
  }

  return createBrowserClient(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  )
}
