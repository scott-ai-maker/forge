import fs from 'node:fs'
import path from 'node:path'

const envPath = path.resolve(process.cwd(), '.env.local')
const content = fs.readFileSync(envPath, 'utf8')
for (const line of content.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const idx = trimmed.indexOf('=')
  if (idx !== -1) {
    process.env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim()
  }
}

let url = process.env.NEXT_PUBLIC_SUPABASE_URL
if (!url.startsWith('http')) url = `https://${url}`

const { createClient } = await import('@supabase/supabase-js')
const supabase = createClient(
  url,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const { data, error } = await supabase.from('discount_codes').select('*')
console.log('Existing discount codes count:', data?.length ?? 0)
console.log('Codes:', data)
if (error) console.error('Error:', error)
