import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabaseUrl = 'https://dgzdubbrneqfdleprjfr.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnemR1YmJybmVxZmRsZXByamZyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTc0NDY3NywiZXhwIjoyMDkxMzIwNjc3fQ.IUfT68OUsLJarZ4bsJTeFz4zZfKSs2ESGKGuA28VEbY'

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function main() {
  const { data, error } = await supabase
    .from('exercise_library_entries')
    .select('id, name, slug, description, coaching_cues, primary_equipment, muscle_groups, media_image_url, media_video_url, metadata_json')
    .eq('source', 'nasm_exercise_library')
    .limit(1000)

  if (error) {
    console.error('Error fetching library:', error)
    return
  }

  console.log(`Fetched ${data?.length || 0} exercises from Supabase`)

  const cleanCatalog = (data || []).map(item => {
    const videoId =
      item.metadata_json?.nasmEdgeVideoId ||
      (item.media_video_url && item.media_video_url.match(/(?:watch\?v=|embed\/|youtu\.be\/|^)([a-zA-Z0-9_-]{11})/)?.[1]) ||
      null

    let imageUrl = item.media_image_url || null
    if (imageUrl && imageUrl.startsWith('/content/dam/nasm/')) {
      imageUrl = `https://www.nasm.org${imageUrl}`
    } else if (!imageUrl && videoId) {
      imageUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    }

    return {
      id: item.id,
      name: item.name,
      slug: item.slug,
      description: item.description,
      coachingCues: item.coaching_cues,
      primaryEquipment: item.primary_equipment,
      muscleGroups: item.muscle_groups,
      imageUrl,
      videoId,
      videoUrl: videoId ? `https://www.youtube.com/watch?v=${videoId}` : null,
    }
  })

  fs.writeFileSync('scripts/nasm-complete-library.json', JSON.stringify(cleanCatalog, null, 2))
  console.log(`Saved ${cleanCatalog.length} clean entries to scripts/nasm-complete-library.json`)
}

main()
