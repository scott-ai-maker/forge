import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ShieldCheck } from 'lucide-react'
import AuthForm from '@/components/auth/AuthForm'
import { createClient } from '@/lib/supabase-server'
import { isEnterpriseLeaderEmail } from '@/lib/authz'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Executive & Leadership Sign In | Forge Athletic',
  description:
    'Dedicated sign-in portal for Forge Athletic executive leadership and enterprise operations.',
  robots: {
    index: false,
    follow: false,
  },
}

type EnterpriseLoginProps = {
  searchParams: Promise<{
    error?: string | string[]
    error_description?: string | string[]
  }>
}

export default async function EnterpriseLoginPage({ searchParams }: EnterpriseLoginProps) {
  const resolved = await searchParams
  const rawError = resolved.error_description || resolved.error
  const initialError = Array.isArray(rawError) ? rawError[0] : rawError

  // If already signed in as authorized leadership, go straight to /enterprise
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user && isEnterpriseLeaderEmail(user.email)) {
      redirect('/enterprise')
    }
  } catch {
    // Allow rendering login form if Supabase session check is unavailable
  }

  return (
    <main
      id="main-content"
      className="min-h-dvh bg-[#060A12] text-zinc-100"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
      }}
    >
      <div className="w-full max-w-[440px]">
        <div className="mb-6 flex flex-col items-center text-center">
          <Link href="/" aria-label="Forge Athletic home" className="mb-4 inline-block">
            <Image
              src="/images/brand/forge-crest-mark.png"
              alt="Forge Athletic"
              width={84}
              height={84}
              priority
              className="rounded-2xl border border-amber-400/35 shadow-[0_12px_32px_rgba(0,0,0,0.6)]"
            />
          </Link>

          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/35 bg-amber-400/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-amber-300">
            <ShieldCheck size={12} aria-hidden="true" />
            <span>Dedicated Executive &amp; Team Portal</span>
          </div>

          <h1 className="mt-3 font-serif text-2xl font-bold tracking-wide text-white">
            FORGE ATHLETIC LEADERSHIP
          </h1>
          <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-zinc-400">
            Separate from athlete and clinical coach logins. Sign in to access live Executive KPI
            dashboards, zero-PII business telemetry, and your AI Advisory Board.
          </p>
        </div>

        <div className="rounded-2xl border border-amber-400/25 bg-[#0C1322] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.65)] sm:p-6">
          <AuthForm
            mode="login"
            redirectPath="/enterprise"
            initialError={initialError}
            publicSignupOpen={false}
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-xs text-zinc-400">
          <Link href="/auth/login" className="underline-offset-4 hover:text-amber-300 hover:underline">
            Athlete &amp; Coach Sign In
          </Link>
          <span aria-hidden="true" className="text-zinc-600">
            ·
          </span>
          <Link href="/" className="underline-offset-4 hover:text-amber-300 hover:underline">
            Back to Forge Athletic
          </Link>
        </div>
      </div>
    </main>
  )
}
