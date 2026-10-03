import Link from 'next/link'

export default function NotFound() {
  return (
    <main
      id="main-content"
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at 50% 20%, rgba(197, 160, 89, 0.08) 0%, transparent 70%), var(--navy)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          maxWidth: '520px',
          width: '100%',
          textAlign: 'center',
          background: 'rgba(14, 23, 36, 0.85)',
          border: '1px solid rgba(197, 160, 89, 0.3)',
          borderRadius: '8px',
          padding: '40px 28px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(197, 160, 89, 0.05)',
        }}
      >
        <h1
          className="font-serif gold-gradient-text"
          style={{
            fontSize: '64px',
            letterSpacing: '0.06em',
            marginBottom: '8px',
            lineHeight: '1',
            fontWeight: 700,
          }}
        >
          404
        </h1>
        <h2
          className="font-serif"
          style={{
            fontSize: '22px',
            color: 'var(--white)',
            letterSpacing: '0.05em',
            marginBottom: '16px',
            fontWeight: 600,
          }}
        >
          PAGE NOT FOUND
        </h2>
        <p
          style={{
            fontFamily: 'Raleway, sans-serif',
            fontSize: '15px',
            color: 'var(--gray)',
            marginBottom: '32px',
            lineHeight: '1.6',
          }}
        >
          The page you&apos;re looking for doesn&apos;t exist or has been moved. Check the URL or return to home.
        </p>
        <Link
          href="/"
          className="tactile-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--gold)',
            color: '#080E14',
            textDecoration: 'none',
            fontFamily: 'Raleway, sans-serif',
            fontWeight: 700,
            fontSize: '14px',
            letterSpacing: '0.04em',
            padding: '12px 28px',
            borderRadius: '4px',
            boxShadow: '0 4px 15px rgba(197, 160, 89, 0.3)',
          }}
        >
          Back to Home
        </Link>
      </div>
    </main>
  )
}
