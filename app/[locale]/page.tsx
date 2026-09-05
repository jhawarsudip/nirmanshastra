'use client'

import React, { useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { FileCheck, HardHat, IndianRupee, ShieldCheck } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'
import { StructureIcon } from '@/components/icons/StructureIcon'
import { MasonryIcon } from '@/components/icons/MasonryIcon'
import { ElectricalIcon } from '@/components/icons/ElectricalIcon'
import { PlumbingIcon } from '@/components/icons/PlumbingIcon'
import { InteriorIcon } from '@/components/icons/InteriorIcon'
import { VastuIcon } from '@/components/icons/VastuIcon'
import { BillingIcon } from '@/components/icons/BillingIcon'
import { CubeIcon } from '@/components/icons/CubeIcon'
import { WageIcon } from '@/components/icons/WageIcon'
import { TierIcon } from '@/components/icons/TierIcon'
import { EvmIcon } from '@/components/icons/EvmIcon'
import HeroSVGBackground from '@/components/HeroSVGBackground'
import { STATE_CITIES, INDIAN_STATES_LIST } from '@/lib/state-cities'

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────
const BG    = '#0A0A0A'
const SURF  = '#171717'
const GOLD  = '#C5A059'
const VGOLD = '#C9A84C'
const TP    = '#FFFFFF'
const TS    = '#A3A3A3'
const BSub  = 'rgba(255,255,255,0.08)'
const FI    = 'var(--font-inter)'
const FP    = 'var(--font-playfair)'

const C_STRUCT  = '#1F4E79'
const C_MASON   = '#8C3A22'
const C_ELECTRO = '#D99A06'
const C_PLUMB   = '#2D6E6E'
const C_INT     = '#B08968'
const C_GREEN   = '#14532D'

const IS_CODES = [
  'IS 456:2000', 'IS 1786:2008', 'IS 1893:2016', 'IS 13920:2016',
  'IS 1077:1992', 'IS 12894:2002', 'IS 2185:2005', 'IS 2212:1991',
  'IS 1661:1972', 'IS 2645:2003', 'IS 4326:1993', 'IS 732:2019',
  'IS 694:2010',  'IS 8828:2007', 'IS 3043:2018', 'IS 1172:1993',
  'IS 1742:1983', 'IS 1904:2016', 'IS 2911:2010', 'IS 875:2015',
  'IS 2250:1981', 'IS 383:2016',  'IS 269:2015',  'IS 2547:1976',
  'NBC 2016',
]

// Google Maps query strings stay in English for accurate results
const DEALER_QUERIES = [
  'construction material dealer near',
  'hardware store near',
  'brick and masonry dealer near',
  'electrical store near',
  'pipes and sanitaryware dealer near',
  'tiles and marble dealer near',
  'paint store near',
  'furniture and interior decor store near',
]

// ─────────────────────────────────────────────────────────────────────────────
// WATERMARK MOTIFS
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
// LAYOUT HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function DimDivider({ label }: { label: string }) {
  const lineColor = 'rgba(255,255,255,0.14)'
  const textColor = 'rgba(255,255,255,0.38)'
  return (
    <div className="flex items-center gap-4 px-6 md:px-16">
      <div className="flex flex-1 items-center" aria-hidden="true">
        <div style={{ width: 0, height: 0, borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderRight: `7px solid ${lineColor}`, flexShrink: 0 }} />
        <div style={{ flex: 1, height: 1, background: lineColor }} />
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
// TOOL ICON
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

// ─────────────────────────────────────────────────────────────────────────────
// TOOL CARD
// ─────────────────────────────────────────────────────────────────────────────

type ToolDef = {
  phase: string
  name: string
  descriptor: string
  desc: string
  price: string
  free: boolean
  href: string
  accent?: string
}

function ToolCard({ tool, delay = 0 }: { tool: ToolDef; delay?: number }) {
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

  const borderColor = tool.free ? VGOLD : (isHover ? GOLD : BSub)

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
        onMouseLeave={() => { setRotX(0); setRotY(0); setIsHover(false) }}
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
// SITE TEMPLATE CARD — downloadable Excel toolkits (content mirrors /site-templates)
// ─────────────────────────────────────────────────────────────────────────────

type TemplateDef = {
  title: string
  sheets: number
  price: string
  desc: string
  href: string
}

// Six toolkits — titles, sheet counts and descriptions verbatim from /site-templates.
const SITE_TEMPLATES: TemplateDef[] = [
  {
    title: 'Residential Construction Cost Estimator',
    sheets: 16,
    price: '₹1,499',
    desc: 'Prices a house from IS-code first principles, generates a client quotation, compares up to 3 contractor quotes line by line, tracks budget against actual once the job starts.',
    href: '/site-templates/cost-estimator',
  },
  {
    title: 'Construction Site Documentation Pack',
    sheets: 14,
    price: '₹1,499',
    desc: 'Nine registers holding the proof of what happened on site — the contemporaneous record that holds up when a delay or defect is disputed.',
    href: '/site-templates/site-documentation',
  },
  {
    title: 'Billing & Measurement',
    sheets: 9,
    price: '₹1,499',
    desc: 'Takes measured work through the full Indian billing chain — joint measurement, abstract against BOQ, RA bill with retention/TDS/GST, payment tracking to close.',
    href: '/site-templates/billing-measurement',
  },
  {
    title: 'Bar Bending Schedule',
    sheets: 12,
    price: '₹1,499',
    desc: 'Turns reinforcement details into a cutting-length schedule and steel order note, with every bend deduction and hook allowance applied per code.',
    href: '/site-templates/bar-bending-schedule',
  },
  {
    title: 'Labour & Statutory Compliance',
    sheets: 16,
    price: '₹1,499',
    desc: "Runs site payroll end to end under India's current four Labour Codes (in force since Nov 2025) — PF, ESI, minimum wage checks, subcontractor compliance holds.",
    href: '/site-templates/labour-compliance',
  },
  {
    title: 'Planning, Progress & Delay Control',
    sheets: 17,
    price: '₹1,499',
    desc: 'Value-weighted S-curve and earned value tracking, plus a delay/EOT register that classifies events the way a contract actually does — with notice-deadline tracking.',
    href: '/site-templates/planning-progress',
  },
]

function SiteTemplateCard({ template, delay = 0 }: { template: TemplateDef; delay?: number }) {
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
        onMouseLeave={() => { setRotX(0); setRotY(0); setIsHover(false) }}
        onMouseEnter={() => setIsHover(true)}
        style={{
          transform: prefersReducedMotion ? undefined
            : `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(${isHover ? -6 : 0}px)`,
          transition: 'transform 0.18s ease-out, box-shadow 0.18s ease-out',
          willChange: 'transform',
          boxShadow: isHover && !prefersReducedMotion
            ? `0 10px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(197,160,89,0.25)`
            : 'none',
        }}
      >
        <Link href={template.href} style={{ textDecoration: 'none', display: 'block' }}>
          <article
            className="tool-card-article"
            style={{
              border: `1px solid ${isHover ? GOLD : BSub}`,
              borderRadius: 2,
              padding: '32px',
              background: SURF,
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
              minHeight: 320,
              cursor: 'pointer',
              transition: 'border-color 0.18s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <span style={{
                fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: TS,
                textTransform: 'uppercase', letterSpacing: '0.08em',
                border: `1px solid ${BSub}`, borderRadius: 2, padding: '4px 9px',
              }}>
                {template.sheets} linked sheets
              </span>
              <span style={{
                fontFamily: FI, fontSize: 10, color: 'rgba(255,255,255,0.3)',
                textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>
                Excel · .xlsx
              </span>
            </div>

            <div style={{ flex: 1 }}>
              <h3 style={{ fontFamily: FI, fontSize: 21, fontWeight: 600, color: TP, marginBottom: 12, lineHeight: 1.25 }}>
                {template.title}
              </h3>
              <p style={{ fontFamily: FI, fontSize: 14.5, color: TS, lineHeight: 1.7 }}>
                {template.desc}
              </p>
            </div>

            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              gap: 12, paddingTop: 18, borderTop: `1px solid ${BSub}`,
            }}>
              <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 22, fontWeight: 500, color: TP }}>
                {template.price}
              </span>
              <span style={{
                fontFamily: FI, fontSize: 13, fontWeight: 500, padding: '5px 14px',
                border: `1px solid ${GOLD}`, color: GOLD, letterSpacing: '0.04em', borderRadius: 2,
              }}>
                View →
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

type LucideIcon = React.ComponentType<{ size?: number; strokeWidth?: number; 'aria-hidden'?: boolean }>
type PillarDef = { Icon: LucideIcon; title: string; body: string }

function PillarCard({ pillar, delay = 0 }: { pillar: PillarDef; delay?: number }) {
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
            ? `0 8px 20px rgba(0,0,0,0.4), 0 0 12px rgba(197,160,89,0.08)`
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

type ProblemDef = { no: string; heading: string; body: string }

function ProblemCard({ problem, index }: { problem: ProblemDef; index: number }) {
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
// FIND NEARBY DEALERS
// ─────────────────────────────────────────────────────────────────────────────

function FindNearbyDealers() {
  const t = useTranslations('dealers')
  const [selectedState, setSelectedState] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [locality, setLocality] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const cities = selectedState ? (STATE_CITIES[selectedState] ?? []) : []

  const CAT_KEYS = ['cat0','cat1','cat2','cat3','cat4','cat5','cat6','cat7'] as const
  const dealerCategories = DEALER_QUERIES.map((query, i) => ({
    label: t(CAT_KEYS[i]),
    query,
  }))

  const handleStateChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedState(e.target.value)
    setSelectedCity('')
  }, [])

  function handleFind() {
    if (!selectedCity || !selectedCategory) return
    const cat = dealerCategories.find(c => c.label === selectedCategory)
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
            {t('eyebrow')}
          </p>
          <h2 style={{ fontFamily: FI, fontSize: 'clamp(28px,3.5vw,48px)', fontWeight: 600, color: TP, lineHeight: 1.15 }}>
            {t('dealersTitlePrefix')} <span className="section-accent">{t('dealersTitleHighlight')}</span>
          </h2>
          <p style={{ fontFamily: FI, fontSize: 15, color: TS, lineHeight: 1.7, maxWidth: 560 }}>
            {t('desc')}
          </p>
        </div>

        <div style={{ border: `1px solid ${BSub}`, padding: '28px 32px', background: SURF, borderRadius: 2, maxWidth: 560 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontFamily: FI, fontSize: 10, color: TS, letterSpacing: '0.09em', textTransform: 'uppercase' }}>{t('labelState')}</label>
              <select value={selectedState} onChange={handleStateChange} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">{t('stateDefault')}</option>
                {INDIAN_STATES_LIST.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontFamily: FI, fontSize: 10, color: TS, letterSpacing: '0.09em', textTransform: 'uppercase' }}>{t('labelCity')}</label>
              <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)} disabled={!selectedState}
                style={{ ...inputStyle, opacity: selectedState ? 1 : 0.4, cursor: selectedState ? 'pointer' : 'not-allowed' }}>
                <option value="">{t('cityDefault')}</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontFamily: FI, fontSize: 10, color: TS, letterSpacing: '0.09em', textTransform: 'uppercase' }}>
                {t('labelLocality')} <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>({t('localityOptional')})</span>
              </label>
              <input type="text" value={locality} onChange={e => setLocality(e.target.value)}
                placeholder={t('localityPlaceholder')}
                style={{ ...inputStyle }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontFamily: FI, fontSize: 10, color: TS, letterSpacing: '0.09em', textTransform: 'uppercase' }}>{t('labelCategory')}</label>
              <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} disabled={!selectedCity}
                style={{ ...inputStyle, opacity: selectedCity ? 1 : 0.4, cursor: selectedCity ? 'pointer' : 'not-allowed' }}>
                <option value="">{t('categoryDefault')}</option>
                {dealerCategories.map(c => <option key={c.label} value={c.label}>{c.label}</option>)}
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
              {t('cta')}
            </button>
          </div>

          <p style={{ fontFamily: FI, fontSize: 10, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.04em', lineHeight: 1.7, marginTop: 18 }}>
            {t('disclaimer')}
          </p>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// HOMEPAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function Home() {
  const prefersReducedMotion = useReducedMotion()
  const [vastuHover, setVastuHover] = useState(false)
  const locale = useLocale()
  const th = useTranslations('hero')
  const tp = useTranslations('problems')
  const tpil = useTranslations('pillars')
  const tt = useTranslations('tools')
  const thiw = useTranslations('howItWorks')
  const tc = useTranslations('comparison')
  const ti = useTranslations('isCodes')
  const tpr = useTranslations('pricing')
  const tf = useTranslations('footer')

  // ── DATA ARRAYS (locale-aware) ──────────────────────────────────────────

  const PROBLEMS: ProblemDef[] = [
    { no: tp('0no'), heading: tp('0heading'), body: tp('0body') },
    { no: tp('1no'), heading: tp('1heading'), body: tp('1body') },
    { no: tp('2no'), heading: tp('2heading'), body: tp('2body') },
  ]

  const PILLARS: PillarDef[] = [
    { Icon: FileCheck,   title: tpil('0title'), body: tpil('0body') },
    { Icon: HardHat,     title: tpil('1title'), body: tpil('1body') },
    { Icon: IndianRupee, title: tpil('2title'), body: tpil('2body') },
    { Icon: ShieldCheck, title: tpil('3title'), body: tpil('3body') },
  ]

  const STEPS = [
    { rev: 'REV A', heading: thiw('0heading'), body: thiw('0body') },
    { rev: 'REV B', heading: thiw('1heading'), body: thiw('1body') },
    { rev: 'REV C', heading: thiw('2heading'), body: thiw('2body') },
    { rev: 'REV D', heading: thiw('3heading'), body: thiw('3body') },
  ]

  const VASTU_TOOL: ToolDef = {
    phase: 'P0', name: 'VastuPro',
    descriptor: tt('vastuDescriptor'),
    desc: tt('vastuDesc'),
    price: locale === 'hi' ? tf('toolFree') : 'FREE',
    free: true, href: '/tools/vastu-pro',
  }

  const PAID_TOOLS: ToolDef[] = [
    { phase: 'P1', name: 'StructurePro',  descriptor: tt('structureDescriptor'), desc: tt('structureDesc'),   price: '₹999', free: false, href: '/tools/structopro',  accent: C_STRUCT  },
    { phase: 'P2', name: 'MasonryPro',    descriptor: tt('masonryDescriptor'),   desc: tt('masonryDesc'),     price: '₹699', free: false, href: '/tools/masonpro',    accent: C_MASON   },
    { phase: 'P3', name: 'ElectricalPro', descriptor: tt('electricalDescriptor'),desc: tt('electricalDesc'),  price: '₹499', free: false, href: '/tools/electropro',  accent: C_ELECTRO },
    { phase: 'P4', name: 'PlumbingPro',   descriptor: tt('plumbingDescriptor'),  desc: tt('plumbingDesc'),    price: '₹499', free: false, href: '/tools/plumbpro',    accent: C_PLUMB   },
    { phase: 'P5', name: 'InteriorPro',   descriptor: tt('interiorDescriptor'),  desc: tt('interiorDesc'),    price: '₹899', free: false, href: '/tools/interiorpro', accent: C_INT     },
  ]

  const ALL_TOOLS = [VASTU_TOOL, ...PAID_TOOLS]

  const COMPARISON_ROWS = [
    { feature: tc('0feature'), free: tc('0free'), ns: tc('0ns') },
    { feature: tc('1feature'), free: tc('1free'), ns: tc('1ns') },
    { feature: tc('2feature'), free: tc('2free'), ns: tc('2ns') },
    { feature: tc('3feature'), free: tc('3free'), ns: tc('3ns') },
    { feature: tc('4feature'), free: tc('4free'), ns: tc('4ns') },
    { feature: tc('5feature'), free: tc('5free'), ns: tc('5ns') },
    { feature: tc('6feature'), free: tc('6free'), ns: tc('6ns') },
    { feature: tc('7feature'), free: tc('7free'), ns: tc('7ns') },
  ]

  const footerCompanyLinks = [
    [tf('about'), '/about'],
    [tf('contact'), '/contact'],
    [tf('blog'), '/blog'],
    [tf('careers'), '/careers'],
  ]

  // Six toolkits each link to their individual product page; the bundle links to the catalog.
  const footerTemplateLinks: [string, string][] = [
    ...SITE_TEMPLATES.map(t => [t.title, t.href] as [string, string]),
    [tf('templatesBundle'), '/site-templates'],
  ]

  const footerLegalLinks = [
    [tf('privacy'), '/privacy-policy'],
    [tf('terms'), '/terms-of-use'],
    [tf('disclaimer'), '/disclaimer'],
    [tf('isCodes'), '/is-codes-used'],
  ]

  return (
    <main className="sheet-frame min-h-screen" style={{ background: BG, position: 'relative' }}>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <div
        id="hero-root"
        style={{ background: BG, minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}
      >
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
                {th('heroTitlePrefix')} <span className="hero-accent">{th('heroTitleHighlight')}</span>{locale === 'hi' ? '।' : '.'}
              </h1>
            </motion.div>

            <motion.p
              style={{ fontFamily: FI, fontSize: 18, color: TS, lineHeight: 1.7, maxWidth: 540, marginBottom: 40 }}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.25 }}
            >
              {th('subheadline')}
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
                {th('ctaFree')}
              </Link>
              <a
                href="#pricing"
                className="btn-3d"
                style={{ border: `1px solid ${GOLD}`, color: GOLD, fontFamily: FI, fontSize: 14, padding: '15px 32px', borderRadius: 2, display: 'inline-block', textDecoration: 'none', background: 'transparent', letterSpacing: '0.02em' }}
              >
                {th('ctaPricing')}
              </a>
            </motion.div>

            <motion.div
              className="flex flex-wrap stats-row-mobile"
              style={{ gap: 40, padding: '24px 28px', background: SURF, border: `1px solid ${BSub}`, borderRadius: 2 }}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.55 }}
            >
              {([
                [th('stat0Val'), th('stat0Label')],
                [th('stat1Val'), th('stat1Label')],
                [th('stat2Val'), th('stat2Label')],
              ] as [string,string][]).map(([val, label]) => (
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
          <SectionHeader title={locale === 'hi'
            ? <>{tp('title').split('ठेकेदार')[0]}<span className="section-accent">ठेकेदार</span>{tp('title').split('ठेकेदार')[1]}</>
            : <>{tp('title').split('no contractor')[0]}<span className="section-accent">no contractor</span> will tell you</>
          } />
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
          <SectionHeader title={<>{tpil('sectionTitle')}<span style={{ color: GOLD, fontSize: '1.4em', marginLeft: '0.25em', verticalAlign: '-0.15em', lineHeight: 1 }}>?</span></>} />
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
            <SectionHeader title={<>{tt('sectionTitle').split(',')[0]},<span className="section-accent"> {locale === 'hi' ? 'अनुमानित' : 'estimated'}</span></>} />
            <div style={{ border: `1px solid ${BSub}`, padding: '14px 20px', background: SURF, flexShrink: 0, maxWidth: 380, borderRadius: 2 }}>
              <p style={{ fontFamily: FI, fontSize: 11, color: TS, letterSpacing: '0.05em', lineHeight: 1.5 }}>
                {tt('sectionNote')}
              </p>
              <p style={{ fontFamily: FI, fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                {tt('sectionSub')}
              </p>
            </div>
          </div>

          {/* VastuPro featured */}
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div style={{ height: 1, flex: 1, background: BSub }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: FI, fontSize: 10, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>SUITE 1</span>
                <span style={{ fontFamily: FI, fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{tt('suite1Label')}</span>
                <span style={{ fontFamily: FI, fontSize: 10, padding: '2px 8px', border: `1px solid ${C_GREEN}`, color: C_GREEN, letterSpacing: '0.04em', borderRadius: 2 }}>{locale === 'hi' ? 'निःशुल्क' : 'FREE'}</span>
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
                        VastuPro
                      </h3>
                      <p style={{ fontFamily: FI, fontSize: 15, color: TS, lineHeight: 1.65, maxWidth: 560 }}>
                        {VASTU_TOOL.desc}
                      </p>
                    </div>
                    <div style={{ flexShrink: 0 }}>
                      <span style={{ fontFamily: FI, fontSize: 13, fontWeight: 500, padding: '8px 20px', border: `1px solid ${C_GREEN}`, color: C_GREEN, letterSpacing: '0.04em', display: 'block', borderRadius: 2 }}>
                        {locale === 'hi' ? 'निःशुल्क →' : 'FREE →'}
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
                <span style={{ fontFamily: FI, fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{tt('suite2Label')}</span>
                <span style={{ fontFamily: FI, fontSize: 10, padding: '2px 8px', border: `1px solid rgba(197,160,89,0.45)`, color: GOLD, letterSpacing: '0.04em', borderRadius: 2 }}>{tt('fromPrice')}</span>
              </div>
              <div style={{ height: 1, flex: 1, background: BSub }} />
            </div>
            <p style={{ fontFamily: FI, fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
              {tt('suite2Sub')}
            </p>
          </div>

          {/* 5 paid tools grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PAID_TOOLS.map((tool, i) => (
              <ToolCard key={tool.name} tool={tool} delay={i * 0.08} />
            ))}
          </div>

          {/* Free calculators divider */}
          <div style={{ paddingTop: 8 }}>
            <div className="flex items-center gap-4 mb-6">
              <div style={{ height: 1, flex: 1, background: BSub }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: FI, fontSize: 10, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>SUITE 3</span>
                <span style={{ fontFamily: FI, fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{locale === 'hi' ? 'निःशुल्क कैलकुलेटर' : 'Free Calculators'}</span>
                <span style={{ fontFamily: FI, fontSize: 10, padding: '2px 8px', border: `1px solid ${C_GREEN}`, color: C_GREEN, letterSpacing: '0.04em', borderRadius: 2 }}>{locale === 'hi' ? 'निःशुल्क' : 'FREE'}</span>
              </div>
              <div style={{ height: 1, flex: 1, background: BSub }} />
            </div>

            <Link href="/tools/bar-bending-schedule-calculator" style={{ textDecoration: 'none', display: 'block' }}>
              <article className="tool-card-article" style={{
                border: `1px solid ${BSub}`,
                borderRadius: 2,
                padding: '28px 32px',
                background: SURF,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 28,
                cursor: 'pointer',
                position: 'relative',
              }}>
                <div style={{ width: 44, height: 44, flexShrink: 0, opacity: 0.9 }}>
                  <StructureIcon size={44} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: FI, fontSize: 10, color: TS, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                    {locale === 'hi' ? 'स्टील BBS और कटिंग लेंथ कैलकुलेटर' : 'Steel BBS & Cutting Length Calculator'}
                  </p>
                  <h3 style={{ fontFamily: FI, fontSize: 22, fontWeight: 600, color: TP, marginBottom: 8 }}>
                    {locale === 'hi' ? 'बार बेंडिंग शेड्यूल कैलकुलेटर' : 'Bar Bending Schedule Calculator'}
                  </h3>
                  <p style={{ fontFamily: FI, fontSize: 14, color: TS, lineHeight: 1.6, maxWidth: 620 }}>
                    {locale === 'hi'
                      ? 'IS 2502:1963 के अनुसार कटिंग लेंथ, हुक, बेंड और स्टील वज़न निकालें — पूरी तरह निःशुल्क, बिना साइन-अप।'
                      : 'Cutting lengths, hooks, bends and steel weight per IS 2502:1963 — completely free, no sign-up required.'}
                  </p>
                </div>
                <div style={{ flexShrink: 0 }}>
                  <span style={{ fontFamily: FI, fontSize: 13, fontWeight: 500, padding: '8px 20px', border: `1px solid ${C_GREEN}`, color: C_GREEN, letterSpacing: '0.04em', display: 'block', borderRadius: 2 }}>
                    {locale === 'hi' ? 'निःशुल्क →' : 'FREE →'}
                  </span>
                </div>
              </article>
            </Link>

            <Link href="/tools/water-tank-size-calculator" style={{ textDecoration: 'none', display: 'block', marginTop: 20 }}>
              <article className="tool-card-article" style={{
                border: `1px solid ${BSub}`,
                borderRadius: 2,
                padding: '28px 32px',
                background: SURF,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 28,
                cursor: 'pointer',
                position: 'relative',
              }}>
                <div style={{ width: 44, height: 44, flexShrink: 0, opacity: 0.9 }}>
                  <PlumbingIcon size={44} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: FI, fontSize: 10, color: TS, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                    {locale === 'hi' ? 'वॉटर स्टोरेज टैंक साइज़ कैलकुलेटर' : 'Water Storage Tank Size Calculator'}
                  </p>
                  <h3 style={{ fontFamily: FI, fontSize: 22, fontWeight: 600, color: TP, marginBottom: 8 }}>
                    {locale === 'hi' ? 'वॉटर टैंक साइज़ कैलकुलेटर' : 'Water Tank Size Calculator'}
                  </h3>
                  <p style={{ fontFamily: FI, fontSize: 14, color: TS, lineHeight: 1.6, maxWidth: 620 }}>
                    {locale === 'hi'
                      ? 'IS 1172:1993 के अनुसार दैनिक पानी की माँग से ओवरहेड और अंडरग्राउंड टैंक क्षमता निकालें — पूरी तरह निःशुल्क, बिना साइन-अप।'
                      : 'Overhead and underground tank capacity from daily water demand per IS 1172:1993 — completely free, no sign-up required.'}
                  </p>
                </div>
                <div style={{ flexShrink: 0 }}>
                  <span style={{ fontFamily: FI, fontSize: 13, fontWeight: 500, padding: '8px 20px', border: `1px solid ${C_GREEN}`, color: C_GREEN, letterSpacing: '0.04em', display: 'block', borderRadius: 2 }}>
                    {locale === 'hi' ? 'निःशुल्क →' : 'FREE →'}
                  </span>
                </div>
              </article>
            </Link>

            <Link href="/tools/concrete-mix-ratio-calculator" style={{ textDecoration: 'none', display: 'block', marginTop: 20 }}>
              <article className="tool-card-article" style={{
                border: `1px solid ${BSub}`,
                borderRadius: 2,
                padding: '28px 32px',
                background: SURF,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 28,
                cursor: 'pointer',
                position: 'relative',
              }}>
                <div style={{ width: 44, height: 44, flexShrink: 0, opacity: 0.9 }}>
                  <StructureIcon size={44} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: FI, fontSize: 10, color: TS, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                    {locale === 'hi' ? 'सीमेंट, रेत और एग्रीगेट कैलकुलेटर' : 'Cement, Sand & Aggregate Calculator'}
                  </p>
                  <h3 style={{ fontFamily: FI, fontSize: 22, fontWeight: 600, color: TP, marginBottom: 8 }}>
                    {locale === 'hi' ? 'कंक्रीट मिक्स रेशियो कैलकुलेटर' : 'Concrete Mix Ratio Calculator'}
                  </h3>
                  <p style={{ fontFamily: FI, fontSize: 14, color: TS, lineHeight: 1.6, maxWidth: 620 }}>
                    {locale === 'hi'
                      ? 'IS 456:2000 के अनुसार ग्रेड के हिसाब से सीमेंट बैग, रेत और एग्रीगेट (M20 = 1:1.5:3, M25 = 1:1:2) निकालें — पूरी तरह निःशुल्क, बिना साइन-अप।'
                      : 'Cement bags, sand and aggregate per grade (M20 = 1:1.5:3, M25 = 1:1:2) using the locked IS 456:2000 quantities — completely free, no sign-up required.'}
                  </p>
                </div>
                <div style={{ flexShrink: 0 }}>
                  <span style={{ fontFamily: FI, fontSize: 13, fontWeight: 500, padding: '8px 20px', border: `1px solid ${C_GREEN}`, color: C_GREEN, letterSpacing: '0.04em', display: 'block', borderRadius: 2 }}>
                    {locale === 'hi' ? 'निःशुल्क →' : 'FREE →'}
                  </span>
                </div>
              </article>
            </Link>

            <Link href="/tools/brick-calculator" style={{ textDecoration: 'none', display: 'block', marginTop: 20 }}>
              <article className="tool-card-article" style={{
                border: `1px solid ${BSub}`,
                borderRadius: 2,
                padding: '28px 32px',
                background: SURF,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 28,
                cursor: 'pointer',
                position: 'relative',
              }}>
                <div style={{ width: 44, height: 44, flexShrink: 0, opacity: 0.9 }}>
                  <MasonryIcon size={44} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: FI, fontSize: 10, color: TS, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                    {locale === 'hi' ? 'दीवार ईंट गिनती और वेस्टेज कैलकुलेटर' : 'Wall Brick Count & Wastage Calculator'}
                  </p>
                  <h3 style={{ fontFamily: FI, fontSize: 22, fontWeight: 600, color: TP, marginBottom: 8 }}>
                    {locale === 'hi' ? 'ईंट कैलकुलेटर' : 'Brick Calculator'}
                  </h3>
                  <p style={{ fontFamily: FI, fontSize: 14, color: TS, lineHeight: 1.6, maxWidth: 620 }}>
                    {locale === 'hi'
                      ? 'IS 1077:1992 के अनुसार 9" और 4.5" दीवारों के लिए दीवार क्षेत्रफल, ईंट गिनती और +5–10% वेस्टेज निकालें — पूरी तरह निःशुल्क, बिना साइन-अप।'
                      : 'Wall area, brick count and a +5–10% wastage allowance for 9" and 4.5" walls per IS 1077:1992 — completely free, no sign-up required.'}
                  </p>
                </div>
                <div style={{ flexShrink: 0 }}>
                  <span style={{ fontFamily: FI, fontSize: 13, fontWeight: 500, padding: '8px 20px', border: `1px solid ${C_GREEN}`, color: C_GREEN, letterSpacing: '0.04em', display: 'block', borderRadius: 2 }}>
                    {locale === 'hi' ? 'निःशुल्क →' : 'FREE →'}
                  </span>
                </div>
              </article>
            </Link>

            <Link href="/tools/wire-size-calculator" style={{ textDecoration: 'none', display: 'block', marginTop: 20 }}>
              <article className="tool-card-article" style={{
                border: `1px solid ${BSub}`,
                borderRadius: 2,
                padding: '28px 32px',
                background: SURF,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 28,
                cursor: 'pointer',
                position: 'relative',
              }}>
                <div style={{ width: 44, height: 44, flexShrink: 0, opacity: 0.9 }}>
                  <ElectricalIcon size={44} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: FI, fontSize: 10, color: TS, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                    {locale === 'hi' ? 'सर्किट अनुसार केबल गेज कैलकुलेटर' : 'Cable Gauge by Circuit Type Calculator'}
                  </p>
                  <h3 style={{ fontFamily: FI, fontSize: 22, fontWeight: 600, color: TP, marginBottom: 8 }}>
                    {locale === 'hi' ? 'वायर साइज़ कैलकुलेटर' : 'Wire Size Calculator'}
                  </h3>
                  <p style={{ fontFamily: FI, fontSize: 14, color: TS, lineHeight: 1.6, maxWidth: 620 }}>
                    {locale === 'hi'
                      ? 'IS 732:2019 Cl 6.2 के अनुसार हर सर्किट के लिए न्यूनतम तांबे का वायर साइज़ — लाइटिंग, सॉकेट, AC/गीजर, सब-पैनल, मेन इनकमर — पूरी तरह निःशुल्क, बिना साइन-अप।'
                      : 'Minimum copper wire size per circuit — lighting, sockets, AC/geyser, sub-panel feed and main incomer — per IS 732:2019 Cl 6.2 — completely free, no sign-up required.'}
                  </p>
                </div>
                <div style={{ flexShrink: 0 }}>
                  <span style={{ fontFamily: FI, fontSize: 13, fontWeight: 500, padding: '8px 20px', border: `1px solid ${C_GREEN}`, color: C_GREEN, letterSpacing: '0.04em', display: 'block', borderRadius: 2 }}>
                    {locale === 'hi' ? 'निःशुल्क →' : 'FREE →'}
                  </span>
                </div>
              </article>
            </Link>

            <Link href="/tools/ra-bill-retention-tds-calculator" style={{ textDecoration: 'none', display: 'block', marginTop: 20 }}>
              <article className="tool-card-article" style={{
                border: `1px solid ${BSub}`,
                borderRadius: 2,
                padding: '28px 32px',
                background: SURF,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 28,
                cursor: 'pointer',
                position: 'relative',
              }}>
                <div style={{ width: 44, height: 44, flexShrink: 0, opacity: 0.9 }}>
                  <BillingIcon size={44} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: FI, fontSize: 10, color: TS, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                    {locale === 'hi' ? 'रिटेंशन, GST और TDS नेट पेयबल कैलकुलेटर' : 'Retention, GST & TDS Net Payable Calculator'}
                  </p>
                  <h3 style={{ fontFamily: FI, fontSize: 22, fontWeight: 600, color: TP, marginBottom: 8 }}>
                    {locale === 'hi' ? 'आरए बिल कैलकुलेटर' : 'RA Bill Calculator'}
                  </h3>
                  <p style={{ fontFamily: FI, fontSize: 14, color: TS, lineHeight: 1.6, maxWidth: 620 }}>
                    {locale === 'hi'
                      ? 'रनिंग अकाउंट बिल का नेट पेयबल — रिटेंशन, GST, TDS और मोबिलाइज़ेशन एडवांस रिकवरी सहित (नेट = ग्रॉस − रिटेंशन − एडवांस + GST − TDS) — पूरी तरह निःशुल्क, बिना साइन-अप।'
                      : 'Net payable on a running-account bill — retention held back, GST added, TDS deducted and advance recovery netted off (Net = Gross − Retention − Advance + GST − TDS) — completely free, no sign-up required.'}
                  </p>
                </div>
                <div style={{ flexShrink: 0 }}>
                  <span style={{ fontFamily: FI, fontSize: 13, fontWeight: 500, padding: '8px 20px', border: `1px solid ${C_GREEN}`, color: C_GREEN, letterSpacing: '0.04em', display: 'block', borderRadius: 2 }}>
                    {locale === 'hi' ? 'निःशुल्क →' : 'FREE →'}
                  </span>
                </div>
              </article>
            </Link>

            <Link href="/tools/concrete-cube-test-calculator" style={{ textDecoration: 'none', display: 'block', marginTop: 20 }}>
              <article className="tool-card-article" style={{
                border: `1px solid ${BSub}`,
                borderRadius: 2,
                padding: '28px 32px',
                background: SURF,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 28,
                cursor: 'pointer',
                position: 'relative',
              }}>
                <div style={{ width: 44, height: 44, flexShrink: 0, opacity: 0.9 }}>
                  <CubeIcon size={44} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: FI, fontSize: 10, color: TS, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                    {locale === 'hi' ? 'सैंपल और क्यूब गिनती कैलकुलेटर' : 'Samples & Cubes Required Calculator'}
                  </p>
                  <h3 style={{ fontFamily: FI, fontSize: 22, fontWeight: 600, color: TP, marginBottom: 8 }}>
                    {locale === 'hi' ? 'कंक्रीट क्यूब टेस्ट कैलकुलेटर' : 'Concrete Cube Test Calculator'}
                  </h3>
                  <p style={{ fontFamily: FI, fontSize: 14, color: TS, lineHeight: 1.6, maxWidth: 620 }}>
                    {locale === 'hi'
                      ? 'IS 456:2000 Cl 15.2.2 के अनुसार कंक्रीट की मात्रा से आवश्यक सैंपल और कुल क्यूब की गिनती (हर सैंपल = 6 क्यूब, 7 और 28 दिन) — पूरी तरह निःशुल्क, बिना साइन-अप।'
                      : 'Samples and total cubes required by concrete volume per IS 456:2000 Cl 15.2.2 — 6 cubes per sample, broken at 7 and 28 days — completely free, no sign-up required.'}
                  </p>
                </div>
                <div style={{ flexShrink: 0 }}>
                  <span style={{ fontFamily: FI, fontSize: 13, fontWeight: 500, padding: '8px 20px', border: `1px solid ${C_GREEN}`, color: C_GREEN, letterSpacing: '0.04em', display: 'block', borderRadius: 2 }}>
                    {locale === 'hi' ? 'निःशुल्क →' : 'FREE →'}
                  </span>
                </div>
              </article>
            </Link>

            <Link href="/tools/daily-wage-pf-esi-calculator" style={{ textDecoration: 'none', display: 'block', marginTop: 20 }}>
              <article className="tool-card-article" style={{
                border: `1px solid ${BSub}`,
                borderRadius: 2,
                padding: '28px 32px',
                background: SURF,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 28,
                cursor: 'pointer',
                position: 'relative',
              }}>
                <div style={{ width: 44, height: 44, flexShrink: 0, opacity: 0.9 }}>
                  <WageIcon size={44} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: FI, fontSize: 10, color: TS, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                    {locale === 'hi' ? 'साइट मज़दूर मस्टर-रोल नेट वेतन कैलकुलेटर' : 'Site Labour Muster-Roll Net Pay Calculator'}
                  </p>
                  <h3 style={{ fontFamily: FI, fontSize: 22, fontWeight: 600, color: TP, marginBottom: 8 }}>
                    {locale === 'hi' ? 'दैनिक मज़दूरी PF और ESI कैलकुलेटर' : 'Daily-Wage PF & ESI Calculator'}
                  </h3>
                  <p style={{ fontFamily: FI, fontSize: 14, color: TS, lineHeight: 1.6, maxWidth: 620 }}>
                    {locale === 'hi'
                      ? 'निर्माण साइट के दैनिक-मज़दूरी मज़दूर के लिए — मस्टर-रोल के अनुसार, मासिक वेतन नहीं। दैनिक दर × देय दिन (23.5 जैसे दशमलव भी) → बेसिक, ग्रॉस, PF (12% ₹1,800 तक), ESI (0.75% ₹21,000 तक) और नेट पेयबल — पूरी तरह निःशुल्क, बिना साइन-अप।'
                      : 'Built for daily-wage construction labour — muster-roll style, not monthly salary. Daily rate × payable days (decimals like 23.5 too) → basic, gross, PF (12% up to ₹1,800), ESI (0.75% up to ₹21,000) and net payable — completely free, no sign-up required.'}
                  </p>
                </div>
                <div style={{ flexShrink: 0 }}>
                  <span style={{ fontFamily: FI, fontSize: 13, fontWeight: 500, padding: '8px 20px', border: `1px solid ${C_GREEN}`, color: C_GREEN, letterSpacing: '0.04em', display: 'block', borderRadius: 2 }}>
                    {locale === 'hi' ? 'निःशुल्क →' : 'FREE →'}
                  </span>
                </div>
              </article>
            </Link>

            <Link href="/tools/finish-tier-cost-calculator" style={{ textDecoration: 'none', display: 'block', marginTop: 20 }}>
              <article className="tool-card-article" style={{
                border: `1px solid ${BSub}`,
                borderRadius: 2,
                padding: '28px 32px',
                background: SURF,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 28,
                cursor: 'pointer',
                position: 'relative',
              }}>
                <div style={{ width: 44, height: 44, flexShrink: 0, opacity: 0.9 }}>
                  <TierIcon size={44} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: FI, fontSize: 10, color: TS, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                    {locale === 'hi' ? 'फिनिश क्वालिटी टियर कॉस्ट अंतर कैलकुलेटर' : 'Finish Quality Tier Cost Difference Calculator'}
                  </p>
                  <h3 style={{ fontFamily: FI, fontSize: 22, fontWeight: 600, color: TP, marginBottom: 8 }}>
                    {locale === 'hi' ? 'फिनिश-टियर कॉस्ट डिफरेंस कैलकुलेटर' : 'Finish-Tier Cost Difference Calculator'}
                  </h3>
                  <p style={{ fontFamily: FI, fontSize: 14, color: TS, lineHeight: 1.6, maxWidth: 620 }}>
                    {locale === 'hi'
                      ? 'बिल्ट-अप एरिया और कोई भी दो टियर (बेसिक/स्टैंडर्ड/प्रीमियम/लक्ज़री) चुनें — स्ट्रक्चर, फ़्लोरिंग, दरवाज़े-खिड़की, इलेक्ट्रिकल, प्लंबिंग, पेंटिंग, फ़ॉल्स सीलिंग व जॉइनरी में एलिमेंट-वार और कुल कॉस्ट का अंतर। दिखाता है कि स्ट्रक्चर लगभग स्थिर रहता है जबकि फ़िनिश कई गुना बढ़ते हैं — पूरी तरह निःशुल्क, बिना साइन-अप।'
                      : 'Pick a built-up area and any two tiers (Basic/Standard/Premium/Luxury) to see the per-element and total cost difference across structure, flooring, doors & windows, electrical, plumbing, painting and joinery — showing why structure barely moves while finishes multiply. Completely free, no sign-up required.'}
                  </p>
                </div>
                <div style={{ flexShrink: 0 }}>
                  <span style={{ fontFamily: FI, fontSize: 13, fontWeight: 500, padding: '8px 20px', border: `1px solid ${C_GREEN}`, color: C_GREEN, letterSpacing: '0.04em', display: 'block', borderRadius: 2 }}>
                    {locale === 'hi' ? 'निःशुल्क →' : 'FREE →'}
                  </span>
                </div>
              </article>
            </Link>

            <Link href="/tools/earned-value-calculator" style={{ textDecoration: 'none', display: 'block', marginTop: 20 }}>
              <article className="tool-card-article" style={{
                border: `1px solid ${BSub}`,
                borderRadius: 2,
                padding: '28px 32px',
                background: SURF,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 28,
                cursor: 'pointer',
                position: 'relative',
              }}>
                <div style={{ width: 44, height: 44, flexShrink: 0, opacity: 0.9 }}>
                  <EvmIcon size={44} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: FI, fontSize: 10, color: TS, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                    {locale === 'hi' ? 'SPI, CPI, EAC और TCPI अर्नड वैल्यू कैलकुलेटर' : 'SPI, CPI, EAC & TCPI Earned Value Calculator'}
                  </p>
                  <h3 style={{ fontFamily: FI, fontSize: 22, fontWeight: 600, color: TP, marginBottom: 8 }}>
                    {locale === 'hi' ? 'अर्नड वैल्यू कैलकुलेटर' : 'Earned Value Calculator'}
                  </h3>
                  <p style={{ fontFamily: FI, fontSize: 14, color: TS, lineHeight: 1.6, maxWidth: 620 }}>
                    {locale === 'hi'
                      ? 'BAC, प्लान्ड वैल्यू, अर्नड वैल्यू और एक्चुअल कॉस्ट डालें → शेड्यूल व कॉस्ट वेरियंस (SV, CV), SPI, CPI, EAC, ETC, VAC और TCPI — साथ में SPI/CPI का सरल 2×2 रीडिंग गाइड। पूरी तरह निःशुल्क, बिना साइन-अप।'
                      : 'Enter BAC, Planned Value, Earned Value and Actual Cost → schedule & cost variance (SV, CV), SPI, CPI, EAC, ETC, VAC and TCPI — plus a plain-language 2×2 SPI/CPI reading guide. Completely free, no sign-up required.'}
                  </p>
                </div>
                <div style={{ flexShrink: 0 }}>
                  <span style={{ fontFamily: FI, fontSize: 13, fontWeight: 500, padding: '8px 20px', border: `1px solid ${C_GREEN}`, color: C_GREEN, letterSpacing: '0.04em', display: 'block', borderRadius: 2 }}>
                    {locale === 'hi' ? 'निःशुल्क →' : 'FREE →'}
                  </span>
                </div>
              </article>
            </Link>
          </div>

        </div>
      </section>

      {/* ── SITE TEMPLATES SECTION ───────────────────────────────────────── */}
      <section className="px-6 md:px-16 lg:px-24 py-28" style={{ background: BG }}>
        <div className="space-y-14">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <SectionHeader
              clause={locale === 'hi' ? 'साइट टेम्पलेट्स · 6 एक्सेल टूलकिट' : 'Site Templates · 6 Excel Toolkits'}
              title={<>{locale === 'hi' ? 'चलाइए काम, ' : 'Run the job, '}<span className="section-accent">{locale === 'hi' ? 'स्प्रेडशीट से' : 'on a spreadsheet'}</span></>}
            />
            <div style={{ border: `1px solid ${BSub}`, padding: '14px 20px', background: SURF, flexShrink: 0, maxWidth: 380, borderRadius: 2 }}>
              <p style={{ fontFamily: FI, fontSize: 11, color: TS, letterSpacing: '0.05em', lineHeight: 1.5 }}>
                {locale === 'hi'
                  ? 'इंटरैक्टिव कैलकुलेटर से अलग — भारतीय मानकों पर बने डाउनलोड करने योग्य एक्सेल पैक।'
                  : 'Standalone Excel packs, separate from the interactive calculators — built to Indian standards and statutory practice.'}
              </p>
              <p style={{ fontFamily: FI, fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                {locale === 'hi' ? 'एस्टिमेट · डॉक्युमेंट · बिल · शेड्यूल · कंप्लायंस' : 'Estimate · document · bill · schedule · comply · control.'}
              </p>
            </div>
          </div>

          {/* Suite 3 divider */}
          <div style={{ paddingTop: 8 }}>
            <div className="flex items-center gap-4 mb-3">
              <div style={{ height: 1, flex: 1, background: BSub }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: FI, fontSize: 10, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>SUITE 3</span>
                <span style={{ fontFamily: FI, fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{locale === 'hi' ? 'साइट टेम्पलेट्स' : 'Site Templates'}</span>
                <span style={{ fontFamily: FI, fontSize: 10, padding: '2px 8px', border: `1px solid rgba(197,160,89,0.45)`, color: GOLD, letterSpacing: '0.04em', borderRadius: 2 }}>{locale === 'hi' ? '₹1,499 प्रत्येक' : '₹1,499 each'}</span>
              </div>
              <div style={{ height: 1, flex: 1, background: BSub }} />
            </div>
          </div>

          {/* 6 site template cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SITE_TEMPLATES.map((template, i) => (
              <SiteTemplateCard key={template.title} template={template} delay={i * 0.08} />
            ))}
          </div>

          {/* Bundle strip — Site Operations Suite */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="bundle-strip-inner"
            style={{ border: `1px solid ${GOLD}`, borderRadius: 2, padding: '28px 40px', background: SURF, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}
          >
            <div>
              <p style={{ fontFamily: FI, fontSize: 11, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                {locale === 'hi' ? 'द बंडल · सभी 6 टूलकिट' : 'The Bundle · All 6 Toolkits'}
              </p>
              <p style={{ fontFamily: FI, fontSize: 15, color: TS }}>
                {locale === 'hi' ? 'साइट ऑपरेशंस सूट' : 'Site Operations Suite'}
                {' '}&mdash; {locale === 'hi' ? 'एक ही डाउनलोड में सब कुछ, बचत' : 'every toolkit in one download, save'}{' '}
                <span style={{ color: TP, fontWeight: 600 }}>~22%</span>
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 40, fontWeight: 600, color: TP }}>₹6,999</span>
              <Link
                href="/site-templates"
                className="btn-3d"
                style={{ background: GOLD, color: '#000000', fontFamily: FI, fontSize: 14, fontWeight: 600, padding: '13px 24px', borderRadius: 2, textDecoration: 'none', whiteSpace: 'nowrap' }}
              >
                {locale === 'hi' ? 'बंडल देखें →' : 'View bundle →'}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="grid-paper px-6 md:px-16 lg:px-24 py-28">
        <div className="space-y-14">
          <SectionHeader title={<>{thiw('sectionTitle')}<span style={{ color: GOLD, fontSize: '1.4em', marginLeft: '0.15em', verticalAlign: '-0.15em', lineHeight: 1 }}>?</span></>} />

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
                className="min-h-[160px] sm:min-h-0"
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
        <DimDivider label={tc('dimLabel')} />
      </div>

      {/* ── COMPARISON TABLE ─────────────────────────────────────────── */}
      <section className="px-6 md:px-16 lg:px-24 py-28" style={{ background: BG }}>
        <div className="space-y-10">
          <SectionHeader title={locale === 'hi'
            ? <>{tc('sectionTitle').split('बेहतर')[0]}<span className="section-accent">बेहतर</span>{tc('sectionTitle').split('बेहतर')[1]}<span style={{ color: GOLD, fontSize: '1.4em', marginLeft: '0.15em', verticalAlign: '-0.15em', lineHeight: 1 }}>?</span></>
            : <>{tc('sectionTitle').split('beats')[0]}<span className="section-accent">beats</span> free calculators<span style={{ color: GOLD, fontSize: '1.4em', marginLeft: '0.25em', verticalAlign: '-0.15em', lineHeight: 1 }}>?</span></>
          } />
          <p style={{ fontFamily: FI, fontSize: 16, color: TS, lineHeight: 1.65, maxWidth: 680 }}>
            {tc('intro')}
          </p>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FI, fontSize: 14 }}>
              <thead>
                <tr>
                  <th scope="col" style={{ fontFamily: FI, fontSize: 10, color: TS, letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'left', padding: '10px 16px', borderBottom: `1px solid ${BSub}`, borderRight: `1px solid ${BSub}`, minWidth: 200 }}>{tc('colFeature')}</th>
                  <th scope="col" style={{ fontFamily: FI, fontSize: 10, color: TS, letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'left', padding: '10px 16px', borderBottom: `1px solid ${BSub}`, borderRight: `1px solid ${BSub}`, minWidth: 260 }}>{tc('colFree')}</th>
                  <th scope="col" style={{ fontFamily: FI, fontSize: 10, color: TP, letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'left', padding: '10px 16px', borderBottom: `1px solid ${BSub}`, background: `rgba(197,160,89,0.07)`, minWidth: 280 }}>{tc('colNS')}</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, i) => (
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
            {tc('footnote')}
          </p>
        </div>
      </section>

      {/* ── DIMENSION DIVIDER ─────────────────────────────────────────── */}
      <div className="py-3">
        <DimDivider label={ti('dimLabel')} />
      </div>

      {/* ── IS CODE TRUST STRIP ──────────────────────────────────────── */}
      <section className="px-6 md:px-16 lg:px-24 py-28" style={{ background: SURF }}>
        <div className="space-y-10">
          <div className="space-y-2">
            <h2 style={{ fontFamily: FI, fontSize: 'clamp(28px,3.5vw,48px)', fontWeight: 600, color: TP, lineHeight: 1.15 }}>
              {ti('title')}
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
              {ti('infoText')} <span style={{ color: TP, fontWeight: 600 }}>{ti('infoM20')}</span>{' '}
              ({locale === 'en' ? 'not' : 'न कि'} <span style={{ fontFamily: FI }}>{ti('infoM20Not')}</span>). {ti('infoDry')}{' '}
              <span style={{ color: TP, fontWeight: 600 }}>{ti('infoDryVal')}</span>. {ti('infoDryMortar')}{' '}
              <span style={{ color: TP, fontWeight: 600 }}>{ti('infoDryMortarVal')}</span>.
            </p>
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────────────── */}
      <section id="pricing" className="grid-paper px-6 md:px-16 lg:px-24 py-28">
        <div className="space-y-14">
          <SectionHeader title={<>{tpr('sectionTitle').split(',')[0]}, <span className="section-accent">{locale === 'hi' ? 'रिपोर्ट-दर-रिपोर्ट' : 'report-by-report'}</span> {locale === 'en' ? 'pricing' : 'मूल्य'}</>} />

          <div className="pricing-grid grid grid-cols-1 md:grid-cols-2 gap-0">

            {/* Tier 1 — VastuPro FREE */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.35, delay: 0 }}
              style={{ border: `1px solid ${VGOLD}`, borderRight: 'none', borderRadius: '2px 0 0 2px', padding: '40px', background: SURF, display: 'flex', flexDirection: 'column', gap: 20 }}
            >
              <div>
                <p style={{ fontFamily: FI, fontSize: 10, color: C_GREEN, letterSpacing: '0.07em', marginBottom: 8 }}>{tpr('vastuPhase')}</p>
                <h3 style={{ fontFamily: FI, fontSize: 26, fontWeight: 600, color: TP, marginBottom: 4 }}>{tpr('vastuName')}</h3>
                <p style={{ fontFamily: FI, fontSize: 12, color: TS, marginBottom: 10 }}>{tpr('vastuSub')}</p>
                <div style={{ fontFamily: FI, fontSize: 48, fontWeight: 600, color: C_GREEN, lineHeight: 1 }}>{locale === 'hi' ? 'निःशुल्क' : 'FREE'}</div>
                <p style={{ fontFamily: FI, fontSize: 13, color: TS, marginTop: 6 }}>{tpr('vastuFreePer')}</p>
              </div>
              <ul style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[tpr('vastuF0'),tpr('vastuF1'),tpr('vastuF2'),tpr('vastuF3'),tpr('vastuF4'),tpr('vastuF5')].map(f => (
                  <li key={f} style={{ fontFamily: FI, fontSize: 15, color: TS, display: 'flex', gap: 10 }}>
                    <span style={{ color: C_GREEN, fontWeight: 700, flexShrink: 0 }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link href="/tools/vastu-pro" className="btn-3d"
                style={{ display: 'block', textAlign: 'center', border: `1px solid ${C_GREEN}`, color: C_GREEN, fontFamily: FI, fontSize: 14, padding: '14px', borderRadius: 2, textDecoration: 'none', letterSpacing: '0.03em' }}>
                {tpr('vastuCta')}
              </Link>
            </motion.div>

            {/* Tier 2 — Per Report */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.35, delay: 0.1 }}
              style={{ border: `1px solid ${BSub}`, borderRadius: '0 2px 2px 0', padding: '40px', background: SURF, display: 'flex', flexDirection: 'column', gap: 20 }}
            >
              <div>
                <p style={{ fontFamily: FI, fontSize: 10, color: TS, letterSpacing: '0.07em', marginBottom: 8 }}>{tpr('singlePhase')}</p>
                <h3 style={{ fontFamily: FI, fontSize: 26, fontWeight: 600, color: TP, marginBottom: 4 }}>{tpr('singleName')}</h3>
                <p style={{ fontFamily: FI, fontSize: 12, color: TS, marginBottom: 10 }}>{tpr('singleSub')}</p>
                <div style={{ fontFamily: FI, fontSize: 48, fontWeight: 600, color: TP, lineHeight: 1 }}>{tpr('singleFrom')}</div>
                <p style={{ fontFamily: FI, fontSize: 13, color: TS, marginTop: 6 }}>{tpr('singleSub2')}</p>
              </div>
              <ul style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[tpr('singleF0'),tpr('singleF1'),tpr('singleF2'),tpr('singleF3'),tpr('singleF4'),tpr('singleF5')].map(f => (
                  <li key={f} style={{ fontFamily: FI, fontSize: 15, color: TS, display: 'flex', gap: 10 }}>
                    <span style={{ color: GOLD, fontWeight: 700, flexShrink: 0 }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link href="/tools/structopro" className="btn-3d"
                style={{ display: 'block', textAlign: 'center', background: GOLD, color: '#000000', fontFamily: FI, fontSize: 14, fontWeight: 600, padding: '14px', borderRadius: 2, textDecoration: 'none', letterSpacing: '0.03em' }}>
                {tpr('singleCta')}
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
              {tpr('gtLabel')}
            </div>
            <div style={{ flex: '1 1 400px' }}>
              <p style={{ fontFamily: FI, fontSize: 10, color: TS, letterSpacing: '0.07em', marginBottom: 8, marginTop: 8 }}>{tpr('gtPhase')}</p>
              <h3 style={{ fontFamily: FI, fontSize: 22, fontWeight: 600, color: TP, marginBottom: 6 }}>{tpr('gtName')}</h3>
              <p style={{ fontFamily: FI, fontSize: 14, color: TS, lineHeight: 1.6, maxWidth: 500 }}>
                {tpr('gtDesc')}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
              <div>
                <div style={{ fontFamily: FI, fontSize: 36, fontWeight: 600, color: TP, lineHeight: 1 }}>₹999</div>
                <p style={{ fontFamily: FI, fontSize: 12, color: TS, marginTop: 4 }}>{tpr('gtFree')}</p>
              </div>
              <Link href="/tools/grand-total" className="btn-3d"
                style={{ display: 'block', textAlign: 'center', background: GOLD, color: '#000000', fontFamily: FI, fontSize: 13, fontWeight: 600, padding: '12px 28px', borderRadius: 2, textDecoration: 'none', letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>
                {tpr('gtCta')}
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
            {tf('tagline')}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ borderBottom: `1px solid ${BSub}` }}>

          <div className="footer-col-3d" style={{ padding: '28px 28px 32px', borderTop: `2px solid ${GOLD}`, borderRight: `1px solid ${BSub}` }}>
            <p style={{ fontFamily: FI, fontSize: 9, color: 'rgba(197,160,89,0.6)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>{tf('colTools')}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {ALL_TOOLS.map(t => (
                <Link key={t.name} href={t.href} className="footer-link"
                  style={{ fontFamily: FI, fontSize: 14, textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {t.name}
                  <span style={{ fontFamily: FI, fontSize: 10, color: t.free ? C_GREEN : 'rgba(255,255,255,0.28)', flexShrink: 0, marginLeft: 8 }}>
                    {t.free ? tf('toolFree') : t.price}
                  </span>
                </Link>
              ))}
              <Link href="/tools/bar-bending-schedule-calculator" className="footer-link"
                style={{ fontFamily: FI, fontSize: 14, textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {locale === 'hi' ? 'बार बेंडिंग शेड्यूल' : 'Bar Bending Schedule'}
                <span style={{ fontFamily: FI, fontSize: 10, color: C_GREEN, flexShrink: 0, marginLeft: 8 }}>
                  {tf('toolFree')}
                </span>
              </Link>
              <Link href="/tools/water-tank-size-calculator" className="footer-link"
                style={{ fontFamily: FI, fontSize: 14, textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {locale === 'hi' ? 'वॉटर टैंक साइज़' : 'Water Tank Size'}
                <span style={{ fontFamily: FI, fontSize: 10, color: C_GREEN, flexShrink: 0, marginLeft: 8 }}>
                  {tf('toolFree')}
                </span>
              </Link>
              <Link href="/tools/concrete-mix-ratio-calculator" className="footer-link"
                style={{ fontFamily: FI, fontSize: 14, textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {locale === 'hi' ? 'कंक्रीट मिक्स रेशियो' : 'Concrete Mix Ratio'}
                <span style={{ fontFamily: FI, fontSize: 10, color: C_GREEN, flexShrink: 0, marginLeft: 8 }}>
                  {tf('toolFree')}
                </span>
              </Link>
              <Link href="/tools/brick-calculator" className="footer-link"
                style={{ fontFamily: FI, fontSize: 14, textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {locale === 'hi' ? 'ईंट कैलकुलेटर' : 'Brick Calculator'}
                <span style={{ fontFamily: FI, fontSize: 10, color: C_GREEN, flexShrink: 0, marginLeft: 8 }}>
                  {tf('toolFree')}
                </span>
              </Link>
              <Link href="/tools/wire-size-calculator" className="footer-link"
                style={{ fontFamily: FI, fontSize: 14, textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {locale === 'hi' ? 'वायर साइज़' : 'Wire Size'}
                <span style={{ fontFamily: FI, fontSize: 10, color: C_GREEN, flexShrink: 0, marginLeft: 8 }}>
                  {tf('toolFree')}
                </span>
              </Link>
              <Link href="/tools/ra-bill-retention-tds-calculator" className="footer-link"
                style={{ fontFamily: FI, fontSize: 14, textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {locale === 'hi' ? 'आरए बिल (रिटेंशन, GST, TDS)' : 'RA Bill (Retention, GST, TDS)'}
                <span style={{ fontFamily: FI, fontSize: 10, color: C_GREEN, flexShrink: 0, marginLeft: 8 }}>
                  {tf('toolFree')}
                </span>
              </Link>
              <Link href="/tools/concrete-cube-test-calculator" className="footer-link"
                style={{ fontFamily: FI, fontSize: 14, textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {locale === 'hi' ? 'कंक्रीट क्यूब टेस्ट' : 'Concrete Cube Test'}
                <span style={{ fontFamily: FI, fontSize: 10, color: C_GREEN, flexShrink: 0, marginLeft: 8 }}>
                  {tf('toolFree')}
                </span>
              </Link>
              <Link href="/tools/daily-wage-pf-esi-calculator" className="footer-link"
                style={{ fontFamily: FI, fontSize: 14, textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {locale === 'hi' ? 'दैनिक मज़दूरी PF और ESI' : 'Daily-Wage PF & ESI'}
                <span style={{ fontFamily: FI, fontSize: 10, color: C_GREEN, flexShrink: 0, marginLeft: 8 }}>
                  {tf('toolFree')}
                </span>
              </Link>
              <Link href="/tools/finish-tier-cost-calculator" className="footer-link"
                style={{ fontFamily: FI, fontSize: 14, textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {locale === 'hi' ? 'फिनिश-टियर कॉस्ट अंतर' : 'Finish-Tier Cost Difference'}
                <span style={{ fontFamily: FI, fontSize: 10, color: C_GREEN, flexShrink: 0, marginLeft: 8 }}>
                  {tf('toolFree')}
                </span>
              </Link>
              <Link href="/tools/earned-value-calculator" className="footer-link"
                style={{ fontFamily: FI, fontSize: 14, textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {locale === 'hi' ? 'अर्नड वैल्यू (SPI, CPI, EAC)' : 'Earned Value (SPI, CPI, EAC)'}
                <span style={{ fontFamily: FI, fontSize: 10, color: C_GREEN, flexShrink: 0, marginLeft: 8 }}>
                  {tf('toolFree')}
                </span>
              </Link>
            </div>
          </div>

          <div className="footer-col-3d" style={{ padding: '28px 28px 32px', borderTop: `2px solid ${GOLD}`, borderRight: `1px solid ${BSub}` }}>
            <p style={{ fontFamily: FI, fontSize: 9, color: 'rgba(197,160,89,0.6)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>{tf('colTemplates')}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {footerTemplateLinks.map(([label, href]) => (
                <Link key={label} href={href} className="footer-link" style={{ fontFamily: FI, fontSize: 14, textDecoration: 'none', lineHeight: 1.35 }}>{label}</Link>
              ))}
            </div>
          </div>

          <div className="footer-col-3d" style={{ padding: '28px 28px 32px', borderTop: `2px solid ${GOLD}`, borderRight: `1px solid ${BSub}` }}>
            <p style={{ fontFamily: FI, fontSize: 9, color: 'rgba(197,160,89,0.6)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>{tf('colCompany')}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {footerCompanyLinks.map(([label, href]) => (
                <Link key={label} href={href} className="footer-link" style={{ fontFamily: FI, fontSize: 14, textDecoration: 'none' }}>{label}</Link>
              ))}
            </div>
          </div>

          <div className="footer-col-3d" style={{ padding: '28px 28px 32px', borderTop: `2px solid ${GOLD}` }}>
            <p style={{ fontFamily: FI, fontSize: 9, color: 'rgba(197,160,89,0.6)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>{tf('colLegal')}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {footerLegalLinks.map(([label, href]) => (
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
            {tf('note')}
          </p>
          <p style={{ fontFamily: FI, fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.04em' }}>
            &copy; {new Date().getFullYear()} NirmanShastra
          </p>
        </div>

      </footer>
    </main>
  )
}
