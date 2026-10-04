import PurchaseButton from '@/components/packages/PurchaseButton'
import {
  FORGE_ADDON_CATEGORIES,
  getForgeAddonPerSessionCents,
  getForgeAddonsByCategory,
  type ForgeAddon,
} from '@/lib/forge-addons'
import { getMembershipsIncluding } from '@/lib/forge-memberships'

const formatPrice = (priceCents: number) => `$${(priceCents / 100).toLocaleString('en-US', { minimumFractionDigits: priceCents % 100 === 0 ? 0 : 2 })}`

function AddonCard({ addon }: { addon: ForgeAddon }) {
  const perSession = getForgeAddonPerSessionCents(addon)
  const includedIn = addon.unlocks ? getMembershipsIncluding(addon.unlocks).map(m => m.name) : []
  const savings = addon.listPriceCents ? addon.listPriceCents - addon.priceCents : 0

  return (
    <article className={`forge-plan-card forge-addon-card${addon.popular ? ' forge-plan-card-featured' : ''}`}>
      {addon.popular && <span className="forge-plan-label">Most popular</span>}
      <h4>{addon.name}</h4>
      <p className="forge-addon-tagline">{addon.tagline}</p>
      <p className="forge-plan-price">
        {formatPrice(addon.priceCents)}<span> one-time</span>
      </p>
      {perSession !== undefined && (
        <p className="forge-plan-alternative">
          {formatPrice(perSession)} per session{savings > 0 ? ` · save ${formatPrice(savings)}` : ''}
        </p>
      )}
      {includedIn.length > 0 && <p className="forge-plan-alternative">Included with {includedIn.join(' and ')}</p>}
      <ul>
        {addon.includes.map(item => <li key={item}>{item}</li>)}
      </ul>
      <div className="forge-plan-actions">
        <PurchaseButton addonId={addon.id} buttonLabel="Add to my plan" redirectNext="/packages#add-ons" showDiscountCode={false} />
      </div>
    </article>
  )
}

export default function ForgeAddons() {
  return (
    <section id="add-ons" className="forge-addons" aria-labelledby="forge-addons-title">
      <div className="forge-packages-intro forge-addons-intro">
        <p className="forge-eyebrow">Optional add-ons</p>
        <h2 id="forge-addons-title">Need more? Add it when you are ready.</h2>
        <p>Every membership works on its own. These extras are one-time purchases with no new subscription.</p>
      </div>

      {FORGE_ADDON_CATEGORIES.map(category => (
        <div className="forge-addon-group" key={category.id}>
          <h3>{category.title}</h3>
          <p>{category.blurb}</p>
          <div className="forge-plans-grid">
            {getForgeAddonsByCategory(category.id).map(addon => <AddonCard addon={addon} key={addon.id} />)}
          </div>
        </div>
      ))}
    </section>
  )
}
