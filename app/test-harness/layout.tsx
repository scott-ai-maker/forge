import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'

/**
 * Defense-in-depth server layout guard covering all `/test-harness/*` pages (#39).
 * Complements `proxy.ts` so dev harnesses can never render in production even if
 * middleware rules are bypassed or altered.
 */
export default function TestHarnessLayout({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV === 'production') {
    notFound()
  }
  return <>{children}</>
}
