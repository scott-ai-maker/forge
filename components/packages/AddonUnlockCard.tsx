'use client'

import PurchaseButton from '@/components/packages/PurchaseButton'
import GaaIcon from '@/components/ui/GaaIcon'
import { getMembershipsIncluding } from '@/lib/forge-memberships'
import { getForgeAddonByFeature, type ForgeAddonFeature } from '@/lib/forge-addons'

const formatPrice = (cents: number) => `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`

export default function AddonUnlockCard({ feature }: { feature: ForgeAddonFeature }) {
  const addon = getForgeAddonByFeature(feature)
  if (!addon) return null
  const includedIn = getMembershipsIncluding(feature).map(m => m.name)

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, #101626 0%, #090D18 100%)',
        border: '1px solid rgba(212,160,23,0.3)',
        borderRadius: 12,
        padding: '24px 20px',
        maxWidth: 520,
        margin: '0 auto',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <GaaIcon name="lightning" size={22} tone="gold" />
        <h3 style={{ margin: 0, color: '#FFFFFF', fontSize: 20 }}>{addon.name}</h3>
      </div>
      <p style={{ margin: '0 0 12px', color: '#CBD5E1', fontSize: 14, lineHeight: 1.5 }}>{addon.tagline}</p>
      <ul style={{ margin: '0 0 16px', paddingLeft: 18, color: '#CBD5E1', fontSize: 13.5, lineHeight: 1.6 }}>
        {addon.includes.map(item => <li key={item}>{item}</li>)}
      </ul>
      <p style={{ margin: '0 0 12px', color: '#FFFFFF', fontSize: 22, fontWeight: 700 }}>
        {formatPrice(addon.priceCents)} <span style={{ fontSize: 13, color: '#94A3B8', fontWeight: 400 }}>one-time</span>
      </p>
      {includedIn.length > 0 && (
        <p style={{ margin: '0 0 12px', color: 'var(--gold-lt)', fontSize: 12.5 }}>
          Already included with {includedIn.join(' and ')}.{' '}
          <a href="/packages" style={{ color: 'inherit', textDecoration: 'underline' }}>See memberships</a>
        </p>
      )}
      <PurchaseButton addonId={addon.id} buttonLabel="Unlock now" redirectNext="/dashboard/fitness" showDiscountCode={false} />
    </div>
  )
}
