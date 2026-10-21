import { execSync } from 'node:child_process'
import path from 'node:path'

const scripts = [
  'generate-batch-7.mjs',
  'generate-batch-6.mjs',
  'generate-batch-5.mjs',
  'generate-batch-4.mjs',
  'generate-batch-3.mjs',
  'generate-batch-2.mjs',
  'generate-batch-1.mjs',
  'generate-prototypes.mjs'
]

console.log(`⚡ Forge Athletic Photography Master Batch Runner`)
console.log(`Remaining scripts: ${scripts.length}\n`)

for (const script of scripts) {
  const scriptPath = path.resolve('scripts', script)
  console.log(`========================================`)
  console.log(`▶ Running ${script}...`)
  console.log(`========================================`)
  try {
    execSync(`node "${scriptPath}"`, { stdio: 'inherit' })
    console.log(`✅ Finished ${script}\n`)
  } catch (err) {
    console.error(`❌ Failed on ${script}:`, err.message)
    process.exit(1)
  }
}

console.log(`\n🏆 ALL REMAINING BATCHES COMPLETED SUCCESSFULLY!`)
