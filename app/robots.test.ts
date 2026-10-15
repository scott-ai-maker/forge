import { describe, it, expect } from 'vitest'
import robots from './robots'

describe('app/robots.ts', () => {
  it('generates valid robots configuration with all public routes allowed', () => {
    const config = robots()
    expect(config).toBeDefined()
    expect(config.sitemap).toContain('sitemap.xml')

    const rules = Array.isArray(config.rules) ? config.rules : [config.rules]
    const wildcardRule = rules.find(r => r.userAgent === '*')
    expect(wildcardRule).toBeDefined()

    const allow = Array.isArray(wildcardRule?.allow)
      ? wildcardRule?.allow
      : [wildcardRule?.allow]

    expect(allow).toContain('/')
    expect(allow).toContain('/packages')
    expect(allow).not.toContain('/credentials')
    expect(allow).toContain('/audit')
    expect(allow).toContain('/corporate')
    expect(allow).toContain('/apps')
    expect(allow).toContain('/exercises/')

    const disallow = Array.isArray(wildcardRule?.disallow)
      ? wildcardRule?.disallow
      : [wildcardRule?.disallow]

    expect(disallow).toContain('/coach/')
    expect(disallow).toContain('/dashboard/')
    expect(disallow).toContain('/api/')
    expect(disallow).toContain('/preview/')
    expect(disallow).toContain('/credentials')
    expect(disallow).toContain('/documents/')
  })
})
