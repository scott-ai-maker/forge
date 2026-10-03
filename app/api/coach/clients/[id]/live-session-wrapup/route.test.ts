import { describe, expect, it } from 'vitest'
import { POST } from './route'
import { POST as ConcludePOST } from '../live-session-conclude/route'

describe('Live Session Wrapup Route Alias', () => {
  it('re-exports POST handler from live-session-conclude', () => {
    expect(POST).toBe(ConcludePOST)
  })
})
