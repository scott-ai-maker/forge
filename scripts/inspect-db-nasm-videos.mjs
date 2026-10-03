import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dgzdubbrneqfdleprjfr.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnemR1YmJybmVxZmRsZXByamZyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTc0NDY3NywiZXhwIjoyMDkxMzIwNjc3fQ.IUfT68OUsLJarZ4bsJTeFz4zZfKSs2ESGKGuA28VEbY'

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function main() {
  const { data, error } = await supabase
    .from('exercise_library_entries')
    .select('id, name, slug, media_video_url, metadata_json')
    .limit(1000)

  if (error) {
    console.error('Error:', error.message)
    return
  }

  console.log(`Total exercises fetched: ${data?.length || 0}`)
  const edgeEntries = (data || []).filter(e => e.metadata_json?.nasmEdgeVideoId || (e.media_video_url && e.media_video_url.includes('youtube')))
  console.log(`Exercises with YouTube/Edge videos: ${edgeEntries.length}`)
  for (const e of edgeEntries.slice(0, 30)) {
    console.log(`- "${e.name}": "${e.metadata_json?.nasmEdgeVideoId || e.media_video_url}"`)
  }
}

main()
