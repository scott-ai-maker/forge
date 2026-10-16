import { describe, it, expect } from 'vitest'
import { generateQrCodeSvg, generateQrCodeDataUrl } from '@/lib/qr-code'

describe('lib/qr-code', () => {
  it('generates a valid SVG string with custom colors', async () => {
    const svg = await generateQrCodeSvg('https://forgeathletic.com/r/FORGE-TEST', {
      width: 200,
      darkColor: '#C5A059',
      lightColor: '#080E14',
    })

    expect(svg).toBeDefined()
    expect(svg).toContain('<svg')
    expect(svg).toContain('</svg>')
  })

  it('generates a valid data URL png string', async () => {
    const dataUrl = await generateQrCodeDataUrl('https://forgeathletic.com/r/FORGE-TEST')

    expect(dataUrl).toBeDefined()
    expect(dataUrl.startsWith('data:image/png;base64,')).toBe(true)
  })
})
