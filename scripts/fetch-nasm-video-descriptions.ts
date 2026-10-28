import fs from 'fs'
import path from 'path'

interface Exercise {
  id: string
  name: string
  slug: string
  videoId: string | null
}

const libraryPath = path.resolve(process.cwd(), 'scripts/nasm-complete-library.json')
const outputPath = path.resolve(process.cwd(), 'scripts/nasm-official-video-descriptions.json')

const exercises: Exercise[] = JSON.parse(fs.readFileSync(libraryPath, 'utf8'))
console.log(`Starting fetch of official NASM video descriptions for ${exercises.length} exercises...`)

async function fetchVideoDescription(videoId: string): Promise<string | null> {
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    })
    if (!res.ok) return null
    const html = await res.text()
    const match = html.match(/"description":\{"simpleText":"([^"]+)"/)
    if (!match) return null

    // Clean escaped characters
    const raw = match[1]
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '')
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'")
      .trim()

    // Strip promotional footers
    const cleaned = raw
      .replace(/Want more great exercises like this[\s\S]*$/i, '')
      .replace(/Sign up for a free trial of the new NASM Edge[\s\S]*$/i, '')
      .replace(/Download the NASM Edge app[\s\S]*$/i, '')
      .replace(/Follow us on social media[\s\S]*$/i, '')
      .replace(/Connect with NASM[\s\S]*$/i, '')
      .trim()

    return cleaned || null
  } catch (err) {
    return null
  }
}

async function main() {
  const descriptions: Record<string, { name: string; videoId: string; rawDescription: string }> = {}
  const concurrency = 8

  for (let i = 0; i < exercises.length; i += concurrency) {
    const batch = exercises.slice(i, i + concurrency)
    await Promise.all(
      batch.map(async (ex) => {
        if (!ex.videoId) return
        const desc = await fetchVideoDescription(ex.videoId)
        if (desc) {
          descriptions[ex.name.toLowerCase().trim()] = {
            name: ex.name,
            videoId: ex.videoId,
            rawDescription: desc,
          }
        }
      })
    )
    const processed = Math.min(i + concurrency, exercises.length)
    process.stdout.write(`\rProgress: ${processed}/${exercises.length} (${Math.round((processed / exercises.length) * 100)}%) fetched...`)
    await new Promise((r) => setTimeout(r, 120))
  }

  console.log(`\n\nFetched official descriptions for ${Object.keys(descriptions).length}/${exercises.length} exercises.`)
  fs.writeFileSync(outputPath, JSON.stringify(descriptions, null, 2))
  console.log(`Saved official descriptions to ${outputPath}`)
}

main().catch(console.error)
