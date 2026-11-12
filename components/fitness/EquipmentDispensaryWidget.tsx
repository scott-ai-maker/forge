'use client'

import React, { useMemo, useState } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import type { NasmAssessmentRecord } from '@/lib/nasm-assessments'
import RagHomeGymBuilder from './RagHomeGymBuilder'
import {
  generateEquipmentPrescription,
  type EquipmentContinuumCategory,
  type HomeGymBuildoutTierId,
  type PrescribedEquipmentItem,
} from '@/lib/equipment-prescriptions'

export interface EquipmentDispensaryWidgetProps {
  assessment?: NasmAssessmentRecord | null
  ownedEquipment?: string[] | null
  optPhase?: number | null
  goal?: string | null
  injuriesLimitations?: string | null
  variant?: 'full' | 'compact_assessment'
  athleteName?: string | null
  coachClientId?: string | null
}

type ActiveFilterKey =
  | 'all'
  | EquipmentContinuumCategory
  | HomeGymBuildoutTierId

const FILTER_OPTIONS: Array<{ key: ActiveFilterKey; label: string }> = [
  { key: 'all', label: 'All Prescribed Gear' },
  { key: 'rep_home_gym', label: 'REP Home-Gym Buildout' },
  { key: 'inhibit_smr', label: 'Phase 1 · SMR / Inhibit' },
  { key: 'lengthen_mobility', label: 'Phase 2 · Lengthen' },
  { key: 'activate_stabilize', label: 'Phase 3 · Activate' },
  { key: 'integrate_stabilization', label: 'OPT™ Phase 1 · Balance' },
]

export default function EquipmentDispensaryWidget({
  assessment = null,
  ownedEquipment = null,
  optPhase = null,
  goal = null,
  injuriesLimitations = null,
  variant = 'full',
  athleteName = null,
  coachClientId = null,
}: EquipmentDispensaryWidgetProps) {
  const [activeWorkspaceMode, setActiveWorkspaceMode] = useState<'rag_builder' | 'catalog'>('rag_builder')
  const [activeFilter, setActiveFilter] = useState<ActiveFilterKey>('all')
  const [copiedSku, setCopiedSku] = useState<string | null>(null)
  const [showAllInCompact, setShowAllInCompact] = useState(false)

  const prescription = useMemo(
    () =>
      generateEquipmentPrescription({
        assessment,
        ownedEquipment,
        optPhase,
        goal,
      }),
    [assessment, ownedEquipment, optPhase, goal]
  )

  if (!prescription.isEnabled) {
    return null
  }

  const handleCopyPromoCode = async (sku: string, code: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(code)
        setCopiedSku(sku)
        setTimeout(() => {
          setCopiedSku(current => (current === sku ? null : current))
        }, 2200)
      }
    } catch {
      // Clipboard API unavailable in non-secure context
    }
  }

  if (variant === 'compact_assessment') {
    const essentialItems = prescription.prescribedItems.filter(
      item => item.necessityTier === 'essential_corrective' || item.necessityTier === 'targeted_adjunct'
    )
    const visibleItems = showAllInCompact ? essentialItems : essentialItems.slice(0, 4)

    return (
      <section
        aria-labelledby="forge-cex-hardware-kit-heading"
        style={{
          border: '1px solid rgba(212, 160, 23, 0.4)',
          background: 'linear-gradient(135deg, rgba(10, 16, 28, 0.96) 0%, rgba(7, 11, 20, 0.98) 100%)',
          borderRadius: 10,
          padding: 20,
          display: 'grid',
          gap: 16,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span
                style={{
                  fontFamily: 'Raleway, sans-serif',
                  fontWeight: 800,
                  fontSize: 10.5,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  padding: '3px 8px',
                  background: 'rgba(212, 160, 23, 0.16)',
                  color: 'var(--gold-lt)',
                  border: '1px solid rgba(212, 160, 23, 0.45)',
                  borderRadius: 4,
                }}
              >
                Prescribed Corrective Hardware Kit
              </span>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: 4,
                  background: 'rgba(52, 211, 153, 0.14)',
                  color: '#34D399',
                  border: '1px solid rgba(52, 211, 153, 0.35)',
                  letterSpacing: '0.06em',
                }}
              >
                10%–15% ATHLETE PRIVILEGE
              </span>
            </div>
            <h3
              id="forge-cex-hardware-kit-heading"
              style={{
                margin: '8px 0 4px',
                fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: '0.04em',
                color: 'var(--white)',
              }}
            >
              Tools Matched to Your 4-Phase Corrective Plan
            </h3>
            <p style={{ margin: 0, color: 'var(--gray)', fontSize: 13, lineHeight: 1.5 }}>
              Direct-shipped clinical tools from <strong>Crossover Symmetry</strong> (15% off) and{' '}
              <strong>Perform Better</strong> (10% off) mapped directly to your NASM movement screen findings.
            </p>
            <p style={{ margin: '6px 0 0', fontSize: 11.5, color: '#CBD5E1', lineHeight: 1.45 }}>
              <strong>Affiliate Disclosure:</strong> {prescription.ftcAffiliateDisclosure} {prescription.voluntarySourcingNotice}
            </p>
          </div>

          <div
            className="tabular-nums"
            style={{
              padding: '8px 12px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 6,
              textAlign: 'right',
            }}
          >
            <div style={{ fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase', fontWeight: 700 }}>
              Core Corrective Bundle
            </div>
            <div
              style={{
                fontFamily: 'var(--font-telemetry, monospace)',
                fontSize: 16,
                fontWeight: 800,
                color: 'var(--gold-lt)',
                marginTop: 2,
              }}
            >
              {prescription.estimatedKitMemberTotalFormatted}{' '}
              <span style={{ fontSize: 11, color: 'var(--gray)', textDecoration: 'line-through', fontWeight: 500 }}>
                {prescription.estimatedKitRetailTotalFormatted}
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 270px), 1fr))',
            gap: 12,
          }}
        >
          {visibleItems.map(item => (
            <EquipmentCard
              key={item.id}
              item={item}
              compact
              copiedSku={copiedSku}
              onCopyPromoCode={handleCopyPromoCode}
            />
          ))}
        </div>

        {essentialItems.length > 4 && (
          <div>
            <button
              type="button"
              onClick={() => setShowAllInCompact(prev => !prev)}
              className="forge-equip-btn"
              style={{
                padding: '7px 14px',
                minBlockSize: 36,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.16)',
                borderRadius: 6,
                color: 'var(--white)',
                fontFamily: 'Raleway, sans-serif',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {showAllInCompact
                ? 'Show Essential Core Kit Only'
                : `View All ${essentialItems.length} Matched Corrective Tools`}
            </button>
          </div>
        )}

        <p style={{ margin: 0, fontSize: 11.5, color: '#CBD5E1', lineHeight: 1.45 }}>
          {prescription.ftcAffiliateDisclosure} {prescription.voluntarySourcingNotice}
        </p>
      </section>
    )
  }

  const activeTierMatch = prescription.homeGymTiers.find(t => t.id === activeFilter)
  const filteredItems = activeTierMatch
    ? activeTierMatch.items
    : activeFilter === 'all'
    ? prescription.prescribedItems
    : prescription.prescribedItems.filter(item => item.category === activeFilter)

  const repPartner = prescription.partners.rep_fitness
  const csPartner = prescription.partners.crossover_symmetry
  const pbPartner = prescription.partners.perform_better

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* ── 1. HEADER & AUTHORIZED PARTNER CHANNELS ─────────────────────────── */}
      <div className="glass-card" style={{ padding: '24px 28px', display: 'grid', gap: 18 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 14,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span
                style={{
                  fontFamily: 'Raleway, sans-serif',
                  fontWeight: 800,
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  padding: '4px 10px',
                  background: 'rgba(212, 160, 23, 0.16)',
                  color: 'var(--gold-lt)',
                  border: '1px solid rgba(212, 160, 23, 0.45)',
                  borderRadius: 4,
                }}
              >
                Forge Athletic Equipment Dispensary
              </span>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: 4,
                  background: 'rgba(52, 211, 153, 0.14)',
                  color: '#34D399',
                  border: '1px solid rgba(52, 211, 153, 0.35)',
                  letterSpacing: '0.06em',
                }}
              >
                REP FITNESS · CROSSOVER SYMMETRY · PERFORM BETTER
              </span>
            </div>

            <h3
              style={{
                margin: '10px 0 4px',
                fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: '0.04em',
                color: 'var(--white)',
              }}
            >
              {athleteName
                ? `PRESCRIBED CORRECTIVE & HOME-GYM ARCHITECTURE · ${athleteName.toUpperCase()}`
                : 'PRESCRIBED CORRECTIVE & HOME-GYM ARCHITECTURE'}
            </h3>
            <p style={{ margin: 0, color: 'var(--gray)', fontSize: 13.5, lineHeight: 1.6, maxWidth: 820 }}>
              {prescription.hasActiveAssessmentMapping
                ? 'Automatically calibrated to your latest NASM Overhead Squat & Kinetic Chain Assessment—pairing clinical corrective tools with REP Fitness commercial home-gym strength hardware.'
                : 'Direct-shipped clinical corrective tools (10%–15% member privilege) paired with REP Fitness commercial home-gym strength equipment (free US shipping & zero inventory markups).'}
            </p>
            <p
              style={{
                margin: '8px 0 0',
                padding: '8px 12px',
                borderRadius: 6,
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                color: '#CBD5E1',
                fontSize: 11.5,
                lineHeight: 1.5,
                maxWidth: 820,
              }}
            >
              <strong style={{ color: '#F8FAFC' }}>FTC Affiliate &amp; Voluntary Sourcing Disclosure:</strong>{' '}
              {prescription.ftcAffiliateDisclosure} {prescription.voluntarySourcingNotice}
            </p>
          </div>

          <div
            className="tabular-nums"
            style={{
              padding: '12px 16px',
              background: 'rgba(212, 160, 23, 0.08)',
              border: '1px solid rgba(212, 160, 23, 0.35)',
              borderRadius: 8,
              minWidth: 205,
            }}
          >
            <div style={{ fontSize: 10.5, color: 'var(--gold-lt)', textTransform: 'uppercase', fontWeight: 800 }}>
              Core Corrective Kit Estimate
            </div>
            <div
              style={{
                fontFamily: 'var(--font-telemetry, monospace)',
                fontSize: 22,
                fontWeight: 800,
                color: '#FFFFFF',
                marginTop: 4,
              }}
            >
              {prescription.estimatedKitMemberTotalFormatted}{' '}
              <span style={{ fontSize: 13, color: 'var(--gray)', textDecoration: 'line-through', fontWeight: 500 }}>
                {prescription.estimatedKitRetailTotalFormatted}
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#34D399', fontWeight: 700, marginTop: 2 }}>
              Corrective Member Savings: {prescription.estimatedSavingsFormatted}
            </div>
          </div>
        </div>

        {/* Partner Channel Pills */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
            gap: 12,
          }}
        >
          {[repPartner, csPartner, pbPartner].map(partner => (
            <div
              key={partner.id}
              style={{
                padding: '12px 14px',
                borderRadius: 8,
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <GaaIcon name="shield-check" size={14} tone="gold" />
                  <strong style={{ color: 'var(--white)', fontSize: 13.5 }}>{partner.brandName}</strong>
                  <span
                    style={{
                      fontSize: 9.5,
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: 'rgba(52, 211, 153, 0.16)',
                      color: '#34D399',
                    }}
                  >
                    {partner.perkBadgeText}
                  </span>
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--gray)', marginTop: 3 }}>{partner.fulfillmentNote}</div>
              </div>
              <a
                href={partner.baseUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Visit ${partner.brandName} official storefront`}
                className="forge-equip-link"
                style={{
                  fontSize: 11.5,
                  fontWeight: 800,
                  color: 'var(--gold-lt)',
                  textDecoration: 'none',
                  padding: '6px 10px',
                  minBlockSize: 32,
                  display: 'inline-flex',
                  alignItems: 'center',
                  border: '1px solid rgba(212, 160, 23, 0.35)',
                  borderRadius: 5,
                  background: 'rgba(212, 160, 23, 0.08)',
                  whiteSpace: 'nowrap',
                }}
              >
                Visit {partner.brandName} →
              </a>
            </div>
          ))}
        </div>

        {/* Workspace Mode Switcher: Interactive RAG Home-Gym Builder vs. Turnkey Catalog */}
        <div
          role="group"
          aria-label="Choose between Custom RAG Home-Gym Builder or Full Equipment Catalog"
          style={{
            display: 'flex',
            gap: 10,
            flexWrap: 'wrap',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: 14,
          }}
        >
          <button
            type="button"
            aria-pressed={activeWorkspaceMode === 'rag_builder'}
            onClick={() => setActiveWorkspaceMode('rag_builder')}
            className="forge-equip-filter-btn"
            style={{
              minBlockSize: 42,
              padding: '9px 16px',
              borderRadius: 7,
              border: '1px solid',
              borderColor:
                activeWorkspaceMode === 'rag_builder' ? 'var(--gold)' : 'rgba(255, 255, 255, 0.16)',
              background:
                activeWorkspaceMode === 'rag_builder'
                  ? 'linear-gradient(135deg, rgba(212, 160, 23, 0.25) 0%, rgba(170, 130, 10, 0.16) 100%)'
                  : 'rgba(255, 255, 255, 0.04)',
              color: activeWorkspaceMode === 'rag_builder' ? 'var(--gold-lt)' : 'var(--white)',
              fontFamily: 'Raleway, sans-serif',
              fontSize: 12.5,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <GaaIcon name="building" size={14} tone={activeWorkspaceMode === 'rag_builder' ? 'gold' : 'slate'} />
            <span>Custom RAG Home-Gym Needs Builder</span>
          </button>

          <button
            type="button"
            aria-pressed={activeWorkspaceMode === 'catalog'}
            onClick={() => setActiveWorkspaceMode('catalog')}
            className="forge-equip-filter-btn"
            style={{
              minBlockSize: 42,
              padding: '9px 16px',
              borderRadius: 7,
              border: '1px solid',
              borderColor:
                activeWorkspaceMode === 'catalog' ? 'var(--gold)' : 'rgba(255, 255, 255, 0.16)',
              background:
                activeWorkspaceMode === 'catalog'
                  ? 'linear-gradient(135deg, rgba(212, 160, 23, 0.25) 0%, rgba(170, 130, 10, 0.16) 100%)'
                  : 'rgba(255, 255, 255, 0.04)',
              color: activeWorkspaceMode === 'catalog' ? 'var(--gold-lt)' : 'var(--white)',
              fontFamily: 'Raleway, sans-serif',
              fontSize: 12.5,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <GaaIcon name="dumbbell" size={14} tone={activeWorkspaceMode === 'catalog' ? 'gold' : 'slate'} />
            <span>Turnkey Blueprints &amp; Full Catalog ({prescription.prescribedItems.length} Items)</span>
          </button>
        </div>
      </div>

      {activeWorkspaceMode === 'rag_builder' ? (
        <RagHomeGymBuilder
          assessment={assessment}
          ownedEquipment={ownedEquipment}
          optPhase={optPhase}
          goal={goal}
          injuriesLimitations={injuriesLimitations}
          athleteName={athleteName}
          coachClientId={coachClientId}
        />
      ) : (
        <>
      {/* ── 2. 3-TIER HOME-GYM ARCHITECTURE BLUEPRINTS (REP FITNESS ANCHORED) ── */}
      <section
        aria-labelledby="forge-home-gym-blueprints-heading"
        className="glass-card"
        style={{ padding: '20px 24px', display: 'grid', gap: 14 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--gold-lt)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              Turnkey Home-Gym Blueprints (REP Fitness × Clinical CEx)
            </div>
            <h4
              id="forge-home-gym-blueprints-heading"
              style={{
                margin: '4px 0 0',
                fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                fontSize: 17,
                fontWeight: 700,
                color: 'var(--white)',
                letterSpacing: '0.03em',
              }}
            >
              Choose Your Space &amp; Performance Tier
            </h4>
          </div>
          {activeTierMatch && (
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className="forge-equip-btn"
              style={{
                padding: '6px 12px',
                minBlockSize: 32,
                borderRadius: 5,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.16)',
                color: 'var(--white)',
                fontSize: 11.5,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Clear Tier Filter (Show All {prescription.prescribedItems.length})
            </button>
          )}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 270px), 1fr))',
            gap: 12,
          }}
        >
          {prescription.homeGymTiers.map(tier => {
            const isSelected = activeFilter === tier.id
            return (
              <article
                key={tier.id}
                style={{
                  border: '1px solid',
                  borderColor: isSelected ? 'var(--gold)' : 'rgba(255, 255, 255, 0.12)',
                  background: isSelected ? 'rgba(212, 160, 23, 0.1)' : 'rgba(8, 14, 24, 0.75)',
                  borderRadius: 8,
                  padding: 15,
                  display: 'grid',
                  gap: 10,
                  alignContent: 'space-between',
                }}
              >
                <header style={{ display: 'grid', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: 'var(--gold-lt)',
                      }}
                    >
                      {tier.badge}
                    </span>
                    <span style={{ fontSize: 10.5, color: '#38BDF8', fontWeight: 700 }}>
                      {tier.footprintLabel}
                    </span>
                  </div>
                  <h5 style={{ margin: 0, fontSize: 15.5, fontWeight: 700, color: '#FFFFFF' }}>{tier.title}</h5>
                </header>

                <div style={{ display: 'grid', gap: 6 }}>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--gray)', lineHeight: 1.45 }}>{tier.subtitle}</p>
                  <div style={{ fontSize: 11, color: '#34D399', fontWeight: 700 }}>{tier.optPhasesUnlocked}</div>
                </div>

                <footer
                  style={{
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                    paddingTop: 10,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 8,
                    flexWrap: 'wrap',
                  }}
                >
                  <div className="tabular-nums">
                    <div style={{ fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase', fontWeight: 700 }}>
                      {tier.ownedCount > 0
                        ? `Remaining (${tier.ownedCount}/${tier.totalCount} Owned)`
                        : `Complete ${tier.totalCount}-Item Kit`}
                    </div>
                    <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 15, fontWeight: 800, color: '#FFFFFF' }}>
                      {tier.remainingUnownedFormatted}
                    </div>
                  </div>

                  <button
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setActiveFilter(isSelected ? 'all' : tier.id)}
                    className="forge-equip-filter-btn"
                    style={{
                      padding: '7px 12px',
                      minBlockSize: 34,
                      borderRadius: 5,
                      border: '1px solid',
                      borderColor: isSelected ? 'var(--gold)' : 'rgba(212, 160, 23, 0.4)',
                      background: isSelected ? 'var(--gold)' : 'rgba(212, 160, 23, 0.12)',
                      color: isSelected ? '#080E14' : 'var(--gold-lt)',
                      fontFamily: 'Raleway, sans-serif',
                      fontSize: 11.5,
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    {isSelected ? `✓ Viewing ${tier.badge.split('·')[0].trim()}` : `Inspect ${tier.totalCount} Items`}
                  </button>
                </footer>
              </article>
            )
          })}
        </div>

        {/* Single-Row Scrollable Category Filter Bar */}
        <div
          role="group"
          aria-label="Filter prescribed equipment by NASM phase or home-gym category"
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            paddingTop: 4,
            paddingBottom: 2,
          }}
        >
          {FILTER_OPTIONS.map(opt => {
            const selected = activeFilter === opt.key
            return (
              <button
                key={opt.key}
                type="button"
                aria-pressed={selected}
                onClick={() => setActiveFilter(opt.key)}
                className="forge-equip-filter-btn"
                style={{
                  flex: 'none',
                  position: 'relative',
                  padding: '8px 14px',
                  minBlockSize: 36,
                  borderRadius: 6,
                  border: '1px solid',
                  borderColor: selected ? 'var(--gold)' : 'rgba(255, 255, 255, 0.14)',
                  background: selected ? 'rgba(212, 160, 23, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                  color: selected ? 'var(--gold-lt)' : 'var(--white)',
                  fontFamily: 'Raleway, sans-serif',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {selected ? `✓ ${opt.label}` : opt.label}
              </button>
            )
          })}
        </div>
      </section>

      {/* ── 3. PRESCRIBED EQUIPMENT CARDS (<article> semantic pattern) ────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
          gap: 16,
        }}
      >
        {filteredItems.map(item => (
          <EquipmentCard
            key={item.id}
            item={item}
            compact={false}
            copiedSku={copiedSku}
            onCopyPromoCode={handleCopyPromoCode}
          />
        ))}
      </div>
        </>
      )}

      {/* ── 4. FTC AFFILIATE & VOLUNTARY SOURCING DISCLOSURE FOOTER ──────────── */}
      <footer
        style={{
          background: 'rgba(8, 14, 20, 0.78)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 8,
          padding: 16,
          display: 'grid',
          gap: 6,
        }}
      >
        <div
          style={{
            color: 'var(--gold-lt)',
            fontSize: 10.5,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <GaaIcon name="scale" size={13} tone="gold" />
          <span>FTC Partner Affiliate &amp; Voluntary Equipment Disclosure</span>
        </div>
        <p style={{ margin: 0, fontSize: 11.5, color: 'rgba(255,255,255,0.68)', lineHeight: 1.5 }}>
          {prescription.ftcAffiliateDisclosure}
        </p>
        <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.45 }}>
          {prescription.voluntarySourcingNotice}
        </p>
      </footer>

      <style jsx>{`
        .forge-equip-filter-btn:focus-visible,
        .forge-equip-link:focus-visible,
        .forge-equip-btn:focus-visible {
          outline: 2px solid var(--gold-lt, #f3d27a);
          outline-offset: 2px;
        }
      `}</style>
    </div>
  )
}

interface EquipmentCardProps {
  item: PrescribedEquipmentItem
  compact: boolean
  copiedSku: string | null
  onCopyPromoCode: (sku: string, code: string) => void
}

function EquipmentCard({ item, compact, copiedSku, onCopyPromoCode }: EquipmentCardProps) {
  const isEssential = item.necessityTier === 'essential_corrective'
  const isRepHomeGym = item.partnerId === 'rep_fitness'
  const hasDiscount = item.discountPercentage > 0

  const ctaText = hasDiscount
    ? `Order on ${item.partnerBrand} (${item.discountPercentage}% Off) →`
    : `Configure on ${item.partnerBrand} →`

  const ctaAriaLabel = hasDiscount
    ? `Order ${item.name} on ${item.partnerBrand} (${item.discountPercentage}% Off)`
    : `Configure ${item.name} on ${item.partnerBrand}`

  return (
    <article
      style={{
        border: isEssential
          ? '1px solid rgba(212, 160, 23, 0.42)'
          : isRepHomeGym
          ? '1px solid rgba(56, 189, 248, 0.28)'
          : '1px solid rgba(255, 255, 255, 0.1)',
        background: item.alreadyOwned
          ? 'rgba(15, 23, 42, 0.55)'
          : 'linear-gradient(180deg, rgba(13, 22, 36, 0.94) 0%, rgba(8, 14, 24, 0.96) 100%)',
        borderRadius: 10,
        padding: compact ? 14 : 18,
        display: 'grid',
        gap: compact ? 10 : 12,
        alignContent: 'space-between',
      }}
    >
      {/* Region 1: Header */}
      <header style={{ display: 'grid', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              padding: '2px 7px',
              borderRadius: 4,
              background: isEssential ? 'rgba(212, 160, 23, 0.2)' : 'rgba(56, 189, 248, 0.14)',
              color: isEssential ? 'var(--gold-lt)' : '#7DD3FC',
              border: isEssential ? '1px solid rgba(212, 160, 23, 0.45)' : '1px solid rgba(56, 189, 248, 0.3)',
            }}
          >
            {item.categoryLabel}
          </span>

          {item.alreadyOwned ? (
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                padding: '2px 7px',
                borderRadius: 4,
                background: 'rgba(52, 211, 153, 0.16)',
                color: '#34D399',
                border: '1px solid rgba(52, 211, 153, 0.35)',
              }}
            >
              ✓ In Your Equipment Profile
            </span>
          ) : (
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                padding: '2px 7px',
                borderRadius: 4,
                background: 'rgba(52, 211, 153, 0.12)',
                color: '#34D399',
              }}
            >
              {hasDiscount
                ? `${item.discountPercentage}% Off · ${item.partnerBrand}`
                : `Free US Shipping · ${item.partnerBrand}`}
            </span>
          )}
        </div>

        <h4
          style={{
            margin: 0,
            color: '#FFFFFF',
            fontSize: compact ? 15 : 16.5,
            fontWeight: 700,
            lineHeight: 1.35,
          }}
        >
          {item.name}
        </h4>
      </header>

      {/* Region 2: Content */}
      <div style={{ display: 'grid', gap: 8 }}>
        {item.prescribedReasons.length > 0 && (
          <div
            style={{
              fontSize: 12,
              color: 'var(--gold-lt)',
              background: 'rgba(212, 160, 23, 0.08)',
              border: '1px solid rgba(212, 160, 23, 0.24)',
              borderRadius: 6,
              padding: '7px 10px',
              lineHeight: 1.45,
            }}
          >
            <strong>Why Prescribed:</strong> {item.prescribedReasons.join(' ')}
          </div>
        )}

        {!compact && (
          <>
            <p style={{ margin: 0, fontSize: 12.5, color: 'rgba(255,255,255,0.82)', lineHeight: 1.5 }}>
              {item.clinicalMechanism}
            </p>
            <div style={{ fontSize: 11.5, color: 'var(--gray)', lineHeight: 1.45 }}>
              <strong style={{ color: 'var(--white)' }}>Execution Cue:</strong> {item.usageProtocol}
            </div>
          </>
        )}
      </div>

      {/* Region 3: Footer (Pricing + Independent Native Controls) */}
      <footer
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <div className="tabular-nums">
          <div style={{ fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase', fontWeight: 700 }}>
            {hasDiscount ? `Member Direct Price (${item.sku})` : `Direct Partner Price (${item.sku})`}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-telemetry, monospace)',
              fontSize: 15.5,
              fontWeight: 800,
              color: '#FFFFFF',
            }}
          >
            {item.clientPriceFormatted}
            {hasDiscount && (
              <>
                {' '}
                <span style={{ fontSize: 11.5, color: 'var(--gray)', textDecoration: 'line-through', fontWeight: 500 }}>
                  {item.retailPriceFormatted}
                </span>
              </>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {item.promoCode && (
            <button
              type="button"
              onClick={() => onCopyPromoCode(item.sku, item.promoCode!)}
              aria-label={`Copy promo code ${item.promoCode} for ${item.name}`}
              className="forge-equip-btn"
              style={{
                padding: '6px 10px',
                minBlockSize: 34,
                borderRadius: 5,
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                color: 'var(--gold-lt)',
                fontFamily: 'var(--font-telemetry, monospace)',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {copiedSku === item.sku ? '✓ Copied' : `Code: ${item.promoCode}`}
            </button>
          )}

          <a
            href={item.dispensaryUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={ctaAriaLabel}
            className="forge-equip-link"
            style={{
              padding: '8px 14px',
              minBlockSize: 36,
              borderRadius: 5,
              background: item.alreadyOwned
                ? 'rgba(255, 255, 255, 0.08)'
                : 'linear-gradient(135deg, var(--gold, #D4A017) 0%, var(--gold-lt, #F3D27A) 100%)',
              color: item.alreadyOwned ? 'var(--white)' : '#080E14',
              border: item.alreadyOwned ? '1px solid rgba(255,255,255,0.18)' : 'none',
              fontFamily: 'Raleway, sans-serif',
              fontSize: 12,
              fontWeight: 800,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              whiteSpace: 'nowrap',
            }}
          >
            {ctaText}
          </a>
        </div>
      </footer>
    </article>
  )
}
