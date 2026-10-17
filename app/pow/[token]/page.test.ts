import { describe, expect, it } from 'vitest'
import { generateMetadata } from './page'
import { buildProofOfWorkDossier, encodeProofOfWorkToken } from '@/lib/proof-of-work-dossier-engine'

describe('Proof of Work Public Share Page', () => {
  it('generates dynamic OpenGraph metadata for valid tokens', async () => {
    const dossier = buildProofOfWorkDossier({
      athleteName: 'David Sterling',
      sanctuaryFocusScore: 99,
    })
    const token = encodeProofOfWorkToken(dossier)

    const meta = await generateMetadata({
      params: Promise.resolve({ token }),
    })

    expect(meta.title).toContain('David Sterling')
    expect(meta.title).toContain('Forge Athletic')
    expect(meta.description).toContain(dossier.totalTonnageLbs.toLocaleString())
  })

  it('provides safe fallback metadata for invalid tokens', async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ token: 'invalid-token' }),
    })

    expect(meta.title).toContain('Forge Athlete')
    expect(meta.description).toContain('Evidence-led clinical sports science')
  })
})
