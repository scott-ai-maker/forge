'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface ProofData {
  id: number
  title: string
  subtitle: string
  archetype: string
  image: string
  description: string
  strengths: string[]
  tokens: { name: string; hex: string }[]
}

const PROOFS: ProofData[] = [
  {
    id: 1,
    title: 'Proof 1: Kinetic Anvil & Flame',
    subtitle: 'Dynamic Mechanical Power · Forward Athletic Drive',
    archetype: 'The Warrior / Heavy Iron Builder',
    image: '/images/brand/forge-logo-proof-1-kinetic-anvil.jpg',
    description:
      'Features a heavy titanium anvil base integrated with an angled kinetic letter "F" and rising forge sparks/flame facets, accented with a 45-degree telemetry line in electric cyan.',
    strengths: [
      'Visceral, high-energy impact that resonates with serious lifters',
      'Strong horizontal & vertical lockup options for gym platforms',
      'Unmistakable symbolic representation of forging raw strength',
    ],
    tokens: [
      { name: 'Carbon Obsidian', hex: '#080E14' },
      { name: 'Brushed Silver', hex: '#D3D3D3' },
      { name: 'Molten Flame', hex: '#F59E0B' },
      { name: 'Telemetry Cyan', hex: '#38BDF8' },
    ],
  },
  {
    id: 2,
    title: 'Proof 2: Precision Apex Crest',
    subtitle: 'Clinical Sports Science · Institutional Sovereignty',
    archetype: 'The Master Authority / Clinical Sports Scientist',
    image: '/images/brand/forge-logo-proof-2-apex-crest.jpg',
    description:
      'A faceted titanium hexagonal shield encasing an architectural "F", protecting a central golden flame core bordered by kinetic telemetry waveform contours.',
    strengths: [
      'Institutional prestige ideal for clinical dossiers and PDF reports',
      'Elevated aesthetic reflecting NASM Master Coach Gordon credentials',
      'Highly recognizable silhouette even at compact shield scales',
    ],
    tokens: [
      { name: 'Obsidian Navy', hex: '#080E14' },
      { name: 'Titanium Slate', hex: '#CBD5E1' },
      { name: 'Gold Apex', hex: '#F59E0B' },
      { name: 'Velocity Cyan', hex: '#38BDF8' },
    ],
  },
  {
    id: 3,
    title: 'Proof 3: Architectural Monogram "F"',
    subtitle: 'Ultra-Modern Luxury · Technical Minimalist Apparel',
    archetype: 'The Innovator / High-Performance Monolith',
    image: '/images/brand/forge-logo-proof-3-architectural-monogram.jpg',
    description:
      'Engineered from two clean, interlocking geometric titanium bars with 45-degree chisel-cut bevels and a recessed amber gold flame channel. Pure, iconic minimalism.',
    strengths: [
      'Exceptional scalability from 16px favicons to building signage',
      'Ideal for apparel embroidery, silicone patches, and gear tags',
      'Modern, high-end tech aesthetic comparable to Arc’teryx & Whoop',
    ],
    tokens: [
      { name: 'Carbon Ground', hex: '#080E14' },
      { name: 'Pure White', hex: '#F8FAFC' },
      { name: 'Flame Accent', hex: '#F59E0B' },
      { name: 'Structure Slate', hex: '#334155' },
    ],
  },
]

export default function BrandProofsPage() {
  const [selectedId, setSelectedId] = useState<number>(1)
  const currentProof = PROOFS.find((p) => p.id === selectedId) || PROOFS[0]

  return (
    <div className="min-h-screen bg-[#080E14] text-[#F8FAFC] p-4 md:p-8 font-sans selection:bg-[#F59E0B] selection:text-[#080E14]">
      {/* Top Banner */}
      <header className="max-w-6xl mx-auto mb-8 border-b border-[#1E293B] pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F172A] border border-[#F59E0B]/30 text-[#F59E0B] text-xs font-mono tracking-wider uppercase mb-2">
            Brand Identity Suite · October 2026
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            FORGE ATHLETIC <span className="text-[#F59E0B]">Logo Proofs</span>
          </h1>
          <p className="text-sm text-[#CBD5E1] mt-1">
            Interactive side-by-side design proof evaluation and application testing.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="px-4 py-2 rounded-lg bg-[#1E293B] hover:bg-[#334155] text-xs font-semibold uppercase tracking-wider text-[#CBD5E1] transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Proof Selector Tabs */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PROOFS.map((proof) => {
            const isSelected = proof.id === selectedId
            return (
              <button
                key={proof.id}
                onClick={() => setSelectedId(proof.id)}
                className={`text-left p-4 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-[#0F172A] border-[#F59E0B] shadow-[0_0_24px_rgba(245,158,11,0.2)]'
                    : 'bg-[#080E14]/80 border-[#1E293B] hover:border-[#334155] opacity-75 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono font-bold text-[#F59E0B]">CONCEPT 0{proof.id}</span>
                  {isSelected && (
                    <span className="inline-block w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse" />
                  )}
                </div>
                <h3 className="font-bold text-base text-white">{proof.title.replace(`Proof ${proof.id}: `, '')}</h3>
                <p className="text-xs text-[#CBD5E1] mt-1 line-clamp-1">{proof.subtitle}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Proof Display Area */}
      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: High Resolution Image Board */}
        <div className="lg:col-span-7 bg-[#0F172A] rounded-2xl border border-[#1E293B] p-4 md:p-6 shadow-2xl">
          <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-black border border-[#1E293B]">
            <Image
              src={currentProof.image}
              alt={currentProof.title}
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="flex items-center justify-between mt-4 text-xs font-mono text-[#CBD5E1]">
            <span>1:1 Vector Identity Specification</span>
            <span className="text-[#38BDF8]">Optical Alignment Verified</span>
          </div>
        </div>

        {/* Right Column: Concept Details & Live Simulations */}
        <div className="lg:col-span-5 space-y-6">
          {/* Concept Overview Card */}
          <div className="bg-[#0F172A] rounded-2xl border border-[#1E293B] p-6">
            <div className="text-xs font-mono uppercase tracking-widest text-[#F59E0B] mb-1">
              {currentProof.archetype}
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{currentProof.title}</h2>
            <p className="text-sm text-[#CBD5E1] leading-relaxed mb-4">{currentProof.description}</p>

            <h4 className="text-xs font-mono uppercase tracking-wider text-white mb-2">Key Strengths</h4>
            <ul className="space-y-2 mb-6">
              {currentProof.strengths.map((str, idx) => (
                <li key={idx} className="text-xs text-[#CBD5E1] flex items-start gap-2">
                  <span className="text-[#F59E0B] mt-0.5">▪</span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>

            <h4 className="text-xs font-mono uppercase tracking-wider text-white mb-2">Color Palette</h4>
            <div className="grid grid-cols-2 gap-2">
              {currentProof.tokens.map((token, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-[#080E14] border border-[#1E293B]">
                  <div
                    className="w-4 h-4 rounded-md border border-white/20 shrink-0"
                    style={{ backgroundColor: token.hex }}
                  />
                  <div className="overflow-hidden">
                    <div className="text-[11px] font-bold text-white truncate">{token.name}</div>
                    <div className="text-[10px] font-mono text-[#CBD5E1]">{token.hex}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Real-World Context Simulation */}
          <div className="bg-[#0F172A] rounded-2xl border border-[#1E293B] p-6 space-y-4">
            <h4 className="text-xs font-mono uppercase tracking-wider text-white">Application Context Previews</h4>

            {/* Simulated App Header */}
            <div className="p-3 rounded-xl bg-[#080E14] border border-[#1E293B] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative w-7 h-7 rounded-lg overflow-hidden border border-[#F59E0B]/30">
                  <Image src={currentProof.image} alt="Icon" fill className="object-cover" />
                </div>
                <div>
                  <div className="text-xs font-bold tracking-wider text-white uppercase font-sans">FORGE ATHLETIC</div>
                  <div className="text-[9px] font-mono text-[#F59E0B]">SANCTUARY · 3D KINEMATICS</div>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1E293B] text-[#38BDF8]">LIVE</span>
            </div>

            {/* Simulated Clinical Badge */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-[#080E14] to-[#0F172A] border border-[#F59E0B]/20 flex items-center gap-3">
              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-[#F59E0B]/40 shrink-0">
                <Image src={currentProof.image} alt="Badge" fill className="object-cover" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-white">Clinical Performance Dossier</div>
                <div className="text-[10px] text-[#CBD5E1]">NASM OPT™ Periodization · S.O.A.P. Certified</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
