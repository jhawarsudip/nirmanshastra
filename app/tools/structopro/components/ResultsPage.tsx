'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { animate } from 'framer-motion'
import { type StructoResult, type StructoInput, formatLakhs } from '../structopro-engine'

function CountUp({ to, format }: { to: number; format: (n: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const controls = animate(0, to, {
      duration: 1.1,
      ease: 'easeOut',
      onUpdate(v) { if (ref.current) ref.current.textContent = format(v) },
    })
    return controls.stop
  }, [to, format])
  return <span ref={ref}>{format(0)}</span>
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any
  }
}

interface Props {
  result: StructoResult
  input: StructoInput
  estimateId: string | null
  contactName: string
  onStartOver: () => void
}

type PayStatus = 'idle' | 'creating' | 'open' | 'verifying' | 'polling' | 'paid' | 'error'
type PdfStatus = 'idle' | 'generating' | 'ready' | 'error'

function StampBadge({ status, clause, description }: { status: 'pass' | 'advisory' | 'fail'; clause: string; description: string }) {
  const colours = {
    pass:     { border: '#14532D', text: '#14532D', bg: 'rgba(20,83,45,0.04)', label: 'PASS' },
    advisory: { border: '#D99A06', text: '#D99A06', bg: 'rgba(217,154,6,0.06)', label: 'ADVISORY' },
    fail:     { border: '#8C3A22', text: '#8C3A22', bg: 'rgba(140,58,34,0.05)', label: 'FAIL' },
  }
  const c = colours[status]
  return (
    <div
      className="flex items-start gap-3 p-3 rounded-[2px]"
      style={{ border: `1px solid ${c.border}22`, background: c.bg }}
    >
      {/* Stamp */}
      <div
        className="shrink-0 mt-0.5"
        style={{
          border: `1.5px double ${c.border}`,
          borderRadius: 1,
          padding: '1px 5px',
          transform: 'rotate(-2deg)',
          fontSize: 9,
          fontFamily: 'var(--font-plex-mono)',
          fontWeight: 600,
          color: c.text,
          letterSpacing: '0.06em',
          whiteSpace: 'nowrap',
        }}
      >
        {c.label}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium" style={{ color: c.text, fontFamily: 'var(--font-plex-mono)' }}>
          {clause}
        </p>
        <p className="text-[12px]" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>
          {description}
        </p>
      </div>
    </div>
  )
}

function BlurOverlay({ onClick }: { onClick: () => void }) {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center rounded-[2px] z-10"
      style={{ background: 'rgba(244,244,240,0.85)', backdropFilter: 'blur(2px)' }}
    >
      <div
        className="text-center px-6 py-5 rounded-[2px] max-w-sm"
        style={{ border: '1px solid rgba(30,34,39,0.15)', background: '#F4F4F0' }}
      >
        <p
          className="text-[11px] uppercase tracking-widest mb-1"
          style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}
        >
          ₹499 · UNLOCK TO VIEW
        </p>
        <p className="text-[13px] mb-3" style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-sans)' }}>
          Exact quantities, itemised costs, and contractor comparison
        </p>
        <button
          onClick={onClick}
          className="px-4 py-2 rounded-[6px] text-[13px] font-semibold text-white"
          style={{ background: '#8C3A22', fontFamily: 'var(--font-plex-sans)' }}
        >
          Unlock Now ₹499
        </button>
      </div>
    </div>
  )
}

export default function ResultsPage({ result, input, estimateId, contactName, onStartOver }: Props) {
  const [payStatus, setPayStatus]   = useState<PayStatus>('idle')
  const [payError, setPayError]     = useState('')
  const [isPaid, setIsPaid]         = useState(false)
  const [orderId, setOrderId]       = useState<string | null>(null)
  const pollRef                     = useRef<ReturnType<typeof setInterval> | null>(null)
  const [pdfStatus, setPdfStatus]   = useState<PdfStatus>('idle')
  const [pdfUrl, setPdfUrl]         = useState<string | null>(null)

  // Load Razorpay checkout script
  useEffect(() => {
    if (document.querySelector('script[src*="checkout.razorpay.com"]')) return
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)
  }, [])

  // Poll payment status
  useEffect(() => {
    if (!orderId || payStatus !== 'polling') return
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/status/${orderId}`)
        const json = await res.json()
        if (json.status === 'success') {
          clearInterval(pollRef.current!)
          setIsPaid(true)
          setPayStatus('paid')
        } else if (json.status === 'failed') {
          clearInterval(pollRef.current!)
          setPayStatus('error')
          setPayError('Payment failed. Please try again.')
        }
      } catch { /* ignore transient errors */ }
    }, 2000)
    return () => clearInterval(pollRef.current!)
  }, [orderId, payStatus])

  // PDF generation — extracted so retry button can call it directly
  const generatePdf = useCallback(async () => {
    if (!estimateId) return
    setPdfStatus('generating')
    try {
      // Check if PDF already exists (idempotent — avoids re-generation on re-render)
      const getRes = await fetch(`/api/structopro/generate-pdf?estimateId=${estimateId}`)
      const getJson = await getRes.json()
      if (getJson.pdfUrl) {
        setPdfUrl(getJson.pdfUrl)
        setPdfStatus('ready')
        return
      }
      // Generate fresh PDF
      const postRes = await fetch('/api/structopro/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estimateId }),
      })
      const postJson = await postRes.json()
      if (postJson.pdfUrl) {
        setPdfUrl(postJson.pdfUrl)
        setPdfStatus('ready')
      } else {
        setPdfStatus('error')
      }
    } catch {
      setPdfStatus('error')
    }
  }, [estimateId])

  // Trigger PDF generation after payment confirmed
  useEffect(() => {
    if (isPaid) generatePdf()
  }, [isPaid, generatePdf])

  async function handleUnlock() {
    if (!estimateId) {
      setPayError('Estimate not saved yet. Please wait a moment and try again.')
      return
    }
    setPayStatus('creating')
    setPayError('')
    try {
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estimateId, amount: 49900 }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Could not create order')

      setOrderId(json.orderId)
      setPayStatus('open')

      const options = {
        key:         json.keyId,
        amount:      json.amount,
        currency:    json.currency || 'INR',
        name:        'NirmanShastra',
        description: 'StructoPro Report — Phase 1 RCC Structure',
        order_id:    json.orderId,
        prefill: {
          name:    contactName,
          contact: input.state,
        },
        notes: { estimateId },
        theme: { color: '#1F4E79' },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          setPayStatus('verifying')
          try {
            const vRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpayOrderId:   response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                estimateId,
              }),
            })
            const vJson = await vRes.json()
            if (!vRes.ok) throw new Error(vJson.error || 'Verification failed')
            setPayStatus('polling')
          } catch (err) {
            setPayStatus('error')
            setPayError(err instanceof Error ? err.message : 'Payment verification failed.')
          }
        },
        modal: {
          ondismiss: () => {
            if (payStatus === 'open') setPayStatus('idle')
          },
        },
      }

      if (!window.Razorpay) {
        throw new Error('Payment SDK not loaded. Please refresh and try again.')
      }
      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      setPayStatus('error')
      setPayError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    }
  }

  const r = result
  const totalBUA = r.totalBUA

  // ---------- render ----------
  return (
    <div className="min-h-screen bg-sheet-white pb-16">
      {/* Page header */}
      <div className="px-4 py-4" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
              NIRMANSHASTRA · STRUCTOPRO
            </p>
            <h1 className="text-[22px] font-bold" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-serif)' }}>
              Your Estimate is Ready
            </h1>
          </div>
          {/* Step bar */}
          <div className="flex items-center">
            {(['REG', 'METHOD', 'DETAILS', 'RESULTS'] as const).map((step, i) => (
              <div key={step} className="flex items-center">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] border"
                    style={{
                      background: i < 4 ? '#14532D' : 'transparent',
                      borderColor: i < 4 ? '#14532D' : 'rgba(30,34,39,0.22)',
                      color: '#fff',
                      fontFamily: 'var(--font-plex-mono)',
                    }}
                  >
                    ✓
                  </div>
                  <span className="text-[10px] uppercase tracking-widest hidden sm:inline" style={{ fontFamily: 'var(--font-plex-mono)', color: '#14532D' }}>
                    {step}
                  </span>
                </div>
                {i < 3 && <div className="w-5 h-px mx-1.5" style={{ background: 'rgba(30,34,39,0.14)' }} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-6 space-y-6">

        {/* Test mode banner */}
        <div
          className="px-4 py-2 rounded-[2px] flex items-center gap-2"
          style={{ background: 'rgba(217,154,6,0.1)', border: '1px solid rgba(217,154,6,0.4)' }}
        >
          <span style={{ color: '#D99A06', fontSize: 13 }}>⚠</span>
          <p className="text-[12px]" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)' }}>
            TEST MODE — Razorpay sandbox. No real money charged. Use test card 4111 1111 1111 1111.
          </p>
        </div>

        {/* ── GRAND TOTAL — FREE, ALWAYS VISIBLE ── */}
        <div
          className="rounded-[2px] p-6"
          style={{ border: '2px solid #1E2227', background: '#F4F4F0' }}
        >
          <p
            className="text-[11px] uppercase tracking-widest mb-2"
            style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}
          >
            PHASE 1 — RCC STRUCTURE · {input.city}, {input.state}
          </p>
          <p
            className="text-[13px] mb-1"
            style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-sans)' }}
          >
            Your Structure Cost (IS 456:2000 — {input.concreteGrade} · {input.steelGrade})
          </p>

          {/* Grand Total range — THE HOOK */}
          <div className="flex flex-wrap items-baseline gap-3 mb-4">
            <span
              className="text-[40px] sm:text-[52px] font-bold leading-none"
              style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)' }}
            >
              <CountUp to={r.grandTotal.standard} format={formatLakhs} />
            </span>
            <span
              className="text-[16px]"
              style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}
            >
              standard
            </span>
          </div>

          {/* Range strip */}
          <div className="flex gap-4 flex-wrap">
            {[
              { label: 'BASIC',    value: r.grandTotal.basic,    note: 'Min spec + local labour' },
              { label: 'STANDARD', value: r.grandTotal.standard, note: 'CPWD rates + overhead', active: true },
              { label: 'PREMIUM',  value: r.grandTotal.premium,  note: 'Premium labour + oversight' },
            ].map(t => (
              <div
                key={t.label}
                className="flex-1 min-w-[100px] px-3 py-2 rounded-[2px]"
                style={{
                  border: t.active ? '1.5px solid #1F4E79' : '1px solid rgba(30,34,39,0.18)',
                  background: t.active ? 'rgba(31,78,121,0.05)' : 'transparent',
                }}
              >
                <p className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: t.active ? '#1F4E79' : 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
                  {t.label}
                </p>
                <p className="text-[18px] font-bold" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)' }}>
                  {formatLakhs(t.value)}
                </p>
                <p className="text-[10px]" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-sans)' }}>
                  {t.note}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>
                  ₹{r.perSqftCost[t.label.toLowerCase() as 'basic' | 'standard' | 'premium']}/sqft
                </p>
              </div>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-3 text-[11px]" style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
            <span>BUA {totalBUA.toLocaleString('en-IN')} sqft</span>
            <span>·</span>
            <span>Zone {r.seismicZone} · Z={r.zFactor}</span>
            <span>·</span>
            <span>{r.foundationRecommendation.label}</span>
          </div>
        </div>

        {/* ── IS COMPLIANCE PANEL — FREE ── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.18)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.1)' }}>
            <p className="text-[11px] uppercase tracking-widest" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              IS COMPLIANCE PANEL — IS 456:2000 · IS 13920:2016 · IS 1904:2016
            </p>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {r.compliance.map(check => (
              <StampBadge
                key={check.id}
                status={check.status}
                clause={check.clause}
                description={check.detail}
              />
            ))}
          </div>
        </div>

        {/* ── GRADE COMPARISON — FREE ── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.18)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.1)' }}>
            <p className="text-[11px] uppercase tracking-widest" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              CONCRETE GRADE COMPARISON — COST IMPACT
            </p>
          </div>
          <div className="p-4 space-y-3">
            {r.gradeSummary.map(g => {
              const maxCost = r.gradeSummary[r.gradeSummary.length - 1].costPerSqft
              const pct = Math.round((g.costPerSqft / maxCost) * 100)
              const isSelected = g.grade === input.concreteGrade
              return (
                <div key={g.grade}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[12px] font-medium"
                        style={{ fontFamily: 'var(--font-plex-mono)', color: isSelected ? '#1F4E79' : '#1E2227' }}
                      >
                        {g.grade}
                      </span>
                      <span className="text-[11px]" style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-sans)' }}>
                        {g.label}
                      </span>
                      {isSelected && (
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded-[2px]"
                          style={{ background: '#1F4E79', color: '#fff', fontFamily: 'var(--font-plex-mono)' }}
                        >
                          SELECTED
                        </span>
                      )}
                    </div>
                    <span className="text-[12px]" style={{ fontFamily: 'var(--font-plex-mono)', color: '#1E2227' }}>
                      ₹{g.costPerSqft}/sqft
                    </span>
                  </div>
                  <div className="h-2 rounded-[1px] bg-iron-ink/5 overflow-hidden">
                    <div
                      className="h-full rounded-[1px]"
                      style={{
                        width: `${pct}%`,
                        background: isSelected ? '#1F4E79' : 'rgba(30,34,39,0.2)',
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── FINISHING COSTS GUIDE — FREE ── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.18)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.1)' }}>
            <p className="text-[11px] uppercase tracking-widest" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              FINISHING COSTS GUIDE — NOT INCLUDED IN THIS REPORT
            </p>
          </div>
          <div className="p-4">
            <p className="text-[13px] mb-3" style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-sans)' }}>
              The RCC structural frame is only <strong>40–45%</strong> of your total building cost. Budget separately for:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                ['Brickwork + Masonry',  '20–25%'],
                ['Plaster + WP',         '8–10%'],
                ['Flooring',             '10–15%'],
                ['Doors + Windows',      '8–12%'],
                ['Electrical',           '8–12%'],
                ['Plumbing',             '6–10%'],
                ['Paint',                '4–6%'],
                ['False ceiling + Carp.','5–10%'],
                ['Contractor overhead',  '10–15%'],
              ].map(([name, pct]) => (
                <div
                  key={name}
                  className="flex items-center justify-between px-2 py-1.5 rounded-[2px]"
                  style={{ border: '1px solid rgba(30,34,39,0.1)', background: 'rgba(30,34,39,0.02)' }}
                >
                  <span className="text-[11px]" style={{ color: 'rgba(30,34,39,0.65)', fontFamily: 'var(--font-plex-sans)' }}>{name}</span>
                  <span className="text-[11px] font-medium" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>{pct}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { label: 'BASIC FINISH',    mult: '1.8–2.0×' },
                { label: 'STANDARD FINISH', mult: '2.2–2.5×' },
                { label: 'PREMIUM FINISH',  mult: '2.8–3.2×' },
              ].map(t => (
                <div key={t.label} className="text-center px-2 py-2 rounded-[2px]" style={{ border: '1px solid rgba(30,34,39,0.15)', background: 'rgba(31,78,121,0.04)' }}>
                  <p className="text-[9px] uppercase tracking-widest" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>{t.label}</p>
                  <p className="text-[16px] font-bold" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>{t.mult}</p>
                  <p className="text-[10px]" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-sans)' }}>of structure cost</p>
                </div>
              ))}
            </div>
            <p className="text-[11px] mt-3" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-sans)' }}>
              Do not approach your bank with the structural estimate alone. Use the full project estimate.
            </p>
          </div>
        </div>

        {/* ── TECHNICAL REMINDERS — FREE ── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.18)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.1)' }}>
            <p className="text-[11px] uppercase tracking-widest" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              10 TECHNICAL REMINDERS — IS-CODE MANDATED
            </p>
          </div>
          <ol className="p-4 space-y-2">
            {r.technicalReminders.map((rem, i) => (
              <li key={i} className="flex gap-3 text-[13px]" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>
                <span
                  className="shrink-0 mt-0.5 text-[11px] w-5 text-right"
                  style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span>{rem}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* ── BOQ SECTION ── */}
        <div className="border rounded-[2px] overflow-hidden" style={{ borderColor: 'rgba(30,34,39,0.18)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.1)' }}>
            <p className="text-[11px] uppercase tracking-widest" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              {isPaid ? 'FULL IS-CODE BOQ — PHASE 1 · RCC STRUCTURE' : 'MATERIAL QUANTITIES — PREVIEW'}
            </p>
          </div>

          <div className="p-4">
            {/* Table header */}
            <table className="w-full text-[13px]" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #1E2227', background: 'rgba(30,34,39,0.04)' }}>
                  {isPaid && <th className="text-left py-2 px-1 text-[9px] uppercase tracking-widest" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)', width: 44 }}>Item No.</th>}
                  <th className="text-left py-2 text-[9px] uppercase tracking-widest" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>Description</th>
                  <th className="text-right py-2 text-[9px] uppercase tracking-widest" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)', width: 44 }}>Unit</th>
                  <th className="text-right py-2 text-[9px] uppercase tracking-widest" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)', width: 70 }}>Qty</th>
                  {isPaid && <th className="text-right py-2 text-[9px] uppercase tracking-widest" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)', width: 70 }}>Rate (₹)</th>}
                  <th className="text-right py-2 text-[9px] uppercase tracking-widest" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)', width: 90 }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {/* ── PROOF-OF-WORK: first 2 rows always visible ── */}
                {[
                  { itemNo: '1.1', name: `Cement — ${input.concreteGrade}`, unit: 'bags', qty: r.quantities.cementBags, cost: r.costs.cement },
                  { itemNo: '1.2', name: `TMT Steel — ${input.steelGrade}`, unit: 'kg',   qty: r.quantities.steelKg,   cost: r.costs.steel },
                ].map((row, i) => (
                  <tr key={row.itemNo} style={{ borderBottom: '1px solid rgba(30,34,39,0.08)', background: i % 2 ? 'rgba(30,34,39,0.018)' : 'transparent' }}>
                    {isPaid && <td className="py-2 px-1" style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)', fontSize: 11 }}>{row.itemNo}</td>}
                    <td className="py-2" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)', fontSize: 13 }}>{row.name}</td>
                    <td className="py-2 text-right" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)', fontSize: 12 }}>{row.unit}</td>
                    <td className="py-2 text-right" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)', fontSize: 13, fontWeight: 500 }}>{row.qty.toLocaleString('en-IN')}</td>
                    {isPaid && <td className="py-2 text-right" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)', fontSize: 12 }}>{Math.round(row.cost / row.qty).toLocaleString('en-IN')}</td>}
                    <td className="py-2 text-right" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)', fontSize: 13 }}>{isPaid ? row.cost.toLocaleString('en-IN') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ── Remaining rows: blurred until paid ── */}
            {!isPaid ? (
              <div style={{ position: 'relative', marginTop: 0 }}>
                {/* Blurred preview of remaining rows */}
                <div style={{ filter: 'blur(5px)', userSelect: 'none', pointerEvents: 'none' }}>
                  <table className="w-full text-[13px]" style={{ borderCollapse: 'collapse' }}>
                    <tbody>
                      {[
                        { name: 'Coarse Aggregate (20mm)', unit: 'cft',  qty: r.quantities.aggregateCft },
                        { name: 'Sand (River/M-Sand)',      unit: 'cft',  qty: r.quantities.sandCft },
                        { name: 'Binding Wire (GI)',        unit: 'kg',   qty: r.quantities.bindingWireKg },
                        { name: 'Formwork (shuttering)',    unit: 'sqft', qty: r.quantities.formworkSqft },
                        { name: `Foundation (${r.foundationRecommendation.label})`, unit: 'lump', qty: 1 },
                      ].map((row, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(30,34,39,0.06)', background: i % 2 ? 'rgba(30,34,39,0.018)' : 'transparent' }}>
                          <td className="py-2" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)', fontSize: 13 }}>{row.name}</td>
                          <td className="py-2 text-right" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)', fontSize: 12 }}>{row.unit}</td>
                          <td className="py-2 text-right" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)', fontSize: 13 }}>{row.qty.toLocaleString('en-IN')}</td>
                          <td className="py-2 text-right" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)', fontSize: 13 }}>—</td>
                        </tr>
                      ))}
                      <tr style={{ borderTop: '2px solid #1F4E79', background: 'rgba(31,78,121,0.05)' }}>
                        <td colSpan={3} className="py-2 font-bold text-[14px]" style={{ fontFamily: 'var(--font-plex-sans)', color: '#1F4E79' }}>TOTAL STANDARD ESTIMATE</td>
                        <td className="py-2 text-right font-bold text-[16px]" style={{ fontFamily: 'var(--font-plex-mono)', color: '#1F4E79' }}>{r.grandTotal.standard.toLocaleString('en-IN')}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {/* Glassmorphism lock overlay */}
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(244,244,240,0.72)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: 'rgba(30,34,39,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    4 more items + labour + total locked
                  </p>
                  <button
                    onClick={handleUnlock}
                    style={{ background: '#8C3A22', color: '#F4F4F0', fontFamily: 'var(--font-plex-mono)', fontSize: 12, padding: '8px 18px', borderRadius: 6, border: 'none', cursor: 'pointer', letterSpacing: '0.03em' }}
                  >
                    Unlock Full BOQ — ₹499
                  </button>
                </div>
              </div>
            ) : (
              /* Post-payment: full professional BOQ */
              <table className="w-full text-[13px] mt-0" style={{ borderCollapse: 'collapse' }}>
                <tbody>
                  {[
                    { itemNo: '1.3', name: 'Coarse Aggregate (20mm)',           unit: 'cft',  qty: r.quantities.aggregateCft,  cost: r.costs.aggregate },
                    { itemNo: '1.4', name: 'Sand (River/M-Sand)',               unit: 'cft',  qty: r.quantities.sandCft,       cost: r.costs.sand },
                    { itemNo: '1.5', name: 'Binding Wire (GI)',                 unit: 'kg',   qty: r.quantities.bindingWireKg, cost: r.costs.bindingWire },
                    { itemNo: '1.6', name: 'Formwork (wooden/steel shuttering)',unit: 'sqft', qty: r.quantities.formworkSqft,  cost: r.costs.formwork },
                  ].map((row, i) => (
                    <tr key={row.itemNo} style={{ borderBottom: '1px solid rgba(30,34,39,0.08)', background: i % 2 ? 'rgba(30,34,39,0.018)' : 'transparent' }}>
                      <td className="py-2 px-1" style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)', fontSize: 11, width: 44 }}>{row.itemNo}</td>
                      <td className="py-2" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)', fontSize: 13 }}>{row.name}</td>
                      <td className="py-2 text-right" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)', fontSize: 12, width: 44 }}>{row.unit}</td>
                      <td className="py-2 text-right" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)', fontSize: 13, width: 70 }}>{row.qty.toLocaleString('en-IN')}</td>
                      <td className="py-2 text-right" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)', fontSize: 12, width: 70 }}>{Math.round(row.cost / Math.max(row.qty, 1)).toLocaleString('en-IN')}</td>
                      <td className="py-2 text-right" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)', fontSize: 13, width: 90 }}>{row.cost.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: '1px solid rgba(30,34,39,0.15)' }}>
                    <td className="py-2 px-1" style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)', fontSize: 11 }}>1.7</td>
                    <td colSpan={3} className="py-2" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)', fontSize: 13 }}>Foundation ({r.foundationRecommendation.label})</td>
                    <td className="py-2 text-right" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)', fontSize: 12 }}>lump</td>
                    <td className="py-2 text-right" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)', fontSize: 13 }}>{r.costs.foundation.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr style={{ borderTop: '2px solid #1E2227', background: 'rgba(30,34,39,0.03)' }}>
                    <td colSpan={5} className="py-2 font-semibold text-[12px]" style={{ fontFamily: 'var(--font-plex-sans)', color: '#1E2227' }}>Total Material Cost</td>
                    <td className="py-2 text-right font-bold text-[14px]" style={{ fontFamily: 'var(--font-plex-mono)', color: '#1E2227' }}>{r.costs.total.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td colSpan={5} className="py-1.5 text-[12px]" style={{ fontFamily: 'var(--font-plex-sans)', color: 'rgba(30,34,39,0.5)' }}>Labour — CPWD standard rates</td>
                    <td className="py-1.5 text-right text-[12px]" style={{ fontFamily: 'var(--font-plex-mono)', color: 'rgba(30,34,39,0.5)' }}>{r.labourCost.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td colSpan={5} className="py-1.5 text-[12px]" style={{ fontFamily: 'var(--font-plex-sans)', color: 'rgba(30,34,39,0.5)' }}>Contractor overhead + margin (10%)</td>
                    <td className="py-1.5 text-right text-[12px]" style={{ fontFamily: 'var(--font-plex-mono)', color: 'rgba(30,34,39,0.5)' }}>{r.overheadCost.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr style={{ borderTop: '2px solid #1F4E79', background: 'rgba(31,78,121,0.06)' }}>
                    <td colSpan={5} className="py-2 font-bold text-[14px]" style={{ fontFamily: 'var(--font-plex-sans)', color: '#1F4E79' }}>TOTAL STANDARD ESTIMATE</td>
                    <td className="py-2 text-right font-bold text-[16px]" style={{ fontFamily: 'var(--font-plex-mono)', color: '#1F4E79' }}>{r.grandTotal.standard.toLocaleString('en-IN')}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ── PAYMENT GATE ── */}
        {!isPaid && (
          <div
            className="rounded-[2px] p-6"
            style={{ border: '2px solid #1E2227', background: '#F4F4F0' }}
          >
            <p
              className="text-[11px] uppercase tracking-widest mb-1"
              style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}
            >
              YOUR PHASE 1 ESTIMATE IS READY
            </p>
            <h2
              className="text-[20px] font-bold mb-2"
              style={{ color: '#1E2227', fontFamily: 'var(--font-plex-serif)' }}
            >
              Unlock Full IS-Code BOQ + Professional PDF
            </h2>
            <p
              className="text-[13px] mb-4"
              style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-sans)' }}
            >
              Includes exact quantities, local market rates, and contractor-ready BOQ
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-3">
              <button
                onClick={handleUnlock}
                disabled={payStatus === 'creating' || payStatus === 'verifying' || payStatus === 'polling'}
                className="flex-1 py-3 rounded-[6px] text-[15px] font-semibold text-white disabled:opacity-60 transition-opacity"
                style={{ background: '#8C3A22', fontFamily: 'var(--font-plex-sans)' }}
              >
                {payStatus === 'creating'  ? 'Creating order…' :
                 payStatus === 'verifying' ? 'Verifying payment…' :
                 payStatus === 'polling'   ? 'Confirming payment…' :
                 'Unlock Full IS-Code BOQ + Professional PDF — ₹499'}
              </button>
              <div
                className="flex-1 py-3 px-4 rounded-[6px] text-center"
                style={{ border: '1px dashed rgba(30,34,39,0.3)', fontFamily: 'var(--font-plex-sans)' }}
              >
                <p className="text-[11px]" style={{ color: 'rgba(30,34,39,0.5)' }}>Or save ₹1,496</p>
                <p className="text-[13px] font-medium" style={{ color: '#1E2227' }}>Bundle — All 5 Apps ₹2,999</p>
              </div>
            </div>

            {payError && (
              <p className="text-[12px] mb-2" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-mono)' }}>
                ⚠ {payError}
              </p>
            )}

            <div className="flex flex-wrap gap-3 mt-2">
              {['IS 456:2000 calculations', 'Itemised BOQ', 'Contractor comparison', '10-page PDF report'].map(f => (
                <span key={f} className="flex items-center gap-1 text-[11px]" style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-sans)' }}>
                  <span style={{ color: '#14532D' }}>✓</span> {f}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── POST-PAYMENT SUCCESS ── */}
        {isPaid && (
          <div
            className="rounded-[2px] p-5"
            style={{ border: '2px solid #14532D', background: 'rgba(20,83,45,0.04)' }}
          >
            <p className="text-[11px] uppercase tracking-widest mb-2" style={{ color: '#14532D', fontFamily: 'var(--font-plex-mono)' }}>
              ✓ PAYMENT SUCCESSFUL — REPORT UNLOCKED
            </p>
            <p className="text-[13px] mb-4" style={{ color: 'rgba(30,34,39,0.65)', fontFamily: 'var(--font-plex-sans)' }}>
              Your full estimate is now visible above. Download your 10-page IS-code PDF report below.
            </p>

            {/* PDF download area */}
            {pdfStatus === 'generating' && (
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-[2px]"
                style={{ border: '1px solid rgba(31,78,121,0.3)', background: 'rgba(31,78,121,0.05)' }}
              >
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6" stroke="#1F4E79" strokeWidth="1.5" strokeDasharray="10 6" />
                </svg>
                <p className="text-[12px]" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                  GENERATING PDF REPORT — please wait…
                </p>
              </div>
            )}

            {pdfStatus === 'ready' && pdfUrl && (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-[6px] text-[14px] font-semibold text-white no-underline"
                style={{ background: '#8C3A22', fontFamily: 'var(--font-plex-sans)' }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2v8M5 7l3 3 3-3M3 13h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Download PDF Report
              </a>
            )}

            {pdfStatus === 'error' && (
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-[12px]" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-mono)' }}>
                  ⚠ PDF generation failed. Check your email — the report may have been sent there.
                </p>
                <button
                  onClick={generatePdf}
                  className="text-[11px] underline"
                  style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-sans)' }}
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        )}

        {/* Start over */}
        <div className="text-center pt-2">
          <button
            onClick={onStartOver}
            className="text-[12px] underline"
            style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-sans)' }}
          >
            Start a new estimate
          </button>
        </div>
      </div>
    </div>
  )
}
