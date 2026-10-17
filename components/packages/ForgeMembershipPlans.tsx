import Image from 'next/image'
import PurchaseButton from '@/components/packages/PurchaseButton'
import { FORGE_MEMBERSHIPS } from '@/lib/forge-memberships'

const formatPrice = (priceCents: number) => `$${(priceCents / 100).toFixed(priceCents % 100 === 0 ? 0 : 2)}`

const PLAN_VISUALS: Record<string, { src: string; alt: string }> = {
  'forge-core': {
    src: '/images/pillar-progress-telemetry.jpg',
    alt: 'Member tracking workout sets and personal records',
  },
  'forge-pro-athlete': {
    src: '/images/remote-virtual-coaching.jpg',
    alt: 'Remote video form check and hybrid training guidance',
  },
  'forge-transformation-direct': {
    src: '/images/coach-client-plan.jpg',
    alt: 'Coach Gordon providing 1:1 program design and consultation',
  },
const PLAN_SUBTITLES: Record<string, string> = {
  'forge-core': 'Foundation · Autonomous NASM OPT™ Lab',
  'forge-pro-athlete': 'Guided Hybrid · Exercise & Nutrition',
  'forge-transformation-direct': 'Master Coaching · Direct Access (Cap 25)',
}

export default function ForgeMembershipPlans() {
  return (
    <div className="forge-plans-grid">
      {FORGE_MEMBERSHIPS.map((membership, index) => (
        <article className={`forge-plan-card${index === 0 ? ' forge-plan-card-featured' : ''}`} key={membership.id}>
          {PLAN_VISUALS[membership.id] && (
            <div
              style={{
                position: 'relative',
                width: 'calc(100% + 2 * clamp(1.25rem, 3vw, 2rem))',
                margin: 'calc(-1 * clamp(1.25rem, 3vw, 2rem)) calc(-1 * clamp(1.25rem, 3vw, 2rem)) 1.25rem',
                aspectRatio: '16 / 9',
                overflow: 'hidden',
                borderTopLeftRadius: 11,
                borderTopRightRadius: 11,
                background: '#080E14',
              }}
            >
              <Image
                src={PLAN_VISUALS[membership.id].src}
                alt={PLAN_VISUALS[membership.id].alt}
                width={500}
                height={280}
                loading="lazy"
                sizes="(max-width: 768px) 100vw, 33vw"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, rgba(8, 14, 20, 0.1) 0%, rgba(8, 14, 20, 0.85) 100%)',
                }}
              />
            </div>
          )}
          {index === 0 && <span className="forge-plan-label">7-day free trial</span>}
          {membership.seatCapLabel && (
            <span
              className="forge-plan-label"
              style={{
                background: 'rgba(212, 175, 55, 0.15)',
                color: '#D4AF37',
                border: '1px solid rgba(212, 175, 55, 0.35)',
              }}
            >
              {membership.seatCapLabel}
            </span>
          )}
          <h3>{membership.name}</h3>
          {PLAN_SUBTITLES[membership.id] && (
            <p style={{ color: 'var(--gold-lt)', fontSize: '0.8rem', fontFamily: 'var(--font-telemetry)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0.25rem 0 0' }}>
              {PLAN_SUBTITLES[membership.id]}
            </p>
          )}
          {membership.annualPriceCents !== undefined ? (
            <>
              <p className="forge-plan-price">
                {formatPrice(membership.monthlyPriceCents)}<span>/month</span>
              </p>
              <p className="forge-plan-alternative">
                or {formatPrice(membership.annualPriceCents)}/year
              </p>
            </>
          ) : (
            <p className="forge-plan-price">
              {formatPrice(membership.monthlyPriceCents)}<span>/month</span>
            </p>
          )}
          <ul>
            {membership.features.map(feature => <li key={feature}>{feature}</li>)}
          </ul>
          <div className="forge-plan-actions">
            {membership.annualPriceCents !== undefined ? (
              <>
                <PurchaseButton packageId={membership.id} cadence="monthly" buttonLabel="Start free trial" redirectNext="/packages" showDiscountCode={false} />
                <PurchaseButton packageId={membership.id} cadence="annual" buttonLabel="Choose annual" redirectNext="/packages" showDiscountCode={false} />
              </>
            ) : (
              <PurchaseButton packageId={membership.id} cadence="monthly" buttonLabel="Choose plan" redirectNext="/packages" showDiscountCode={false} />
            )}
          </div>
        </article>
      ))}
    </div>
  )
}
