'use client'

import React, { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'

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
    phase: 'P1', name: 'StructoPro',
    descriptor: 'Structural Cost & BOQ Estimator',
    tagline: 'Structural Cost',
    desc: 'Foundations, columns, beams, slabs per IS 456:2000. M20 / M25 / M30 grades.',
    price: '₹499', free: false, href: '/tools/structopro',
  },
  {
    phase: 'P2', name: 'MasonPro',
    descriptor: 'Masonry Cost & BOQ Estimator',
    tagline: 'Masonry Cost',
    desc: 'All 8 wall types — brick, AAC, hollow block — plaster and waterproofing per IS 1077:1992.',
    price: '₹499', free: false, href: '/tools/masonpro',
  },
  {
    phase: 'P3', name: 'ElectroPro',
    descriptor: 'Electrical Cost & BOQ Estimator',
    tagline: 'Electrical Cost',
    desc: 'Wiring, DB panels, earthing per IS 732:2019. Circuit-by-circuit breakdown.',
    price: '₹499', free: false, href: '/tools/electropro',
  },
  {
    phase: 'P4', name: 'PlumbPro',
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
// SVG ENGINEERING ILLUSTRATION
// ─────────────────────────────────────────────────────────────────────────────

function HouseConstructionSVG() {
  const INK = '#F4F4F0'
  const D = 'rgba(244,244,240,0.5)'
  const GLS = 'rgba(244,244,240,0.06)'
  const WAL = 'rgba(244,244,240,0.03)'
  const SLB = 'rgba(244,244,240,0.09)'
  return (
    <svg width="100%" viewBox="0 0 520 325" fill="none" aria-hidden="true" style={{ opacity: 0.82 }}>
      <line x1="32" y1="275" x2="488" y2="275" stroke={INK} strokeWidth="1.5" />
      {Array.from({ length: 15 }, (_, i) => (
        <line key={i} x1={80 + i * 28} y1="275" x2={66 + i * 28} y2="291" stroke={INK} strokeWidth="0.8" opacity="0.28" />
      ))}
      <rect x="62" y="252" width="396" height="23" stroke={INK} strokeWidth="1.2" fill={SLB} />
      <rect x="68" y="137" width="384" height="115" stroke={INK} strokeWidth="1.5" fill={WAL} />
      <rect x="60" y="125" width="400" height="12" stroke={INK} strokeWidth="1.2" fill={SLB} />
      <rect x="68" y="24" width="384" height="101" stroke={INK} strokeWidth="1.5" fill={WAL} />
      <rect x="60" y="8" width="400" height="16" stroke={INK} strokeWidth="1.2" fill={SLB} />
      <line x1="60" y1="8" x2="460" y2="8" stroke={INK} strokeWidth="2" />
      <line x1="68" y1="8" x2="68" y2="252" stroke={INK} strokeWidth="2" />
      <line x1="452" y1="8" x2="452" y2="252" stroke={INK} strokeWidth="2" />
      <line x1="97" y1="163" x2="184" y2="163" stroke={INK} strokeWidth="1.2" />
      <rect x="103" y="165" width="75" height="57" stroke={INK} strokeWidth="1.1" fill={GLS} />
      <line x1="140" y1="165" x2="140" y2="222" stroke={INK} strokeWidth="0.6" opacity="0.7" />
      <line x1="103" y1="193" x2="178" y2="193" stroke={INK} strokeWidth="0.6" opacity="0.7" />
      <line x1="97" y1="222" x2="184" y2="222" stroke={INK} strokeWidth="1.2" />
      <text x="140" y="242" fontSize="7" fill={D} fontFamily="monospace" textAnchor="middle" letterSpacing="0.5">W1</text>
      <line x1="336" y1="163" x2="423" y2="163" stroke={INK} strokeWidth="1.2" />
      <rect x="342" y="165" width="75" height="57" stroke={INK} strokeWidth="1.1" fill={GLS} />
      <line x1="379" y1="165" x2="379" y2="222" stroke={INK} strokeWidth="0.6" opacity="0.7" />
      <line x1="342" y1="193" x2="417" y2="193" stroke={INK} strokeWidth="0.6" opacity="0.7" />
      <line x1="336" y1="222" x2="423" y2="222" stroke={INK} strokeWidth="1.2" />
      <text x="379" y="242" fontSize="7" fill={D} fontFamily="monospace" textAnchor="middle" letterSpacing="0.5">W2</text>
      <line x1="224" y1="163" x2="296" y2="163" stroke={INK} strokeWidth="1.2" />
      <path d="M231,178 Q231,160 260,160 Q289,160 289,178" stroke={INK} strokeWidth="1" fill="none" />
      <rect x="231" y="178" width="58" height="74" stroke={INK} strokeWidth="1.1" fill="rgba(244,244,240,0.05)" />
      <line x1="260" y1="178" x2="260" y2="252" stroke={INK} strokeWidth="0.7" opacity="0.7" />
      <line x1="220" y1="252" x2="300" y2="252" stroke={INK} strokeWidth="1.5" />
      <text x="260" y="242" fontSize="7" fill={D} fontFamily="monospace" textAnchor="middle" letterSpacing="0.5">D1</text>
      <line x1="470" y1="8" x2="470" y2="275" stroke={D} strokeWidth="0.8" />
      <line x1="463" y1="8" x2="477" y2="8" stroke={D} strokeWidth="0.8" />
      <line x1="463" y1="275" x2="477" y2="275" stroke={D} strokeWidth="0.8" />
      <text x="484" y="141" fontSize="7" fill={D} fontFamily="monospace" textAnchor="middle" transform="rotate(-90 484 141)" letterSpacing="0.5">7500</text>
      <line x1="68" y1="292" x2="452" y2="292" stroke={D} strokeWidth="0.8" />
      <line x1="68" y1="285" x2="68" y2="299" stroke={D} strokeWidth="0.8" />
      <line x1="452" y1="285" x2="452" y2="299" stroke={D} strokeWidth="0.8" />
      <text x="260" y="307" fontSize="7.5" fill={D} fontFamily="monospace" textAnchor="middle" letterSpacing="0.5">10800</text>
      <text x="458" y="200" fontSize="7" fill={D} fontFamily="monospace" letterSpacing="0.5">GF</text>
      <text x="458" y="80" fontSize="7" fill={D} fontFamily="monospace" letterSpacing="0.5">FF</text>
      <text x="68" y="321" fontSize="6.5" fill={INK} fontFamily="monospace" letterSpacing="0.6" opacity="0.45">
        NORTH ELEVATION · SCALE 1:100 · RCC FRAMED STRUCTURE · IS 456:2000 · DRG NS-EL-01
      </text>
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function DimDivider({ label, animated = false, dark = false }: { label: string; animated?: boolean; dark?: boolean }) {
  const lineColor = dark ? 'rgba(244,244,240,0.18)' : '#1E2227'
  const textColor = dark ? 'rgba(244,244,240,0.4)' : '#1E2227'
  return (
    <div className="flex items-center gap-4 px-6 md:px-16">
      <div className="flex flex-1 items-center">
        <div style={{ width: 0, height: 0, borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderRight: `7px solid ${lineColor}`, flexShrink: 0 }} />
        <div style={{ flex: 1, height: 1, background: lineColor }} className={animated ? 'animate-dim-line' : ''} />
        <div style={{ width: 1, height: 10, background: lineColor, flexShrink: 0 }} />
      </div>
      <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: textColor, letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <div className="flex flex-1 items-center">
        <div style={{ width: 1, height: 10, background: lineColor, flexShrink: 0 }} />
        <div style={{ flex: 1, height: 1, background: lineColor }} />
        <div style={{ width: 0, height: 0, borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: `7px solid ${lineColor}`, flexShrink: 0 }} />
      </div>
    </div>
  )
}

function SectionHeader({ clause, title, dark = false }: { clause: string; title: string; dark?: boolean }) {
  return (
    <div className="space-y-2">
      <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: dark ? '#6BA3CC' : '#1F4E79', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {clause}
      </p>
      <h2 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 'clamp(28px,3.5vw,48px)', fontWeight: 600, color: dark ? '#F4F4F0' : '#1E2227', lineHeight: 1.15 }}>
        {title}
      </h2>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL CARD
// ─────────────────────────────────────────────────────────────────────────────

const motifMap: Record<string, React.ReactElement> = {
  P0: <Image src="/vastupro-icon.png"    alt="VastuPro"    width={80} height={80} style={{ objectFit: 'contain' }} />,
  P1: <Image src="/structopro-icon.png"  alt="StructoPro"  width={80} height={80} style={{ objectFit: 'contain' }} />,
  P2: <Image src="/masonpro-icon.png"    alt="MasonPro"    width={80} height={80} style={{ objectFit: 'contain' }} />,
  P3: <Image src="/electropro-icon.png"  alt="ElectroPro"  width={80} height={80} style={{ objectFit: 'contain' }} />,
  P4: <Image src="/plumbpro-icon.png"    alt="PlumbPro"    width={80} height={80} style={{ objectFit: 'contain' }} />,
  P5: <Image src="/interiorpro-icon.png" alt="InteriorPro" width={80} height={80} style={{ objectFit: 'contain' }} />,
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, ease: 'easeOut', delay }}
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
            transition: 'border-color 0.15s, transform 0.15s',
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

          <div style={{ color: tool.free ? '#C9A84C' : '#1E2227', width: 80, height: 80, flexShrink: 0 }}>
            {motifMap[tool.phase]}
          </div>

          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: '#1F4E79', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
              {tool.descriptor}
            </p>
            <h3 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 28, fontWeight: 700, color: '#1E2227', marginBottom: 10, lineHeight: 1.1 }}>
              {tool.name}
            </h3>
            <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 15, color: 'rgba(30,34,39,0.63)', lineHeight: 1.7 }}>
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
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// HOMEPAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function Home() {
  const today = new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })

  const sectionRef = useRef<HTMLDivElement>(null)

  return (
    <main className="sheet-frame min-h-screen" style={{ background: '#F4F4F0' }}>

      {/* ── HERO (dark Iron Ink, full viewport width) ─────────────────────── */}
      <div style={{ background: '#1E2227', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <section className="px-6 md:px-16 lg:px-24 pt-20 pb-18">
          <div className="grid grid-cols-1 items-center" style={{ gridTemplateColumns: '55fr 45fr', gap: '4rem' }}>

            {/* Left — headline */}
            <motion.div
              className="space-y-10"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <div>
                <h1 style={{
                  fontFamily: 'var(--font-plex-serif)',
                  fontSize: 'clamp(56px, 8vw, 96px)',
                  fontWeight: 700,
                  color: '#F4F4F0',
                  lineHeight: 1.02,
                  letterSpacing: '-0.02em',
                }}>
                  Build With Certainty.
                </h1>
                <p style={{ fontFamily: 'var(--font-plex-devanagari)', fontSize: 24, color: '#C9A84C', marginTop: 14, letterSpacing: '0.01em' }}>
                  निर्माणशास्त्र
                </p>
              </div>

              <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 18, color: 'rgba(244,244,240,0.65)', lineHeight: 1.65, maxWidth: 540 }}>
                Stop your contractor from overcharging you. Get exact material quantities backed by Indian Standards.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/tools/vastu-pro"
                  style={{ background: '#8C3A22', color: '#F4F4F0', fontFamily: 'var(--font-plex-mono)', fontSize: 14, padding: '15px 32px', borderRadius: 6, display: 'inline-block', textDecoration: 'none', letterSpacing: '0.02em', fontWeight: 500 }}
                >
                  Start Free — VastuPro
                </Link>
                <a
                  href="#pricing"
                  style={{ border: '1px solid rgba(244,244,240,0.3)', color: '#F4F4F0', fontFamily: 'var(--font-plex-mono)', fontSize: 14, padding: '15px 32px', borderRadius: 6, display: 'inline-block', textDecoration: 'none', background: 'transparent', letterSpacing: '0.02em' }}
                >
                  See Pricing ↓
                </a>
              </div>

              {/* Stats row — huge Plex Mono numbers */}
              <div className="flex flex-wrap gap-10 pt-4" style={{ borderTop: '1px solid rgba(244,244,240,0.1)' }}>
                {[['25', 'IS Codes'], ['6', 'Tools'], ['₹499', 'Per Report'], ['₹1,999', 'Bundle']].map(([val, label]) => (
                  <div key={label}>
                    <div style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 'clamp(40px, 5vw, 64px)', fontWeight: 500, color: '#C9A84C', lineHeight: 1 }}>{val}</div>
                    <div style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 12, color: 'rgba(244,244,240,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 6 }}>{label}</div>
                  </div>
                ))}
              </div>

            </motion.div>

            {/* Right — Building elevation illustration (45% of viewport) */}
            <motion.div
              className="flex items-center justify-end"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.15 }}
              style={{ width: '100%' }}
            >
              <div style={{ position: 'relative', width: '100%', minHeight: 500 }}>
                <Image
                  src="/hero-illustration.png"
                  alt="NirmanShastra building elevation"
                  fill
                  style={{ objectFit: 'contain', objectPosition: 'right center' }}
                  priority
                />
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
      <section className="px-6 md:px-16 lg:px-24 py-20" style={{ background: '#1E2227' }}>
        <div className="space-y-14">
          <SectionHeader clause="CL. 1.0 — WHY BUDGETS FAIL" title="The three problems no contractor will tell you" dark />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            {PROBLEMS.map((p, i) => (
              <motion.div
                key={p.no}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45, ease: 'easeOut', delay: i * 0.2 }}
                style={{
                  borderLeft: i === 0 ? '1px solid rgba(244,244,240,0.1)' : 'none',
                  borderRight: '1px solid rgba(244,244,240,0.1)',
                  borderTop: '1px solid rgba(244,244,240,0.1)',
                  borderBottom: '1px solid rgba(244,244,240,0.1)',
                  padding: '48px 40px',
                  background: 'rgba(255,255,255,0.02)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Big number — 120px Blueprint blue at 20% opacity */}
                <div style={{
                  fontFamily: 'var(--font-plex-mono)',
                  fontSize: 120,
                  color: 'rgba(31,78,121,0.2)',
                  fontWeight: 700,
                  lineHeight: 1,
                  userSelect: 'none',
                  marginBottom: 24,
                }}>
                  {p.no}
                </div>
                <h3 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 26, fontWeight: 600, color: '#F4F4F0', marginBottom: 16, lineHeight: 1.25 }}>
                  {p.heading}
                </h3>
                <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 16, color: 'rgba(244,244,240,0.56)', lineHeight: 1.75 }}>
                  {p.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DIMENSION DIVIDER (dark) ─────────────────────────────────────── */}
      <div style={{ background: '#1E2227', paddingTop: 14, paddingBottom: 14 }}>
        <DimDivider label="SHEET 02 · 6 TOOLS · 1 PLATFORM" dark />
      </div>

      {/* ── TOOLS SECTION (dark section, full width) ──────────────────────── */}
      <section className="px-6 md:px-16 lg:px-24 py-20" style={{ background: '#1E2227' }} ref={sectionRef}>
        <div className="space-y-14">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <SectionHeader clause="CL. 2.0 — SCOPE OF TOOLS" title="Every phase of your construction, estimated" dark />
            <div style={{ border: '1px solid rgba(31,78,121,0.4)', padding: '14px 20px', background: 'rgba(31,78,121,0.1)', flexShrink: 0, maxWidth: 380 }}>
              <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: '#7BA7CC', letterSpacing: '0.05em', lineHeight: 1.5 }}>
                Professional IS-code compliant BOQ for each construction phase
              </p>
              <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 13, color: 'rgba(244,244,240,0.4)', marginTop: 4 }}>
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
                <span style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 16, fontWeight: 600, color: 'rgba(244,244,240,0.75)' }}>Compliance &amp; Analysis</span>
                <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, padding: '2px 8px', border: '1px solid #14532D', color: '#14532D', letterSpacing: '0.04em' }}>FREE</span>
              </div>
              <div style={{ height: 1, flex: 1, background: 'rgba(244,244,240,0.08)' }} />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
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
                  <div style={{ width: 80, height: 80, flexShrink: 0 }}>
                    <Image src="/vastupro-icon.png" alt="VastuPro" width={80} height={80} style={{ objectFit: 'contain' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: '#1F4E79', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                      {VASTU_TOOL.descriptor}
                    </p>
                    <h3 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 32, fontWeight: 700, color: '#1E2227', marginBottom: 8 }}>
                      {VASTU_TOOL.name}
                    </h3>
                    <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 15, color: 'rgba(30,34,39,0.63)', lineHeight: 1.65, maxWidth: 560 }}>
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
            </motion.div>
          </div>

          {/* Suite 2 divider */}
          <div style={{ paddingTop: 8 }}>
            <div className="flex items-center gap-4 mb-3">
              <div style={{ height: 1, flex: 1, background: 'rgba(244,244,240,0.08)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: 'rgba(244,244,240,0.28)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>SUITE 2</span>
                <span style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 16, fontWeight: 600, color: 'rgba(244,244,240,0.75)' }}>Phase-wise Cost &amp; BOQ Estimation</span>
                <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, padding: '2px 8px', border: '1px solid rgba(31,78,121,0.55)', color: '#7BA7CC', letterSpacing: '0.04em' }}>₹499 / REPORT</span>
              </div>
              <div style={{ height: 1, flex: 1, background: 'rgba(244,244,240,0.08)' }} />
            </div>
            <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 13, color: 'rgba(244,244,240,0.32)', textAlign: 'center' }}>
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
              <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 16, color: 'rgba(244,244,240,0.57)' }}>
                StructoPro · MasonPro · ElectroPro · PlumbPro · InteriorPro
                {' '}&mdash; saves{' '}
                <span style={{ fontFamily: 'var(--font-plex-mono)' }}>₹496</span> vs buying separately
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 40, fontWeight: 500, color: '#F4F4F0' }}>₹1,999</span>
              <Link
                href="/tools/structopro"
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
      <section id="how-it-works" className="grid-paper px-6 md:px-16 lg:px-24 py-20">
        <div className="space-y-14">
          <SectionHeader clause="CL. 3.0 — PROCESS" title="How NirmanShastra works" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.rev}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.35, ease: 'easeOut', delay: i * 0.1 }}
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
                <h3 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 20, fontWeight: 600, color: '#1E2227', marginBottom: 12, lineHeight: 1.3 }}>
                  {step.heading}
                </h3>
                <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 15, color: 'rgba(30,34,39,0.65)', lineHeight: 1.7 }}>
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
      <section className="px-6 md:px-16 lg:px-24 py-20" style={{ background: '#1E2227' }}>
        <div className="space-y-10">
          <SectionHeader
            clause="CL. 3.5 — COMPETITIVE COMPARISON"
            title="Why NirmanShastra beats free calculators"
            dark
          />
          <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 16, color: 'rgba(244,244,240,0.6)', lineHeight: 1.65, maxWidth: 680 }}>
            Free online calculators steal your phone number and sell it to contractors. Here&apos;s what you actually get.
          </p>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-plex-sans)', fontSize: 14 }}>
              <thead>
                <tr>
                  <th style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: 'rgba(244,244,240,0.45)', letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'left', padding: '10px 16px', borderBottom: '1px solid rgba(244,244,240,0.12)', borderRight: '1px solid rgba(244,244,240,0.08)', minWidth: 200 }}>Feature</th>
                  <th style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: '#EF4444', letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'left', padding: '10px 16px', borderBottom: '1px solid rgba(244,244,240,0.12)', borderRight: '1px solid rgba(244,244,240,0.08)', minWidth: 260 }}>Free Online Calculators</th>
                  <th style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: '#1F4E79', letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'left', padding: '10px 16px', borderBottom: '1px solid rgba(244,244,240,0.12)', background: 'rgba(31,78,121,0.15)', minWidth: 280 }}>NirmanShastra (₹499/phase)</th>
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
                    ns: 'Professional 10-page PDF with BOQ, IS compliance, site checklist',
                  },
                  {
                    feature: 'Your data',
                    free: 'Sold to contractor lead networks',
                    ns: 'Never sold. Your project data is yours.',
                  },
                ].map((row, i) => (
                  <tr key={row.feature} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                    <td style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 14, color: 'rgba(244,244,240,0.75)', padding: '12px 16px', borderBottom: '1px solid rgba(244,244,240,0.07)', borderRight: '1px solid rgba(244,244,240,0.08)', verticalAlign: 'top' }}>{row.feature}</td>
                    <td style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 14, color: 'rgba(244,244,240,0.5)', padding: '12px 16px', borderBottom: '1px solid rgba(244,244,240,0.07)', borderRight: '1px solid rgba(244,244,240,0.08)', verticalAlign: 'top' }}>
                      <span style={{ color: '#EF4444', fontWeight: 700, marginRight: 8 }}>✗</span>{row.free}
                    </td>
                    <td style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 14, color: 'rgba(244,244,240,0.85)', padding: '12px 16px', borderBottom: '1px solid rgba(244,244,240,0.07)', background: 'rgba(31,78,121,0.1)', verticalAlign: 'top' }}>
                      <span style={{ color: '#1F4E79', fontWeight: 700, marginRight: 8 }}>✓</span>{row.ns}
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
      <section className="px-6 md:px-16 lg:px-24 py-20" style={{ background: '#1F4E79' }}>
        <div className="space-y-10">
          <div className="space-y-2">
            <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: 'rgba(244,244,240,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              CL. 4.0 — CODE COMPLIANCE
            </p>
            <h2 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 'clamp(28px,3.5vw,48px)', fontWeight: 600, color: '#F4F4F0', lineHeight: 1.15 }}>
              Every calculation backed by Bureau of Indian Standards
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
            <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 15, color: 'rgba(244,244,240,0.72)', lineHeight: 1.65, margin: 0 }}>
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
      <section id="pricing" className="grid-paper px-6 md:px-16 lg:px-24 py-20">
        <div className="space-y-14">
          <SectionHeader clause="CL. 5.0 — PRICING · LAUNCH 2026" title="Simple, report-by-report pricing" />

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
                <h3 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 28, fontWeight: 700, color: '#1E2227', marginBottom: 4 }}>VastuPro</h3>
                <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 12, color: 'rgba(30,34,39,0.5)', marginBottom: 10 }}>Vastu Compliance Analyser</p>
                <div style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 48, fontWeight: 500, color: '#14532D', lineHeight: 1 }}>FREE</div>
                <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 13, color: 'rgba(30,34,39,0.5)', marginTop: 6 }}>forever · no payment required</p>
              </div>
              <ul style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['Vastu compliance analysis','33 room types supported','16-zone Vastu Mandala','Score + remedies','Full PDF report','IS 4326:1993 seismic warnings'].map(f => (
                  <li key={f} style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 15, color: 'rgba(30,34,39,0.68)', display: 'flex', gap: 10 }}>
                    <span style={{ color: '#14532D', fontWeight: 700, flexShrink: 0 }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link
                href="/tools/vastu-pro"
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
                <h3 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 28, fontWeight: 700, color: '#1E2227', marginBottom: 4 }}>Single Tool</h3>
                <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 12, color: 'rgba(30,34,39,0.5)', marginBottom: 10 }}>IS-Code BOQ Estimator</p>
                <div style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 48, fontWeight: 500, color: '#1E2227', lineHeight: 1 }}>₹499</div>
                <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 13, color: 'rgba(30,34,39,0.5)', marginTop: 6 }}>per report · StructoPro to InteriorPro</p>
              </div>
              <ul style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['Exact material quantities','Itemised cost breakdown','IS code compliance panel','CPWD labour cost calculator','Contractor quote comparison','PDF report with SVG drawings'].map(f => (
                  <li key={f} style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 15, color: 'rgba(30,34,39,0.68)', display: 'flex', gap: 10 }}>
                    <span style={{ color: '#1F4E79', fontWeight: 700, flexShrink: 0 }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link
                href="/tools/structopro"
                style={{ display: 'block', textAlign: 'center', background: '#8C3A22', color: '#F4F4F0', fontFamily: 'var(--font-plex-mono)', fontSize: 14, padding: '14px', borderRadius: 6, textDecoration: 'none', letterSpacing: '0.03em' }}
              >
                Start with StructoPro →
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
                <h3 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 28, fontWeight: 700, color: '#1E2227', marginBottom: 4 }}>Full Platform</h3>
                <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 12, color: 'rgba(30,34,39,0.5)', marginBottom: 10 }}>All 5 Phase Estimators</p>
                <div style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 48, fontWeight: 500, color: '#1E2227', lineHeight: 1 }}>₹1,999</div>
                <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 13, color: 'rgba(30,34,39,0.5)', marginTop: 6 }}>
                  saves <span style={{ fontFamily: 'var(--font-plex-mono)' }}>₹496</span> vs buying individually
                </p>
              </div>
              <ul style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['StructoPro + MasonPro','ElectroPro + PlumbPro','InteriorPro','All quantities across all phases','Cross-phase contractor comparison','Grand Total Report (₹999) free'].map(f => (
                  <li key={f} style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 15, color: 'rgba(30,34,39,0.68)', display: 'flex', gap: 10 }}>
                    <span style={{ color: '#8C3A22', fontWeight: 700, flexShrink: 0 }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link
                href="/tools/structopro"
                style={{ display: 'block', textAlign: 'center', background: '#8C3A22', color: '#F4F4F0', fontFamily: 'var(--font-plex-mono)', fontSize: 14, padding: '14px', borderRadius: 6, textDecoration: 'none', letterSpacing: '0.03em' }}
              >
                Get Bundle →
              </Link>
            </motion.div>
          </div>

        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid #1E2227', background: '#1E2227', marginTop: 0 }}>
        <div style={{ borderLeft: '1px solid rgba(244,244,240,0.1)', borderRight: '1px solid rgba(244,244,240,0.1)' }}>
          <div className="grid grid-cols-2 md:grid-cols-4 px-6 md:px-16 lg:px-24" style={{ borderBottom: '1px solid rgba(244,244,240,0.1)' }}>

            <div style={{ padding: '32px 0 32px 0', paddingRight: 40, borderRight: '1px solid rgba(244,244,240,0.1)' }}>
              <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 9, color: 'rgba(244,244,240,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>TOOLS</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {ALL_TOOLS.map(t => (
                  <Link key={t.name} href={t.href} style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 14, color: 'rgba(244,244,240,0.65)', textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {t.name}
                    <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: t.free ? '#14532D' : 'rgba(244,244,240,0.35)' }}>{t.free ? 'FREE' : '₹499'}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div style={{ padding: '32px 0 32px 40px', borderRight: '1px solid rgba(244,244,240,0.1)', paddingRight: 40 }}>
              <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 9, color: 'rgba(244,244,240,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>COMPANY</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[['About', '#'], ['Contact', '#'], ['Blog', '#'], ['Careers', '#']].map(([label, href]) => (
                  <a key={label} href={href} style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 14, color: 'rgba(244,244,240,0.65)', textDecoration: 'none' }}>{label}</a>
                ))}
              </div>
            </div>

            <div style={{ padding: '32px 0 32px 40px', borderRight: '1px solid rgba(244,244,240,0.1)', paddingRight: 40 }}>
              <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 9, color: 'rgba(244,244,240,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>LEGAL</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[['Privacy Policy', '#'], ['Terms of Use', '#'], ['Disclaimer', '#'], ['IS Codes Used', '#']].map(([label, href]) => (
                  <a key={label} href={href} style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 14, color: 'rgba(244,244,240,0.65)', textDecoration: 'none' }}>{label}</a>
                ))}
              </div>
            </div>

            <div style={{ padding: '32px 0 32px 40px' }}>
              <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 9, color: 'rgba(244,244,240,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>DRG BLOCK</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  ['PROJECT', 'NIRMANSHASTRA'],
                  ['DRG NO.', 'NS-001'],
                  ['DATE', today],
                  ['REV', 'A'],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', gap: 10 }}>
                    <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 9, color: 'rgba(244,244,240,0.35)', letterSpacing: '0.06em', textTransform: 'uppercase', minWidth: 60, flexShrink: 0 }}>{k}</span>
                    <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 12, color: 'rgba(244,244,240,0.8)' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="px-6 md:px-16 lg:px-24" style={{ padding: '16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, paddingTop: 16, paddingBottom: 16 }}>
            <div style={{ paddingLeft: 0 }}>
              <span style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 15, color: '#F4F4F0', fontWeight: 600 }}>NirmanShastra</span>
              <span style={{ fontFamily: 'var(--font-plex-devanagari)', fontSize: 12, color: 'rgba(244,244,240,0.4)', marginLeft: 10 }}>निर्माणशास्त्र</span>
            </div>
            <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: 'rgba(244,244,240,0.35)', letterSpacing: '0.04em' }}>
              Estimates are for budgeting reference only. Not for structural approval without licensed engineer.
            </p>
            <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: 'rgba(244,244,240,0.35)', letterSpacing: '0.04em' }}>
              © {new Date().getFullYear()} NirmanShastra
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
