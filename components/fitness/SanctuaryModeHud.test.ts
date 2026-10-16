import { describe, expect, it } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('SanctuaryModeHud Component Structure & Tokens', () => {
  const componentPath = path.resolve(process.cwd(), 'components/fitness/SanctuaryModeHud.tsx')

  it('verifies component file exists', () => {
    expect(fs.existsSync(componentPath)).toBe(true)
  })

  it('contains Sanctuary Mode and Zero Distraction branding tokens', () => {
    const source = fs.readFileSync(componentPath, 'utf-8')
    expect(source).toContain('SANCTUARY MODE')
    expect(source).toContain('ZERO DISTRACTIONS')
    expect(source).toContain('NO SOCIAL MEDIA')
    expect(source).toContain('The gym is sacred ground · Hands on the bar')
    expect(source).toContain('Box 4x4 (Power Reset)')
    expect(source).toContain('4-2-6 (Vagal Recovery)')
    expect(source).toContain('Cardiac Drift (Zone 2)')
    expect(source).toContain('Resynthesizing phosphagen (ATP-CP)')
  })
})
