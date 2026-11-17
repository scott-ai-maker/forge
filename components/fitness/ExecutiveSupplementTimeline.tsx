'use client'

import React, { useId, useMemo, useRef, useState } from 'react'
import {
  FDA_DSHEA_DISCLAIMER,
  FTC_PROXIMATE_AFFILIATE_DISCLOSURE,
  getThorneGoalCollection,
  MA_SAFE_HARBOR_SCOPE_NOTICE,
  normalizeSupplementGoal,
  ThorneCatalogProduct,
} from '@/lib/supplement-prescriptions'

export interface ExecutiveSupplementTimelineProps {
  athleteName?: string
  isCoachView?: boolean
  athleteAge?: number
  athleteSex?: 'male' | 'female' | 'other'
  fitnessGoal?: string
}

export default function ExecutiveSupplementTimeline({
  fitnessGoal = 'hypertrophy',
}: ExecutiveSupplementTimelineProps) {
  const dialogTitleId = useId()
  const detailDialogRef = useRef<HTMLDialogElement | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<ThorneCatalogProduct | null>(null)

  const collection = useMemo(
    () => getThorneGoalCollection(normalizeSupplementGoal(fitnessGoal)),
    [fitnessGoal]
  )

  function openProductDetail(product: ThorneCatalogProduct) {
    setSelectedProduct(product)
    if (detailDialogRef.current && !detailDialogRef.current.open) {
      detailDialogRef.current.showModal()
    }
  }

  function closeProductDetail() {
    detailDialogRef.current?.close()
    setSelectedProduct(null)
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
        <div>
          <strong style={{ fontSize: 14, color: 'var(--white)' }}>{collection.title}</strong>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--gray)' }}>{collection.subtitle}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
        {collection.products.map(product => (
          <div
            key={product.id}
            style={{
              padding: 12,
              borderRadius: 8,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#34D399', marginBottom: 4 }}>
                {product.certificationBadge}
              </div>
              <strong style={{ display: 'block', fontSize: 13.5, color: '#FFFFFF', marginBottom: 4 }}>
                {product.name}
              </strong>
              <span style={{ fontSize: 11.5, color: 'var(--gray)' }}>{product.labelGuidance}</span>
            </div>
            <button
              type="button"
              onClick={() => openProductDetail(product)}
              style={{
                minHeight: 40,
                padding: '6px 10px',
                borderRadius: 6,
                background: 'rgba(212, 160, 23, 0.14)',
                border: '1px solid rgba(212, 160, 23, 0.4)',
                color: 'var(--gold-lt)',
                fontSize: 11.5,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Details &amp; Storefront Link
            </button>
          </div>
        ))}
      </div>

      <dialog
        ref={detailDialogRef}
        {...({ closedby: 'any' } as Record<string, string>)}
        aria-labelledby={dialogTitleId}
        onClose={() => setSelectedProduct(null)}
        style={{
          maxWidth: 520,
          width: '92vw',
          borderRadius: 12,
          border: '1px solid rgba(212, 160, 23, 0.4)',
          background: '#0B1322',
          color: '#FFFFFF',
          padding: 20,
        }}
      >
        {selectedProduct && (
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
              <h4 id={dialogTitleId} style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>
                {selectedProduct.name}
              </h4>
              <button
                type="button"
                onClick={closeProductDetail}
                style={{
                  minHeight: 36,
                  padding: '4px 10px',
                  borderRadius: 6,
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.16)',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: '#CBD5E1', lineHeight: 1.55 }}>
              {selectedProduct.overview}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: '#FDE68A' }}>
              {selectedProduct.labelGuidance}
            </p>
            <p style={{ margin: 0, fontSize: 11.5, color: 'var(--gray)', lineHeight: 1.5 }}>
              {FTC_PROXIMATE_AFFILIATE_DISCLOSURE} {FDA_DSHEA_DISCLAIMER} {MA_SAFE_HARBOR_SCOPE_NOTICE}
            </p>
            <a
              href={selectedProduct.productUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              style={{
                minHeight: 44,
                padding: '10px 16px',
                borderRadius: 6,
                background: 'var(--gold)',
                color: '#080E14',
                fontWeight: 800,
                fontSize: 12.5,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              View Official Label on Thorne (15% Off) →
            </a>
          </div>
        )}
      </dialog>
    </div>
  )
}
