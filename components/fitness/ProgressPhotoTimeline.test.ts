import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('ProgressPhotoTimeline Attire Standards & Clinical Acceptance Policy', () => {
  const componentPath = path.resolve(__dirname, 'ProgressPhotoTimeline.tsx')
  const content = fs.readFileSync(componentPath, 'utf-8')

  it('enforces Forge Athletic Photo Attire Standards disclosure card', () => {
    expect(content).toContain('Forge Athletic Photo Attire Standards')
    expect(content).toContain('Fitted athletic apparel required (sports bra + athletic shorts/tights for women; fitted athletic shorts + fitted top for men)')
    expect(content).toContain('Baggy sweatpants, oversized hoodies, casual street clothing, or inappropriate garments will not be accepted.')
  })

  it('mandates client confirmation before photo upload or body fat estimation', () => {
    expect(content).toContain('attireConfirmed')
    expect(content).toContain('I confirm this photo meets Forge Athletic Attire Standards (fitted athletic wear, visible waistline, no baggy clothing).')
    expect(content).toContain('Please verify that your photo complies with Forge Athletic Attire Standards (fitted athletic apparel, visible natural waistline and limb contours).')
    expect(content).toContain('Please verify that your photo complies with Forge Athletic Attire Standards (fitted athletic apparel, visible waistline, no baggy clothes).')
  })

  it('strictly upholds Forge Athletic brand identity (never GAA or Gordon Athletic Advisory)', () => {
    expect(content).not.toContain('GAA')
    expect(content).not.toContain('Gordon Athletic Advisory')
    expect(content).not.toContain('Gordon Athletic')
    expect(content).toContain('Forge Athletic')
  })
})
