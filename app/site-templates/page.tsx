'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { PAYMENT_BYPASS } from '@/lib/payment-config'

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any
  }
}

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
// BUY BUTTON — triggers the real purchase flow (email capture → Razorpay → deliver).
// The click handler is owned by the page-level PurchaseController.
// ─────────────────────────────────────────────────────────────────────────────
function BuyButton({
  label,
  productId,
  onBuy,
  busy = false,
  variant = 'card',
}: {
  label: string
  productId: string
  onBuy: (productId: string) => void
  busy?: boolean
  variant?: 'card' | 'bundle'
}) {
  const isBundle = variant === 'bundle'

  return (
    <button
      type="button"
      onClick={() => { if (!busy) onBuy(productId) }}
      disabled={busy}
      aria-live="polite"
      className="btn-3d"
      style={{
        fontFamily: FI,
        fontSize: isBundle ? 14 : 13,
        fontWeight: 600,
        letterSpacing: '0.02em',
        padding: isBundle ? '13px 26px' : '11px 22px',
        borderRadius: 2,
        cursor: busy ? 'default' : 'pointer',
        whiteSpace: 'nowrap',
        border: busy ? `1px solid ${BSub}` : '1px solid transparent',
        background: busy ? 'transparent' : GOLD,
        color: busy ? TS : '#000000',
        transition: 'background 0.2s ease, color 0.2s ease, border-color 0.2s ease',
      }}
    >
      {busy ? 'Processing…' : label}
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
function ToolkitCard({
  kit,
  delay = 0,
  onBuy,
  busy = false,
}: {
  kit: Toolkit
  delay?: number
  onBuy: (productId: string) => void
  busy?: boolean
}) {
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
            <BuyButton label={`Buy — ${kit.price}`} productId={kit.id} onBuy={onBuy} busy={busy} />
          </div>
        </article>
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PURCHASE OVERLAY — email capture → processing → download links.
// Styled consistently with the paid-report unlock pattern (surface card, gold CTA).
// ─────────────────────────────────────────────────────────────────────────────
type Phase = 'idle' | 'email' | 'processing' | 'success' | 'error'
type Download = { title: string; url: string }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function PurchaseOverlay({
  phase,
  productTitle,
  email,
  setEmail,
  downloads,
  emailSent,
  error,
  onSubmitEmail,
  onClose,
}: {
  phase: Phase
  productTitle: string
  email: string
  setEmail: (v: string) => void
  downloads: Download[]
  emailSent: boolean
  error: string
  onSubmitEmail: () => void
  onClose: () => void
}) {
  if (phase === 'idle') return null

  const emailValid = EMAIL_RE.test(email.trim())

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={phase === 'processing' ? undefined : onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'rgba(0,0,0,0.72)',
        backdropFilter: 'blur(3px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 460,
          background: SURF,
          border: `1px solid ${GOLD}`,
          borderRadius: 2,
          padding: '32px 30px',
        }}
      >
        {/* ── EMAIL CAPTURE ── */}
        {phase === 'email' && (
          <>
            <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
              Checkout · Site Templates
            </p>
            <h3 style={{ fontFamily: FI, fontSize: 20, fontWeight: 600, color: TP, marginBottom: 8, lineHeight: 1.25 }}>
              {productTitle}
            </h3>
            <p style={{ fontFamily: FI, fontSize: 13.5, color: TS, lineHeight: 1.6, marginBottom: 20 }}>
              Enter your email. Your download link is shown here after payment and also emailed to you, so you have it even if you close this tab.
            </p>
            <label style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: TS, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Email address
            </label>
            <input
              type="email"
              value={email}
              autoFocus
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && emailValid) onSubmitEmail() }}
              placeholder="you@example.com"
              style={{
                width: '100%',
                marginTop: 6,
                marginBottom: 8,
                padding: '11px 13px',
                borderRadius: 6,
                background: BG,
                border: `1px solid ${BSub}`,
                color: TP,
                fontFamily: FI,
                fontSize: 14,
                outline: 'none',
              }}
            />
            {error && (
              <p style={{ fontFamily: FI, fontSize: 12, color: '#E0704E', marginBottom: 8 }}>{error}</p>
            )}
            <button
              type="button"
              onClick={onSubmitEmail}
              disabled={!emailValid}
              className="btn-3d"
              style={{
                width: '100%',
                marginTop: 12,
                padding: '13px 22px',
                borderRadius: 2,
                fontFamily: FI,
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: '0.02em',
                border: '1px solid transparent',
                background: emailValid ? GOLD : 'transparent',
                color: emailValid ? '#000' : TS,
                cursor: emailValid ? 'pointer' : 'default',
              }}
            >
              {PAYMENT_BYPASS ? 'Get download (preview mode)' : 'Continue to payment'}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{ width: '100%', marginTop: 10, padding: 8, background: 'none', border: 'none', color: TS, fontFamily: FI, fontSize: 12, cursor: 'pointer' }}
            >
              Cancel
            </button>
          </>
        )}

        {/* ── PROCESSING ── */}
        {phase === 'processing' && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
              Verifying payment
            </p>
            <p style={{ fontFamily: FI, fontSize: 14, color: TS, lineHeight: 1.6 }}>
              Confirming your payment and preparing your secure download link…
            </p>
          </div>
        )}

        {/* ── SUCCESS — DOWNLOAD LINKS ── */}
        {phase === 'success' && (
          <>
            <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
              Payment confirmed
            </p>
            <h3 style={{ fontFamily: FI, fontSize: 20, fontWeight: 600, color: TP, marginBottom: 8, lineHeight: 1.25 }}>
              Your toolkit{downloads.length > 1 ? 's are' : ' is'} ready
            </h3>
            <p style={{ fontFamily: FI, fontSize: 13.5, color: TS, lineHeight: 1.6, marginBottom: 18 }}>
              {emailSent
                ? `We've also emailed ${downloads.length > 1 ? 'these links' : 'this link'} to ${email}. `
                : ''}
              Links are secure and expire in 48 hours — save the file{downloads.length > 1 ? 's' : ''} after downloading.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 8 }}>
              {downloads.map((d) => (
                <a
                  key={d.url}
                  href={d.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '13px 16px',
                    borderRadius: 2,
                    border: `1px solid ${GOLD}`,
                    background: 'rgba(197,160,89,0.08)',
                    textDecoration: 'none',
                  }}
                >
                  <span style={{ fontFamily: FI, fontSize: 13.5, color: TP, fontWeight: 500 }}>{d.title}</span>
                  <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: GOLD, whiteSpace: 'nowrap' }}>Download .zip ↓</span>
                </a>
              ))}
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{ width: '100%', marginTop: 14, padding: 8, background: 'none', border: 'none', color: TS, fontFamily: FI, fontSize: 12, cursor: 'pointer' }}
            >
              Done
            </button>
          </>
        )}

        {/* ── ERROR ── */}
        {phase === 'error' && (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: '#E0704E', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
              Something went wrong
            </p>
            <p style={{ fontFamily: FI, fontSize: 14, color: TS, lineHeight: 1.6, marginBottom: 18 }}>
              {error || 'Your payment could not be completed. If money was deducted it will be refunded automatically.'}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="btn-3d"
              style={{ padding: '11px 26px', borderRadius: 2, fontFamily: FI, fontSize: 13, fontWeight: 600, background: GOLD, color: '#000', border: '1px solid transparent', cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function SiteTemplatesPage() {
  const prefersReducedMotion = useReducedMotion()

  // ── Purchase state machine ──
  const [phase, setPhase] = useState<Phase>('idle')
  const [activeProduct, setActiveProduct] = useState<string>('')
  const [email, setEmail] = useState('')
  const [downloads, setDownloads] = useState<Download[]>([])
  const [emailSent, setEmailSent] = useState(false)
  const [error, setError] = useState('')

  const activeTitle =
    activeProduct === 'bundle'
      ? 'Site Operations Suite — All 6 Toolkits'
      : TOOLKITS.find((t) => t.id === activeProduct)?.title ?? 'Toolkit'

  // Load Razorpay checkout script once
  useEffect(() => {
    if (PAYMENT_BYPASS) return
    if (document.querySelector('script[src*="checkout.razorpay.com"]')) return
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)
  }, [])

  const onBuy = useCallback((productId: string) => {
    setActiveProduct(productId)
    setEmail('')
    setError('')
    setDownloads([])
    setEmailSent(false)
    setPhase('email')
  }, [])

  const onClose = useCallback(() => {
    setPhase('idle')
    setError('')
  }, [])

  async function deliver(payload: Record<string, unknown>) {
    const vRes = await fetch('/api/site-templates/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const vJson = await vRes.json()
    if (!vRes.ok || !vJson.success) throw new Error(vJson.error || 'Verification failed')
    setDownloads(vJson.downloads || [])
    setEmailSent(!!vJson.emailSent)
    setPhase('success')
  }

  const onSubmitEmail = useCallback(async () => {
    const cleanEmail = email.trim()
    if (!EMAIL_RE.test(cleanEmail)) {
      setError('Please enter a valid email address.')
      return
    }
    setError('')
    setPhase('processing')

    try {
      // Preview / bypass mode — skip Razorpay entirely.
      if (PAYMENT_BYPASS) {
        await deliver({ productId: activeProduct, email: cleanEmail })
        return
      }

      // 1. Create the order server-side (amount is derived server-side).
      const res = await fetch('/api/site-templates/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: activeProduct, email: cleanEmail }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Could not create order')

      if (!window.Razorpay) {
        throw new Error('Payment SDK not loaded. Please refresh and try again.')
      }

      // 2. Open Razorpay checkout with the Key ID only.
      const options = {
        key: json.keyId,
        amount: json.amount,
        currency: json.currency || 'INR',
        name: 'NirmanShastra',
        description: `Site Templates — ${activeTitle}`,
        order_id: json.orderId,
        prefill: { email: cleanEmail },
        notes: { productId: activeProduct },
        theme: { color: '#C5A059' },
        handler: async (response: {
          razorpay_order_id: string
          razorpay_payment_id: string
          razorpay_signature: string
        }) => {
          setPhase('processing')
          try {
            await deliver({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              email: cleanEmail,
            })
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Payment verification failed.')
            setPhase('error')
          }
        },
        modal: {
          ondismiss: () => {
            // Return to the email step so the user can retry.
            setError('Payment was not completed. You can try again.')
            setPhase('email')
          },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setPhase('error')
    }
  }, [email, activeProduct, activeTitle])

  const busy = phase === 'processing'

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
              <BuyButton label="Buy Bundle — ₹6,999" productId="bundle" onBuy={onBuy} busy={busy} variant="bundle" />
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
            <ToolkitCard key={kit.id} kit={kit} delay={i * 0.06} onBuy={onBuy} busy={busy} />
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
          Secure payment by Razorpay. Toolkits are delivered as Excel (.xlsx) files, packaged as
          a .zip, via a secure download link shown here and emailed to you after checkout.
        </p>
      </section>

      <PurchaseOverlay
        phase={phase}
        productTitle={activeTitle}
        email={email}
        setEmail={setEmail}
        downloads={downloads}
        emailSent={emailSent}
        error={error}
        onSubmitEmail={onSubmitEmail}
        onClose={onClose}
      />
    </main>
  )
}
