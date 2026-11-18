import { describe, expect, it } from 'vitest'
import { generateMetadata } from './page'
import { buildProofOfWorkDossier, encodeProofOfWorkToken } from '@/lib/proof-of-work-dossier-engine'

describe('Proof of Work Public Share Page (Locked Privacy Gate)', () => {
  it('never reflects athlete name, tonnage, or coaching notes from Base64 URL tokens in OpenGraph metadata', async () => {
    const dossier = buildProofOfWorkDossier({
      athleteName: 'David Sterling',
      sanctuaryFocusScore: 99,
    })
    const token = encodeProofOfWorkToken(dossier)

    const meta = await generateMetadata({
      params: Promise.resolve({ token }),
    })

    expect(meta.title).toContain('Forge Athletic')
    expect(meta.title).not.toContain('David Sterling')
    expect(String(meta.description)).not.toContain('David Sterling')
    expect(String(meta.description)).not.toContain(dossier.totalTonnageLbs.toLocaleString())
  })

  it('provides static noindex metadata for invalid or arbitrary tokens', async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ token: 'invalid-token' }),
    })

    expect(meta.title).toContain('Forge Athletic')
    expect(meta.robots).toMatchObject({ index: false, follow: false, nocache: true })
  })
})
