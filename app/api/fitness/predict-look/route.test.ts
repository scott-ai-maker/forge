import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { GET, POST } from './route'

describe('Retired /api/fitness/predict-look endpoint (410 Gone)', () => {
  it('returns 410 Gone with no-store headers on POST and performs zero external image synthesis', async () => {
    const res = await POST()
    expect(res.status).toBe(410)
    expect(res.headers.get('Cache-Control')).toContain('no-store')

    const body = await res.json()
    expect(body.code).toBe('PREDICT_LOOK_RETIRED')
    expect(body.error).toContain('permanently retired')
  })

  it('returns 410 Gone with no-store headers on GET', async () => {
    const res = await GET()
    expect(res.status).toBe(410)
    expect(res.headers.get('Cache-Control')).toContain('no-store')
  })

  it('confirms lib/leonardo.ts is permanently removed from the repository', () => {
    const leonardoPath = path.join(process.cwd(), 'lib/leonardo.ts')
    expect(fs.existsSync(leonardoPath)).toBe(false)
  })
})
