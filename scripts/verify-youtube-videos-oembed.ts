import { NASM_COMPLETE_LIBRARY } from '../lib/nasm-fuzzy-matcher'

interface OembedResult {
  videoId: string
  status: 'ACTIVE' | 'NOT_FOUND' | 'RESTRICTED' | 'RATE_LIMITED' | 'ERROR'
  httpStatus?: number
  title?: string
  authorName?: string
  error?: string
}

async function checkVideoOembed(videoId: string): Promise<OembedResult> {
  const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 6000)
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Forge-Athletic-Exercise-Audit/1.0',
      },
    })
    clearTimeout(timeout)

    if (res.status === 200) {
      const data = await res.json()
      return {
        videoId,
        status: 'ACTIVE',
        httpStatus: 200,
        title: data.title,
        authorName: data.author_name,
      }
    } else if (res.status === 404) {
      return { videoId, status: 'NOT_FOUND', httpStatus: 404 }
    } else if (res.status === 401 || res.status === 403) {
      return { videoId, status: 'RESTRICTED', httpStatus: res.status }
    } else if (res.status === 429) {
      return { videoId, status: 'RATE_LIMITED', httpStatus: 429 }
    } else {
      return { videoId, status: 'ERROR', httpStatus: res.status }
    }
  } catch (err: any) {
    return {
      videoId,
      status: 'ERROR',
      error: err.name === 'AbortError' ? 'TIMEOUT' : err.message,
    }
  }
}

async function runAudit() {
  console.log('=== FORGE ATHLETIC YOUTUBE OEMBED AVAILABILITY AUDIT ===')
  
  // Collect all unique video IDs and their associated exercises
  const videoToExercises = new Map<string, string[]>()
  for (const ex of NASM_COMPLETE_LIBRARY) {
    if (ex.videoId) {
      const existing = videoToExercises.get(ex.videoId) || []
      existing.push(ex.name)
      videoToExercises.set(ex.videoId, existing)
    }
  }

  const uniqueIds = Array.from(videoToExercises.keys())
  console.log(`Found ${uniqueIds.length} unique YouTube video IDs across ${NASM_COMPLETE_LIBRARY.length} catalog exercises.`)
  console.log(`Auditing via YouTube oEmbed API with controlled concurrency...\n`)

  const results: OembedResult[] = []
  const concurrency = 8
  const delayMs = 100

  for (let i = 0; i < uniqueIds.length; i += concurrency) {
    const batch = uniqueIds.slice(i, i + concurrency)
    const batchPromises = batch.map(id => checkVideoOembed(id))
    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults)

    const processed = Math.min(i + concurrency, uniqueIds.length)
    process.stdout.write(`\rProgress: ${processed}/${uniqueIds.length} (${Math.round((processed / uniqueIds.length) * 100)}%) checked...`)
    
    // Slight pause to be polite to YouTube oEmbed service
    await new Promise(r => setTimeout(r, delayMs))
  }

  console.log('\n\n=== AUDIT RESULTS SUMMARY ===')
  const active = results.filter(r => r.status === 'ACTIVE')
  const notFound = results.filter(r => r.status === 'NOT_FOUND')
  const restricted = results.filter(r => r.status === 'RESTRICTED')
  const rateLimited = results.filter(r => r.status === 'RATE_LIMITED')
  const errors = results.filter(r => r.status === 'ERROR')

  console.log(`✅ Active & Accessible: ${active.length}/${uniqueIds.length} (${Math.round((active.length / uniqueIds.length) * 100)}%)`)
  console.log(`❌ Not Found (404 Removed/Deleted): ${notFound.length}`)
  console.log(`🔒 Restricted / Private (401/403): ${restricted.length}`)
  console.log(`⚠️ Rate Limited (429): ${rateLimited.length}`)
  console.log(`⚠️ Network / Timeout Errors: ${errors.length}\n`)

  const problematic = results.filter(r => r.status !== 'ACTIVE')
  if (problematic.length === 0) {
    console.log('🎉 100% of all exercise video assets are live, public, and streamable on YouTube!')
  } else {
    console.log('=== PROBLEMATIC VIDEO ASSETS ===')
    for (const p of problematic) {
      const exercises = videoToExercises.get(p.videoId) || []
      console.log(`Video ID: "${p.videoId}" [${p.status}] (HTTP ${p.httpStatus || 'N/A'})`)
      console.log(`  URL: https://www.youtube.com/watch?v=${p.videoId}`)
      console.log(`  Associated Exercises (${exercises.length}):`)
      for (const exName of exercises) {
        console.log(`    - ${exName}`)
      }
      if (p.error) console.log(`  Error Detail: ${p.error}`)
      console.log('')
    }
  }
}

runAudit()
