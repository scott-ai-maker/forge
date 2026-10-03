import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ForgeBrandMark from './ForgeBrandMark'

describe('ForgeBrandMark SVG Component', () => {
  it('renders SVG brand mark to static HTML with default dimensions', () => {
    const html = renderToStaticMarkup(React.createElement(ForgeBrandMark))
    expect(html).toContain('<svg')
    expect(html).toContain('width="48"')
    expect(html).toContain('height="48"')
    expect(html).toContain('viewBox="0 0 100 100"')
  })

  it('renders SVG brand mark with custom size and no glow', () => {
    const html = renderToStaticMarkup(React.createElement(ForgeBrandMark, { size: 64, withGlow: false }))
    expect(html).toContain('width="64"')
    expect(html).toContain('height="64"')
  })

  it('contains the kinetic anvil foundation and F-monogram vectors in source', () => {
    const source = fs.readFileSync(path.resolve(process.cwd(), 'components/ui/ForgeBrandMark.tsx'), 'utf-8')
    expect(source).toContain('Kinetic Forge Gradient')
    expect(source).toContain('Heavy Foundation Base')
    expect(source).toContain('Vertical Spine')
  })
})

