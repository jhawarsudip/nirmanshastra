'use client'

import React, { useRef } from 'react'
import Link from 'next/link'
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
    descriptor: 'RCC Structure Cost Estimator',
    tagline: 'RCC Structure Cost',
    desc: 'Foundations, columns, beams, slabs per IS 456:2000. M20 / M25 / M30 grades.',
    price: '₹499', free: false, href: '/tools/structopro',
  },
  {
    phase: 'P2', name: 'MasonPro',
    descriptor: 'Masonry & Plaster Estimator',
    tagline: 'Masonry & Plaster',
    desc: 'All 8 wall types — brick, AAC, hollow block — plaster and waterproofing per IS 1077:1992.',
    price: '₹499', free: false, href: '/tools/masonpro',
  },
  {
    phase: 'P3', name: 'ElectroPro',
    descriptor: 'Electrical Wiring Estimator',
    tagline: 'Electrical',
    desc: 'Wiring, DB panels, earthing per IS 732:2019. Circuit-by-circuit breakdown.',
    price: '₹499', free: false, href: '/tools/electropro',
  },
  {
    phase: 'P4', name: 'PlumbPro',
    descriptor: 'Plumbing & Drainage Estimator',
    tagline: 'Plumbing',
    desc: 'Water supply, drainage, sanitary fixtures per IS 1172:1993. Tank sizing included.',
    price: '₹499', free: false, href: '/tools/plumbpro',
  },
  {
    phase: 'P5', name: 'InteriorPro',
    descriptor: 'Interior Finishing Estimator',
    tagline: 'Interior Finishing',
    desc: 'Flooring, kitchen, paint, false ceiling across Basic / Standard / Premium / Luxury.',
    price: '₹499', free: false, href: '/tools/interiorpro',
  },
]

const ALL_TOOLS = [VASTU_TOOL, ...PAID_TOOLS]

const PROBLEMS = [
  {
    no: '01',
    heading: 'Contractors quote without IS codes',
    body: 'Most residential estimates use thumb rules and verbal norms, not IS 456 or IS 732. You have no standardised baseline to verify against.',
  },
  {
    no: '02',
    heading: 'Quantity inflation is invisible',
    body: 'Inflated brick counts, wrong mortar ratios, oversized pipe diameters — all buried inside a single lump-sum figure. A detailed breakdown would expose them instantly.',
  },
  {
    no: '03',
    heading: 'Five phases, zero unified picture',
    body: 'Structure, masonry, electrical, plumbing, interior — five contractors, five quotations, no reconciled total and no way to track where the budget went.',
  },
]

const STEPS = [
  {
    rev: 'REV A',
    heading: 'Answer plain questions',
    body: 'No engineering degree required. IS codes run silently in the background. Rates pre-filled from city databases.',
  },
  {
    rev: 'REV B',
    heading: 'See IS compliance live',
    body: 'Every estimate auto-checks against 25 IS codes. Green / amber / red badges appear as you fill in project details.',
  },
  {
    rev: 'REV C',
    heading: 'Unlock exact quantities',
    body: 'Pay ₹499. See cement bags, steel kg, wire metres, pipe lengths, brick counts — line by line with labour costs.',
  },
  {
    rev: 'REV D',
    heading: 'Compare your contractor',
    body: 'Paste their quote. Get a line-by-line comparison showing exactly where it diverges from the IS-code baseline.',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// SVG MOTIFS — per-app engineering hatch conventions
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

function ElectroGlyph() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <line x1="0"  y1="22" x2="44" y2="22" stroke="currentColor" strokeWidth="1.5" opacity=".45" />
      <circle cx="13" cy="22" r="6" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="31" cy="22" r="6" stroke="currentColor" strokeWidth="1.5" />
      <line x1="13" y1="16" x2="13" y2="8"  stroke="currentColor" strokeWidth="1"   opacity=".7" />
      <line x1="31" y1="16" x2="31" y2="8"  stroke="currentColor" strokeWidth="1"   opacity=".7" />
      <line x1="10" y1="8"  x2="16" y2="8"  stroke="currentColor" strokeWidth="1"   opacity=".55" />
      <line x1="28" y1="8"  x2="34" y2="8"  stroke="currentColor" strokeWidth="1"   opacity=".55" />
    </svg>
  )
}

function PlumbRiser() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <line x1="22" y1="0"  x2="22" y2="18" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12,18 Q12,37 22,37 Q32,37 32,18" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <line x1="32" y1="37" x2="32" y2="44" stroke="currentColor" strokeWidth="1.5" />
      <line x1="8"  y1="18" x2="36" y2="18" stroke="currentColor" strokeWidth="1"   opacity=".5" />
    </svg>
  )
}

function InteriorTile() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <rect x="1"  y="1"  width="19" height="19" stroke="currentColor" strokeWidth="1" />
      <rect x="24" y="1"  width="19" height="19" stroke="currentColor" strokeWidth="1" />
      <rect x="1"  y="24" width="19" height="19" stroke="currentColor" strokeWidth="1" />
      <rect x="24" y="24" width="19" height="19" stroke="currentColor" strokeWidth="1" />
    </svg>
  )
}

function VastuMandala() {
  const spokes = Array.from({ length: 16 }, (_, i) => {
    const rad = (i * 22.5 - 90) * (Math.PI / 180)
    return {
      x2: parseFloat((22 + 18 * Math.cos(rad)).toFixed(2)),
      y2: parseFloat((22 + 18 * Math.sin(rad)).toFixed(2)),
    }
  })
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true"
      style={{ background: '#1E2227' }}>
      {spokes.map((s, i) => (
        <line key={i} x1="22" y1="22" x2={s.x2} y2={s.y2}
          stroke="#C9A84C" strokeWidth=".9" opacity=".9" />
      ))}
      <circle cx="22" cy="22" r="5"  stroke="#C9A84C" strokeWidth="1"  fill="none" />
      <circle cx="22" cy="22" r="18" stroke="#C9A84C" strokeWidth=".8" fill="none" opacity=".5" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG ENGINEERING ILLUSTRATIONS
// ─────────────────────────────────────────────────────────────────────────────

function HouseConstructionSVG() {
  const INK = '#1E2227'
  return (
    <svg width="220" height="150" viewBox="0 0 220 150" fill="none" aria-hidden="true"
      style={{ opacity: 0.55 }}>
      {/* Ground line */}
      <line x1="10" y1="138" x2="210" y2="138" stroke={INK} strokeWidth="1.5" />
      {/* Footing left */}
      <rect x="22" y="130" width="20" height="8" stroke={INK} strokeWidth="0.8" fill="none" />
      {/* Footing right */}
      <rect x="178" y="130" width="20" height="8" stroke={INK} strokeWidth="0.8" fill="none" />
      {/* Footing centre */}
      <rect x="100" y="130" width="20" height="8" stroke={INK} strokeWidth="0.8" fill="none" />
      {/* Left column */}
      <rect x="27" y="40" width="10" height="90" stroke={INK} strokeWidth="1" fill="rgba(30,34,39,0.04)" />
      {/* Right column */}
      <rect x="183" y="40" width="10" height="90" stroke={INK} strokeWidth="1" fill="rgba(30,34,39,0.04)" />
      {/* Centre column */}
      <rect x="105" y="40" width="10" height="90" stroke={INK} strokeWidth="1" fill="rgba(30,34,39,0.04)" />
      {/* Ground floor beam (left span) */}
      <rect x="27" y="90" width="88" height="8" stroke={INK} strokeWidth="1" fill="rgba(30,34,39,0.06)" />
      {/* Ground floor beam (right span) */}
      <rect x="105" y="90" width="88" height="8" stroke={INK} strokeWidth="1" fill="rgba(30,34,39,0.06)" />
      {/* Roof beam */}
      <rect x="27" y="32" width="166" height="10" stroke={INK} strokeWidth="1" fill="rgba(30,34,39,0.06)" />
      {/* Partial brick wall - left bay lower */}
      <line x1="37" y1="98" x2="105" y2="98" stroke={INK} strokeWidth="0.4" />
      <line x1="37" y1="107" x2="105" y2="107" stroke={INK} strokeWidth="0.4" />
      <line x1="37" y1="116" x2="105" y2="116" stroke={INK} strokeWidth="0.4" />
      <line x1="37" y1="125" x2="105" y2="125" stroke={INK} strokeWidth="0.4" />
      {[50,68,86].map(x => <line key={x} x1={x} y1="98" x2={x} y2="130" stroke={INK} strokeWidth="0.4" />)}
      {[44,62,80,96].map(x => <line key={x} x1={x} y1="107" x2={x} y2="116" stroke={INK} strokeWidth="0.4" />)}
      {/* Rebar indication in column */}
      <line x1="30" y1="42" x2="30" y2="88" stroke={INK} strokeWidth="0.4" strokeDasharray="3,3" />
      <line x1="34" y1="42" x2="34" y2="88" stroke={INK} strokeWidth="0.4" strokeDasharray="3,3" />
      {/* Dimension arrow - column height */}
      <line x1="8" y1="40" x2="8" y2="130" stroke={INK} strokeWidth="0.6" />
      <line x1="5" y1="40" x2="11" y2="40" stroke={INK} strokeWidth="0.6" />
      <line x1="5" y1="130" x2="11" y2="130" stroke={INK} strokeWidth="0.6" />
      {/* Label */}
      <text x="114" y="148" fontSize="6" fill={INK} fontFamily="monospace" letterSpacing="0.5" opacity=".6">
        RCC STRUCTURAL FRAME
      </text>
    </svg>
  )
}

function BrickWallSVG() {
  const INK = '#1E2227'
  const rows = [0, 1, 2, 3, 4, 5]
  return (
    <svg width="180" height="130" viewBox="0 0 180 130" fill="none" aria-hidden="true"
      style={{ opacity: 0.55 }}>
      {/* Section hatch lines in brick (45°) */}
      {rows.map(row => {
        const y = 10 + row * 18
        const offset = row % 2 === 0 ? 0 : 14
        const bricks = [0, 28, 56, 84, 112, 140]
        return bricks.map((bx, bi) => {
          const bLeft = bx + offset
          if (bLeft > 160) return null
          const bRight = Math.min(bLeft + 24, 160)
          const bTop = y
          const bBottom = y + 13
          return (
            <g key={`${row}-${bi}`}>
              <rect x={bLeft} y={bTop} width={bRight - bLeft} height="13"
                stroke={INK} strokeWidth="0.8" fill="rgba(30,34,39,0.03)" />
              {[0, 5, 10, 15, 20].map(d => (
                <line key={d}
                  x1={Math.max(bLeft, bLeft + d)} y1={bTop}
                  x2={Math.min(bLeft + d + 13, bRight)} y2={Math.min(bTop + (bRight - bLeft - d), bBottom)}
                  stroke={INK} strokeWidth="0.35" opacity=".4"
                  clipPath={`url(#clip-${row}-${bi})`}
                />
              ))}
            </g>
          )
        })
      })}
      {/* Mortar joints (horizontal) */}
      {rows.map(row => (
        <line key={row} x1="0" y1={10 + row * 18 + 13} x2="170" y2={10 + row * 18 + 13}
          stroke={INK} strokeWidth="0.4" opacity=".3" />
      ))}
      {/* Wall outline */}
      <rect x="0" y="10" width="170" height="108" stroke={INK} strokeWidth="1" fill="none" />
      {/* Mortar joint thickness note */}
      <line x1="172" y1="10" x2="172" y2="23" stroke={INK} strokeWidth="0.5" />
      <line x1="170" y1="10" x2="174" y2="10" stroke={INK} strokeWidth="0.5" />
      <line x1="170" y1="23" x2="174" y2="23" stroke={INK} strokeWidth="0.5" />
      <text x="176" y="18" fontSize="5" fill={INK} fontFamily="monospace" opacity=".6">10</text>
      {/* Label */}
      <text x="0" y="125" fontSize="6" fill={INK} fontFamily="monospace" letterSpacing="0.5" opacity=".6">
        BRICK SECTION — IS 1077:1992
      </text>
    </svg>
  )
}

function ElectricalLineSVG() {
  const INK = '#1E2227'
  return (
    <svg width="200" height="130" viewBox="0 0 200 130" fill="none" aria-hidden="true"
      style={{ opacity: 0.55 }}>
      {/* Main incomer line */}
      <line x1="20" y1="20" x2="20" y2="60" stroke={INK} strokeWidth="1.5" />
      {/* Main MCB symbol */}
      <circle cx="20" cy="68" r="8" stroke={INK} strokeWidth="1" fill="none" />
      <line x1="16" y1="64" x2="24" y2="72" stroke={INK} strokeWidth="1" />
      {/* Distribution line */}
      <line x1="20" y1="76" x2="20" y2="90" stroke={INK} strokeWidth="1.2" />
      <line x1="20" y1="90" x2="170" y2="90" stroke={INK} strokeWidth="1.2" />
      {/* Branch 1 — Lighting */}
      <line x1="50" y1="90" x2="50" y2="105" stroke={INK} strokeWidth="1" />
      <circle cx="50" cy="113" r="6" stroke={INK} strokeWidth="0.8" fill="none" />
      <line x1="47" y1="110" x2="53" y2="116" stroke={INK} strokeWidth="0.8" />
      <text x="43" y="126" fontSize="5" fill={INK} fontFamily="monospace" opacity=".7">L1</text>
      {/* Branch 2 — Power */}
      <line x1="90" y1="90" x2="90" y2="105" stroke={INK} strokeWidth="1" />
      <circle cx="90" cy="113" r="6" stroke={INK} strokeWidth="0.8" fill="none" />
      <line x1="87" y1="110" x2="93" y2="116" stroke={INK} strokeWidth="0.8" />
      <text x="83" y="126" fontSize="5" fill={INK} fontFamily="monospace" opacity=".7">P1</text>
      {/* Branch 3 — AC */}
      <line x1="130" y1="90" x2="130" y2="105" stroke={INK} strokeWidth="1" />
      <circle cx="130" cy="113" r="6" stroke={INK} strokeWidth="0.8" fill="none" />
      <line x1="127" y1="110" x2="133" y2="116" stroke={INK} strokeWidth="0.8" />
      <text x="120" y="126" fontSize="5" fill={INK} fontFamily="monospace" opacity=".7">AC</text>
      {/* Branch 4 — Geyser */}
      <line x1="160" y1="90" x2="160" y2="105" stroke={INK} strokeWidth="1" />
      <circle cx="160" cy="113" r="6" stroke={INK} strokeWidth="0.8" fill="none" />
      <line x1="157" y1="110" x2="163" y2="116" stroke={INK} strokeWidth="0.8" />
      <text x="150" y="126" fontSize="5" fill={INK} fontFamily="monospace" opacity=".7">GYZ</text>
      {/* Incomer label */}
      <text x="26" y="18" fontSize="5.5" fill={INK} fontFamily="monospace" opacity=".6">MAIN INCOMER</text>
      {/* DB label */}
      <rect x="8" y="86" width="24" height="8" stroke={INK} strokeWidth="0.5" fill="rgba(31,78,121,0.05)" />
      <text x="10" y="92" fontSize="4.5" fill={INK} fontFamily="monospace" opacity=".6">DB-1</text>
      {/* Wire sizes */}
      <text x="25" y="55" fontSize="4.5" fill={INK} fontFamily="monospace" opacity=".5">10mm²</text>
      {/* Label */}
      <text x="0" y="10" fontSize="6" fill={INK} fontFamily="monospace" letterSpacing="0.5" opacity=".6">
        SINGLE LINE DIAGRAM — IS 732:2019
      </text>
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function DimDivider({ label, animated = false }: { label: string; animated?: boolean }) {
  const INK = '#1E2227'
  return (
    <div className="flex items-center gap-4 px-6 md:px-12">
      <div className="flex flex-1 items-center">
        <div style={{ width: 0, height: 0, borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderRight: `7px solid ${INK}`, flexShrink: 0 }} />
        <div style={{ flex: 1, height: 1, background: INK }} className={animated ? 'animate-dim-line' : ''} />
        <div style={{ width: 1, height: 10, background: INK, flexShrink: 0 }} />
      </div>
      <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: INK, letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <div className="flex flex-1 items-center">
        <div style={{ width: 1, height: 10, background: INK, flexShrink: 0 }} />
        <div style={{ flex: 1, height: 1, background: INK }} />
        <div style={{ width: 0, height: 0, borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: `7px solid ${INK}`, flexShrink: 0 }} />
      </div>
    </div>
  )
}

function SectionHeader({ clause, title }: { clause: string; title: string }) {
  return (
    <div className="space-y-1">
      <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: '#1F4E79', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {clause}
      </p>
      <h2 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 'clamp(22px,3vw,30px)', fontWeight: 700, color: '#1E2227', lineHeight: 1.2 }}>
        {title}
      </h2>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL CARD
// ─────────────────────────────────────────────────────────────────────────────

const motifMap: Record<string, React.ReactElement> = {
  P0: <VastuMandala />,
  P1: <StructoHatch />,
  P2: <MasonHatch />,
  P3: <ElectroGlyph />,
  P4: <PlumbRiser />,
  P5: <InteriorTile />,
}

function ToolCard({ tool, delay = 0 }: { tool: typeof VASTU_TOOL; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35, ease: 'easeOut', delay }}
    >
      <Link href={tool.href} style={{ textDecoration: 'none', display: 'block' }}>
        <article
          style={{
            border: `1px solid ${tool.free ? '#C9A84C' : '#1E2227'}`,
            padding: '20px',
            background: '#F4F4F0',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            minHeight: 220,
            cursor: 'pointer',
            transition: 'border-color 0.15s',
          }}
        >
          <span style={{ position: 'absolute', top: 6, right: 12, fontFamily: 'var(--font-plex-mono)', fontSize: 52, color: 'rgba(30,34,39,0.05)', fontWeight: 500, lineHeight: 1, userSelect: 'none' }}>
            {tool.phase}
          </span>

          <div style={{ color: tool.free ? '#C9A84C' : '#1E2227', width: 44, height: 44, flexShrink: 0 }}>
            {motifMap[tool.phase]}
          </div>

          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 9, color: '#1F4E79', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>
              {tool.descriptor}
            </p>
            <h3 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 20, fontWeight: 700, color: '#1E2227', marginBottom: 8 }}>
              {tool.name}
            </h3>
            <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 13, color: 'rgba(30,34,39,0.63)', lineHeight: 1.65 }}>
              {tool.desc}
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{
              fontFamily: 'var(--font-plex-mono)',
              fontSize: 12,
              padding: '3px 9px',
              border: `1px solid ${tool.free ? '#14532D' : '#1F4E79'}`,
              color: tool.free ? '#14532D' : '#1F4E79',
              letterSpacing: '0.04em',
            }}>
              {tool.price}
            </span>
            <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: 'rgba(30,34,39,0.35)' }}>
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

  const titleRows: [string, string][] = [
    ['PROJECT',          'YOUR HOME'],
    ['DRG NO.',          'NS-001'],
    ['DRAWN BY',         'NIRMANSHASTRA'],
    ['CHECKED AGAINST',  'IS 456 · 1077 · 732 · 1172 · 1893'],
    ['SCALE',            '1:1 COST CERTAINTY'],
    ['DATE',             `${today}   REV A`],
  ]

  const sectionRef = useRef<HTMLDivElement>(null)

  return (
    <main className="sheet-frame min-h-screen" style={{ background: '#F4F4F0' }}>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="px-6 md:px-12 pt-14 pb-12 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

        {/* Left — headline */}
        <motion.div
          className="space-y-7"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div>
            <h1 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 'clamp(38px,5vw,56px)', fontWeight: 700, color: '#1E2227', lineHeight: 1.08, letterSpacing: '-0.01em' }}>
              Build With Certainty.
            </h1>
            <p style={{ fontFamily: 'var(--font-plex-devanagari)', fontSize: 16, color: 'rgba(30,34,39,0.5)', marginTop: 6 }}>
              निर्माणशास्त्र
            </p>
          </div>

          <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 15, color: 'rgba(30,34,39,0.72)', lineHeight: 1.7, maxWidth: 500 }}>
            India&rsquo;s first IS-code construction cost estimation platform.
            Know exact material quantities, catch contractor inflation, and build your home
            with engineering certainty — phase by phase.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/tools/vastu-pro"
              style={{ background: '#14532D', color: '#F4F4F0', fontFamily: 'var(--font-plex-mono)', fontSize: 13, padding: '11px 22px', borderRadius: 6, display: 'inline-block', textDecoration: 'none', letterSpacing: '0.02em' }}
            >
              Start Free — VastuPro
            </Link>
            <a
              href="#pricing"
              style={{ border: '1px solid #1E2227', color: '#1E2227', fontFamily: 'var(--font-plex-mono)', fontSize: 13, padding: '11px 22px', borderRadius: 6, display: 'inline-block', textDecoration: 'none', background: 'transparent', letterSpacing: '0.02em' }}
            >
              See Pricing ↓
            </a>
          </div>

          {/* Stats */}
          <div className="flex gap-10 pt-2" style={{ borderTop: '1px solid rgba(30,34,39,0.1)', paddingTop: 20 }}>
            {[['25', 'IS Codes'], ['6', 'Tools'], ['₹499', 'Per Report'], ['₹2,999', 'Bundle']].map(([val, label]) => (
              <div key={label}>
                <div style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 20, fontWeight: 500, color: '#1E2227' }}>{val}</div>
                <div style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 11, color: 'rgba(30,34,39,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* SVG Illustration — house under construction, below stats */}
          <div style={{ paddingTop: 12, opacity: 1 }}>
            <HouseConstructionSVG />
          </div>
        </motion.div>

        {/* Right — Engineering title block */}
        <motion.div
          className="flex justify-center lg:justify-end"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.15 }}
        >
          <div
            className="hero-title-block"
            style={{ border: '1px solid #1E2227', fontFamily: 'var(--font-plex-mono)', display: 'inline-block' }}
          >
            <table style={{ borderCollapse: 'collapse', minWidth: 340 }}>
              <tbody>
                {titleRows.map(([label, value], i) => (
                  <tr key={label} style={i > 0 ? { borderTop: '1px solid #1E2227' } : {}}>
                    <td style={{ borderRight: '1px solid #1E2227', padding: '8px 14px', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(30,34,39,0.55)', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                      {label}
                    </td>
                    <td style={{ padding: '8px 14px', fontSize: 13, color: '#1E2227', verticalAlign: 'top' }}>
                      {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </section>

      {/* ── DIMENSION DIVIDER ────────────────────────────────────────────── */}
      <div className="py-3">
        <DimDivider label="SHEET 01 · THE PROBLEM" animated />
      </div>

      {/* ── PROBLEM SECTION ──────────────────────────────────────────────── */}
      <section className="grid-paper px-6 md:px-12 py-14">
        <div className="max-w-7xl mx-auto space-y-10">
          <SectionHeader clause="CL. 1.0 — WHY BUDGETS FAIL" title="The three problems no contractor will tell you" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PROBLEMS.map((p, i) => (
              <motion.div
                key={p.no}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.3, ease: 'easeOut', delay: i * 0.1 }}
                style={{ border: '1px solid #1E2227', padding: '24px', background: '#F4F4F0', position: 'relative', overflow: 'hidden' }}
              >
                <div style={{ position: 'absolute', top: 10, right: 14, fontFamily: 'var(--font-plex-mono)', fontSize: 56, color: 'rgba(30,34,39,0.05)', fontWeight: 500, lineHeight: 1, userSelect: 'none' }}>
                  {p.no}
                </div>
                <h3 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 18, fontWeight: 600, color: '#1E2227', marginBottom: 12, lineHeight: 1.3 }}>
                  {p.heading}
                </h3>
                <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 14, color: 'rgba(30,34,39,0.68)', lineHeight: 1.7 }}>
                  {p.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DIMENSION DIVIDER ────────────────────────────────────────────── */}
      <div className="py-3">
        <DimDivider label="SHEET 02 · 6 TOOLS · 1 PLATFORM" />
      </div>

      {/* ── TOOLS SECTION ────────────────────────────────────────────────── */}
      <section className="px-6 md:px-12 py-14" ref={sectionRef}>
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <SectionHeader clause="CL. 2.0 — SCOPE OF TOOLS" title="Every phase of your construction, estimated" />
            {/* IS-code BOQ messaging */}
            <div style={{ border: '1px solid rgba(31,78,121,0.3)', padding: '10px 16px', background: 'rgba(31,78,121,0.04)', flexShrink: 0, maxWidth: 380 }}>
              <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: '#1F4E79', letterSpacing: '0.05em', lineHeight: 1.5 }}>
                Professional IS-code compliant BOQ for each construction phase
              </p>
              <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 11, color: 'rgba(30,34,39,0.55)', marginTop: 3 }}>
                Exact quantities · Local market rates · Contractor-ready format
              </p>
            </div>
          </div>

          {/* ── SUITE 1: COMPLIANCE & ANALYSIS ─────────────────────────── */}
          <div>
            {/* Suite header */}
            <div className="flex items-center gap-4 mb-5">
              <div style={{ height: 1, flex: 1, background: 'rgba(30,34,39,0.12)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: 'rgba(30,34,39,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  SUITE 1
                </span>
                <span style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 15, fontWeight: 600, color: '#1E2227' }}>
                  Compliance &amp; Analysis
                </span>
                <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, padding: '2px 8px', border: '1px solid #14532D', color: '#14532D', letterSpacing: '0.04em' }}>
                  FREE
                </span>
              </div>
              <div style={{ height: 1, flex: 1, background: 'rgba(30,34,39,0.12)' }} />
            </div>

            {/* VastuPro featured card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <Link href={VASTU_TOOL.href} style={{ textDecoration: 'none', display: 'block' }}>
                <article style={{
                  border: '1px solid #C9A84C',
                  padding: '24px 28px',
                  background: '#F4F4F0',
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 28,
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  <span style={{ position: 'absolute', top: 8, right: 16, fontFamily: 'var(--font-plex-mono)', fontSize: 80, color: 'rgba(201,168,76,0.06)', fontWeight: 500, lineHeight: 1, userSelect: 'none' }}>
                    P0
                  </span>
                  <div style={{ color: '#C9A84C', width: 52, height: 52, flexShrink: 0 }}>
                    <VastuMandala />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 9, color: '#1F4E79', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>
                      {VASTU_TOOL.descriptor}
                    </p>
                    <h3 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 22, fontWeight: 700, color: '#1E2227', marginBottom: 6 }}>
                      {VASTU_TOOL.name}
                    </h3>
                    <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 13, color: 'rgba(30,34,39,0.63)', lineHeight: 1.65, maxWidth: 520 }}>
                      {VASTU_TOOL.desc}
                    </p>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    <span style={{
                      fontFamily: 'var(--font-plex-mono)',
                      fontSize: 13,
                      padding: '6px 14px',
                      border: '1px solid #14532D',
                      color: '#14532D',
                      letterSpacing: '0.04em',
                      display: 'block',
                    }}>
                      FREE →
                    </span>
                  </div>
                </article>
              </Link>
            </motion.div>
          </div>

          {/* ── SUITE DIVIDER ───────────────────────────────────────────── */}
          <div style={{ paddingTop: 8, paddingBottom: 4 }}>
            <div className="flex items-center gap-4">
              <div style={{ height: 1, flex: 1, background: 'rgba(30,34,39,0.12)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: 'rgba(30,34,39,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  SUITE 2
                </span>
                <span style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 15, fontWeight: 600, color: '#1E2227' }}>
                  Phase-wise Cost &amp; BOQ Estimation
                </span>
                <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, padding: '2px 8px', border: '1px solid #1F4E79', color: '#1F4E79', letterSpacing: '0.04em' }}>
                  ₹499 / REPORT
                </span>
              </div>
              <div style={{ height: 1, flex: 1, background: 'rgba(30,34,39,0.12)' }} />
            </div>
            <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 12, color: 'rgba(30,34,39,0.5)', textAlign: 'center', marginTop: 8 }}>
              IS-code verified BOQ · Exact quantities · CPWD labour rates · Contractor comparison
            </p>
          </div>

          {/* SVG Illustrations strip */}
          <div className="flex flex-wrap items-end justify-center gap-10 py-2" style={{ borderTop: '1px solid rgba(30,34,39,0.08)', borderBottom: '1px solid rgba(30,34,39,0.08)', paddingTop: 16, paddingBottom: 16 }}>
            <BrickWallSVG />
            <ElectricalLineSVG />
          </div>

          {/* 5 paid tools grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PAID_TOOLS.map((tool, i) => (
              <ToolCard key={tool.name} tool={tool} delay={i * 0.08} />
            ))}
          </div>

          {/* Bundle strip */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{ border: '1px solid #1E2227', padding: '18px 24px', background: '#F4F4F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}
          >
            <div>
              <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: '#1F4E79', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
                COMPLETE BUNDLE — ALL 5 PAID TOOLS
              </p>
              <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 14, color: 'rgba(30,34,39,0.68)' }}>
                StructoPro · MasonPro · ElectroPro · PlumbPro · InteriorPro
                {' '}&mdash; saves{' '}
                <span style={{ fontFamily: 'var(--font-plex-mono)' }}>₹1,496</span> vs buying separately
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 28, fontWeight: 500, color: '#1E2227' }}>₹2,999</span>
              <Link
                href="/tools/structopro"
                style={{ background: '#8C3A22', color: '#F4F4F0', fontFamily: 'var(--font-plex-mono)', fontSize: 13, padding: '10px 20px', borderRadius: 6, textDecoration: 'none', whiteSpace: 'nowrap' }}
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

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="grid-paper px-6 md:px-12 py-14">
        <div className="max-w-7xl mx-auto space-y-10">
          <SectionHeader clause="CL. 3.0 — PROCESS" title="How NirmanShastra works" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.rev}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.3, ease: 'easeOut', delay: i * 0.1 }}
                style={{ borderTop: '2px solid #1F4E79', paddingTop: 16 }}
              >
                <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: '#1F4E79', letterSpacing: '0.06em', marginBottom: 10 }}>
                  {step.rev}
                </p>
                <h3 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 17, fontWeight: 600, color: '#1E2227', marginBottom: 10, lineHeight: 1.3 }}>
                  {step.heading}
                </h3>
                <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 13, color: 'rgba(30,34,39,0.65)', lineHeight: 1.7 }}>
                  {step.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DIMENSION DIVIDER ────────────────────────────────────────────── */}
      <div className="py-3">
        <DimDivider label="CHECKED AGAINST 25 IS CODES" />
      </div>

      {/* ── IS CODE TRUST STRIP ──────────────────────────────────────────── */}
      <section className="px-6 md:px-12 py-12">
        <div className="max-w-7xl mx-auto space-y-8">
          <SectionHeader clause="CL. 4.0 — CODE COMPLIANCE" title="Every calculation backed by Bureau of Indian Standards" />

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
                  fontSize: 11,
                  padding: '4px 10px',
                  border: '1px solid #1F4E79',
                  color: '#1F4E79',
                  letterSpacing: '0.04em',
                  background: 'transparent',
                  display: 'inline-block',
                }}
              >
                {code}
              </motion.span>
            ))}
          </div>

          <div style={{ border: '1px solid rgba(31,78,121,0.25)', padding: '14px 18px', background: 'rgba(31,78,121,0.04)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 14, color: '#1F4E79', flexShrink: 0 }}>ⓘ</span>
            <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 13, color: 'rgba(30,34,39,0.68)', lineHeight: 1.65, margin: 0 }}>
              IS code values in NirmanShastra are verified against BIS publications and locked at source.
              Every material quantity, mix ratio, and structural parameter traces back to a specific IS clause.
              M20 is <span style={{ fontFamily: 'var(--font-plex-mono)' }}>1:1.5:3</span> (not{' '}
              <span style={{ fontFamily: 'var(--font-plex-mono)' }}>1:2:4</span>). Dry volume factor for
              concrete is <span style={{ fontFamily: 'var(--font-plex-mono)' }}>1.54</span>. For mortar:{' '}
              <span style={{ fontFamily: 'var(--font-plex-mono)' }}>1.1</span>. These are not negotiable.
            </p>
          </div>
        </div>
      </section>

      {/* ── DIMENSION DIVIDER ────────────────────────────────────────────── */}
      <div className="grid-paper py-3">
        <DimDivider label="₹499 / REPORT · ₹2,999 / BUNDLE" />
      </div>

      {/* ── PRICING SECTION ──────────────────────────────────────────────── */}
      <section id="pricing" className="grid-paper px-6 md:px-12 py-14">
        <div className="max-w-7xl mx-auto space-y-10">
          <SectionHeader clause="CL. 5.0 — PRICING · LAUNCH 2026" title="Simple, report-by-report pricing" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Tier 1 — VastuPro FREE */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0 }}
              style={{ border: '1px solid #14532D', padding: '28px', background: '#F4F4F0', display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              <div>
                <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: '#14532D', letterSpacing: '0.07em', marginBottom: 6 }}>PHASE 0 — LEAD MAGNET</p>
                <h3 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 22, fontWeight: 700, color: '#1E2227', marginBottom: 4 }}>VastuPro</h3>
                <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: 'rgba(30,34,39,0.5)', marginBottom: 6 }}>Vastu Compliance Analyser</p>
                <div style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 40, fontWeight: 500, color: '#14532D', lineHeight: 1 }}>FREE</div>
                <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 12, color: 'rgba(30,34,39,0.5)', marginTop: 4 }}>forever · no payment required</p>
              </div>
              <ul style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  'Vastu compliance analysis',
                  '33 room types supported',
                  '16-zone Vastu Mandala',
                  'Score + remedies',
                  'Full PDF report',
                  'IS 4326:1993 seismic warnings',
                ].map(f => (
                  <li key={f} style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 13, color: 'rgba(30,34,39,0.68)', display: 'flex', gap: 8 }}>
                    <span style={{ color: '#14532D', fontWeight: 700, flexShrink: 0 }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link
                href="/tools/vastu-pro"
                style={{ display: 'block', textAlign: 'center', border: '1px solid #14532D', color: '#14532D', fontFamily: 'var(--font-plex-mono)', fontSize: 13, padding: '11px', borderRadius: 6, textDecoration: 'none', letterSpacing: '0.03em' }}
              >
                Start Free →
              </Link>
            </motion.div>

            {/* Tier 2 — Per Report ₹499 */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.1 }}
              style={{ border: '1px solid #1E2227', padding: '28px', background: '#F4F4F0', display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              <div>
                <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: '#1F4E79', letterSpacing: '0.07em', marginBottom: 6 }}>PER REPORT · ANY PAID TOOL</p>
                <h3 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 22, fontWeight: 700, color: '#1E2227', marginBottom: 4 }}>Single Tool</h3>
                <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: 'rgba(30,34,39,0.5)', marginBottom: 6 }}>IS-Code BOQ Estimator</p>
                <div style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 40, fontWeight: 500, color: '#1E2227', lineHeight: 1 }}>₹499</div>
                <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 12, color: 'rgba(30,34,39,0.5)', marginTop: 4 }}>per report · StructoPro to InteriorPro</p>
              </div>
              <ul style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  'Exact material quantities',
                  'Itemised cost breakdown',
                  'IS code compliance panel',
                  'CPWD labour cost calculator',
                  'Contractor quote comparison',
                  'PDF report with SVG drawings',
                ].map(f => (
                  <li key={f} style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 13, color: 'rgba(30,34,39,0.68)', display: 'flex', gap: 8 }}>
                    <span style={{ color: '#1F4E79', fontWeight: 700, flexShrink: 0 }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link
                href="/tools/structopro"
                style={{ display: 'block', textAlign: 'center', background: '#8C3A22', color: '#F4F4F0', fontFamily: 'var(--font-plex-mono)', fontSize: 13, padding: '11px', borderRadius: 6, textDecoration: 'none', letterSpacing: '0.03em' }}
              >
                Start with StructoPro →
              </Link>
            </motion.div>

            {/* Tier 3 — Bundle ₹2,999 */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.2 }}
              style={{ border: '2px solid #1E2227', padding: '28px', background: '#F4F4F0', display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}
            >
              <div style={{ position: 'absolute', top: -1, right: 18, background: '#8C3A22', color: '#F4F4F0', fontFamily: 'var(--font-plex-mono)', fontSize: 10, padding: '3px 10px', letterSpacing: '0.05em' }}>
                BEST VALUE
              </div>
              <div>
                <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: '#8C3A22', letterSpacing: '0.07em', marginBottom: 6 }}>COMPLETE BUNDLE · ALL 5 PAID TOOLS</p>
                <h3 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 22, fontWeight: 700, color: '#1E2227', marginBottom: 4 }}>Full Platform</h3>
                <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: 'rgba(30,34,39,0.5)', marginBottom: 6 }}>All 5 Phase Estimators</p>
                <div style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 40, fontWeight: 500, color: '#1E2227', lineHeight: 1 }}>₹2,999</div>
                <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 12, color: 'rgba(30,34,39,0.5)', marginTop: 4 }}>
                  saves <span style={{ fontFamily: 'var(--font-plex-mono)' }}>₹1,496</span> vs buying individually
                </p>
              </div>
              <ul style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  'StructoPro + MasonPro',
                  'ElectroPro + PlumbPro',
                  'InteriorPro',
                  'All quantities across all phases',
                  'Cross-phase contractor comparison',
                  'Grand Total Report (₹999) free',
                ].map(f => (
                  <li key={f} style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 13, color: 'rgba(30,34,39,0.68)', display: 'flex', gap: 8 }}>
                    <span style={{ color: '#8C3A22', fontWeight: 700, flexShrink: 0 }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link
                href="/tools/structopro"
                style={{ display: 'block', textAlign: 'center', background: '#8C3A22', color: '#F4F4F0', fontFamily: 'var(--font-plex-mono)', fontSize: 13, padding: '11px', borderRadius: 6, textDecoration: 'none', letterSpacing: '0.03em' }}
              >
                Get Bundle →
              </Link>
            </motion.div>
          </div>

          <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: 'rgba(30,34,39,0.4)', letterSpacing: '0.03em' }}>
            Launch pricing valid Jun 2026. Prices increase to ₹999 / ₹799 / ₹699 from Month 4. Never discount below launch price.
          </p>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid #1E2227', background: '#1E2227', marginTop: 0 }}>
        <div className="max-w-7xl mx-auto" style={{ borderLeft: '1px solid rgba(244,244,240,0.1)', borderRight: '1px solid rgba(244,244,240,0.1)' }}>
          <div className="grid grid-cols-2 md:grid-cols-4" style={{ borderBottom: '1px solid rgba(244,244,240,0.1)' }}>

            {/* Tools column */}
            <div style={{ padding: '28px 24px', borderRight: '1px solid rgba(244,244,240,0.1)' }}>
              <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 9, color: 'rgba(244,244,240,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>TOOLS</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {ALL_TOOLS.map(t => (
                  <Link key={t.name} href={t.href} style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 13, color: 'rgba(244,244,240,0.65)', textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {t.name}
                    <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: t.free ? '#14532D' : 'rgba(244,244,240,0.35)' }}>
                      {t.free ? 'FREE' : '₹499'}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Company column */}
            <div style={{ padding: '28px 24px', borderRight: '1px solid rgba(244,244,240,0.1)' }}>
              <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 9, color: 'rgba(244,244,240,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>COMPANY</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[['About', '#'], ['Contact', '#'], ['Blog', '#'], ['Careers', '#']].map(([label, href]) => (
                  <a key={label} href={href} style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 13, color: 'rgba(244,244,240,0.65)', textDecoration: 'none' }}>{label}</a>
                ))}
              </div>
            </div>

            {/* Legal column */}
            <div style={{ padding: '28px 24px', borderRight: '1px solid rgba(244,244,240,0.1)' }}>
              <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 9, color: 'rgba(244,244,240,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>LEGAL</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[['Privacy Policy', '#'], ['Terms of Use', '#'], ['Disclaimer', '#'], ['IS Codes Used', '#']].map(([label, href]) => (
                  <a key={label} href={href} style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 13, color: 'rgba(244,244,240,0.65)', textDecoration: 'none' }}>{label}</a>
                ))}
              </div>
            </div>

            {/* DRG block */}
            <div style={{ padding: '28px 24px' }}>
              <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 9, color: 'rgba(244,244,240,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>DRG BLOCK</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  ['PROJECT', 'NIRMANSHASTRA'],
                  ['DRG NO.', 'NS-001'],
                  ['DATE', today],
                  ['REV', 'A'],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 9, color: 'rgba(244,244,240,0.35)', letterSpacing: '0.06em', textTransform: 'uppercase', minWidth: 58, flexShrink: 0 }}>{k}</span>
                    <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: 'rgba(244,244,240,0.8)' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom strip */}
          <div style={{ padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <span style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 14, color: '#F4F4F0', fontWeight: 600 }}>NirmanShastra</span>
              <span style={{ fontFamily: 'var(--font-plex-devanagari)', fontSize: 11, color: 'rgba(244,244,240,0.4)', marginLeft: 8 }}>निर्माणशास्त्र</span>
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
