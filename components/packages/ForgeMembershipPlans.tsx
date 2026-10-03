import PurchaseButton from '@/components/packages/PurchaseButton'
import { FORGE_MEMBERSHIPS } from '@/lib/forge-memberships'

const formatPrice = (priceCents: number) => `$${(priceCents / 100).toFixed(priceCents % 100 === 0 ? 0 : 2)}`

export default function ForgeMembershipPlans() {
  return (
    <div className="forge-plans-grid">
      {FORGE_MEMBERSHIPS.map((membership, index) => (
        <article className={`forge-plan-card${index === 0 ? ' forge-plan-card-featured' : ''}`} key={membership.id}>
          {index === 0 && <span className="forge-plan-label">7-day free trial</span>}
          <h3>{membership.name}</h3>
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
