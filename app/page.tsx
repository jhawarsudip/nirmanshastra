'use client'

import React, { useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { FileCheck, HardHat, IndianRupee, ShieldCheck } from 'lucide-react'
import { StructureIcon } from '@/components/icons/StructureIcon'
import { MasonryIcon } from '@/components/icons/MasonryIcon'
import { ElectricalIcon } from '@/components/icons/ElectricalIcon'
import { PlumbingIcon } from '@/components/icons/PlumbingIcon'
import { InteriorIcon } from '@/components/icons/InteriorIcon'
import { VastuIcon } from '@/components/icons/VastuIcon'
import HeroSVGBackground from '@/components/HeroSVGBackground'
import { STATE_CITIES, INDIAN_STATES_LIST } from '@/lib/state-cities'

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────
const BG    = '#0A0A0A'
const SURF  = '#171717'
const GOLD  = '#C5A059'
const VGOLD = '#C9A84C' // Vastu Gold — LOCKED, VastuPro only
const TP    = '#FFFFFF'
const TS    = '#A3A3A3'
const BSub  = 'rgba(255,255,255,0.08)'
const FI    = 'var(--font-inter)'
const FP    = 'var(--font-playfair)'

// Tool-specific accent colours kept in badge/icon contexts
const C_STRUCT  = '#1F4E79'
const C_MASON   = '#8C3A22'
const C_ELECTRO = '#D99A06'
const C_PLUMB   = '#2D6E6E'
const C_INT     = '#B08968'
const C_GREEN   = '#14532D'

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

const DEALER_CATEGORIES: { label: string; query: string }[] = [
  { label: 'Cement & construction material shops', query: 'construction material dealer near' },
  { label: 'Hardware shops',                       query: 'hardware store near' },
  { label: 'Brick & masonry material shops',       query: 'brick and masonry dealer near' },
  { label: 'Electrical shops',                     query: 'electrical store near' },
  { label: 'Pipes & sanitaryware shops',           query: 'pipes and sanitaryware dealer near' },
  { label: 'Tiles & marble shops',                 query: 'tiles and marble dealer near' },
  { label: 'Paint shops',                          query: 'paint store near' },
  { label: 'Interior decoration & furniture shops', query: 'furniture and interior decor store near' },
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
    price: '₹999', free: false, href: '/tools/structopro',
    accent: C_STRUCT,
  },
  {
    phase: 'P2', name: 'MasonryPro',
    descriptor: 'Masonry Cost & BOQ Estimator',
    tagline: 'Masonry Cost',
    desc: 'All 8 wall types — brick, AAC, hollow block — plaster and waterproofing per IS 1077:1992.',
    price: '₹699', free: false, href: '/tools/masonpro',
    accent: C_MASON,
  },
  {
    phase: 'P3', name: 'ElectricalPro',
    descriptor: 'Electrical Cost & BOQ Estimator',
    tagline: 'Electrical Cost',
    desc: 'Wiring, DB panels, earthing per IS 732:2019. Circuit-by-circuit breakdown.',
    price: '₹499', free: false, href: '/tools/electropro',
    accent: C_ELECTRO,
  },
  {
    phase: 'P4', name: 'PlumbingPro',
    descriptor: 'Plumbing Cost & BOQ Estimator',
    tagline: 'Plumbing Cost',
    desc: 'Water supply, drainage, sanitary fixtures per IS 1172:1993. Tank sizing included.',
    price: '₹499', free: false, href: '/tools/plumbpro',
    accent: C_PLUMB,
  },
  {
    phase: 'P5', name: 'InteriorPro',
    descriptor: 'Interior Cost & BOQ Estimator',
    tagline: 'Interior Cost',
    desc: 'Flooring, kitchen, paint, false ceiling across Basic / Standard / Premium / Luxury.',
    price: '₹899', free: false, href: '/tools/interiorpro',
    accent: C_INT,
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
  { rev: 'REV A', heading: 'Answer plain questions', body: 'Answer plain questions about your building — no engineering degree required.' },
  { rev: 'REV B', heading: 'See IS compliance live', body: 'See live IS code compliance checks as you fill in details.' },
  { rev: 'REV C', heading: 'Enter your local rates', body: 'Enter your local material rates — we show India averages as a starting point.' },
  { rev: 'REV D', heading: 'Get exact quantities', body: 'Get exact quantities your contractor cannot argue with — backed by Bureau of Indian Standards.' },
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
    body: "From ₹499 per detailed report. No subscription trap, no 'contact sales' for basic numbers. See the free grand-total range first, pay only if you want the itemised breakdown.",
  },
  {
    Icon: ShieldCheck,
    title: 'Your Data, Your Report',
    body: 'No commissions from contractors, no kickbacks from material suppliers. The numbers you get are calculated from IS codes and your inputs — nothing else influences them.',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// WATERMARK MOTIFS (unchanged — used in card backgrounds)
// ─────────────────────────────────────────────────────────────────────────────

function LargeVastuWatermark() {
  const spokes = Array.from({ length: 16 }, (_, i) => {
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
          stroke={VGOLD} strokeWidth="1.2" opacity=".7" />
      ))}
      <circle cx="70" cy="70" r="18" stroke={VGOLD} strokeWidth="1.5" fill="none" opacity=".6" />
      <circle cx="70" cy="70" r="62" stroke={VGOLD} strokeWidth="1" fill="none" opacity=".35" />
      <circle cx="70" cy="70" r="40" stroke={VGOLD} strokeWidth=".8" fill="none" opacity=".25" />
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

const largeMotifMap: Record<string, React.ReactElement> = {
  P0: <LargeVastuWatermark />,
  P1: <LargeStructoWatermark />,
  P2: <LargeMasonWatermark />,
  P3: <LargeElectroWatermark />,
  P4: <LargePlumbWatermark />,
  P5: <LargeInteriorWatermark />,
}

// ─────────────────────────────────────────────────────────────────────────────
// FIND NEARBY DEALERS
// ─────────────────────────────────────────────────────────────────────────────

function FindNearbyDealers() {
  const [selectedState, setSelectedState] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [locality, setLocality] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const cities = selectedState ? (STATE_CITIES[selectedState] ?? []) : []

  const handleStateChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedState(e.target.value)
    setSelectedCity('')
  }, [])

  function handleFind() {
    if (!selectedCity || !selectedCategory) return
    const cat = DEALER_CATEGORIES.find(c => c.label === selectedCategory)
    if (!cat) return
    const location = locality.trim() ? `${locality.trim()}, ${selectedCity}` : selectedCity
    const query = encodeURIComponent(`${cat.query} ${location}`)
    window.open(`https://www.google.com/maps/search/${query}`, '_blank', 'noopener,noreferrer')
  }

  const inputStyle: React.CSSProperties = {
    fontFamily: FI, fontSize: 14, color: TP,
    background: '#1F1F1F', border: `1px solid ${BSub}`,
    borderRadius: 2, padding: '10px 12px',
    outline: 'none', width: '100%', boxSizing: 'border-box',
  }

  return (
    <section className="grid-paper px-6 md:px-16 lg:px-24 py-28">
      <div className="space-y-10">
        <div className="space-y-3">
          <p style={{ fontFamily: FI, fontSize: 11, color: TS, textTransform: 'uppercase', letterSpacing: '0.09em' }}>
            LOCAL RESOURCES
          </p>
          <h2 style={{ fontFamily: FI, fontSize: 'clamp(28px,3.5vw,48px)', fontWeight: 600, color: TP, lineHeight: 1.15 }}>
            Find Nearby <span className="section-accent">Material Dealers</span>
          </h2>
          <p style={{ fontFamily: FI, fontSize: 15, color: TS, lineHeight: 1.7, maxWidth: 560 }}>
            Select your state, city, and material category to open a Google Maps search near you. We do not maintain a dealer directory — this links directly to Google Maps.
          </p>
        </div>

        <div style={{ border: `1px solid ${BSub}`, padding: '28px 32px', background: SURF, borderRadius: 2, maxWidth: 560 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontFamily: FI, fontSize: 10, color: TS, letterSpacing: '0.09em', textTransform: 'uppercase' }}>State / UT</label>
              <select value={selectedState} onChange={handleStateChange} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">— Select a state —</option>
                {INDIAN_STATES_LIST.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontFamily: FI, fontSize: 10, color: TS, letterSpacing: '0.09em', textTransform: 'uppercase' }}>City / Town</label>
              <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)} disabled={!selectedState}
                style={{ ...inputStyle, opacity: selectedState ? 1 : 0.4, cursor: selectedState ? 'pointer' : 'not-allowed' }}>
                <option value="">— Select a city —</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontFamily: FI, fontSize: 10, color: TS, letterSpacing: '0.09em', textTransform: 'uppercase' }}>
                Specific Area / Locality <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(Optional)</span>
              </label>
              <input type="text" value={locality} onChange={e => setLocality(e.target.value)}
                placeholder="e.g. Kothrud, Baner, Sector 15"
                style={{ ...inputStyle }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontFamily: FI, fontSize: 10, color: TS, letterSpacing: '0.09em', textTransform: 'uppercase' }}>What are you looking for?</label>
              <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} disabled={!selectedCity}
                style={{ ...inputStyle, opacity: selectedCity ? 1 : 0.4, cursor: selectedCity ? 'pointer' : 'not-allowed' }}>
                <option value="">— Select a category —</option>
                {DEALER_CATEGORIES.map(c => <option key={c.label} value={c.label}>{c.label}</option>)}
              </select>
            </div>

            <button onClick={handleFind} disabled={!selectedCity || !selectedCategory}
              style={{
                fontFamily: FI, fontSize: 14, fontWeight: 600,
                color: (selectedCity && selectedCategory) ? '#000000' : TS,
                background: (selectedCity && selectedCategory) ? GOLD : '#1F1F1F',
                border: 'none', borderRadius: 2, padding: '13px 24px',
                cursor: (selectedCity && selectedCategory) ? 'pointer' : 'not-allowed',
                letterSpacing: '0.03em', transition: 'background 0.15s ease',
              }}>
              Open in Google Maps →
            </button>
          </div>

          <p style={{ fontFamily: FI, fontSize: 10, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.04em', lineHeight: 1.7, marginTop: 18 }}>
            Opens in a new tab · No dealer data is stored by NirmanShastra · Results are from Google Maps
          </p>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function DimDivider({ label, animated = false }: { label: string; animated?: boolean }) {
  const lineColor = 'rgba(255,255,255,0.14)'
  const textColor = 'rgba(255,255,255,0.38)'
  return (
    <div className="flex items-center gap-4 px-6 md:px-16">
      <div className="flex flex-1 items-center" aria-hidden="true">
        <div style={{ width: 0, height: 0, borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderRight: `7px solid ${lineColor}`, flexShrink: 0 }} />
        <div style={{ flex: 1, height: 1, background: lineColor }} className={animated ? 'animate-dim-line' : ''} />
        <div style={{ width: 1, height: 10, background: lineColor, flexShrink: 0 }} />
      </div>
      <span style={{ fontFamily: FI, fontSize: 11, color: textColor, letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>
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

function SectionHeader({ clause, title }: { clause?: string; title: React.ReactNode }) {
  return (
    <div className="space-y-3">
      {clause && (
        <p style={{ fontFamily: FI, fontSize: 11, color: TS, letterSpacing: '0.09em', textTransform: 'uppercase' }}>
          {clause}
        </p>
      )}
      <h2 style={{ fontFamily: FI, fontSize: 'clamp(28px,3.5vw,48px)', fontWeight: 600, color: TP, lineHeight: 1.15, letterSpacing: '-0.01em' }}>
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
    default:   return null
  }
}

function ToolCard({ tool, delay = 0 }: { tool: typeof VASTU_TOOL & { accent?: string }; delay?: number }) {
  const prefersReducedMotion = useReducedMotion()
  const cardRef = useRef<HTMLDivElement>(null)
  const [rotX, setRotX] = useState(0)
  const [rotY, setRotY] = useState(0)
  const [isHover, setIsHover] = useState(false)

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!cardRef.current || prefersReducedMotion) return
    const rect = cardRef.current.getBoundingClientRect()
    const dx = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2)
    const dy = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2)
    setRotX(-dy * 6)
    setRotY(dx * 6)
  }

  function onMouseLeave() {
    setRotX(0); setRotY(0); setIsHover(false)
  }

  const borderColor = tool.free
    ? (isHover ? VGOLD : VGOLD)
    : (isHover ? GOLD : BSub)

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
          transform: prefersReducedMotion ? undefined
            : `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(${isHover ? -6 : 0}px)`,
          transition: 'transform 0.18s ease-out, box-shadow 0.18s ease-out',
          willChange: 'transform',
          boxShadow: isHover && !prefersReducedMotion
            ? `0 10px 24px rgba(0,0,0,0.4), 0 0 0 1px ${tool.free ? 'rgba(201,168,76,0.35)' : 'rgba(197,160,89,0.25)'}`
            : 'none',
        }}
      >
        <Link href={tool.href} style={{ textDecoration: 'none', display: 'block' }}>
          <article
            className="tool-card-article"
            style={{
              border: `1px solid ${borderColor}`,
              borderRadius: 2,
              padding: '32px',
              background: SURF,
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              minHeight: 340,
              cursor: 'pointer',
              transition: 'border-color 0.18s ease',
            }}
          >
            <div style={{
              position: 'absolute', bottom: -10, right: -10,
              color: tool.free ? `rgba(201,168,76,0.10)` : 'rgba(255,255,255,0.05)',
              pointerEvents: 'none', lineHeight: 0,
            }}>
              {largeMotifMap[tool.phase]}
            </div>

            <div style={{ width: 48, height: 48, flexShrink: 0 }}>
              {getToolIcon(tool.phase, isHover && !prefersReducedMotion)}
            </div>

            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: FI, fontSize: 10, color: TS, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                {tool.descriptor}
              </p>
              <h3 style={{ fontFamily: FI, fontSize: 24, fontWeight: 600, color: TP, marginBottom: 10, lineHeight: 1.2 }}>
                {tool.name}
              </h3>
              <p style={{ fontFamily: FI, fontSize: 15, color: TS, lineHeight: 1.7 }}>
                {tool.desc}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{
                fontFamily: FI, fontSize: 13, fontWeight: 500,
                padding: '5px 14px',
                border: `1px solid ${tool.free ? C_GREEN : GOLD}`,
                color: tool.free ? C_GREEN : GOLD,
                letterSpacing: '0.04em', borderRadius: 2,
              }}>
                {tool.price}
              </span>
            </div>
          </article>
        </Link>
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PILLAR CARD
// ─────────────────────────────────────────────────────────────────────────────

function PillarCard({ pillar, delay = 0 }: { pillar: (typeof PILLARS)[0]; delay?: number }) {
  const prefersReducedMotion = useReducedMotion()
  const [isHover, setIsHover] = useState(false)
  const { Icon } = pillar

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 28, scale: 0.97 }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-24px' }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: prefersReducedMotion ? 0 : delay }}
    >
      <div
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        style={{
          border: isHover ? `1px solid ${GOLD}` : `1px solid ${BSub}`,
          borderTop: isHover ? `3px solid ${GOLD}` : `3px solid ${BSub}`,
          borderRadius: 2,
          padding: '32px',
          background: SURF,
          display: 'flex',
          flexDirection: 'column',
          transform: isHover && !prefersReducedMotion ? 'translateY(-4px)' : 'translateY(0)',
          boxShadow: isHover && !prefersReducedMotion
            ? `0 8px 20px rgba(0,0,0,0.4), 0 0 0 0 transparent, 0 0 12px rgba(197,160,89,0.08)`
            : 'none',
          transition: 'transform 0.2s ease-out, box-shadow 0.2s ease-out, border-color 0.2s ease-out',
          willChange: 'transform',
        }}
      >
        <div style={{ color: isHover ? GOLD : TS, marginBottom: 20, transition: 'color 0.2s ease' }}>
          <Icon size={32} strokeWidth={1.5} aria-hidden={true} />
        </div>
        <h3 style={{ fontFamily: FI, fontSize: 20, fontWeight: 600, color: TP, lineHeight: 1.25, marginBottom: 12 }}>
          {pillar.title}
        </h3>
        <p style={{ fontFamily: FI, fontSize: 15, color: TS, lineHeight: 1.75, flex: 1 }}>
          {pillar.body}
        </p>
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PROBLEM CARD
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
      className="problem-card-mobile"
      style={{
        border: isHover ? `1px solid rgba(197,160,89,0.35)` : `1px solid ${BSub}`,
        borderLeft: index === 0
          ? (isHover ? `1px solid rgba(197,160,89,0.35)` : `1px solid ${BSub}`)
          : 'none',
        padding: '48px 40px',
        background: isHover && !prefersReducedMotion ? SURF : 'transparent',
        position: 'relative',
        overflow: 'hidden',
        transform: isHover && !prefersReducedMotion ? 'translateY(-4px)' : undefined,
        boxShadow: isHover && !prefersReducedMotion ? '0 12px 32px rgba(0,0,0,0.4)' : undefined,
        transition: 'border-color 200ms ease, background 200ms ease, transform 200ms ease, box-shadow 200ms ease',
        willChange: 'transform',
        borderRadius: 0,
      }}
    >
      <div style={{
        fontFamily: FI, fontSize: 120, color: 'rgba(255,255,255,0.05)',
        fontWeight: 700, lineHeight: 1, userSelect: 'none', marginBottom: 24,
        transition: 'color 200ms ease',
      }}>
        {problem.no}
      </div>
      <h3 style={{ fontFamily: FI, fontSize: 22, fontWeight: 600, color: TP, marginBottom: 16, lineHeight: 1.25 }}>
        {problem.heading}
      </h3>
      <p style={{ fontFamily: FI, fontSize: 15, color: TS, lineHeight: 1.7 }}>
        {problem.body}
      </p>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// HOMEPAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function Home() {
  const prefersReducedMotion = useReducedMotion()
  const [vastuHover, setVastuHover] = useState(false)

  return (
    <main className="sheet-frame min-h-screen" style={{ background: BG, position: 'relative' }}>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <div
        id="hero-root"
        style={{ background: BG, minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}
      >
        {/* Abstract isometric structural column SVG — behind text, scroll-drawn */}
        <HeroSVGBackground />

        <section className="px-6 md:px-16 lg:px-24 pt-14 pb-14 md:pt-20 md:pb-20" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: 700 }}>

            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              style={{ marginBottom: 24 }}
            >
              <h1 className="hero-h1-mobile" style={{
                fontFamily: FP,
                fontSize: 'clamp(56px, 8vw, 96px)',
                fontWeight: 700,
                color: TP,
                lineHeight: 1.02,
                letterSpacing: '-0.02em',
                marginBottom: 20,
              }}>
                Build With <span className="hero-accent">Certainty.</span>
              </h1>
            </motion.div>

            <motion.p
              style={{ fontFamily: FI, fontSize: 18, color: TS, lineHeight: 1.7, maxWidth: 540, marginBottom: 40 }}
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
              style={{ marginBottom: 48 }}
            >
              <Link
                href="/tools/vastu-pro"
                className="btn-3d"
                style={{ background: GOLD, color: '#000000', fontFamily: FI, fontSize: 14, fontWeight: 600, padding: '15px 32px', borderRadius: 2, display: 'inline-block', textDecoration: 'none', letterSpacing: '0.02em' }}
              >
                Start Free — VastuPro
              </Link>
              <a
                href="#pricing"
                className="btn-3d"
                style={{ border: `1px solid ${GOLD}`, color: GOLD, fontFamily: FI, fontSize: 14, padding: '15px 32px', borderRadius: 2, display: 'inline-block', textDecoration: 'none', background: 'transparent', letterSpacing: '0.02em' }}
              >
                See Pricing ↓
              </a>
            </motion.div>

            <motion.div
              className="flex flex-wrap stats-row-mobile"
              style={{ gap: 40, padding: '24px 28px', background: SURF, border: `1px solid ${BSub}`, borderRadius: 2 }}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.55 }}
            >
              {[['25', 'IS Codes'], ['6', 'Tools'], ['from ₹499', 'Per Report'], ['₹2,999', 'Bundle']].map(([val, label]) => (
                <div key={label}>
                  <div style={{ fontFamily: FI, fontSize: 'clamp(36px, 8vw, 64px)', fontWeight: 600, color: TP, lineHeight: 1 }}>{val}</div>
                  <div style={{ fontFamily: FI, fontSize: 11, color: TS, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 6 }}>{label}</div>
                </div>
              ))}
            </motion.div>

          </div>
        </section>
      </div>

      {/* ── PROBLEM SECTION ─────────────────────────────────────────────── */}
      <section className="px-6 md:px-16 lg:px-24 py-28" style={{ background: BG }}>
        <div className="space-y-16">
          <SectionHeader title={<>The three problems <span className="section-accent">no contractor</span> will tell you</>} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            {PROBLEMS.map((p, i) => (
              <ProblemCard key={p.no} problem={p} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY NIRMANSHASTRA ──────────────────────────────────────────── */}
      <section className="grid-paper px-6 md:px-16 lg:px-24 py-28">
        <div className="space-y-14">
          <SectionHeader title={<>Why NirmanShastra<span style={{ color: GOLD, fontSize: '1.4em', marginLeft: '0.25em', verticalAlign: 'baseline', lineHeight: 1 }}>?</span></>} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PILLARS.map((pillar, i) => (
              <PillarCard key={pillar.title} pillar={pillar} delay={i * 0.08} />
            ))}
          </div>
        </div>
      </section>

      {/* ── TOOLS SECTION ─────────────────────────────────────────────── */}
      <section className="px-6 md:px-16 lg:px-24 py-28" style={{ background: BG }}>
        <div className="space-y-14">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <SectionHeader title={<>Every phase of your construction, <span className="section-accent">estimated</span></>} />
            <div style={{ border: `1px solid ${BSub}`, padding: '14px 20px', background: SURF, flexShrink: 0, maxWidth: 380, borderRadius: 2 }}>
              <p style={{ fontFamily: FI, fontSize: 11, color: TS, letterSpacing: '0.05em', lineHeight: 1.5 }}>
                Professional IS-code compliant BOQ for each construction phase
              </p>
              <p style={{ fontFamily: FI, fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                Exact quantities · Local market rates · Contractor-ready format
              </p>
            </div>
          </div>

          {/* VastuPro featured card */}
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div style={{ height: 1, flex: 1, background: BSub }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: FI, fontSize: 10, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>SUITE 1</span>
                <span style={{ fontFamily: FI, fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Compliance &amp; Analysis</span>
                <span style={{ fontFamily: FI, fontSize: 10, padding: '2px 8px', border: `1px solid ${C_GREEN}`, color: C_GREEN, letterSpacing: '0.04em', borderRadius: 2 }}>FREE</span>
              </div>
              <div style={{ height: 1, flex: 1, background: BSub }} />
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
                    ? `0 10px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(201,168,76,0.4)`
                    : undefined,
                }}
              >
                <Link href={VASTU_TOOL.href} style={{ textDecoration: 'none', display: 'block' }}>
                  <article className="vastu-featured-article" style={{
                    border: `1px solid ${VGOLD}`,
                    borderRadius: 2,
                    padding: '40px 48px',
                    background: SURF,
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 36,
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    minHeight: 160,
                  }}>
                    <div style={{ position: 'absolute', bottom: -10, right: -10, color: `rgba(201,168,76,0.09)`, pointerEvents: 'none', lineHeight: 0 }}>
                      <LargeVastuWatermark />
                    </div>
                    <div style={{ width: 56, height: 56, flexShrink: 0 }}>
                      <VastuIcon size={56} animated={vastuHover && !prefersReducedMotion} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: FI, fontSize: 10, color: TS, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                        {VASTU_TOOL.descriptor}
                      </p>
                      <h3 style={{ fontFamily: FI, fontSize: 28, fontWeight: 600, color: TP, marginBottom: 8 }}>
                        {VASTU_TOOL.name}
                      </h3>
                      <p style={{ fontFamily: FI, fontSize: 15, color: TS, lineHeight: 1.65, maxWidth: 560 }}>
                        {VASTU_TOOL.desc}
                      </p>
                    </div>
                    <div style={{ flexShrink: 0 }}>
                      <span style={{ fontFamily: FI, fontSize: 13, fontWeight: 500, padding: '8px 20px', border: `1px solid ${C_GREEN}`, color: C_GREEN, letterSpacing: '0.04em', display: 'block', borderRadius: 2 }}>
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
              <div style={{ height: 1, flex: 1, background: BSub }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: FI, fontSize: 10, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>SUITE 2</span>
                <span style={{ fontFamily: FI, fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Phase-wise Cost &amp; BOQ Estimation</span>
                <span style={{ fontFamily: FI, fontSize: 10, padding: '2px 8px', border: `1px solid rgba(197,160,89,0.45)`, color: GOLD, letterSpacing: '0.04em', borderRadius: 2 }}>from ₹499 / REPORT</span>
              </div>
              <div style={{ height: 1, flex: 1, background: BSub }} />
            </div>
            <p style={{ fontFamily: FI, fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
              IS-code verified BOQ · Exact quantities · CPWD labour rates · Contractor comparison
            </p>
          </div>

          {/* 5 paid tools grid */}
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
            className="bundle-strip-inner"
            style={{ border: `1px solid ${BSub}`, borderRadius: 2, padding: '28px 40px', background: SURF, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}
          >
            <div>
              <p style={{ fontFamily: FI, fontSize: 11, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                COMPLETE BUNDLE — ALL 5 PAID TOOLS
              </p>
              <p style={{ fontFamily: FI, fontSize: 15, color: TS }}>
                StructurePro · MasonryPro · ElectricalPro · PlumbingPro · InteriorPro
                {' '}&mdash; saves <span style={{ color: TP, fontWeight: 600 }}>₹596</span> vs buying separately
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <span style={{ fontFamily: FI, fontSize: 40, fontWeight: 600, color: TP }}>₹2,999</span>
              <Link
                href="/tools/structopro"
                className="btn-3d"
                style={{ background: GOLD, color: '#000000', fontFamily: FI, fontSize: 14, fontWeight: 600, padding: '13px 24px', borderRadius: 2, textDecoration: 'none', whiteSpace: 'nowrap' }}
              >
                Get Bundle →
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="grid-paper px-6 md:px-16 lg:px-24 py-28">
        <div className="space-y-14">
          <SectionHeader title={<>How NirmanShastra <span className="section-accent">works</span><span style={{ color: GOLD, fontSize: '1.4em', marginLeft: '0.25em', verticalAlign: 'baseline', lineHeight: 1 }}>?</span></>} />

          <motion.div
            initial={prefersReducedMotion ? false : { scaleX: 0 }}
            whileInView={prefersReducedMotion ? undefined : { scaleX: 1 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            style={{ height: 1, background: `linear-gradient(to right, ${GOLD} 60%, rgba(197,160,89,0))`, transformOrigin: 'left center', marginBottom: 8 }}
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
                  borderTop: `3px solid ${GOLD}`,
                  borderRight: i < 3 ? `1px solid ${BSub}` : 'none',
                  paddingTop: 24, paddingRight: 32,
                  paddingLeft: i === 0 ? 0 : 32,
                  paddingBottom: 16,
                }}
              >
                <h3 style={{ fontFamily: FI, fontSize: 18, fontWeight: 600, color: TP, marginBottom: 12, lineHeight: 1.3 }}>
                  {step.heading}
                </h3>
                <p style={{ fontFamily: FI, fontSize: 15, color: TS, lineHeight: 1.75 }}>
                  {step.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DIMENSION DIVIDER ─────────────────────────────────────────── */}
      <div style={{ paddingTop: 14, paddingBottom: 14, background: BG }}>
        <DimDivider label="FREE CALCULATORS vs NIRMANSHASTRA" />
      </div>

      {/* ── COMPARISON TABLE ─────────────────────────────────────────── */}
      <section className="px-6 md:px-16 lg:px-24 py-28" style={{ background: BG }}>
        <div className="space-y-10">
          <SectionHeader title={<>Why NirmanShastra <span className="section-accent">beats</span> free calculators<span style={{ color: GOLD, fontSize: '1.4em', marginLeft: '0.25em', verticalAlign: 'baseline', lineHeight: 1 }}>?</span></>} />
          <p style={{ fontFamily: FI, fontSize: 16, color: TS, lineHeight: 1.65, maxWidth: 680 }}>
            Free online calculators steal your phone number and sell it to contractors. Here&apos;s what you actually get.
          </p>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FI, fontSize: 14 }}>
              <thead>
                <tr>
                  <th scope="col" style={{ fontFamily: FI, fontSize: 10, color: TS, letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'left', padding: '10px 16px', borderBottom: `1px solid ${BSub}`, borderRight: `1px solid ${BSub}`, minWidth: 200 }}>Feature</th>
                  <th scope="col" style={{ fontFamily: FI, fontSize: 10, color: TS, letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'left', padding: '10px 16px', borderBottom: `1px solid ${BSub}`, borderRight: `1px solid ${BSub}`, minWidth: 260 }}>Free Online Calculators</th>
                  <th scope="col" style={{ fontFamily: FI, fontSize: 10, color: TP, letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'left', padding: '10px 16px', borderBottom: `1px solid ${BSub}`, background: `rgba(197,160,89,0.07)`, minWidth: 280 }}>NirmanShastra (from ₹499/phase)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'Calculation method', free: 'Per sqft thumb rule — meaningless averages', ns: 'Exact item-wise BOQ based on IS 456, IS 732, IS 1172' },
                  { feature: 'Material quantities', free: 'Vague guesses (₹8L for cement)', ns: 'Exact: 412 bags OPC 53, 2.4 tonnes Fe500D steel' },
                  { feature: 'IS Code compliance', free: 'None — not even mentioned', ns: '25 IS codes verified, every quantity traceable to a specific clause' },
                  { feature: 'Contractor accountability', free: 'Zero — they sell your data to contractors', ns: 'Line-by-line comparison — catch overcharging to the decimal' },
                  { feature: 'Local rates', free: 'Fixed city averages you cannot change', ns: 'You enter local dealer rates — India average pre-filled as benchmark' },
                  { feature: 'CPWD labour', free: 'Not included', ns: '14 CPWD trades, productivity rates, fully editable' },
                  { feature: 'PDF report', free: 'No PDF — just a number on screen', ns: 'Professional 10+ page PDF with BOQ, IS compliance, site checklist' },
                  { feature: 'Your data', free: 'Sold to contractor lead networks', ns: 'Never sold. Your project data is yours.' },
                ].map((row, i) => (
                  <tr key={row.feature} style={{ background: i % 2 === 0 ? SURF : 'transparent' }}>
                    <td style={{ fontFamily: FI, fontSize: 14, color: TS, padding: '12px 16px', borderBottom: `1px solid ${BSub}`, borderRight: `1px solid ${BSub}`, verticalAlign: 'top' }}>{row.feature}</td>
                    <td style={{ fontFamily: FI, fontSize: 14, color: 'rgba(255,255,255,0.4)', padding: '12px 16px', borderBottom: `1px solid ${BSub}`, borderRight: `1px solid ${BSub}`, verticalAlign: 'top' }}>
                      <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 700, marginRight: 8 }}>✗</span>{row.free}
                    </td>
                    <td style={{ fontFamily: FI, fontSize: 14, color: TP, padding: '12px 16px', borderBottom: `1px solid ${BSub}`, background: `rgba(197,160,89,0.05)`, verticalAlign: 'top' }}>
                      <span style={{ color: GOLD, fontWeight: 700, marginRight: 8 }}>✓</span>{row.ns}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p style={{ fontFamily: FI, fontSize: 13, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.04em', borderTop: `1px solid ${BSub}`, paddingTop: 20 }}>
            The math is universal. IS codes don&apos;t change by city. Only the rates do — and you control those.
          </p>
        </div>
      </section>

      {/* ── DIMENSION DIVIDER ─────────────────────────────────────────── */}
      <div className="py-3">
        <DimDivider label="CHECKED AGAINST 25 IS CODES" />
      </div>

      {/* ── IS CODE TRUST STRIP ──────────────────────────────────────── */}
      <section className="px-6 md:px-16 lg:px-24 py-28" style={{ background: SURF }}>
        <div className="space-y-10">
          <div className="space-y-2">
            <h2 style={{ fontFamily: FI, fontSize: 'clamp(28px,3.5vw,48px)', fontWeight: 600, color: TP, lineHeight: 1.15 }}>
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
                transition={{ duration: 0.2, delay: i * 0.025 }}
                style={{
                  fontFamily: FI, fontSize: 12, padding: '7px 12px',
                  border: `1px solid rgba(197,160,89,0.25)`,
                  color: 'rgba(255,255,255,0.75)',
                  letterSpacing: '0.04em',
                  background: 'rgba(197,160,89,0.04)',
                  display: 'inline-block', borderRadius: 2,
                }}
              >
                {code}
              </motion.span>
            ))}
          </div>

          <div style={{ border: `1px solid ${BSub}`, borderRadius: 2, padding: '18px 24px', background: BG, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <span style={{ fontFamily: FI, fontSize: 16, color: TS, flexShrink: 0 }}>ⓘ</span>
            <p style={{ fontFamily: FI, fontSize: 15, color: TS, lineHeight: 1.65, margin: 0 }}>
              IS code values in NirmanShastra are verified against BIS publications and locked at source.
              Every material quantity, mix ratio, and structural parameter traces back to a specific IS clause.
              M20 is <span style={{ fontFamily: FI, color: TP, fontWeight: 600 }}>1:1.5:3</span> (not{' '}
              <span style={{ fontFamily: FI }}>1:2:4</span>). Dry volume factor for concrete is{' '}
              <span style={{ fontFamily: FI, color: TP, fontWeight: 600 }}>1.54</span>. For mortar:{' '}
              <span style={{ fontFamily: FI, color: TP, fontWeight: 600 }}>1.1</span>.
            </p>
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────────────── */}
      <section id="pricing" className="grid-paper px-6 md:px-16 lg:px-24 py-28">
        <div className="space-y-14">
          <SectionHeader title={<>Simple, <span className="section-accent">report-by-report</span> pricing</>} />

          <div className="pricing-grid grid grid-cols-1 md:grid-cols-3 gap-0">

            {/* Tier 1 — VastuPro FREE */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.35, delay: 0 }}
              style={{ border: `1px solid ${VGOLD}`, borderRight: 'none', borderRadius: '2px 0 0 2px', padding: '40px', background: SURF, display: 'flex', flexDirection: 'column', gap: 20 }}
            >
              <div>
                <p style={{ fontFamily: FI, fontSize: 10, color: C_GREEN, letterSpacing: '0.07em', marginBottom: 8 }}>PHASE 0 — LEAD MAGNET</p>
                <h3 style={{ fontFamily: FI, fontSize: 26, fontWeight: 600, color: TP, marginBottom: 4 }}>VastuPro</h3>
                <p style={{ fontFamily: FI, fontSize: 12, color: TS, marginBottom: 10 }}>Vastu Compliance Analyser</p>
                <div style={{ fontFamily: FI, fontSize: 48, fontWeight: 600, color: C_GREEN, lineHeight: 1 }}>FREE</div>
                <p style={{ fontFamily: FI, fontSize: 13, color: TS, marginTop: 6 }}>forever · no payment required</p>
              </div>
              <ul style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['Vastu compliance analysis','33 room types supported','16-zone Vastu Mandala','Score + remedies','Full PDF report','IS 4326:1993 seismic warnings'].map(f => (
                  <li key={f} style={{ fontFamily: FI, fontSize: 15, color: TS, display: 'flex', gap: 10 }}>
                    <span style={{ color: C_GREEN, fontWeight: 700, flexShrink: 0 }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link href="/tools/vastu-pro" className="btn-3d"
                style={{ display: 'block', textAlign: 'center', border: `1px solid ${C_GREEN}`, color: C_GREEN, fontFamily: FI, fontSize: 14, padding: '14px', borderRadius: 2, textDecoration: 'none', letterSpacing: '0.03em' }}>
                Start Free →
              </Link>
            </motion.div>

            {/* Tier 2 — Per Report */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.35, delay: 0.1 }}
              style={{ border: `1px solid ${BSub}`, padding: '40px', background: SURF, display: 'flex', flexDirection: 'column', gap: 20 }}
            >
              <div>
                <p style={{ fontFamily: FI, fontSize: 10, color: TS, letterSpacing: '0.07em', marginBottom: 8 }}>PER REPORT · ANY PAID TOOL</p>
                <h3 style={{ fontFamily: FI, fontSize: 26, fontWeight: 600, color: TP, marginBottom: 4 }}>Single Tool</h3>
                <p style={{ fontFamily: FI, fontSize: 12, color: TS, marginBottom: 10 }}>IS-Code BOQ Estimator</p>
                <div style={{ fontFamily: FI, fontSize: 48, fontWeight: 600, color: TP, lineHeight: 1 }}>from ₹499</div>
                <p style={{ fontFamily: FI, fontSize: 13, color: TS, marginTop: 6 }}>ElectroPro / PlumbPro ₹499 · MasonPro ₹699 · InteriorPro ₹899 · StructurePro ₹999</p>
              </div>
              <ul style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['Exact material quantities','Itemised cost breakdown','IS code compliance panel','CPWD labour cost calculator','Contractor quote comparison','PDF report with SVG drawings'].map(f => (
                  <li key={f} style={{ fontFamily: FI, fontSize: 15, color: TS, display: 'flex', gap: 10 }}>
                    <span style={{ color: GOLD, fontWeight: 700, flexShrink: 0 }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link href="/tools/structopro" className="btn-3d"
                style={{ display: 'block', textAlign: 'center', background: GOLD, color: '#000000', fontFamily: FI, fontSize: 14, fontWeight: 600, padding: '14px', borderRadius: 2, textDecoration: 'none', letterSpacing: '0.03em' }}>
                Start with StructurePro →
              </Link>
            </motion.div>

            {/* Tier 3 — Bundle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.35, delay: 0.2 }}
              style={{ border: `1px solid ${GOLD}`, borderLeft: 'none', borderRadius: '0 2px 2px 0', padding: '40px', background: SURF, display: 'flex', flexDirection: 'column', gap: 20, position: 'relative' }}
            >
              <div style={{ position: 'absolute', top: -1, right: 18, background: GOLD, color: '#000000', fontFamily: FI, fontSize: 10, fontWeight: 600, padding: '4px 12px', letterSpacing: '0.05em', borderRadius: '0 0 2px 2px' }}>
                BEST VALUE
              </div>
              <div>
                <p style={{ fontFamily: FI, fontSize: 10, color: GOLD, letterSpacing: '0.07em', marginBottom: 8 }}>COMPLETE BUNDLE · ALL 5 PAID TOOLS</p>
                <h3 style={{ fontFamily: FI, fontSize: 26, fontWeight: 600, color: TP, marginBottom: 4 }}>Full Platform</h3>
                <p style={{ fontFamily: FI, fontSize: 12, color: TS, marginBottom: 10 }}>All 5 Phase Estimators</p>
                <div style={{ fontFamily: FI, fontSize: 48, fontWeight: 600, color: TP, lineHeight: 1 }}>₹2,999</div>
                <p style={{ fontFamily: FI, fontSize: 13, color: TS, marginTop: 6 }}>
                  saves <span style={{ color: GOLD, fontWeight: 600 }}>₹596</span> vs buying individually
                </p>
              </div>
              <ul style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['StructurePro + MasonryPro','ElectricalPro + PlumbingPro','InteriorPro','All quantities across all phases','Cross-phase contractor comparison','Grand Total Report (₹999) free'].map(f => (
                  <li key={f} style={{ fontFamily: FI, fontSize: 15, color: TS, display: 'flex', gap: 10 }}>
                    <span style={{ color: GOLD, fontWeight: 700, flexShrink: 0 }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link href="/tools/structopro" className="btn-3d"
                style={{ display: 'block', textAlign: 'center', background: GOLD, color: '#000000', fontFamily: FI, fontSize: 14, fontWeight: 600, padding: '14px', borderRadius: 2, textDecoration: 'none', letterSpacing: '0.03em' }}>
                Get Bundle →
              </Link>
            </motion.div>
          </div>

          {/* Grand Total Report */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.35, delay: 0.3 }}
            style={{ border: `1px solid ${BSub}`, borderRadius: 2, padding: '32px 40px', background: SURF, display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}
          >
            <div style={{ position: 'absolute', top: -1, left: 24, background: GOLD, color: '#000000', fontFamily: FI, fontSize: 10, fontWeight: 600, padding: '4px 12px', letterSpacing: '0.05em', borderRadius: '0 0 2px 2px' }}>
              MASTER REPORT
            </div>
            <div style={{ flex: '1 1 400px' }}>
              <p style={{ fontFamily: FI, fontSize: 10, color: TS, letterSpacing: '0.07em', marginBottom: 8, marginTop: 8 }}>COMBINE ALL 5 PHASES · ONE MASTER BOQ</p>
              <h3 style={{ fontFamily: FI, fontSize: 22, fontWeight: 600, color: TP, marginBottom: 6 }}>Grand Total Report</h3>
              <p style={{ fontFamily: FI, fontSize: 14, color: TS, lineHeight: 1.6, maxWidth: 500 }}>
                Combine all 5 phases into one master report. Phase-wise cost breakdown, construction timeline Gantt chart, combined IS code compliance, and a 12-page contractor-ready PDF.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
              <div>
                <div style={{ fontFamily: FI, fontSize: 36, fontWeight: 600, color: TP, lineHeight: 1 }}>₹999</div>
                <p style={{ fontFamily: FI, fontSize: 12, color: TS, marginTop: 4 }}>Free with Complete Bundle (₹2,999)</p>
              </div>
              <Link href="/tools/grand-total" className="btn-3d"
                style={{ display: 'block', textAlign: 'center', background: GOLD, color: '#000000', fontFamily: FI, fontSize: 13, fontWeight: 600, padding: '12px 28px', borderRadius: 2, textDecoration: 'none', letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>
                Generate Grand Total Report →
              </Link>
            </div>
          </motion.div>

        </div>
      </section>

      {/* ── FIND NEARBY DEALERS ──────────────────────────────────────── */}
      <FindNearbyDealers />

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${BSub}`, background: '#050505', marginTop: 0 }}>

        <div style={{ borderBottom: `1px solid ${BSub}`, padding: '9px 24px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <span style={{ fontFamily: FI, fontSize: 9, color: 'rgba(197,160,89,0.55)', letterSpacing: '0.08em', textTransform: 'uppercase', border: `1px solid rgba(197,160,89,0.2)`, padding: '2px 10px', borderRadius: 2 }}>
            BUILD WITH CERTAINTY
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3" style={{ borderBottom: `1px solid ${BSub}` }}>

          <div className="footer-col-3d" style={{ padding: '28px 28px 32px', borderTop: `2px solid ${GOLD}`, borderRight: `1px solid ${BSub}` }}>
            <p style={{ fontFamily: FI, fontSize: 9, color: 'rgba(197,160,89,0.6)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>TOOLS</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {ALL_TOOLS.map(t => (
                <Link key={t.name} href={t.href} className="footer-link"
                  style={{ fontFamily: FI, fontSize: 14, textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {t.name}
                  <span style={{ fontFamily: FI, fontSize: 10, color: t.free ? C_GREEN : 'rgba(255,255,255,0.28)', flexShrink: 0, marginLeft: 8 }}>
                    {t.free ? 'FREE' : t.price}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="footer-col-3d" style={{ padding: '28px 28px 32px', borderTop: `2px solid ${GOLD}`, borderRight: `1px solid ${BSub}` }}>
            <p style={{ fontFamily: FI, fontSize: 9, color: 'rgba(197,160,89,0.6)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>COMPANY</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {[['About', '/about'], ['Contact', '/contact'], ['Blog', '/blog'], ['Careers', '/careers']].map(([label, href]) => (
                <Link key={label} href={href} className="footer-link" style={{ fontFamily: FI, fontSize: 14, textDecoration: 'none' }}>{label}</Link>
              ))}
            </div>
          </div>

          <div className="footer-col-3d" style={{ padding: '28px 28px 32px', borderTop: `2px solid ${GOLD}` }}>
            <p style={{ fontFamily: FI, fontSize: 9, color: 'rgba(197,160,89,0.6)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>LEGAL</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {[['Privacy Policy', '/privacy-policy'], ['Terms of Use', '/terms-of-use'], ['Disclaimer', '/disclaimer'], ['IS Codes Used', '/is-codes-used']].map(([label, href]) => (
                <Link key={label} href={href} className="footer-link" style={{ fontFamily: FI, fontSize: 14, textDecoration: 'none' }}>{label}</Link>
              ))}
            </div>
          </div>

        </div>

        <div style={{ padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <span style={{ fontFamily: FP, fontSize: 15, color: TP, fontWeight: 600 }}>NirmanShastra</span>
          </div>
          <p style={{ fontFamily: FI, fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.04em' }}>
            Estimates are for budgeting reference only. Not for structural approval without licensed engineer.
          </p>
          <p style={{ fontFamily: FI, fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.04em' }}>
            © {new Date().getFullYear()} NirmanShastra
          </p>
        </div>

      </footer>
    </main>
  )
}
