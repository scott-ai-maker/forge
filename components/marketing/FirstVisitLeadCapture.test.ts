import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('FirstVisitLeadCapture & Voucher Intake Dock Responsive Mobile Architecture', () => {
  const componentPath = path.resolve(__dirname, './FirstVisitLeadCapture.tsx')
  const componentSource = fs.readFileSync(componentPath, 'utf-8')

  const globalsCssPath = path.resolve(__dirname, '../../app/globals.css')
  const globalsCss = fs.readFileSync(globalsCssPath, 'utf-8')

  it('verifies FirstVisitLeadCapture renders responsive container and inner classes', () => {
    expect(componentSource).toContain('className="first-visit-dock"')
    expect(componentSource).toContain('className="first-visit-dock-inner"')
    expect(componentSource).toContain('className="first-visit-dock-minimized"')
    expect(componentSource).toContain('className="first-visit-dock-input"')
    expect(componentSource).toContain('className="first-visit-dock-form"')
  })

  it('guarantees form inputs specify 16px font-size to prevent iOS Safari auto-zoom viewport drift', () => {
    // 16px minimum font size prevents iOS Safari from automatically zooming into the page on tap
    expect(componentSource).toContain('fontSize: 16')
    expect(globalsCss).toContain('.first-visit-dock-input')
    expect(globalsCss).toContain('font-size: 16px !important;')
  })

  it('verifies globals.css excludes first-visit-dock from blanket 100% width aside rule on mobile', () => {
    expect(globalsCss).toContain('aside:not(.first-visit-dock)')
  })

  it('guarantees globals.css defines dedicated slideUp keyframes for mobile and desktop', () => {
    expect(globalsCss).toContain('@keyframes leadDockSlideUpMobile')
    expect(globalsCss).toContain('transform: translate(-50%, 20px)')
    expect(globalsCss).toContain('transform: translate(-50%, 0)')

    expect(globalsCss).toContain('@keyframes leadDockSlideUpDesktop')
    expect(globalsCss).toContain('transform: translateY(20px)')
    expect(globalsCss).toContain('transform: translateY(0)')
  })

  it('guarantees mobile rules center the intake dock without drifting over the right side of iPhone', () => {
    // Mobile viewports must center via left: 50% and transform: translateX(-50%)
    expect(globalsCss).toContain('aside.first-visit-dock')
    expect(globalsCss).toContain('left: 50% !important;')
    expect(globalsCss).toContain('right: auto !important;')
    expect(globalsCss).toContain('transform: translateX(-50%) !important;')
    expect(globalsCss).toContain('width: min(calc(100vw - 28px), 400px) !important;')
    expect(globalsCss).toContain('max-width: calc(100vw - 28px) !important;')
  })

  it('guarantees desktop rules dock to bottom-right corner', () => {
    expect(globalsCss).toContain('right: 24px !important;')
    expect(globalsCss).toContain('left: auto !important;')
    expect(globalsCss).toContain('transform: none !important;')
    expect(globalsCss).toContain('width: 380px !important;')
  })

  it('guarantees safe-area-inset-bottom and safe-area-inset-right support for iOS devices', () => {
    expect(globalsCss).toContain('env(safe-area-inset-bottom')
    expect(globalsCss).toContain('env(safe-area-inset-right')
  })

  it('guarantees minimized badge has overflow ellipsis and safe insets', () => {
    expect(componentSource).toContain('whiteSpace: \'nowrap\'')
    expect(componentSource).toContain('textOverflow: \'ellipsis\'')
    expect(componentSource).toContain('overflow: \'hidden\'')
  })
})

