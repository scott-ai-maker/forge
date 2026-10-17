import { describe, expect, it } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('ProofOfWorkDossierModal Component Structure & Tokens', () => {
  const componentPath = path.resolve(process.cwd(), 'components/fitness/ProofOfWorkDossierModal.tsx')

  it('verifies component file exists', () => {
    expect(fs.existsSync(componentPath)).toBe(true)
  })

  it('contains Anti-Social proof of work and clinical periodization tokens', () => {
    const source = fs.readFileSync(componentPath, 'utf-8')
    expect(source).toContain('Proof of Work Performance Dossier')
    expect(source).toContain('ZERO SOCIAL MEDIA')
    expect(source).toContain('Compound Overload Vault')
    expect(source).toContain('Sanctuary Mode Autonomic &amp; Neuro-Discipline Record')
    expect(source).toContain('Clinical S.O.A.P. Documentation')
    expect(source).toContain('NASM Master Trainer Candidate · CPT® · CES®')
    expect(source).toContain('Export Clinical PDF / Print')
    expect(source).toContain('@media print')
    expect(source).toContain('Gift 1 of 3 Founding Member Passes')
  })
})
