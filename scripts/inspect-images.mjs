import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dgzdubbrneqfdleprjfr.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnemR1YmJybmVxZmRsZXByamZyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTc0NDY3NywiZXhwIjoyMDkxMzIwNjc3fQ.IUfT68OUsLJarZ4bsJTeFz4zZfKSs2ESGKGuA28VEbY'

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function main() {
  const { data, error } = await supabase
    .from('exercise_library_entries')
    .select('name, media_image_url, metadata_json')
    .eq('source', 'nasm_exercise_library')
    .limit(50)

  if (error) {
    console.error(error)
    return
  }

  console.log(`Total sample fetched: ${data.length}`)
  for (const item of data.slice(0, 20)) {
    console.log(`- ${item.name} | img: ${item.media_image_url || item.metadata_json?.nasmVideoThumbnail}`)
  }
}

main()
