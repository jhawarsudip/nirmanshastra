'use client'

import React, { useRef, useState } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import { FileCheck, HardHat, IndianRupee, ShieldCheck } from 'lucide-react'
import { StructureIcon } from '@/components/icons/StructureIcon'
import { MasonryIcon } from '@/components/icons/MasonryIcon'
import { ElectricalIcon } from '@/components/icons/ElectricalIcon'
import { PlumbingIcon } from '@/components/icons/PlumbingIcon'
import { InteriorIcon } from '@/components/icons/InteriorIcon'
import { VastuIcon } from '@/components/icons/VastuIcon'
import HeroIllustration from '@/components/HeroIllustration'

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────

const IS_CODES = [
  'IS 456:2000', 'IS 1786:2008', 'IS 1893:2016', 'IS 13920:2016',
  'IS 1077:1992', 'IS 12894:2002', 'IS 2185:2005', 'IS 2212:1991',
  'IS 1661:1972', 'IS 2645:2003', 'IS 4326:1993', 'IS 732:2019',
  'IS 694:2010',  'IS 8828:2007', 'IS 3043:2018', 'IS 1172:1993',
  'IS 1742:1983', 'IS 1904:2016', 'IS 2911:2010', 'IS 875:2015',
  'IS 2250:1981', 'IS 383:2016',  'IS 269:2015',  'IS 2547:1976',
  'NBC 2016',
]

const VASTU_TOOL = {
  phase: 'P0', name: 'VastuPro',
  descriptor: 'Vastu Compliance Analyser',
  tagline: 'Vastu Compliance',
  desc: 'Complete 33-room Vastu check with zone scoring, remedies, and free PDF report. 16-zone Vastu Mandala included.',
  price: 'FREE', free: true, href: '/tools/vastu-pro',
}

const PAID_TOOLS = [
  {
    phase: 'P1', name: 'StructurePro',
    descriptor: 'Structural Cost & BOQ Estimator',
    tagline: 'Structural Cost',
    desc: 'Foundations, columns, beams, slabs per IS 456:2000. M20 / M25 / M30 grades.',
    price: '₹499', free: false, href: '/tools/structopro',
  },
  {
    phase: 'P2', name: 'MasonryPro',
    descriptor: 'Masonry Cost & BOQ Estimator',
    tagline: 'Masonry Cost',
    desc: 'All 8 wall types — brick, AAC, hollow block — plaster and waterproofing per IS 1077:1992.',
    price: '₹499', free: false, href: '/tools/masonpro',
  },
  {
    phase: 'P3', name: 'ElectricalPro',
    descriptor: 'Electrical Cost & BOQ Estimator',
    tagline: 'Electrical Cost',
    desc: 'Wiring, DB panels, earthing per IS 732:2019. Circuit-by-circuit breakdown.',
    price: '₹499', free: false, href: '/tools/electropro',
  },
  {
    phase: 'P4', name: 'PlumbingPro',
    descriptor: 'Plumbing Cost & BOQ Estimator',
    tagline: 'Plumbing Cost',
    desc: 'Water supply, drainage, sanitary fixtures per IS 1172:1993. Tank sizing included.',
    price: '₹499', free: false, href: '/tools/plumbpro',
  },
  {
    phase: 'P5', name: 'InteriorPro',
    descriptor: 'Interior Cost & BOQ Estimator',
    tagline: 'Interior Cost',
    desc: 'Flooring, kitchen, paint, false ceiling across Basic / Standard / Premium / Luxury.',
    price: '₹499', free: false, href: '/tools/interiorpro',
  },
]

const ALL_TOOLS = [VASTU_TOOL, ...PAID_TOOLS]

const PROBLEMS = [
  {
    no: '01',
    heading: "Your contractor's quote is a black box",
    body: "Most contractors give lump-sum quotes. No breakdown. No quantities. No way to verify if they're stealing cement bags or inflating steel tonnage.",
  },
  {
    no: '02',
    heading: 'Per square foot pricing hides fraud',
    body: '₹1,800/sqft sounds simple. But it hides inflated brick counts, wrong mortar ratios, oversized pipe diameters — all ways contractors pad their pockets invisibly.',
  },
  {
    no: '03',
    heading: 'Five phases, zero unified picture',
    body: 'Structure, masonry, electrical, plumbing, interior — five contractors, five quotations, no reconciled total. You have no idea where ₹15 lakhs went.',
  },
]

const STEPS = [
  {
    rev: 'REV A',
    heading: 'Answer plain questions',
    body: 'Answer plain questions about your building — no engineering degree required.',
  },
  {
    rev: 'REV B',
    heading: 'See IS compliance live',
    body: 'See live IS code compliance checks as you fill in details.',
  },
  {
    rev: 'REV C',
    heading: 'Enter your local rates',
    body: 'Enter your local material rates — we show India averages as a starting point.',
  },
  {
    rev: 'REV D',
    heading: 'Get exact quantities',
    body: 'Get exact quantities your contractor cannot argue with — backed by Bureau of Indian Standards.',
  },
]

const PILLARS = [
  {
    Icon: FileCheck,
    title: 'IS Code Traceable',
    body: "Every number in your report traces back to a specific Indian Standard clause — not a contractor's gut feeling. Concrete mix design under IS 456:2000. Steel percentages under IS 1786:2008. Seismic compliance under IS 1893:2016. Check any figure against the code yourself.",
  },
  {
    Icon: HardHat,
    title: 'Built by an Engineer, Not a Marketer',
    body: 'Founded by a NITian civil engineer with hands-on experience at a leading real estate construction company. NirmanShastra exists because contractor quotes are opaque by design — this tool makes them checkable.',
  },
  {
    Icon: IndianRupee,
    title: 'Transparent Pricing, No Hidden Tiers',
    body: "₹499 per detailed report. No subscription trap, no 'contact sales' for basic numbers. See the free grand-total range first, pay only if you want the itemised breakdown.",
  },
  {
    Icon: ShieldCheck,
    title: 'Your Data, Your Report',
    body: 'No commissions from contractors, no kickbacks from material suppliers. The numbers you get are calculated from IS codes and your inputs — nothing else influences them.',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// SVG MOTIFS — small icons (44×44, card top-left)
// ─────────────────────────────────────────────────────────────────────────────

function StructoHatch() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <circle cx="10" cy="12" r="2.5" fill="currentColor" opacity=".65" />
      <circle cx="27" cy="25" r="2"   fill="currentColor" opacity=".45" />
      <circle cx="36" cy="13" r="2.5" fill="currentColor" opacity=".65" />
      <circle cx="15" cy="34" r="2"   fill="currentColor" opacity=".45" />
      <circle cx="32" cy="37" r="1.5" fill="currentColor" opacity=".35" />
      <line x1="22" y1="0"  x2="22" y2="44" stroke="currentColor" strokeWidth=".8" opacity=".35" />
      <line x1="0"  y1="22" x2="44" y2="22" stroke="currentColor" strokeWidth=".8" opacity=".35" />
      <text x="24" y="11" fontSize="7" fill="currentColor" fontFamily="monospace" opacity=".8">C1</text>
    </svg>
  )
}

function MasonHatch() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <line x1="0"  y1="0"  x2="44" y2="44" stroke="currentColor" strokeWidth="1.2" opacity=".5" />
      <line x1="0"  y1="11" x2="33" y2="44" stroke="currentColor" strokeWidth="1.2" opacity=".5" />
      <line x1="11" y1="0"  x2="44" y2="33" stroke="currentColor" strokeWidth="1.2" opacity=".5" />
      <line x1="44" y1="0"  x2="0"  y2="44" stroke="currentColor" strokeWidth="1"   opacity=".4" />
      <line x1="44" y1="11" x2="11" y2="44" stroke="currentColor" strokeWidth="1"   opacity=".4" />
      <line x1="33" y1="0"  x2="0"  y2="33" stroke="currentColor" strokeWidth="1"   opacity=".4" />
    </svg>
  )
}

function LargeVastuWatermark() {
  const spokes = Array.from({length: 16}, (_, i) => {
    const rad = (i * 22.5 - 90) * (Math.PI / 180)
    return {
      x2: parseFloat((70 + 62 * Math.cos(rad)).toFixed(2)),
      y2: parseFloat((70 + 62 * Math.sin(rad)).toFixed(2)),
    }
  })
  return (
    <svg width="140" height="140" viewBox="0 0 140 140" fill="none" aria-hidden="true">
      {spokes.map((s, i) => (
        <line key={i} x1="70" y1="70" x2={s.x2} y2={s.y2}
          stroke="#C9A84C" strokeWidth="1.2" opacity=".7" />
      ))}
      <circle cx="70" cy="70" r="18" stroke="#C9A84C" strokeWidth="1.5" fill="none" opacity=".6" />
      <circle cx="70" cy="70" r="62" stroke="#C9A84C" strokeWidth="1" fill="none" opacity=".35" />
      <circle cx="70" cy="70" r="40" stroke="#C9A84C" strokeWidth=".8" fill="none" opacity=".25" />
    </svg>
  )
}

function LargeStructoWatermark() {
  return (
    <svg width="140" height="140" viewBox="0 0 140 140" fill="none" aria-hidden="true">
      {([
        [18,18],[48,12],[80,22],[112,15],[132,28],
        [28,48],[62,44],[95,50],[128,42],
        [14,78],[44,72],[75,80],[108,75],[138,82],
        [24,108],[56,103],[90,110],[122,105],
        [18,135],[52,130],[88,138],[120,133],
      ] as [number,number][]).map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r="4.5" fill="currentColor" opacity=".85" />
      ))}
      <line x1="70" y1="0" x2="70" y2="140" stroke="currentColor" strokeWidth="1" opacity=".45" />
      <line x1="0" y1="70" x2="140" y2="70" stroke="currentColor" strokeWidth="1" opacity=".45" />
      <text x="74" y="28" fontSize="13" fill="currentColor" fontFamily="monospace" opacity=".7">C1</text>
      <text x="74" y="88" fontSize="13" fill="currentColor" fontFamily="monospace" opacity=".7">C2</text>
    </svg>
  )
}

function LargeMasonWatermark() {
  return (
    <svg width="140" height="140" viewBox="0 0 140 140" fill="none" aria-hidden="true">
      {Array.from({length:12}, (_,i) => (
        <line key={`a${i}`} x1={-8+i*14} y1="0" x2={i*14+132} y2="140" stroke="currentColor" strokeWidth="1.5" opacity=".55" />
      ))}
      {Array.from({length:12}, (_,i) => (
        <line key={`b${i}`} x1={148-i*14} y1="0" x2={8-i*14} y2="140" stroke="currentColor" strokeWidth="1.2" opacity=".4" />
      ))}
    </svg>
  )
}

function LargeElectroWatermark() {
  return (
    <svg width="140" height="140" viewBox="0 0 140 140" fill="none" aria-hidden="true">
      <line x1="0" y1="70" x2="140" y2="70" stroke="currentColor" strokeWidth="2" opacity=".5" />
      {([25,62,100,132] as number[]).map((cx,i) => (
        <g key={i}>
          <circle cx={cx} cy="70" r="11" stroke="currentColor" strokeWidth="1.5" opacity=".65" />
          <line x1={cx-7} y1="63" x2={cx+7} y2="77" stroke="currentColor" strokeWidth="1.5" opacity=".65" />
          <line x1={cx} y1="59" x2={cx} y2="46" stroke="currentColor" strokeWidth="1.2" opacity=".5" />
          <line x1={cx-5} y1="46" x2={cx+5} y2="46" stroke="currentColor" strokeWidth="1.2" opacity=".4" />
        </g>
      ))}
    </svg>
  )
}

function LargePlumbWatermark() {
  return (
    <svg width="140" height="140" viewBox="0 0 140 140" fill="none" aria-hidden="true">
      <line x1="70" y1="0" x2="70" y2="52" stroke="currentColor" strokeWidth="2.5" opacity=".5" />
      <line x1="40" y1="52" x2="100" y2="52" stroke="currentColor" strokeWidth="1.5" opacity=".35" />
      <path d="M35,52 Q35,118 70,118 Q105,118 105,52" stroke="currentColor" strokeWidth="2" fill="none" opacity=".5" />
      <line x1="105" y1="118" x2="105" y2="140" stroke="currentColor" strokeWidth="2" opacity=".45" />
    </svg>
  )
}

function LargeInteriorWatermark() {
  return (
    <svg width="140" height="140" viewBox="0 0 140 140" fill="none" aria-hidden="true">
      {Array.from({length:4}, (_,r) =>
        Array.from({length:4}, (_,c) => (
          <rect key={`${r}-${c}`} x={c*35+1} y={r*35+1} width="33" height="33"
            stroke="currentColor" strokeWidth="1.2" opacity=".55" />
        ))
      ).flat()}
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function DimDivider({ label, animated = false, dark = false }: { label: string; animated?: boolean; dark?: boolean }) {
  const lineColor = dark ? 'rgba(244,244,240,0.18)' : '#1E2227'
  const textColor = dark ? 'rgba(244,244,240,0.55)' : '#1E2227'
  return (
    <div className="flex items-center gap-4 px-6 md:px-16">
      <div className="flex flex-1 items-center" aria-hidden="true">
        <div style={{ width: 0, height: 0, borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderRight: `7px solid ${lineColor}`, flexShrink: 0 }} />
        <div style={{ flex: 1, height: 1, background: lineColor }} className={animated ? 'animate-dim-line' : ''} />
        <div style={{ width: 1, height: 10, background: lineColor, flexShrink: 0 }} />
      </div>
      <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: textColor, letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <div className="flex flex-1 items-center" aria-hidden="true">
        <div style={{ width: 1, height: 10, background: lineColor, flexShrink: 0 }} />
        <div style={{ flex: 1, height: 1, background: lineColor }} />
        <div style={{ width: 0, height: 0, borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: `7px solid ${lineColor}`, flexShrink: 0 }} />
      </div>
    </div>
  )
}

function SectionHeader({ clause, title, dark = false }: { clause: string; title: React.ReactNode; dark?: boolean }) {
  return (
    <div className="space-y-3">
      <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: dark ? '#6BA3CC' : '#1F4E79', letterSpacing: '0.09em', textTransform: 'uppercase' }}>
        {clause}
      </p>
      <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 'clamp(28px,3.5vw,48px)', fontWeight: 600, color: dark ? '#F4F4F0' : '#1E2227', lineHeight: 1.15, letterSpacing: '0.01em' }}>
        {title}
      </h2>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL CARD
// ─────────────────────────────────────────────────────────────────────────────

function getToolIcon(phase: string, animated: boolean, size = 48): React.ReactElement | null {
  const props = { size, animated }
  switch (phase) {
    case 'P0': return <VastuIcon {...props} />
    case 'P1': return <StructureIcon {...props} />
    case 'P2': return <MasonryIcon {...props} />
    case 'P3': return <ElectricalIcon {...props} />
    case 'P4': return <PlumbingIcon {...props} />
    case 'P5': return <InteriorIcon {...props} />
    default: return null
  }
}

const largeMotifMap: Record<string, React.ReactElement> = {
  P0: <LargeVastuWatermark />,
  P1: <LargeStructoWatermark />,
  P2: <LargeMasonWatermark />,
  P3: <LargeElectroWatermark />,
  P4: <LargePlumbWatermark />,
  P5: <LargeInteriorWatermark />,
}

function ToolCard({ tool, delay = 0 }: { tool: typeof VASTU_TOOL; delay?: number }) {
  const prefersReducedMotion = useReducedMotion()
  const cardRef = useRef<HTMLDivElement>(null)
  const [rotX, setRotX] = useState(0)
  const [rotY, setRotY] = useState(0)
  const [isHover, setIsHover] = useState(false)

  const animated = isHover && !prefersReducedMotion

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!cardRef.current || prefersReducedMotion) return
    const rect = cardRef.current.getBoundingClientRect()
    const dx = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2)
    const dy = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2)
    setRotX(-dy * 8)
    setRotY(dx * 8)
  }

  function onMouseLeave() {
    setRotX(0)
    setRotY(0)
    setIsHover(false)
  }

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 48, scale: 0.97 }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: prefersReducedMotion ? 0 : delay }}
    >
      <div
        ref={cardRef}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        onMouseEnter={() => setIsHover(true)}
        style={{
          transform: prefersReducedMotion
            ? undefined
            : `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(${isHover ? -6 : 0}px)`,
          transition: 'transform 0.18s ease-out, box-shadow 0.18s ease-out',
          willChange: 'transform',
          boxShadow: isHover && !prefersReducedMotion
            ? '0 10px 24px rgba(30,34,39,0.18), 0 24px 48px rgba(30,34,39,0.10), 0 0 0 1px rgba(201,168,76,0.14)'
            : '0 1px 0 rgba(30,34,39,0.06)',
        }}
      >
        <Link href={tool.href} style={{ textDecoration: 'none', display: 'block' }}>
          <article
            style={{
              border: `1px solid ${tool.free ? '#C9A84C' : 'rgba(30,34,39,0.75)'}`,
              padding: '32px',
              background: '#F4F4F0',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              minHeight: 340,
              cursor: 'pointer',
            }}
          >
            <div style={{
              position: 'absolute',
              bottom: -10,
              right: -10,
              color: tool.free ? 'rgba(201,168,76,0.11)' : 'rgba(30,34,39,0.09)',
              pointerEvents: 'none',
              lineHeight: 0,
            }}>
              {largeMotifMap[tool.phase]}
            </div>

            <span style={{ position: 'absolute', top: 8, right: 16, fontFamily: 'var(--font-plex-mono)', fontSize: 64, color: 'rgba(30,34,39,0.04)', fontWeight: 500, lineHeight: 1, userSelect: 'none' }}>
              {tool.phase}
            </span>

            <div style={{ width: 48, height: 48, flexShrink: 0 }}>
              {getToolIcon(tool.phase, animated)}
            </div>

            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: '#1F4E79', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                {tool.descriptor}
              </p>
              <h3 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 28, fontWeight: 700, color: '#1E2227', marginBottom: 10, lineHeight: 1.1, letterSpacing: '0.01em' }}>
                {tool.name}
              </h3>
              <p style={{ fontFamily: 'var(--font-public-sans)', fontSize: 15, color: 'rgba(30,34,39,0.70)', lineHeight: 1.7 }}>
                {tool.desc}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{
                fontFamily: 'var(--font-plex-mono)',
                fontSize: 14,
                padding: '5px 14px',
                border: `1px solid ${tool.free ? '#14532D' : '#1F4E79'}`,
                color: tool.free ? '#14532D' : '#1F4E79',
                letterSpacing: '0.04em',
              }}>
                {tool.price}
              </span>
              <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 12, color: 'rgba(30,34,39,0.35)' }}>
                {tool.phase} ›
              </span>
            </div>
          </article>
        </Link>
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PILLAR CARD — Trust section (visual/motion upgrade; copy locked)
// ─────────────────────────────────────────────────────────────────────────────

function PillarCard({ pillar, delay = 0 }: { pillar: (typeof PILLARS)[0]; delay?: number }) {
  const prefersReducedMotion = useReducedMotion()
  const [isHover, setIsHover] = useState(false)
  const { Icon } = pillar

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 30, scale: 0.96 }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: prefersReducedMotion ? 0 : delay }}
    >
      <div
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        style={{
          border: '1px solid rgba(30,34,39,0.15)',
          borderTop: '3px solid #1F4E79',
          padding: '32px',
          background: '#F4F4F0',
          display: 'flex',
          flexDirection: 'column',
          transform: isHover && !prefersReducedMotion ? 'translateY(-4px)' : 'translateY(0)',
          boxShadow: isHover && !prefersReducedMotion
            ? '0 8px 20px rgba(30,34,39,0.12), 0 2px 6px rgba(30,34,39,0.07), 0 0 0 1px rgba(31,78,121,0.35)'
            : '0 1px 0 rgba(30,34,39,0.06)',
          transition: 'transform 0.2s ease-out, box-shadow 0.2s ease-out',
          willChange: 'transform',
        }}
      >
        {/* Icon — 32px, Blueprint, 20px bottom margin separates it from title block */}
        <div style={{ color: '#1F4E79', marginBottom: 20 }}>
          <Icon size={32} strokeWidth={1.5} aria-hidden={true} />
        </div>
        {/* Title — top of H3 spec range (22px) at 700 weight for stronger hierarchy */}
        <h3 style={{
          fontFamily: 'var(--font-fraunces)',
          fontSize: 22,
          fontWeight: 700,
          color: '#1E2227',
          lineHeight: 1.25,
          marginBottom: 12,
        }}>
          {pillar.title}
        </h3>
        {/* Body — unchanged */}
        <p style={{
          fontFamily: 'var(--font-public-sans)',
          fontSize: 15,
          color: 'rgba(30,34,39,0.70)',
          lineHeight: 1.75,
          flex: 1,
        }}>
          {pillar.body}
        </p>
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PROBLEM CARD — hover state per card (copy locked)
// ─────────────────────────────────────────────────────────────────────────────

function ProblemCard({ problem, index }: { problem: (typeof PROBLEMS)[0]; index: number }) {
  const prefersReducedMotion = useReducedMotion()
  const [isHover, setIsHover] = useState(false)

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 50, scale: 0.97 }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: prefersReducedMotion ? 0 : index * 0.15 }}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      style={{
        borderLeft: index === 0 ? `1px solid ${isHover ? 'rgba(31,78,121,0.45)' : 'rgba(244,244,240,0.1)'}` : 'none',
        borderRight: `1px solid ${isHover ? 'rgba(31,78,121,0.45)' : 'rgba(244,244,240,0.1)'}`,
        borderTop: `1px solid ${isHover ? 'rgba(31,78,121,0.45)' : 'rgba(244,244,240,0.1)'}`,
        borderBottom: `1px solid ${isHover ? 'rgba(31,78,121,0.45)' : 'rgba(244,244,240,0.1)'}`,
        padding: '48px 40px',
        background: isHover && !prefersReducedMotion ? 'rgba(31,78,121,0.07)' : 'rgba(255,255,255,0.02)',
        position: 'relative',
        overflow: 'hidden',
        transform: isHover && !prefersReducedMotion ? 'translateY(-4px)' : undefined,
        boxShadow: isHover && !prefersReducedMotion ? '0 12px 32px rgba(0,0,0,0.3)' : undefined,
        transition: 'border-color 200ms ease, background 200ms ease, transform 200ms ease, box-shadow 200ms ease',
        willChange: 'transform',
      }}
    >
      <div style={{
        fontFamily: 'var(--font-plex-mono)',
        fontSize: 120,
        color: isHover && !prefersReducedMotion ? 'rgba(31,78,121,0.28)' : 'rgba(31,78,121,0.2)',
        fontWeight: 700,
        lineHeight: 1,
        userSelect: 'none',
        marginBottom: 24,
        transition: 'color 200ms ease',
      }}>
        {problem.no}
      </div>
      <h3 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 26, fontWeight: 600, color: '#F4F4F0', marginBottom: 16, lineHeight: 1.25 }}>
        {problem.heading}
      </h3>
      <p style={{ fontFamily: 'var(--font-public-sans)', fontSize: 16, color: 'rgba(244,244,240,0.56)', lineHeight: 1.7 }}>
        {problem.body}
      </p>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ENGINEERING TITLE BLOCK (Design Spec § 5.A)
// ─────────────────────────────────────────────────────────────────────────────

function TitleBlock() {
  const now = new Date()
  const dd = String(now.getDate()).padStart(2, '0')
  const mmm = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][now.getMonth()]
  const dateStr = `${dd} ${mmm} ${now.getFullYear()}`

  const rows: [string, string][] = [
    ['PROJECT',  'YOUR HOME'],
    ['DRG NO.',  'NS-001'],
    ['DRAWN BY', 'NIRMANSHASTRA'],
    ['CHECKED',  'IS 456 · 1077 · 732'],
    ['AGAINST',  '· 1172 · 1893'],
    ['SCALE',    '1:1 COST CERTAINTY'],
    ['DATE',     `${dateStr}   REV A`],
  ]

  return (
    <div
      className="hero-title-block"
      style={{ border: '1px solid rgba(244,244,240,0.32)', width: '100%' }}
    >
      {rows.map(([label, value], i) => (
        <div
          key={label}
          style={{
            display: 'grid',
            gridTemplateColumns: '108px 1fr',
            borderBottom: i < rows.length - 1 ? '1px solid rgba(244,244,240,0.1)' : 'none',
            padding: '9px 16px',
          }}
        >
          <span style={{
            fontFamily: 'var(--font-plex-mono)',
            fontSize: 9,
            color: 'rgba(244,244,240,0.38)',
            letterSpacing: '0.09em',
            textTransform: 'uppercase',
            lineHeight: 1.5,
          }}>
            {label}
          </span>
          <span
            suppressHydrationWarning
            style={{
              fontFamily: 'var(--font-plex-mono)',
              fontSize: 12,
              color: 'rgba(244,244,240,0.82)',
              letterSpacing: '0.04em',
              lineHeight: 1.5,
            }}
          >
            {value}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// HOMEPAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function Home() {
  const prefersReducedMotion = useReducedMotion()
  const sectionRef = useRef<HTMLDivElement>(null)
  const { scrollY } = useScroll()
  const heroIllustrationY = useTransform(scrollY, [0, 700], [0, -90])
  const [vastuHover, setVastuHover] = useState(false)

  return (
    <main className="sheet-frame min-h-screen" style={{ background: '#F4F4F0' }}>

      {/* ── HERO (dark Iron Ink, full viewport width) ─────────────────────── */}
      <div style={{ background: '#1E2227', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* No blobs — grid-paper engineering ground only */}

        <section className="px-6 md:px-16 lg:px-24 pt-14 pb-14 md:pt-20 md:pb-20" style={{ position: 'relative', zIndex: 1 }}>
          <div className="grid items-center hero-grid">

            {/* Left — staged entrance: headline → subtitle → CTAs → stats */}
            <div className="space-y-14">
              <motion.div
                style={{ paddingBottom: 8 }}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              >
                <h1 style={{
                  fontFamily: 'var(--font-fraunces)',
                  fontSize: 'clamp(56px, 8vw, 96px)',
                  fontWeight: 700,
                  color: '#F4F4F0',
                  lineHeight: 1.02,
                  letterSpacing: '-0.02em',
                  marginBottom: 20,
                }}>
                  Build With <span className="hero-accent">Certainty.</span>
                </h1>
                <p style={{ fontFamily: 'var(--font-plex-devanagari)', fontSize: 24, color: 'rgba(244,244,240,0.55)', letterSpacing: '0.01em' }}>
                  निर्माणशास्त्र
                </p>
              </motion.div>

              <motion.p
                style={{ fontFamily: 'var(--font-public-sans)', fontSize: 18, color: 'rgba(244,244,240,0.65)', lineHeight: 1.7, maxWidth: 540 }}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut', delay: 0.25 }}
              >
                Stop your contractor from overcharging you. Get exact material quantities backed by Indian Standards.
              </motion.p>

              <motion.div
                className="flex flex-wrap gap-4"
                initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: 'easeOut', delay: 0.4 }}
              >
                <Link
                  href="/tools/vastu-pro"
                  className="btn-3d"
                  style={{ background: '#8C3A22', color: '#F4F4F0', fontFamily: 'var(--font-plex-mono)', fontSize: 14, padding: '15px 32px', borderRadius: 6, display: 'inline-block', textDecoration: 'none', letterSpacing: '0.02em', fontWeight: 500 }}
                >
                  Start Free — VastuPro
                </Link>
                <a
                  href="#pricing"
                  className="btn-3d"
                  style={{ border: '1px solid rgba(244,244,240,0.3)', color: '#F4F4F0', fontFamily: 'var(--font-plex-mono)', fontSize: 14, padding: '15px 32px', borderRadius: 6, display: 'inline-block', textDecoration: 'none', background: 'transparent', letterSpacing: '0.02em' }}
                >
                  See Pricing ↓
                </a>
              </motion.div>

              {/* Stats row — clean ink-bordered callout, no glass */}
              <motion.div
                className="flex flex-wrap gap-10"
                style={{
                  padding: '24px 28px',
                  background: 'rgba(244,244,240,0.04)',
                  border: '1px solid rgba(244,244,240,0.18)',
                  borderRadius: 0,
                }}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut', delay: 0.55 }}
              >
                {[['25', 'IS Codes'], ['6', 'Tools'], ['₹499', 'Per Report'], ['₹1,999', 'Bundle']].map(([val, label]) => (
                  <div key={label}>
                    <div style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 'clamp(40px, 5vw, 64px)', fontWeight: 500, color: '#F4F4F0', lineHeight: 1 }}>{val}</div>
                    <div style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 12, color: 'rgba(244,244,240,0.55)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 6 }}>{label}</div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right — Engineering title block + building elevation SVG */}
            <motion.div
              className="flex flex-col justify-center gap-8"
              initial={prefersReducedMotion ? false : { opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              style={{ width: '100%', y: heroIllustrationY }}
            >
              <TitleBlock />
              <div style={{ opacity: 0.88 }}>
                <HeroIllustration />
              </div>
            </motion.div>
          </div>
        </section>
      </div>

      {/* ── DIMENSION DIVIDER (dark) ─────────────────────────────────────── */}
      <div style={{ background: '#1E2227', paddingTop: 14, paddingBottom: 14 }}>
        <DimDivider label="SHEET 01 · THE PROBLEM" dark animated />
      </div>

      {/* ── PROBLEM SECTION (dark, full width) ──────────────────────────── */}
      <section className="px-6 md:px-16 lg:px-24 py-28" style={{ background: '#1E2227' }}>
        <div className="space-y-16">
          <SectionHeader clause="CL. 1.0 — WHY BUDGETS FAIL" title={<>The three problems <span className="section-accent">no contractor</span> will tell you</>} dark />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            {PROBLEMS.map((p, i) => (
              <ProblemCard key={p.no} problem={p} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── DIMENSION DIVIDER (dark → light) ────────────────────────────── */}
      <div style={{ background: '#1E2227', paddingTop: 14, paddingBottom: 14 }}>
        <DimDivider label="CL. 1.5 — WHY NIRMANSHASTRA" dark />
      </div>

      {/* ── WHY NIRMANSHASTRA — trust pillars ──────────────────────────── */}
      <section className="grid-paper px-6 md:px-16 lg:px-24 py-28">
        <div className="space-y-14">
          <SectionHeader clause="CL. 1.5 — TRUST" title="Why NirmanShastra" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PILLARS.map((pillar, i) => (
              <PillarCard key={pillar.title} pillar={pillar} delay={i * 0.08} />
            ))}
          </div>
        </div>
      </section>

      {/* ── DIMENSION DIVIDER (light → dark) ────────────────────────────── */}
      <div style={{ background: '#1E2227', paddingTop: 14, paddingBottom: 14 }}>
        <DimDivider label="SHEET 02 · 6 TOOLS · 1 PLATFORM" dark />
      </div>

      {/* ── TOOLS SECTION (dark section, full width) ──────────────────────── */}
      <section className="px-6 md:px-16 lg:px-24 py-28" style={{ background: '#1E2227' }} ref={sectionRef}>
        <div className="space-y-14">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <SectionHeader clause="CL. 2.0 — SCOPE OF TOOLS" title={<>Every phase of your construction, <span className="section-accent">estimated</span></>} dark />
            <div style={{ border: '1px solid rgba(31,78,121,0.4)', padding: '14px 20px', background: 'rgba(31,78,121,0.1)', flexShrink: 0, maxWidth: 380 }}>
              <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: '#7BA7CC', letterSpacing: '0.05em', lineHeight: 1.5 }}>
                Professional IS-code compliant BOQ for each construction phase
              </p>
              <p style={{ fontFamily: 'var(--font-public-sans)', fontSize: 13, color: 'rgba(244,244,240,0.55)', marginTop: 4 }}>
                Exact quantities · Local market rates · Contractor-ready format
              </p>
            </div>
          </div>

          {/* VastuPro featured card */}
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div style={{ height: 1, flex: 1, background: 'rgba(244,244,240,0.08)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: 'rgba(244,244,240,0.28)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>SUITE 1</span>
                <span style={{ fontFamily: 'var(--font-fraunces)', fontSize: 16, fontWeight: 600, color: 'rgba(244,244,240,0.75)' }}>Compliance &amp; Analysis</span>
                <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, padding: '2px 8px', border: '1px solid #14532D', color: '#14532D', letterSpacing: '0.04em' }}>FREE</span>
              </div>
              <div style={{ height: 1, flex: 1, background: 'rgba(244,244,240,0.08)' }} />
            </div>

            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
              whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <div
                onMouseEnter={() => setVastuHover(true)}
                onMouseLeave={() => setVastuHover(false)}
                style={{
                  transform: !prefersReducedMotion && vastuHover ? 'translateY(-5px)' : undefined,
                  transition: 'transform 0.18s ease-out, box-shadow 0.18s ease-out',
                  willChange: 'transform',
                  boxShadow: !prefersReducedMotion && vastuHover
                    ? '0 10px 24px rgba(30,34,39,0.16), 0 0 0 1px rgba(201,168,76,0.3)'
                    : undefined,
                }}
              >
              <Link href={VASTU_TOOL.href} style={{ textDecoration: 'none', display: 'block' }}>
                <article style={{
                  border: '1px solid #C9A84C',
                  padding: '40px 48px',
                  background: '#F4F4F0',
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 36,
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  minHeight: 160,
                }}>
                  <span style={{ position: 'absolute', top: 8, right: 20, fontFamily: 'var(--font-plex-mono)', fontSize: 96, color: 'rgba(201,168,76,0.06)', fontWeight: 500, lineHeight: 1, userSelect: 'none' }}>P0</span>
                  <div style={{ position: 'absolute', bottom: -10, right: -10, color: 'rgba(201,168,76,0.1)', pointerEvents: 'none', lineHeight: 0 }}>
                    <LargeVastuWatermark />
                  </div>
                  <div style={{ width: 56, height: 56, flexShrink: 0 }}>
                    <VastuIcon size={56} animated={vastuHover && !prefersReducedMotion} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: '#1F4E79', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                      {VASTU_TOOL.descriptor}
                    </p>
                    <h3 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 32, fontWeight: 700, color: '#1E2227', marginBottom: 8 }}>
                      {VASTU_TOOL.name}
                    </h3>
                    <p style={{ fontFamily: 'var(--font-public-sans)', fontSize: 15, color: 'rgba(30,34,39,0.70)', lineHeight: 1.65, maxWidth: 560 }}>
                      {VASTU_TOOL.desc}
                    </p>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 14, padding: '8px 20px', border: '1px solid #14532D', color: '#14532D', letterSpacing: '0.04em', display: 'block' }}>
                      FREE →
                    </span>
                  </div>
                </article>
              </Link>
              </div>
            </motion.div>
          </div>

          {/* Suite 2 divider */}
          <div style={{ paddingTop: 8 }}>
            <div className="flex items-center gap-4 mb-3">
              <div style={{ height: 1, flex: 1, background: 'rgba(244,244,240,0.08)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: 'rgba(244,244,240,0.28)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>SUITE 2</span>
                <span style={{ fontFamily: 'var(--font-fraunces)', fontSize: 16, fontWeight: 600, color: 'rgba(244,244,240,0.75)' }}>Phase-wise Cost &amp; BOQ Estimation</span>
                <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, padding: '2px 8px', border: '1px solid rgba(31,78,121,0.55)', color: '#7BA7CC', letterSpacing: '0.04em' }}>₹499 / REPORT</span>
              </div>
              <div style={{ height: 1, flex: 1, background: 'rgba(244,244,240,0.08)' }} />
            </div>
            <p style={{ fontFamily: 'var(--font-public-sans)', fontSize: 13, color: 'rgba(244,244,240,0.55)', textAlign: 'center' }}>
              IS-code verified BOQ · Exact quantities · CPWD labour rates · Contractor comparison
            </p>
          </div>

          {/* 5 paid tools — edge-to-edge grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PAID_TOOLS.map((tool, i) => (
              <ToolCard key={tool.name} tool={tool} delay={i * 0.08} />
            ))}
          </div>

          {/* Bundle strip */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            style={{ border: '1px solid rgba(244,244,240,0.12)', padding: '28px 40px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}
          >
            <div>
              <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: '#7BA7CC', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                COMPLETE BUNDLE — ALL 5 PAID TOOLS
              </p>
              <p style={{ fontFamily: 'var(--font-public-sans)', fontSize: 16, color: 'rgba(244,244,240,0.57)' }}>
                StructurePro · MasonryPro · ElectricalPro · PlumbingPro · InteriorPro
                {' '}&mdash; saves{' '}
                <span style={{ fontFamily: 'var(--font-plex-mono)' }}>₹496</span> vs buying separately
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 40, fontWeight: 500, color: '#F4F4F0' }}>₹1,999</span>
              <Link
                href="/tools/structopro"
                className="btn-3d"
                style={{ background: '#8C3A22', color: '#F4F4F0', fontFamily: 'var(--font-plex-mono)', fontSize: 14, padding: '13px 24px', borderRadius: 6, textDecoration: 'none', whiteSpace: 'nowrap' }}
              >
                Get Bundle →
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── DIMENSION DIVIDER ────────────────────────────────────────────── */}
      <div className="grid-paper py-3">
        <DimDivider label="SHEET 03 · 4 STEPS TO CERTAINTY" />
      </div>

      {/* ── HOW IT WORKS (full width) ────────────────────────────────────── */}
      <section id="how-it-works" className="grid-paper px-6 md:px-16 lg:px-24 py-28">
        <div className="space-y-14">
          <SectionHeader clause="CL. 3.0 — PROCESS" title={<>How NirmanShastra <span className="section-accent">works</span></>} />

          {/* Connector line — draws left to right before cards reveal */}
          <motion.div
            initial={prefersReducedMotion ? false : { scaleX: 0 }}
            whileInView={prefersReducedMotion ? undefined : { scaleX: 1 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            style={{ height: 1, background: 'linear-gradient(to right, #1F4E79 60%, rgba(31,78,121,0))', transformOrigin: 'left center', marginBottom: 8 }}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.rev}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 32 }}
                whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45, ease: 'easeOut', delay: prefersReducedMotion ? 0 : i * 0.1 }}
                style={{
                  borderTop: '3px solid #1F4E79',
                  borderRight: i < 3 ? '1px solid rgba(30,34,39,0.1)' : 'none',
                  paddingTop: 24,
                  paddingRight: 32,
                  paddingLeft: i === 0 ? 0 : 32,
                  paddingBottom: 16,
                }}
              >
                <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 12, color: '#1F4E79', letterSpacing: '0.06em', marginBottom: 14 }}>
                  {step.rev}
                </p>
                <h3 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, fontWeight: 600, color: '#1E2227', marginBottom: 12, lineHeight: 1.3 }}>
                  {step.heading}
                </h3>
                <p style={{ fontFamily: 'var(--font-public-sans)', fontSize: 15, color: 'rgba(30,34,39,0.70)', lineHeight: 1.75 }}>
                  {step.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DIMENSION DIVIDER ────────────────────────────────────────────── */}
      <div style={{ background: '#1E2227', paddingTop: 14, paddingBottom: 14 }}>
        <DimDivider label="FREE CALCULATORS vs NIRMANSHASTRA" dark />
      </div>

      {/* ── COMPARISON TABLE ─────────────────────────────────────────────── */}
      <section className="px-6 md:px-16 lg:px-24 py-28" style={{ background: '#1E2227' }}>
        <div className="space-y-10">
          <SectionHeader
            clause="CL. 3.5 — COMPETITIVE COMPARISON"
            title={<>Why NirmanShastra <span className="section-accent">beats</span> free calculators</>}
            dark
          />
          <p style={{ fontFamily: 'var(--font-public-sans)', fontSize: 16, color: 'rgba(244,244,240,0.6)', lineHeight: 1.65, maxWidth: 680 }}>
            Free online calculators steal your phone number and sell it to contractors. Here&apos;s what you actually get.
          </p>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-plex-sans)', fontSize: 14 }}>
              <thead>
                <tr>
                  <th scope="col" style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: 'rgba(244,244,240,0.55)', letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'left', padding: '10px 16px', borderBottom: '1px solid rgba(244,244,240,0.12)', borderRight: '1px solid rgba(244,244,240,0.08)', minWidth: 200 }}>Feature</th>
                  <th scope="col" style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: 'rgba(244,244,240,0.65)', letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'left', padding: '10px 16px', borderBottom: '1px solid rgba(244,244,240,0.12)', borderRight: '1px solid rgba(244,244,240,0.08)', minWidth: 260 }}>Free Online Calculators</th>
                  <th scope="col" style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: 'rgba(244,244,240,0.85)', letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'left', padding: '10px 16px', borderBottom: '1px solid rgba(244,244,240,0.12)', background: 'rgba(31,78,121,0.15)', minWidth: 280 }}>NirmanShastra (₹499/phase)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    feature: 'Calculation method',
                    free: 'Per sqft thumb rule — meaningless averages',
                    ns: 'Exact item-wise BOQ based on IS 456, IS 732, IS 1172',
                  },
                  {
                    feature: 'Material quantities',
                    free: 'Vague guesses (₹8L for cement)',
                    ns: 'Exact: 412 bags OPC 53, 2.4 tonnes Fe500D steel',
                  },
                  {
                    feature: 'IS Code compliance',
                    free: 'None — not even mentioned',
                    ns: '25 IS codes verified, every quantity traceable to a specific clause',
                  },
                  {
                    feature: 'Contractor accountability',
                    free: 'Zero — they sell your data to contractors',
                    ns: 'Line-by-line comparison — catch overcharging to the decimal',
                  },
                  {
                    feature: 'Local rates',
                    free: 'Fixed city averages you cannot change',
                    ns: 'You enter local dealer rates — India average pre-filled as benchmark',
                  },
                  {
                    feature: 'CPWD labour',
                    free: 'Not included',
                    ns: '14 CPWD trades, productivity rates, fully editable',
                  },
                  {
                    feature: 'PDF report',
                    free: 'No PDF — just a number on screen',
                    ns: 'Professional 10+ page PDF with BOQ, IS compliance, site checklist',
                  },
                  {
                    feature: 'Your data',
                    free: 'Sold to contractor lead networks',
                    ns: 'Never sold. Your project data is yours.',
                  },
                ].map((row, i) => (
                  <tr key={row.feature} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                    <td style={{ fontFamily: 'var(--font-public-sans)', fontSize: 14, color: 'rgba(244,244,240,0.75)', padding: '12px 16px', borderBottom: '1px solid rgba(244,244,240,0.07)', borderRight: '1px solid rgba(244,244,240,0.08)', verticalAlign: 'top' }}>{row.feature}</td>
                    <td style={{ fontFamily: 'var(--font-public-sans)', fontSize: 14, color: 'rgba(244,244,240,0.5)', padding: '12px 16px', borderBottom: '1px solid rgba(244,244,240,0.07)', borderRight: '1px solid rgba(244,244,240,0.08)', verticalAlign: 'top' }}>
                      <span style={{ color: 'rgba(244,244,240,0.55)', fontWeight: 700, marginRight: 8 }}>✗</span>{row.free}
                    </td>
                    <td style={{ fontFamily: 'var(--font-public-sans)', fontSize: 14, color: 'rgba(244,244,240,0.85)', padding: '12px 16px', borderBottom: '1px solid rgba(244,244,240,0.07)', background: 'rgba(31,78,121,0.1)', verticalAlign: 'top' }}>
                      <span style={{ color: 'rgba(244,244,240,0.85)', fontWeight: 700, marginRight: 8 }}>✓</span>{row.ns}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 13, color: 'rgba(244,244,240,0.45)', letterSpacing: '0.04em', borderTop: '1px solid rgba(244,244,240,0.1)', paddingTop: 20 }}>
            The math is universal. IS codes don&apos;t change by city. Only the rates do — and you control those.
          </p>
        </div>
      </section>

      {/* ── DIMENSION DIVIDER ────────────────────────────────────────────── */}
      <div className="py-3">
        <DimDivider label="CHECKED AGAINST 25 IS CODES" />
      </div>

      {/* ── IS CODE TRUST STRIP (full width) ─────────────────────────────── */}
      <section className="px-6 md:px-16 lg:px-24 py-28" style={{ background: '#1F4E79' }}>
        <div className="space-y-10">
          <div className="space-y-2">
            <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: 'rgba(244,244,240,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              CL. 4.0 — CODE COMPLIANCE
            </p>
            <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 'clamp(28px,3.5vw,48px)', fontWeight: 600, color: '#F4F4F0', lineHeight: 1.15 }}>
              Every calculation <span className="section-accent">backed</span> by Bureau of Indian Standards
            </h2>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {IS_CODES.map((code, i) => (
              <motion.span
                key={code}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.2, delay: i * 0.02 }}
                style={{
                  fontFamily: 'var(--font-plex-mono)',
                  fontSize: 13,
                  padding: '7px 14px',
                  border: '1px solid rgba(244,244,240,0.35)',
                  color: '#F4F4F0',
                  letterSpacing: '0.04em',
                  background: 'rgba(255,255,255,0.09)',
                  display: 'inline-block',
                }}
              >
                {code}
              </motion.span>
            ))}
          </div>

          <div style={{ border: '1px solid rgba(244,244,240,0.2)', padding: '18px 24px', background: 'rgba(255,255,255,0.06)', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 16, color: 'rgba(244,244,240,0.55)', flexShrink: 0 }}>ⓘ</span>
            <p style={{ fontFamily: 'var(--font-public-sans)', fontSize: 15, color: 'rgba(244,244,240,0.72)', lineHeight: 1.65, margin: 0 }}>
              IS code values in NirmanShastra are verified against BIS publications and locked at source.
              Every material quantity, mix ratio, and structural parameter traces back to a specific IS clause.
              M20 is <span style={{ fontFamily: 'var(--font-plex-mono)' }}>1:1.5:3</span> (not{' '}
              <span style={{ fontFamily: 'var(--font-plex-mono)' }}>1:2:4</span>). Dry volume factor for
              concrete is <span style={{ fontFamily: 'var(--font-plex-mono)' }}>1.54</span>. For mortar:{' '}
              <span style={{ fontFamily: 'var(--font-plex-mono)' }}>1.1</span>.
            </p>
          </div>
        </div>
      </section>

      {/* ── DIMENSION DIVIDER ────────────────────────────────────────────── */}
      <div className="grid-paper py-3">
        <DimDivider label="₹499 / REPORT · ₹1,999 / BUNDLE" />
      </div>

      {/* ── PRICING SECTION (full width) ─────────────────────────────────── */}
      <section id="pricing" className="grid-paper px-6 md:px-16 lg:px-24 py-28">
        <div className="space-y-14">
          <SectionHeader clause="CL. 5.0 — PRICING · LAUNCH 2026" title={<>Simple, <span className="section-accent">report-by-report</span> pricing</>} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0">

            {/* Tier 1 — VastuPro FREE */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: 0 }}
              style={{ border: '1px solid #14532D', borderRight: 'none', padding: '40px', background: '#F4F4F0', display: 'flex', flexDirection: 'column', gap: 20 }}
            >
              <div>
                <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: '#14532D', letterSpacing: '0.07em', marginBottom: 8 }}>PHASE 0 — LEAD MAGNET</p>
                <h3 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 28, fontWeight: 700, color: '#1E2227', marginBottom: 4 }}>VastuPro</h3>
                <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 12, color: 'rgba(30,34,39,0.5)', marginBottom: 10 }}>Vastu Compliance Analyser</p>
                <div style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 48, fontWeight: 500, color: '#14532D', lineHeight: 1 }}>FREE</div>
                <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 13, color: 'rgba(30,34,39,0.5)', marginTop: 6 }}>forever · no payment required</p>
              </div>
              <ul style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['Vastu compliance analysis','33 room types supported','16-zone Vastu Mandala','Score + remedies','Full PDF report','IS 4326:1993 seismic warnings'].map(f => (
                  <li key={f} style={{ fontFamily: 'var(--font-public-sans)', fontSize: 15, color: 'rgba(30,34,39,0.68)', display: 'flex', gap: 10 }}>
                    <span style={{ color: '#14532D', fontWeight: 700, flexShrink: 0 }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link
                href="/tools/vastu-pro"
                className="btn-3d"
                style={{ display: 'block', textAlign: 'center', border: '1px solid #14532D', color: '#14532D', fontFamily: 'var(--font-plex-mono)', fontSize: 14, padding: '14px', borderRadius: 6, textDecoration: 'none', letterSpacing: '0.03em' }}
              >
                Start Free →
              </Link>
            </motion.div>

            {/* Tier 2 — Per Report ₹499 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: 0.1 }}
              style={{ border: '1px solid #1E2227', padding: '40px', background: '#F4F4F0', display: 'flex', flexDirection: 'column', gap: 20 }}
            >
              <div>
                <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: '#1F4E79', letterSpacing: '0.07em', marginBottom: 8 }}>PER REPORT · ANY PAID TOOL</p>
                <h3 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 28, fontWeight: 700, color: '#1E2227', marginBottom: 4 }}>Single Tool</h3>
                <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 12, color: 'rgba(30,34,39,0.5)', marginBottom: 10 }}>IS-Code BOQ Estimator</p>
                <div style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 48, fontWeight: 500, color: '#1E2227', lineHeight: 1 }}>₹499</div>
                <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 13, color: 'rgba(30,34,39,0.5)', marginTop: 6 }}>per report · StructurePro to InteriorPro</p>
              </div>
              <ul style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['Exact material quantities','Itemised cost breakdown','IS code compliance panel','CPWD labour cost calculator','Contractor quote comparison','PDF report with SVG drawings'].map(f => (
                  <li key={f} style={{ fontFamily: 'var(--font-public-sans)', fontSize: 15, color: 'rgba(30,34,39,0.68)', display: 'flex', gap: 10 }}>
                    <span style={{ color: '#1F4E79', fontWeight: 700, flexShrink: 0 }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link
                href="/tools/structopro"
                className="btn-3d"
                style={{ display: 'block', textAlign: 'center', background: '#8C3A22', color: '#F4F4F0', fontFamily: 'var(--font-plex-mono)', fontSize: 14, padding: '14px', borderRadius: 6, textDecoration: 'none', letterSpacing: '0.03em' }}
              >
                Start with StructurePro →
              </Link>
            </motion.div>

            {/* Tier 3 — Bundle ₹1,999 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: 0.2 }}
              style={{ border: '2px solid #1E2227', borderLeft: 'none', padding: '40px', background: '#F4F4F0', display: 'flex', flexDirection: 'column', gap: 20, position: 'relative' }}
            >
              <div style={{ position: 'absolute', top: -1, right: 18, background: '#8C3A22', color: '#F4F4F0', fontFamily: 'var(--font-plex-mono)', fontSize: 10, padding: '4px 12px', letterSpacing: '0.05em' }}>
                BEST VALUE
              </div>
              <div>
                <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: '#8C3A22', letterSpacing: '0.07em', marginBottom: 8 }}>COMPLETE BUNDLE · ALL 5 PAID TOOLS</p>
                <h3 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 28, fontWeight: 700, color: '#1E2227', marginBottom: 4 }}>Full Platform</h3>
                <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 12, color: 'rgba(30,34,39,0.5)', marginBottom: 10 }}>All 5 Phase Estimators</p>
                <div style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 48, fontWeight: 500, color: '#1E2227', lineHeight: 1 }}>₹1,999</div>
                <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 13, color: 'rgba(30,34,39,0.5)', marginTop: 6 }}>
                  saves <span style={{ fontFamily: 'var(--font-plex-mono)' }}>₹496</span> vs buying individually
                </p>
              </div>
              <ul style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['StructurePro + MasonryPro','ElectricalPro + PlumbingPro','InteriorPro','All quantities across all phases','Cross-phase contractor comparison','Grand Total Report (₹999) free'].map(f => (
                  <li key={f} style={{ fontFamily: 'var(--font-public-sans)', fontSize: 15, color: 'rgba(30,34,39,0.68)', display: 'flex', gap: 10 }}>
                    <span style={{ color: '#8C3A22', fontWeight: 700, flexShrink: 0 }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link
                href="/tools/structopro"
                className="btn-3d"
                style={{ display: 'block', textAlign: 'center', background: '#8C3A22', color: '#F4F4F0', fontFamily: 'var(--font-plex-mono)', fontSize: 14, padding: '14px', borderRadius: 6, textDecoration: 'none', letterSpacing: '0.03em' }}
              >
                Get Bundle →
              </Link>
            </motion.div>
          </div>

          {/* Grand Total Report — standalone card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: 0.3 }}
            style={{ border: '1px solid #1E2227', padding: '32px 40px', background: '#F4F4F0', display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}
          >
            <div style={{ position: 'absolute', top: -1, left: 24, background: '#1F4E79', color: '#F4F4F0', fontFamily: 'var(--font-plex-mono)', fontSize: 10, padding: '4px 12px', letterSpacing: '0.05em' }}>
              MASTER REPORT
            </div>
            <div style={{ flex: '1 1 400px' }}>
              <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: '#1F4E79', letterSpacing: '0.07em', marginBottom: 8, marginTop: 8 }}>COMBINE ALL 5 PHASES · ONE MASTER BOQ</p>
              <h3 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 24, fontWeight: 700, color: '#1E2227', marginBottom: 6 }}>Grand Total Report</h3>
              <p style={{ fontFamily: 'var(--font-public-sans)', fontSize: 14, color: 'rgba(30,34,39,0.6)', lineHeight: 1.6, maxWidth: 500 }}>
                Combine all 5 phases into one master report. Phase-wise cost breakdown, construction timeline Gantt chart,
                combined IS code compliance, and a 12-page contractor-ready PDF.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 36, fontWeight: 500, color: '#1E2227', lineHeight: 1 }}>₹999</div>
                <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 12, color: 'rgba(30,34,39,0.5)', marginTop: 4 }}>
                  Free with bundle · ₹2,495 saved vs individual
                </p>
              </div>
              <Link
                href="/tools/grand-total"
                className="btn-3d"
                style={{ display: 'block', textAlign: 'center', background: '#1F4E79', color: '#F4F4F0', fontFamily: 'var(--font-plex-mono)', fontSize: 13, padding: '12px 28px', borderRadius: 6, textDecoration: 'none', letterSpacing: '0.03em', whiteSpace: 'nowrap' }}
              >
                Generate Grand Total Report →
              </Link>
            </div>
          </motion.div>

        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(244,244,240,0.12)', background: '#1E2227', marginTop: 0 }}>

        {/* Sheet reference eyebrow — echoes section-header clause numbering */}
        <div style={{
          borderBottom: '1px solid rgba(244,244,240,0.07)',
          padding: '9px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 9, color: 'rgba(244,244,240,0.2)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            SHEET NS-WEB-01 · REV A · NIRMANSHASTRA.IN
          </span>
          <span style={{
            fontFamily: 'var(--font-plex-mono)',
            fontSize: 9,
            color: 'rgba(31,78,121,0.75)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            border: '1px solid rgba(31,78,121,0.28)',
            padding: '2px 10px',
          }}>
            BUILD WITH CERTAINTY
          </span>
        </div>

        {/* 4-column title-block grid — per Design Spec §5B */}
        <div
          className="grid grid-cols-2 lg:grid-cols-4"
          style={{ borderBottom: '1px solid rgba(244,244,240,0.07)' }}
        >
          {/* Column 1: TOOLS */}
          <div className="footer-col-3d" style={{
            padding: '28px 28px 32px',
            borderTop: '2px solid #1F4E79',
            borderRight: '1px solid rgba(244,244,240,0.07)',
          }}>
            <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 9, color: 'rgba(31,78,121,0.75)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>TOOLS</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {ALL_TOOLS.map(t => (
                <Link
                  key={t.name}
                  href={t.href}
                  className="footer-link"
                  style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 14, textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  {t.name}
                  <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: t.free ? '#14532D' : 'rgba(244,244,240,0.28)', flexShrink: 0, marginLeft: 8 }}>
                    {t.free ? 'FREE' : '₹499'}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Column 2: COMPANY */}
          <div className="footer-col-3d" style={{
            padding: '28px 28px 32px',
            borderTop: '2px solid #1F4E79',
            borderRight: '1px solid rgba(244,244,240,0.07)',
          }}>
            <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 9, color: 'rgba(31,78,121,0.75)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>COMPANY</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {[['About', '/about'], ['Contact', '/contact'], ['Blog', '/blog'], ['Careers', '/careers']].map(([label, href]) => (
                <Link key={label} href={href} className="footer-link" style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 14, textDecoration: 'none' }}>{label}</Link>
              ))}
            </div>
          </div>

          {/* Column 3: LEGAL */}
          <div className="footer-col-3d" style={{
            padding: '28px 28px 32px',
            borderTop: '2px solid #1F4E79',
            borderRight: '1px solid rgba(244,244,240,0.07)',
          }}>
            <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 9, color: 'rgba(31,78,121,0.75)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>LEGAL</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {[['Privacy Policy', '/privacy-policy'], ['Terms of Use', '/terms-of-use'], ['Disclaimer', '/disclaimer'], ['IS Codes Used', '/is-codes-used']].map(([label, href]) => (
                <Link key={label} href={href} className="footer-link" style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 14, textDecoration: 'none' }}>{label}</Link>
              ))}
            </div>
          </div>

          {/* Column 4: DRAWING INFO — mini title block per Design Spec §5B */}
          <div style={{
            padding: '28px 28px 32px',
            borderTop: '2px solid rgba(31,78,121,0.45)',
          }}>
            <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 9, color: 'rgba(31,78,121,0.55)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>DRAWING INFO</p>
            <div style={{ border: '1px solid rgba(244,244,240,0.09)', display: 'flex', flexDirection: 'column' }}>
              {([
                ['DRG NO.', 'NS-WEB-01'],
                ['DRAWN BY', 'NIRMANSHASTRA'],
                ['CHECKED', 'IS 456 · 875 · 732'],
                ['DATE', String(new Date().getFullYear())],
                ['REV', 'A'],
              ] as [string, string][]).map(([label, value], i, arr) => (
                <div key={label} style={{ display: 'flex', borderBottom: i < arr.length - 1 ? '1px solid rgba(244,244,240,0.07)' : 'none' }}>
                  <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 9, color: 'rgba(244,244,240,0.28)', letterSpacing: '0.07em', textTransform: 'uppercase', padding: '7px 10px', borderRight: '1px solid rgba(244,244,240,0.07)', minWidth: 82, flexShrink: 0 }}>
                    {label}
                  </span>
                  <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: 'rgba(244,244,240,0.55)', padding: '7px 10px', letterSpacing: '0.03em' }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar — wordmark + disclaimer + copyright */}
        <div style={{
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
        }}>
          <div>
            <span style={{ fontFamily: 'var(--font-fraunces)', fontSize: 15, color: '#F4F4F0', fontWeight: 600 }}>NirmanShastra</span>
            <span style={{ fontFamily: 'var(--font-plex-devanagari)', fontSize: 12, color: 'rgba(244,244,240,0.32)', marginLeft: 10 }}>निर्माणशास्त्र</span>
          </div>
          <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: 'rgba(244,244,240,0.5)', letterSpacing: '0.04em' }}>
            Estimates are for budgeting reference only. Not for structural approval without licensed engineer.
          </p>
          <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: 'rgba(244,244,240,0.5)', letterSpacing: '0.04em' }}>
            © {new Date().getFullYear()} NirmanShastra
          </p>
        </div>

      </footer>
    </main>
  )
}
