'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

type Mode = 'login' | 'signup' | 'reset'

interface AuthFormProps {
  mode: Mode
  redirectPath?: string
  coachId?: string
  coachName?: string
  initialError?: string
}

interface ValidationErrors {
  email?: string
  password?: string
}

function formatAuthErrorMessage(rawMessage: string, provider?: 'google' | 'apple') {
  const msg = rawMessage.toLowerCase()

  if (msg.includes('rate limit') || msg.includes('too many requests') || msg.includes('over_email_send_rate_limit')) {
    return 'Email rate limit reached. Please wait a minute, then try again. You can also sign in with 1-click Google or Apple right now.'
  }

  if (msg.includes('unsupported provider') || msg.includes('provider is not enabled') || msg.includes('provider_disabled')) {
    if (provider === 'apple' || msg.includes('apple')) {
      return 'Apple sign-in is not enabled in Supabase yet. Please enable Apple under Authentication -> Providers in Supabase, or continue with Google/email.'
    }
    return 'Google sign-in is not enabled in Supabase yet. Enable Google under Authentication -> Providers in Supabase, or use email/password for now.'
  }

  if (msg.includes('access_denied') || msg.includes('user_cancelled') || msg.includes('cancelled')) {
    return 'Sign-in was cancelled. Please try again.'
  }

  if (msg.includes('invalid login credentials')) {
    return 'Invalid email or password. If you need to reset your password, click "Forgot password?" below.'
  }

  return rawMessage
}

function validateEmail(email: string): string | undefined {
  if (!email.trim()) {
    return 'Email is required'
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.trim())) {
    return 'Enter a valid email address'
  }
}

function validatePassword(password: string, mode: Mode): string | undefined {
  if (!password) {
    return 'Password is required'
  }
  if (mode === 'signup') {
    if (password.length < 8) {
      return 'Password must be at least 8 characters'
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain an uppercase letter'
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain a number'
    }
  }
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  background: 'rgba(14, 23, 36, 0.92)',
  border: '1px solid rgba(197, 160, 89, 0.28)',
  borderRadius: 6,
  color: '#FFFFFF',
  fontFamily: 'Raleway, sans-serif',
  fontWeight: 400,
  fontSize: 14.5,
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
}

const errorStyle: React.CSSProperties = {
  border: '1.5px solid var(--error, #F87171)',
  boxShadow: '0 0 10px rgba(248, 113, 113, 0.25)',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'Raleway, sans-serif',
  fontWeight: 700,
  fontSize: 11,
  color: 'var(--gold-lt)',
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  marginBottom: 6,
}

const errorMessageStyle: React.CSSProperties = {
  fontFamily: 'Raleway, sans-serif',
  fontSize: 11.5,
  fontWeight: 600,
  color: 'var(--error, #F87171)',
  margin: '4px 0 0 0',
}

const oauthButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  background: 'rgba(14, 23, 36, 0.88)',
  border: '1px solid rgba(197, 160, 89, 0.35)',
  borderRadius: 4,
  color: '#FFFFFF',
  fontFamily: 'Raleway, sans-serif',
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  transition: 'all 0.18s ease',
  boxSizing: 'border-box',
}

export default function AuthForm({
  mode: initialMode,
  redirectPath = '/dashboard',
  coachId,
  coachName,
  initialError,
}: AuthFormProps) {
  const resetCooldownMs = 30_000
  const [mode, setMode] = useState<Mode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoadingProvider, setOauthLoadingProvider] = useState<'google' | 'apple' | null>(null)
  const [error, setError] = useState<string | null>(initialError ? formatAuthErrorMessage(initialError) : null)
  const [fieldErrors, setFieldErrors] = useState<ValidationErrors>({})
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const [resetCooldownEndsAt, setResetCooldownEndsAt] = useState<number | null>(null)
  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    if (!resetCooldownEndsAt) return

    const interval = setInterval(() => {
      setNowMs(Date.now())
    }, 500)

    return () => clearInterval(interval)
  }, [resetCooldownEndsAt])

  const resetCooldownSeconds = resetCooldownEndsAt
    ? Math.max(0, Math.ceil((resetCooldownEndsAt - nowMs) / 1000))
    : 0
  const isResetCooldownActive = mode === 'reset' && resetCooldownSeconds > 0

  function validateForm(): boolean {
    const newErrors: ValidationErrors = {}

    const emailError = validateEmail(email)
    if (emailError) newErrors.email = emailError

    if (mode !== 'reset') {
      const passwordError = validatePassword(password, mode)
      if (passwordError) newErrors.password = passwordError
    }

    setFieldErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleResetRequest(e: React.FormEvent) {
    e.preventDefault()

    if (isResetCooldownActive) {
      return
    }

    const emailError = validateEmail(email)
    if (emailError) {
      setFieldErrors({ email: emailError })
      return
    }

    setLoading(true)
    setError(null)

    const cleanEmail = email.trim().toLowerCase()
    const res = await fetch('/api/auth/password-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail }),
    })

    if (!res.ok) {
      const raw = await res.text()
      let apiError: string | null = null

      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Record<string, unknown>
          apiError = typeof parsed.error === 'string' ? parsed.error : null
        } catch {
          apiError = null
        }
      }

      setError(apiError ?? 'Unable to send reset email right now. Please try again in a minute.')
      setLoading(false)
      return
    }

    setResetEmailSent(true)
    setResetCooldownEndsAt(Date.now() + resetCooldownMs)
    setNowMs(Date.now())
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!validateForm()) {
      setError(null)
      return
    }

    if (mode === 'reset') {
      return handleResetRequest(e)
    }

    setLoading(true)
    setError(null)
    setFieldErrors({})

    const supabase = createClient()
    const cleanEmail = email.trim().toLowerCase()

    if (mode === 'signup') {
      const callbackUrl = new URL('/auth/callback', window.location.origin)
      callbackUrl.searchParams.set('next', redirectPath)
      if (coachId) {
        callbackUrl.searchParams.set('coach', coachId)
      }

      const { error, data } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo: callbackUrl.toString(),
        },
      })
      if (error) {
        setError(formatAuthErrorMessage(error.message))
        setLoading(false)
        return
      }

      // Supabase returns an empty identities array when the user is already registered
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        setError('An account with this email already exists. Please sign in or click "Forgot password?" below to reset your password.')
        setLoading(false)
        return
      }

      if (data.session) {
        window.location.href = callbackUrl.pathname + callbackUrl.search
        return
      }

      // Email confirmation required
      setError('✓ Account created! Please check your email for a confirmation link to activate your access.')
      setLoading(false)
      return
    } else {
      const { error, data } = await supabase.auth.signInWithPassword({ email: cleanEmail, password })
      if (error) {
        setError(formatAuthErrorMessage(error.message))
        setLoading(false)
        return
      }

      let resolvedRedirectPath = redirectPath
      if (resolvedRedirectPath === '/dashboard' && data.user) {
        const isCoach =
          data.user.user_metadata?.surface_role === 'coach' ||
          data.user.email?.toLowerCase() === 'scott.gordon72@outlook.com'

        if (isCoach) {
          resolvedRedirectPath = '/coach'
        } else {
          try {
            const { data: profile } = await supabase
              .from('clients')
              .select('role')
              .eq('id', data.user.id)
              .maybeSingle()

            if (profile?.role === 'coach') {
              resolvedRedirectPath = '/coach'
            }
          } catch {
            // default to redirectPath if table lookup times out
          }
        }
      }

      // Hard navigation ensures fresh session cookies reach server components and avoids Next.js cache race conditions
      window.location.href = resolvedRedirectPath
      return
    }
  }

  async function handleOAuth(provider: 'google' | 'apple') {
    const supabase = createClient()
    setError(null)
    setFieldErrors({})
    setOauthLoadingProvider(provider)

    try {
      const callbackUrl = new URL('/auth/callback', window.location.origin)
      callbackUrl.searchParams.set('next', redirectPath)
      if (coachId) {
        callbackUrl.searchParams.set('coach', coachId)
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: callbackUrl.toString(),
          queryParams: provider === 'google' ? { access_type: 'offline', prompt: 'select_account' } : undefined,
        },
      })

      if (error) {
        setError(formatAuthErrorMessage(error.message, provider))
        setOauthLoadingProvider(null)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to initiate sign-in'
      setError(formatAuthErrorMessage(msg, provider))
      setOauthLoadingProvider(null)
    }
  }

  const isAnyLoading = loading || oauthLoadingProvider !== null

  // Reset email sent confirmation screen
  if (resetEmailSent) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, textAlign: 'center' }}>
        <p
          style={{
            fontFamily: 'Raleway, sans-serif',
            fontSize: 15,
            color: 'var(--success, #2ecc71)',
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          ✓ Check your email — we sent a reset link to <strong>{email}</strong>.
        </p>
        <p
          style={{
            fontFamily: 'Raleway, sans-serif',
            fontSize: 13,
            color: 'var(--gray)',
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          Click the link in the email to choose a new password. If it doesn&apos;t arrive in a few minutes, check your spam folder.
        </p>
        <button
          onClick={() => {
            setResetEmailSent(false)
            setMode('login')
            setEmail('')
            setPassword('')
          }}
          style={{
            padding: '12px',
            background: 'var(--navy-lt)',
            color: 'var(--gold)',
            border: '1px solid var(--navy-lt)',
            borderRadius: 2,
            fontFamily: 'Raleway, sans-serif',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Back to Sign In
        </button>
      </div>
    )
  }

  return (
    <div className="sgf-auth-form-shell" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ── OAuth 1-Click Fast Pass (Google & Apple) ── */}
      {mode !== 'reset' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {mode === 'signup' && coachId ? (
            <p
              style={{
                fontFamily: 'Raleway, sans-serif',
                fontSize: 12,
                color: 'var(--gray)',
                lineHeight: 1.5,
                margin: '0 0 4px',
              }}
            >
              This account will be attached to {coachName ?? 'your coach'}.
            </p>
          ) : null}

          {/* Google OAuth Button */}
          <button
            type="button"
            disabled={isAnyLoading}
            onClick={() => handleOAuth('google')}
            style={{
              ...oauthButtonStyle,
              opacity: isAnyLoading ? 0.7 : 1,
              cursor: isAnyLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {oauthLoadingProvider === 'google' ? (
              <span style={{ fontSize: 13, color: 'var(--gold-lt)' }}>Connecting to Google...</span>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Apple OAuth Button */}
          <button
            type="button"
            disabled={isAnyLoading}
            onClick={() => handleOAuth('apple')}
            style={{
              ...oauthButtonStyle,
              opacity: isAnyLoading ? 0.7 : 1,
              cursor: isAnyLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {oauthLoadingProvider === 'apple' ? (
              <span style={{ fontSize: 13, color: 'var(--gold-lt)' }}>Connecting to Apple...</span>
            ) : (
              <>
                <svg width="17" height="17" viewBox="0 0 170 170" fill="currentColor" aria-hidden="true" style={{ flexShrink: 0 }}>
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.67-7.81-11.96-14.34-5.87-8.91-10.45-19.11-13.73-30.59-3.28-11.48-4.92-22.18-4.92-32.1 0-14.57 3.75-26.71 11.23-36.43 7.49-9.72 17.02-14.7 28.58-14.96 4.57 0 9.77 1.25 15.6 3.75 5.82 2.5 9.74 3.79 11.73 3.87 1.85 0 5.87-1.33 12.06-3.98 6.19-2.66 11.24-3.87 15.15-3.64 12.83.65 23.01 5.38 30.53 14.2-11.3 6.85-16.83 16.32-16.6 28.42.22 9.57 3.81 17.56 10.77 23.97 6.96 6.42 15.11 10.05 24.45 10.91-2.17 6.31-4.89 12.56-8.16 18.75zm-33.15-113.68c0 7.39-2.72 14.3-8.16 20.73-5.98 6.85-13.15 10.77-21.52 11.75-.22-.98-.33-2.07-.33-3.26 0-7.39 2.83-14.52 8.48-21.39 2.93-3.59 6.47-6.53 10.6-8.81 4.13-2.28 8.04-3.48 11.73-3.59.11 1.52.2 3.04.2 4.57z" />
                </svg>
                <span>Continue with Apple</span>
              </>
            )}
          </button>

          {/* Elegant Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '6px 0 2px' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(197, 160, 89, 0.22)' }} />
            <span
              style={{
                fontFamily: 'Raleway, sans-serif',
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--gold-lt)',
              }}
            >
              Or with email
            </span>
            <div style={{ flex: 1, height: 1, background: 'rgba(197, 160, 89, 0.22)' }} />
          </div>
        </div>
      )}

      {/* ── Error Banner ── */}
      {error && (
        <div
          role="alert"
          style={{
            fontFamily: 'Raleway, sans-serif',
            fontSize: 13,
            color: 'var(--error, #ff6b6b)',
            margin: 0,
            padding: '12px',
            background: 'rgba(255, 107, 107, 0.12)',
            borderRadius: 4,
            border: '1px solid rgba(255, 107, 107, 0.4)',
            lineHeight: 1.5,
          }}
        >
          {error}
        </div>
      )}

      {/* ── Email & Password Form ── */}
      <form className="sgf-auth-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label htmlFor="email-input" style={labelStyle}>
            Email Address {fieldErrors.email && '*'}
          </label>
          <input
            id="email-input"
            type="email"
            value={email}
            disabled={isAnyLoading}
            onChange={e => {
              setEmail(e.target.value)
              if (fieldErrors.email) {
                const rest = { ...fieldErrors }
                delete rest.email
                setFieldErrors(rest)
              }
            }}
            onBlur={() => {
              const error = validateEmail(email)
              if (error) {
                setFieldErrors(prev => ({ ...prev, email: error }))
              }
            }}
            aria-invalid={!!fieldErrors.email}
            aria-describedby={fieldErrors.email ? 'email-error' : undefined}
            style={{
              ...inputStyle,
              ...(fieldErrors.email ? errorStyle : {}),
            }}
            placeholder="you@example.com"
          />
          {fieldErrors.email && (
            <div id="email-error" role="alert" style={errorMessageStyle}>
              {fieldErrors.email}
            </div>
          )}
        </div>

        {mode !== 'reset' && (
          <div>
            <label htmlFor="password-input" style={labelStyle}>
              Password {fieldErrors.password && '*'}
            </label>
            <input
              id="password-input"
              type="password"
              value={password}
              disabled={isAnyLoading}
              onChange={e => {
                setPassword(e.target.value)
                if (fieldErrors.password) {
                  const rest = { ...fieldErrors }
                  delete rest.password
                  setFieldErrors(rest)
                }
              }}
              onBlur={() => {
                const error = validatePassword(password, mode)
                if (error) {
                  setFieldErrors(prev => ({ ...prev, password: error }))
                }
              }}
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? 'password-error' : undefined}
              style={{
                ...inputStyle,
                ...(fieldErrors.password ? errorStyle : {}),
              }}
              placeholder="••••••••"
            />
            {fieldErrors.password && (
              <div id="password-error" role="alert" style={errorMessageStyle}>
                {fieldErrors.password}
              </div>
            )}
            {mode === 'signup' && !fieldErrors.password && password && (
              <div style={{ ...errorMessageStyle, color: 'var(--gray)', marginTop: 4 }}>
                ✓ Password meets requirements
              </div>
            )}
          </div>
        )}

        {mode === 'login' && (
          <div style={{ textAlign: 'right' }}>
            <button
              type="button"
              disabled={isAnyLoading}
              onClick={() => {
                setMode('reset')
                setPassword('')
                setError(null)
                setFieldErrors({})
              }}
              style={{
                fontFamily: 'Raleway, sans-serif',
                fontSize: 13,
                color: 'var(--gold)',
                textDecoration: 'none',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Forgot password?
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={isAnyLoading || Object.keys(fieldErrors).length > 0 || isResetCooldownActive}
          style={{
            padding: '13px',
            background:
              isAnyLoading || Object.keys(fieldErrors).length > 0 || isResetCooldownActive
                ? 'var(--navy-lt)'
                : 'var(--gold)',
            color:
              isAnyLoading || Object.keys(fieldErrors).length > 0 || isResetCooldownActive
                ? 'var(--gray)'
                : '#0D1B2A',
            border: 'none',
            borderRadius: 2,
            fontFamily: 'var(--font-sans, Raleway), sans-serif',
            fontSize: 13,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            cursor:
              isAnyLoading || Object.keys(fieldErrors).length > 0 || isResetCooldownActive
                ? 'not-allowed'
                : 'pointer',
            transition: 'background 0.15s',
          }}
        >
          {loading
            ? '...'
            : mode === 'login'
              ? 'Sign In'
              : mode === 'reset'
                ? isResetCooldownActive
                  ? `Resend in ${resetCooldownSeconds}s`
                  : 'Send Reset Link'
                : 'Create Account'}
        </button>

        {mode === 'reset' && isResetCooldownActive && (
          <p style={{ ...errorMessageStyle, color: 'var(--gray)', marginTop: 2 }}>
            Please wait before requesting another reset email.
          </p>
        )}
      </form>

      {/* ── Mode Switching & Legal Links ── */}
      {mode === 'reset' ? (
        <button
          type="button"
          onClick={() => {
            setMode('login')
            setEmail('')
            setPassword('')
            setError(null)
            setFieldErrors({})
          }}
          style={{
            padding: 0,
            textAlign: 'center',
            fontFamily: 'Raleway, sans-serif',
            fontSize: 13,
            color: 'var(--gold)',
            textDecoration: 'none',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          ← Back to Sign In
        </button>
      ) : (
        <>
          <p
            style={{
              textAlign: 'center',
              fontFamily: 'Raleway, sans-serif',
              fontSize: 13.5,
              color: 'var(--gray)',
              margin: '2px 0 0',
            }}
          >
            {mode === 'login' ? (
              <>
                Don&apos;t have an account?{' '}
                <a href="/auth/signup" style={{ color: 'var(--gold)', textDecoration: 'none', fontWeight: 600 }}>
                  Sign up
                </a>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <a href="/auth/login" style={{ color: 'var(--gold)', textDecoration: 'none', fontWeight: 600 }}>
                  Sign in
                </a>
              </>
            )}
          </p>

          <p
            style={{
              textAlign: 'center',
              fontFamily: 'Raleway, sans-serif',
              fontSize: 11,
              color: 'rgba(197, 160, 89, 0.7)',
              lineHeight: 1.5,
              margin: '6px 0 0',
            }}
          >
            By continuing, you agree to Gordon Athletic Advisory&apos;s{' '}
            <a href="/terms" target="_blank" rel="noreferrer" style={{ color: 'var(--gold-lt)', textDecoration: 'underline' }}>
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" target="_blank" rel="noreferrer" style={{ color: 'var(--gold-lt)', textDecoration: 'underline' }}>
              Privacy Policy
            </a>
            .
          </p>
        </>
      )}
    </div>
  )
}
