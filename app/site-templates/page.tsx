'use client'

import React, { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS — matte dark-mode system (matches homepage)
// ─────────────────────────────────────────────────────────────────────────────
const BG   = '#0A0A0A'
const SURF = '#171717'
const GOLD = '#C5A059'
const TP   = '#FFFFFF'
const TS   = '#A3A3A3'
const BSub = 'rgba(255,255,255,0.08)'
const FI   = 'var(--font-inter)'
const FP   = 'var(--font-playfair)'

// ─────────────────────────────────────────────────────────────────────────────
// CONTENT — six downloadable Excel toolkits (real content, verbatim)
// ─────────────────────────────────────────────────────────────────────────────
type Toolkit = {
  id: string
  title: string
  price: string
  sheetCount: number
  sheets: string
  description: string
  codesLabel: string
  codes: string[]
}

const TOOLKITS: Toolkit[] = [
  {
    id: 'cost-estimator',
    title: 'Residential Construction Cost Estimator',
    price: '₹1,499',
    sheetCount: 16,
    sheets:
      'Project Inputs, Area Statement, Rate Library, Rate Analysis, BOQ, Material Summary, Quality Tiers, Material Options, Quotation, Margin & Bid, Quote Comparison, Payment Schedule, Budget vs Actual, Change Orders, Cost Diagrams, Dashboard.',
    description:
      'Prices a house from IS-code first principles, generates a client quotation, compares up to 3 contractor quotes line by line, tracks budget against actual once the job starts.',
    codesLabel: 'Codes',
    codes: ['IS 456:2000', 'IS 1786:2008', 'IS 1077:1992', 'IS 2212', 'IS 1661:1972', 'IS 1893:2016'],
  },
  {
    id: 'documentation-pack',
    title: 'Construction Site Documentation Pack',
    price: '₹1,499',
    sheetCount: 14,
    sheets:
      'Project Info, Drawing Register, RFI Register & Form, Site Instructions, Inspection Requests, NCR Register, Test Register, Procurement Log, Daily Site Log, Snag List, Document Flow, Dashboard.',
    description:
      'Nine registers holding the proof of what happened on site — the contemporaneous record that holds up when a delay or defect is disputed.',
    codesLabel: 'Codes',
    codes: ['IS 516', 'IS 1786:2008', 'IS 3495', 'IS 4031', 'IS 383', 'IS 2386', 'IS 456:2000'],
  },
  {
    id: 'billing-measurement',
    title: 'Billing & Measurement',
    price: '₹1,499',
    sheetCount: 9,
    sheets:
      'Project & Contract, IS 1200 Deductions, BOQ & Rates, Measurement Book, Abstract, RA Bill, Payment Tracker, Dashboard.',
    description:
      'Takes measured work through the full Indian billing chain — joint measurement, abstract against BOQ, RA bill with retention/TDS/GST, payment tracking to close.',
    codesLabel: 'Codes',
    codes: ['IS 1200', 'CPWD Works Manual Ch. 26', 'Income-tax Act 2025 Section 393(1)'],
  },
  {
    id: 'bar-bending-schedule',
    title: 'Bar Bending Schedule',
    price: '₹1,499',
    sheetCount: 12,
    sheets:
      'Project & Standards, Shape Library, Shape Diagrams, Cutting Length Calc, Lap & Development, BBS, Bar Summary, Cutting Optimiser, Reconciliation, Order Note, Dashboard.',
    description:
      'Turns reinforcement details into a cutting-length schedule and steel order note, with every bend deduction and hook allowance applied per code.',
    codesLabel: 'Codes',
    codes: ['IS 2502:1963', 'IS 1786:2008', 'IS 456:2000', 'IS 13920:2016'],
  },
  {
    id: 'labour-compliance',
    title: 'Labour & Statutory Compliance',
    price: '₹1,499',
    sheetCount: 16,
    sheets:
      'Setup, Trade Rates, Worker Master, Muster Roll, Wage Register, Advance Ledger, Wage Slip, Payment Advice, Subcontractor Register & Bill, Contractor Compliance, Safety Register, Statutory Summary, Compliance Checklist, Dashboard.',
    description:
      "Runs site payroll end to end under India's current four Labour Codes (in force since Nov 2025) — PF, ESI, minimum wage checks, subcontractor compliance holds.",
    codesLabel: 'Codes',
    codes: [
      'Code on Wages 2019',
      'Code on Social Security 2020',
      'OSH & Working Conditions Code 2020',
      'Industrial Relations Code 2020',
    ],
  },
  {
    id: 'planning-progress',
    title: 'Planning, Progress & Delay Control',
    price: '₹1,499',
    sheetCount: 17,
    sheets:
      'Project & Baseline, Baseline Plan, Gantt Chart, Progress Update, S-Curve, Earned Value, Cash Flow, Lookahead, Milestones, Delay Register, EOT Claim, Variation Register, Monsoon Planner, Risk Register, Progress Report, Dashboard.',
    description:
      'Value-weighted S-curve and earned value tracking, plus a delay/EOT register that classifies events the way a contract actually does — with notice-deadline tracking.',
    codesLabel: 'Reference',
    codes: ['FIDIC Red/Yellow Books', 'Indian Contract Act 1872'],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// BUY BUTTON — UI only. On click, shows a "Coming soon" placeholder state.
// No payment logic is wired here (Razorpay wiring is a deliberate follow-up).
// ─────────────────────────────────────────────────────────────────────────────
function BuyButton({
  label,
  variant = 'card',
}: {
  label: string
  variant?: 'card' | 'bundle'
}) {
  const [comingSoon, setComingSoon] = useState(false)

  function handleClick() {
    if (comingSoon) return
    setComingSoon(true)
    setTimeout(() => setComingSoon(false), 2600)
  }

  const isBundle = variant === 'bundle'

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-live="polite"
      className="btn-3d"
      style={{
        fontFamily: FI,
        fontSize: isBundle ? 14 : 13,
        fontWeight: 600,
        letterSpacing: '0.02em',
        padding: isBundle ? '13px 26px' : '11px 22px',
        borderRadius: 2,
        cursor: comingSoon ? 'default' : 'pointer',
        whiteSpace: 'nowrap',
        border: comingSoon ? `1px solid ${BSub}` : '1px solid transparent',
        background: comingSoon ? 'transparent' : GOLD,
        color: comingSoon ? TS : '#000000',
        transition: 'background 0.2s ease, color 0.2s ease, border-color 0.2s ease',
      }}
    >
      {comingSoon ? 'Coming soon' : label}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CODE TAG
// ─────────────────────────────────────────────────────────────────────────────
function CodeTag({ code }: { code: string }) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-plex-mono)',
        fontSize: 10,
        color: TS,
        border: `1px solid ${BSub}`,
        borderRadius: 2,
        padding: '3px 7px',
        letterSpacing: '0.03em',
        whiteSpace: 'nowrap',
        lineHeight: 1.3,
      }}
    >
      {code}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOLKIT CARD
// ─────────────────────────────────────────────────────────────────────────────
function ToolkitCard({ kit, delay = 0 }: { kit: Toolkit; delay?: number }) {
  const prefersReducedMotion = useReducedMotion()
  const [isHover, setIsHover] = useState(false)

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 40, scale: 0.98 }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: prefersReducedMotion ? 0 : delay }}
    >
      <div
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        style={{
          transform: isHover && !prefersReducedMotion ? 'translateY(-6px)' : 'translateY(0)',
          boxShadow:
            isHover && !prefersReducedMotion
              ? '0 10px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(197,160,89,0.25)'
              : 'none',
          transition: 'transform 0.18s ease-out, box-shadow 0.18s ease-out',
          willChange: 'transform',
        }}
      >
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
            minHeight: 400,
            transition: 'border-color 0.18s ease',
          }}
        >
          {/* Sheet count badge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span
              style={{
                fontFamily: 'var(--font-plex-mono)',
                fontSize: 10,
                color: TS,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                border: `1px solid ${BSub}`,
                borderRadius: 2,
                padding: '4px 9px',
              }}
            >
              {kit.sheetCount} linked sheets
            </span>
            <span
              style={{
                fontFamily: FI,
                fontSize: 10,
                color: 'rgba(255,255,255,0.3)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Excel · .xlsx
            </span>
          </div>

          <div style={{ flex: 1 }}>
            <h3 style={{ fontFamily: FI, fontSize: 21, fontWeight: 600, color: TP, marginBottom: 12, lineHeight: 1.25 }}>
              {kit.title}
            </h3>
            <p style={{ fontFamily: FI, fontSize: 14.5, color: TS, lineHeight: 1.7, marginBottom: 16 }}>
              {kit.description}
            </p>

            {/* Codes as small tags */}
            <p
              style={{
                fontFamily: FI,
                fontSize: 10,
                color: 'rgba(255,255,255,0.3)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 8,
              }}
            >
              {kit.codesLabel}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {kit.codes.map(code => (
                <CodeTag key={code} code={code} />
              ))}
            </div>
          </div>

          {/* Price + Buy */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              paddingTop: 18,
              borderTop: `1px solid ${BSub}`,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-plex-mono)',
                fontSize: 22,
                fontWeight: 500,
                color: TP,
              }}
            >
              {kit.price}
            </span>
            <BuyButton label={`Buy — ${kit.price}`} />
          </div>
        </article>
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function SiteTemplatesPage() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <main className="sheet-frame" style={{ background: BG, minHeight: '100vh' }}>
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="px-6 md:px-16 lg:px-24 pt-20 pb-14" style={{ background: BG }}>
        <div style={{ maxWidth: 900 }}>
          <p
            style={{
              fontFamily: 'var(--font-plex-mono)',
              fontSize: 11,
              color: GOLD,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: 18,
            }}
          >
            Site Templates · 6 Excel Toolkits
          </p>
          <h1
            style={{
              fontFamily: FP,
              fontSize: 'clamp(38px,5vw,60px)',
              fontWeight: 700,
              color: TP,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              marginBottom: 22,
            }}
          >
            Downloadable Excel toolkits<br />for running the job on site.
          </h1>
          <p style={{ fontFamily: FI, fontSize: 17, color: TS, lineHeight: 1.7, maxWidth: 680 }}>
            Standalone spreadsheet packs — separate from the interactive calculators. Each is a set
            of linked sheets built to Indian standards and statutory practice: estimate, document,
            bill, schedule, comply, and control progress. Buy one, or take the full suite.
          </p>
        </div>
      </section>

      {/* ── FEATURED BUNDLE — Site Operations Suite ──────────────────────── */}
      <section className="px-6 md:px-16 lg:px-24 pb-16" style={{ background: BG }}>
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
          whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div
            className="bundle-strip-inner"
            style={{
              border: `1px solid ${GOLD}`,
              borderRadius: 2,
              padding: '40px 48px',
              background: SURF,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 28,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ flex: 1, minWidth: 260 }}>
              <p
                style={{
                  fontFamily: 'var(--font-plex-mono)',
                  fontSize: 10,
                  color: GOLD,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: 12,
                }}
              >
                The Bundle · All 6 Toolkits
              </p>
              <h2 style={{ fontFamily: FI, fontSize: 30, fontWeight: 600, color: TP, marginBottom: 12, lineHeight: 1.15 }}>
                Site Operations Suite
              </h2>
              <p style={{ fontFamily: FI, fontSize: 15, color: TS, lineHeight: 1.7, maxWidth: 560, marginBottom: 16 }}>
                Every toolkit on this page — estimating, documentation, billing, bar bending,
                labour compliance, and planning &amp; delay control — in one download.
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 15, color: TS, textDecoration: 'line-through' }}>
                  ₹8,994
                </span>
                <span
                  style={{
                    fontFamily: FI,
                    fontSize: 11,
                    color: GOLD,
                    border: `1px solid ${GOLD}`,
                    borderRadius: 2,
                    padding: '3px 9px',
                    letterSpacing: '0.04em',
                    fontWeight: 600,
                  }}
                >
                  SAVE ~22%
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 16 }}>
              <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 48, fontWeight: 500, color: TP, lineHeight: 1 }}>
                ₹6,999
              </span>
              <BuyButton label="Buy Bundle — ₹6,999" variant="bundle" />
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── INDIVIDUAL TOOLKITS ──────────────────────────────────────────── */}
      <section className="px-6 md:px-16 lg:px-24 pb-28" style={{ background: BG }}>
        <div className="flex items-center gap-4 mb-10">
          <div style={{ height: 1, flex: 1, background: BSub }} />
          <span
            style={{
              fontFamily: 'var(--font-plex-mono)',
              fontSize: 10,
              color: 'rgba(255,255,255,0.4)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            Or buy individually · ₹1,499 each
          </span>
          <div style={{ height: 1, flex: 1, background: BSub }} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {TOOLKITS.map((kit, i) => (
            <ToolkitCard key={kit.id} kit={kit} delay={i * 0.06} />
          ))}
        </div>

        <p
          style={{
            fontFamily: FI,
            fontSize: 12,
            color: 'rgba(255,255,255,0.32)',
            textAlign: 'center',
            marginTop: 32,
            lineHeight: 1.7,
          }}
        >
          Payments open soon. Toolkits are delivered as Excel (.xlsx) files after checkout.
        </p>
      </section>
    </main>
  )
}
