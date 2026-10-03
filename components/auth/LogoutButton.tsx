'use client'

import { createClient } from '@/lib/supabase-browser'

export default function LogoutButton() {

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  return (
    <button
      onClick={handleLogout}
      className="tactile-btn"
      style={{
        padding: '6px 14px',
        background: 'rgba(13, 27, 42, 0.55)',
        border: '1px solid var(--navy-lt)',
        borderRadius: 4,
        color: 'var(--gray)',
        fontFamily: 'Raleway, sans-serif',
        fontWeight: 600,
        fontSize: 12,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      Sign Out
    </button>
  )
}
