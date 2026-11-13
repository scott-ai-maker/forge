import Image from 'next/image'
import { CLIENT_OUTCOMES_GRID } from '@/lib/landingSocialProof'

export default function ClientOutcomesShowcase() {
  return (
    <div style={{ maxWidth: 1160, margin: '2.75rem auto 0' }}>
      <div style={{ marginBottom: '1.25rem', textAlign: 'left' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '4px 12px',
            borderRadius: 9999,
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(52, 211, 153, 0.35)',
            color: '#6EE7B7',
            fontFamily: 'var(--font-telemetry)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          <span>VERIFIED MEMBER OUTCOMES</span>
          <span>·</span>
          <span>REAL SCHEDULES</span>
        </div>
        <h3
          style={{
            margin: 0,
            color: '#FFFFFF',
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(1.5rem, 2.8vw, 2.1rem)',
            fontWeight: 800,
            letterSpacing: '0.02em',
          }}
        >
          Built for desk days, packed mornings, and work travel.
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {CLIENT_OUTCOMES_GRID.map(item => (
          <article
            key={item.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              borderRadius: 16,
              background: 'linear-gradient(155deg, rgba(15, 23, 42, 0.95) 0%, rgba(8, 14, 20, 0.99) 100%)',
              border: '1px solid rgba(148, 163, 184, 0.22)',
              boxShadow: '0 18px 44px rgba(0, 0, 0, 0.48), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
              textAlign: 'left',
            }}
          >
            {/* 16:9 Scene Header */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '16 / 9',
                overflow: 'hidden',
                background: '#05080F',
              }}
            >
              <Image
                src={item.imageSrc}
                alt={item.imageAlt}
                width={520}
                height={292}
                loading="lazy"
                sizes="(max-width: 768px) 94vw, 32vw"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(180deg, rgba(8, 14, 20, 0.12) 0%, rgba(8, 14, 20, 0.55) 60%, rgba(8, 14, 20, 0.95) 100%)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 12,
                  left: 12,
                  right: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  flexWrap: 'wrap',
                }}
              >
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: 9999,
                    background: 'rgba(8, 14, 20, 0.88)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    color: '#FDE68A',
                    fontFamily: 'var(--font-telemetry)',
                    fontSize: 10.5,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  {item.personaBadge}
                </span>
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: 9999,
                    background: 'rgba(6, 78, 59, 0.82)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(52, 211, 153, 0.5)',
                    color: '#6EE7B7',
                    fontFamily: 'var(--font-telemetry)',
                    fontSize: 10.5,
                    fontWeight: 800,
                    letterSpacing: '0.05em',
                  }}
                >
                  {item.keyMetricBadge}
                </span>
              </div>
            </div>

            {/* Body */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                flex: 1,
                padding: '1.25rem 1.35rem 1.35rem',
              }}
            >
              <div>
                <h4
                  style={{
                    margin: 0,
                    color: '#FFFFFF',
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    lineHeight: 1.28,
                  }}
                >
                  {item.headline}
                </h4>
                <p
                  style={{
                    margin: '0.65rem 0 0',
                    color: '#CBD5E1',
                    fontSize: '0.88rem',
                    lineHeight: 1.6,
                  }}
                >
                  {item.story}
                </p>
              </div>

              <div
                style={{
                  marginTop: '1.15rem',
                  paddingTop: '0.9rem',
                  borderTop: '1px solid rgba(148, 163, 184, 0.16)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    aria-hidden="true"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 9999,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.22), rgba(15, 23, 42, 0.9))',
                      border: '1px solid rgba(245, 158, 11, 0.45)',
                      color: '#FBBF24',
                      fontFamily: 'var(--font-telemetry)',
                      fontSize: 11,
                      fontWeight: 800,
                    }}
                  >
                    {item.monogram}
                  </span>
                  <strong style={{ color: '#F8FAFC', fontSize: '0.88rem' }}>{item.nameAndAge}</strong>
                </div>
                <span
                  style={{
                    color: '#94A3B8',
                    fontFamily: 'var(--font-telemetry)',
                    fontSize: 10.5,
                    textAlign: 'right',
                  }}
                >
                  {item.featureUsed}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

