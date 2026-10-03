import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabaseUrl = 'https://dgzdubbrneqfdleprjfr.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnemR1YmJybmVxZmRsZXByamZyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTc0NDY3NywiZXhwIjoyMDkxMzIwNjc3fQ.IUfT68OUsLJarZ4bsJTeFz4zZfKSs2ESGKGuA28VEbY'

const supabase = createClient(supabaseUrl, serviceRoleKey)

function extractYouTubeId(val) {
  if (!val) return null
  const match = String(val).match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/|^)([a-zA-Z0-9_-]{11})/i)
  return match ? match[1] : null
}

function cleanKey(name) {
  return String(name ?? '')
    .toLowerCase()
    .replace(/^nasm\s*edge\s*[:\-]\s*/i, '')
    .replace(/^nasm\s*[:\-]\s*/i, '')
    .replace(/\s*\|\s*nasm(\s*edge)?$/i, '')
    .replace(/\s*-\s*nasm(\s*edge)?$/i, '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

async function main() {
  const { data, error } = await supabase
    .from('exercise_library_entries')
    .select('name, slug, media_video_url, metadata_json')
    .eq('source', 'nasm_exercise_library')
    .limit(1000)

  if (error) {
    console.error('Error:', error)
    return
  }

  const entries = []
  const dictionary = {}

  for (const item of data) {
    const rawId = item.metadata_json?.nasmEdgeVideoId || item.media_video_url
    const videoId = extractYouTubeId(rawId)
    if (!videoId) continue

    const key = cleanKey(item.name)
    if (key) {
      dictionary[key] = videoId
      entries.push({
        name: item.name,
        key,
        videoId,
        source: 'NASM Edge'
      })
    }
  }

  fs.writeFileSync('scripts/nasm-edge-dictionary.json', JSON.stringify(dictionary, null, 2))
  console.log(`Generated NASM Edge dictionary with ${Object.keys(dictionary).length} official videos!`)
}

main()
