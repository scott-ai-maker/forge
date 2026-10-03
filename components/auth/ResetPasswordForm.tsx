'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import type { EmailOtpType } from '@supabase/supabase-js'

function formatAuthErrorMessage(rawMessage: string) {
  const msg = rawMessage.toLowerCase()

  if (msg.includes('rate limit') || msg.includes('too many requests') || msg.includes('over_email_send_rate_limit')) {
    return 'Email rate limit reached. Please wait a minute and try again.'
  }

  if (msg.includes('invalid') || msg.includes('expired')) {
    return 'This password reset link is invalid or has expired. Please request a new one below.'
  }

  return rawMessage
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  background: 'var(--navy)',
  border: '1px solid var(--navy-lt)',
  borderRadius: 2,
  color: 'var(--white)',
  fontFamily: 'Raleway, sans-serif',
  fontWeight: 300,
  fontSize: 15,
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'Raleway, sans-serif',
  fontWeight: 600,
  fontSize: 12,
  color: 'var(--gray)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: 6,
}

interface ResetPasswordFormProps {
  forceChange?: boolean
  nextPath?: string
}

function validatePassword(password: string): string | undefined {
  if (!password) return 'Password is required'
  if (password.length < 8) return 'Password must be at least 8 characters'
  if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter'
  if (!/[0-9]/.test(password)) return 'Password must contain a number'
}

export default function ResetPasswordForm({ forceChange = false, nextPath = '/dashboard' }: ResetPasswordFormProps) {
  const router = useRouter()
  const [requestEmail, setRequestEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSessionValid, setIsSessionValid] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [resetEmailSent, setResetEmailSent] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient()

      // Check if URL has query/hash tokens for password recovery
      const params = new URLSearchParams(window.location.search)
      const hashParams = new URLSearchParams(
        window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash
      )
      const code = params.get('code')
      const tokenHash = params.get('token_hash') ?? hashParams.get('token_hash')
      const type = params.get('type') ?? hashParams.get('type')

      // Pre-fill email from query param if available
      const emailParam = params.get('email')
      if (emailParam) {
        setRequestEmail(emailParam)
      }

      // If there are explicit recovery tokens in the URL, verify them
      if (tokenHash && type) {
        try {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as EmailOtpType,
          })
          if (!verifyError) {
            setIsSessionValid(true)
            setIsChecking(false)
            return
          }
        } catch {
          // Token verification failed or expired
        }
      } else if (code) {
        try {
          const { error: codeError } = await supabase.auth.exchangeCodeForSession(code)
          if (!codeError) {
            setIsSessionValid(true)
            setIsChecking(false)
            return
          }
        } catch {
          // Code exchange failed
        }
      }

      // Check for active authenticated session
      const { data: sessionData } = await supabase.auth.getSession()
      if (sessionData.session || forceChange) {
        setIsSessionValid(true)
        setIsChecking(false)
        return
      }

      // If no token in URL and no active session, switch to "Request Reset" mode
      setIsSessionValid(false)
      setIsChecking(false)
    }

    void checkSession()
  }, [forceChange])

  // Handles requesting a new reset link via email
  async function handleSendResetEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!requestEmail.trim()) {
      setError('Please enter your email address.')
      return
    }

    setLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const res = await fetch('/api/auth/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: requestEmail.trim() }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Unable to send password reset email. Please try again.')
        setLoading(false)
        return
      }

      setResetEmailSent(true)
      setSuccessMessage('✓ If an account exists for this email, a password reset link has been sent. Please check your inbox and spam folder.')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Handles setting the new password once authenticated via recovery link
  async function handleChangePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMessage(null)

    const validationError = validatePassword(newPassword)
    if (validationError) {
      setError(validationError)
      setLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
      data: { must_reset_password: false },
    })

    if (updateError) {
      setError(formatAuthErrorMessage(updateError.message))
      setLoading(false)
      return
    }

    // Prefer an explicit next path from the URL, otherwise determine destination by role.
    let redirectPath = nextPath && nextPath.startsWith('/') ? nextPath : '/dashboard'
    try {
      const { data } = await supabase.auth.getUser()

      if (nextPath === '/dashboard' && data.user?.id) {
        const { data: profile } = await supabase
          .from('clients')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle()

        if (profile?.role === 'coach') {
          redirectPath = '/coach'
        }
      }
    } catch {
      // Fall back to the default route.
    }

    setSuccessMessage('✓ Password updated successfully! Redirecting to your dashboard...')
    setLoading(false)

    setTimeout(() => {
      router.push(redirectPath)
      router.refresh()
    }, 1200)
  }

  if (isChecking) {
    return (
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <p
          style={{
            fontFamily: 'Raleway, sans-serif',
            fontSize: 14,
            color: 'var(--gray)',
            margin: 0,
          }}
        >
          Verifying security session...
        </p>
      </div>
    )
  }

  // ── MODE 1: Request Reset Link (No Session) ──
  if (!isSessionValid && !forceChange) {
    return (
      <form onSubmit={handleSendResetEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p
          style={{
            fontFamily: 'Raleway, sans-serif',
            fontSize: 14,
            color: 'var(--gray)',
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          Enter the email address associated with your Gordon Athletic Advisory account. We&apos;ll email you a secure link to reset your password.
        </p>

        <div>
          <label htmlFor="reset-email" style={labelStyle}>
            Your Email Address
          </label>
          <input
            id="reset-email"
            type="email"
            value={requestEmail}
            onChange={e => setRequestEmail(e.target.value)}
            required
            style={inputStyle}
            placeholder="athlete@example.com"
            autoComplete="email"
            disabled={loading || resetEmailSent}
          />
        </div>

        {error && (
          <div
            role="alert"
            style={{
              fontFamily: 'Raleway, sans-serif',
              fontSize: 13,
              color: 'var(--error, #ff6b6b)',
              margin: 0,
              padding: '10px 14px',
              background: 'rgba(255, 107, 107, 0.12)',
              borderRadius: 4,
              border: '1px solid var(--error, #ff6b6b)',
            }}
          >
            {error}
          </div>
        )}

        {successMessage && (
          <div
            style={{
              fontFamily: 'Raleway, sans-serif',
              fontSize: 13,
              color: 'var(--success, #2ecc71)',
              margin: 0,
              padding: '12px 14px',
              background: 'rgba(46, 204, 113, 0.12)',
              borderRadius: 4,
              border: '1px solid var(--success, #2ecc71)',
              lineHeight: 1.5,
            }}
          >
            {successMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !requestEmail.trim() || resetEmailSent}
          style={{
            padding: '13px',
            background:
              loading || !requestEmail.trim() || resetEmailSent ? 'var(--navy-lt)' : 'var(--gold)',
            color: loading || !requestEmail.trim() || resetEmailSent ? 'var(--gray)' : '#0D1B2A',
            border: 'none',
            borderRadius: 2,
            fontFamily: 'var(--font-sans, Raleway), sans-serif',
            fontSize: 13,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            cursor: loading || !requestEmail.trim() || resetEmailSent ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s',
          }}
        >
          {loading ? 'Sending Link...' : resetEmailSent ? 'Link Sent ✓' : 'Send Password Reset Link'}
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'center', marginTop: 6 }}>
          <a
            href="/auth/login"
            style={{
              fontFamily: 'Raleway, sans-serif',
              fontSize: 13,
              color: 'var(--gold)',
              textDecoration: 'none',
            }}
          >
            ← Back to Sign In
          </a>
          <a
            href="/auth/login?next=/coach"
            style={{
              fontFamily: 'Raleway, sans-serif',
              fontSize: 12,
              color: 'var(--gold-lt)',
              textDecoration: 'none',
              opacity: 0.85,
            }}
          >
            Coach Console Access & 1-Click Fast Pass →
          </a>
        </div>
      </form>
    )
  }

  // ── MODE 2: Set New Password (Valid Session from Email Link) ──
  return (
    <form onSubmit={handleChangePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p
        style={{
          fontFamily: 'Raleway, sans-serif',
          fontSize: 14,
          color: 'var(--gray)',
          margin: 0,
          lineHeight: 1.6,
        }}
      >
        {forceChange
          ? 'Update your password to continue accessing your account.'
          : 'Enter your new password below. Make sure it is secure and different from your previous password.'}
      </p>

      <div>
        <label htmlFor="new-password" style={labelStyle}>
          New Password
        </label>
        <input
          id="new-password"
          type="password"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          required
          style={inputStyle}
          placeholder="••••••••"
          autoComplete="new-password"
        />
      </div>

      <div>
        <label htmlFor="confirm-password" style={labelStyle}>
          Confirm Password
        </label>
        <input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          required
          style={inputStyle}
          placeholder="••••••••"
          autoComplete="new-password"
        />
      </div>

      {newPassword && (
        <ul
          style={{
            fontFamily: 'Raleway, sans-serif',
            fontSize: 12,
            color: 'var(--gray)',
            margin: '8px 0',
            paddingLeft: 20,
            listStyle: 'none',
          }}
        >
          <li style={{ marginBottom: 4 }}>
            {newPassword.length >= 8 ? '✓' : '○'} At least 8 characters
          </li>
          <li style={{ marginBottom: 4 }}>
            {/[A-Z]/.test(newPassword) ? '✓' : '○'} One uppercase letter
          </li>
          <li>
            {/[0-9]/.test(newPassword) ? '✓' : '○'} One number
          </li>
        </ul>
      )}

      {error && (
        <p
          style={{
            fontFamily: 'Raleway, sans-serif',
            fontSize: 13,
            color: 'var(--error, #ff6b6b)',
            margin: 0,
            padding: '8px 12px',
            background: 'rgba(255, 107, 107, 0.1)',
            borderRadius: 2,
            border: '1px solid var(--error, #ff6b6b)',
          }}
        >
          {error}
        </p>
      )}

      {successMessage && (
        <p
          style={{
            fontFamily: 'Raleway, sans-serif',
            fontSize: 13,
            color: 'var(--success, #2ecc71)',
            margin: 0,
            padding: '8px 12px',
            background: 'rgba(46, 204, 113, 0.1)',
            borderRadius: 2,
            border: '1px solid var(--success, #2ecc71)',
          }}
        >
          {successMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || !newPassword || !confirmPassword}
        style={{
          padding: '13px',
          background:
            loading || !newPassword || !confirmPassword ? 'var(--navy-lt)' : 'var(--gold)',
          color: loading || !newPassword || !confirmPassword ? 'var(--gray)' : '#0D1B2A',
          border: 'none',
          borderRadius: 2,
          fontFamily: 'var(--font-sans, Raleway), sans-serif',
          fontSize: 13,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          cursor: loading || !newPassword || !confirmPassword ? 'not-allowed' : 'pointer',
          transition: 'background 0.15s',
        }}
      >
        {loading ? 'Updating Password...' : 'Update Password'}
      </button>

      <a
        href="/auth/login"
        style={{
          textAlign: 'center',
          fontFamily: 'Raleway, sans-serif',
          fontSize: 13,
          color: 'var(--gold)',
          textDecoration: 'none',
        }}
      >
        Back to Sign In
      </a>
    </form>
  )
}
