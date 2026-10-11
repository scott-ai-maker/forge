import fs from 'node:fs'
import path from 'node:path'

const MANIFEST_PATH = path.resolve(process.cwd(), 'data/rag-resources/vcs/nasm-vcs-manifest.json')
const KB_PATH = path.resolve(process.cwd(), 'lib/nasm-rag-knowledge-base.ts')

if (!fs.existsSync(MANIFEST_PATH)) {
  console.error(`Manifest not found at ${MANIFEST_PATH}. Run the scraper first!`)
  process.exit(1)
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'))
console.log(`Loaded ${manifest.length} items from manifest.`)

const entries = manifest.map((item, idx) => {
  const headings = item.headings || []
  const concepts = Array.from(new Set([
    'Virtual Coaching',
    'Remote Assessment',
    'Telehealth Protocol',
    ...headings.slice(0, 3),
  ])).slice(0, 5)

  return `  {
    id: ${JSON.stringify(item.id || `vcs_mod_${idx + 1}`)},
    filename: ${JSON.stringify(item.filename)},
    title: ${JSON.stringify(item.title)},
    category: 'Virtual Coaching Protocol',
    goalCategory: 'Virtual Coaching & Remote Telehealth',
    summary: ${JSON.stringify(item.summary || 'NASM Virtual Coaching Specialization curriculum covering remote assessment, telehealth delivery, and digital client retention.')},
    keyConcepts: ${JSON.stringify(concepts)},
  },`
})

console.log('\nGenerated RAG entries:')
console.log(entries.join('\n'))
