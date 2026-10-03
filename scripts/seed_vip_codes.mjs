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

const codesToSeed = [
  {
    code: 'ALLACCESS',
    description: 'Executive VIP All-Access Client Demo Pass (100% Off)',
    discount_type: 'percent',
    discount_value: 100,
    is_active: true,
    max_redemptions: null,
    starts_at: new Date(Date.now() - 3600_000).toISOString(),
    expires_at: null,
    applies_to_package_ids: null,
    restricted_client_id: null,
  },
  {
    code: 'VIPDEMO',
    description: 'Full Platform VIP Demo Pass (100% Off)',
    discount_type: 'percent',
    discount_value: 100,
    is_active: true,
    max_redemptions: null,
    starts_at: new Date(Date.now() - 3600_000).toISOString(),
    expires_at: null,
    applies_to_package_ids: null,
    restricted_client_id: null,
  },
  {
    code: 'FOUNDERPASS',
    description: 'Founder All-Features Master Pass (100% Off)',
    discount_type: 'percent',
    discount_value: 100,
    is_active: true,
    max_redemptions: null,
    starts_at: new Date(Date.now() - 3600_000).toISOString(),
    expires_at: null,
    applies_to_package_ids: null,
    restricted_client_id: null,
  }
]

for (const item of codesToSeed) {
  const { data: existing } = await supabase
    .from('discount_codes')
    .select('id')
    .eq('code', item.code)
    .maybeSingle()

  if (existing) {
    await supabase
      .from('discount_codes')
      .update(item)
      .eq('id', existing.id)
    console.log(`Updated code: ${item.code}`)
  } else {
    await supabase
      .from('discount_codes')
      .insert(item)
    console.log(`Inserted code: ${item.code}`)
  }
}

console.log('✅ VIP Demo Codes successfully seeded into Supabase!')
