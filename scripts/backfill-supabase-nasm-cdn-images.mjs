import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

// 1. Read environment variables from .env.local if not already set
const envLocalPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, 'utf8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim()
      const val = trimmed.slice(idx + 1).trim()
      if (!process.env[key]) {
        process.env[key] = val
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dgzdubbrneqfdleprjfr.supabase.co'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!serviceRoleKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Load complete NASM library
const libraryPath = path.resolve(process.cwd(), 'scripts/nasm-complete-library.json')
const library = JSON.parse(fs.readFileSync(libraryPath, 'utf8'))

// Build quick lookup map by normalized name and slug
const libraryByName = new Map()
const libraryBySlug = new Map()
const libraryByVideoId = new Map()

function normalizeKey(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim()
}

function extractYouTubeId(url) {
  if (!url) return null
  const m = String(url).match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i)
  return m ? m[1] : null
}

for (const item of library) {
  if (item.name) libraryByName.set(normalizeKey(item.name), item)
  if (item.slug) libraryBySlug.set(item.slug.toLowerCase(), item)
  if (item.videoId) libraryByVideoId.set(item.videoId, item)
}

function resolveNasmCdnImage(name, videoUrl, currentImg) {
  const norm = normalizeKey(name)
  // Ensure reverse lunge movements always resolve to authentic NASM reverse lunge
  if (norm.includes('reverselunge')) {
    return 'https://img.youtube.com/vi/lKhZvT_NkOs/hqdefault.jpg'
  }

  // 1. Direct video ID from videoUrl
  const directId = extractYouTubeId(videoUrl)
  if (directId) {
    return `https://img.youtube.com/vi/${directId}/hqdefault.jpg`
  }

  // 2. Exact or substring match in complete library
  if (libraryByName.has(norm)) {
    const rec = libraryByName.get(norm)
    if (rec.videoId) return `https://img.youtube.com/vi/${rec.videoId}/hqdefault.jpg`
  }

  for (const [k, rec] of libraryByName.entries()) {
    if (k.length >= 5 && (norm.includes(k) || k.includes(norm))) {
      if (rec.videoId) return `https://img.youtube.com/vi/${rec.videoId}/hqdefault.jpg`
    }
  }

  // 3. Fallback: if already a youtube url, keep it
  const ytFromImg = extractYouTubeId(currentImg)
  if (ytFromImg) {
    return `https://img.youtube.com/vi/${ytFromImg}/hqdefault.jpg`
  }

  // Default fallback if no video found
  return '/images/exercises/image-not-available.jpg'
}

async function main() {
  console.log('=== 1. BACKFILLING exercise_library_entries TO NASM CDN IMAGES ===')
  const { data: entries, error: eErr } = await supabase
    .from('exercise_library_entries')
    .select('id, name, slug, media_image_url, media_video_url')
    .limit(2000)

  if (eErr) {
    console.error('Error fetching exercise_library_entries:', eErr)
  } else {
    console.log(`Found ${entries.length} entries in exercise_library_entries.`)
    let updatedCount = 0
    let unchangedCount = 0

    for (const item of entries) {
      const cdnImage = resolveNasmCdnImage(item.name, item.media_video_url, item.media_image_url)
      if (item.media_image_url !== cdnImage) {
        const { error: upErr } = await supabase
          .from('exercise_library_entries')
          .update({ media_image_url: cdnImage })
          .eq('id', item.id)

        if (upErr) {
          console.error(`Failed to update entry ${item.id} (${item.name}):`, upErr)
        } else {
          updatedCount++
        }
      } else {
        unchangedCount++
      }
    }
    console.log(`✅ Updated ${updatedCount} entries to NASM CDN images (${unchangedCount} already up to date).`)
  }

  console.log('\n=== 2. BACKFILLING workout_plans TO NASM CDN IMAGES ===')
  const { data: plans, error: pErr } = await supabase
    .from('workout_plans')
    .select('id, user_id, plan_json')
    .limit(200)

  if (pErr) {
    console.error('Error fetching workout_plans:', pErr)
  } else {
    console.log(`Found ${plans.length} workout plans in Supabase.`)
    let updatedPlans = 0

    for (const plan of plans) {
      if (!plan.plan_json) continue

      let modified = false
      const planJson = JSON.parse(JSON.stringify(plan.plan_json))

      // Helper to process an array of exercise objects
      function processExercises(exerciseList) {
        if (!Array.isArray(exerciseList)) return
        for (const ex of exerciseList) {
          if (!ex || typeof ex !== 'object') continue
          const norm = normalizeKey(ex.name)
          if (norm.includes('reverselunge')) {
            const correctImg = 'https://img.youtube.com/vi/lKhZvT_NkOs/hqdefault.jpg'
            const correctVid = 'https://www.youtube.com/watch?v=lKhZvT_NkOs'
            const correctEmbed = 'https://www.youtube-nocookie.com/embed/lKhZvT_NkOs?autoplay=1&rel=0&modestbranding=1'

            if (ex.imageUrl !== correctImg) {
              ex.imageUrl = correctImg
              modified = true
            }
            if (ex.media_image_url && ex.media_image_url !== correctImg) {
              ex.media_image_url = correctImg
              modified = true
            }
            if (ex.videoUrl && ex.videoUrl.includes('UInwcEa5BH4')) {
              ex.videoUrl = correctVid
              modified = true
            }
            if (ex.embedUrl && ex.embedUrl.includes('UInwcEa5BH4')) {
              ex.embedUrl = correctEmbed
              modified = true
            }
          }

          const current = ex.imageUrl || ex.media_image_url
          if (current && (current.startsWith('/images/exercises/') || current.includes('/images/exercises/'))) {
            const cdnImg = resolveNasmCdnImage(ex.name, ex.videoUrl, current)
            if (cdnImg && cdnImg !== current) {
              ex.imageUrl = cdnImg
              if (ex.media_image_url) ex.media_image_url = cdnImg
              modified = true
            }
          }
        }
      }

      // Check planJson.workouts
      if (Array.isArray(planJson.workouts)) {
        for (const w of planJson.workouts) {
          processExercises(w.exercises)
          if (Array.isArray(w.warmup)) processExercises(w.warmup)
          if (Array.isArray(w.cooldown)) processExercises(w.cooldown)
        }
      }

      // Check planJson.sessions
      if (Array.isArray(planJson.sessions)) {
        for (const s of planJson.sessions) {
          processExercises(s.exercises)
        }
      }

      // Check planJson.days
      if (Array.isArray(planJson.days)) {
        for (const d of planJson.days) {
          processExercises(d.exercises)
        }
      }

      if (modified) {
        const { error: upErr } = await supabase
          .from('workout_plans')
          .update({ plan_json: planJson })
          .eq('id', plan.id)

        if (upErr) {
          console.error(`Failed to update plan ${plan.id}:`, upErr)
        } else {
          updatedPlans++
          console.log(`Updated plan ${plan.id} for user ${plan.user_id}`)
        }
      }
    }
    console.log(`✅ Successfully backfilled ${updatedPlans} workout plans in Supabase.`)
  }

  console.log('\nSupabase NASM CDN image backfill completed!')
}

main().catch(err => {
  console.error('Fatal backfill error:', err)
  process.exit(1)
})

