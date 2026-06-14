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

  type ResultTab = 'raw_materials' | 'steel_schedule' | 'concrete' | 'labour' | 'by_floor'
  const [activeTab, setActiveTab]   = useState<ResultTab>('raw_materials')

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

      <div className="px-6 md:px-12 lg:px-16 pt-6 space-y-6">

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
        <div style={{ background: '#1E2227', padding: '56px 48px', textAlign: 'center', position: 'relative' }}>
          <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: 'rgba(244,244,240,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
            PHASE 1 — RCC STRUCTURE · {input.city}, {input.state} · IS 456:2000
          </p>
          <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 16, color: 'rgba(244,244,240,0.55)', marginBottom: 16 }}>
            Your Structure Cost ({input.concreteGrade} · {input.steelGrade})
          </p>

          {/* Grand Total — dominant number */}
          <div style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 'clamp(64px,8vw,96px)', fontWeight: 700, color: '#F4F4F0', lineHeight: 1, marginBottom: 8 }}>
            <CountUp to={r.grandTotal.standard} format={formatLakhs} />
          </div>
          <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 14, color: 'rgba(244,244,240,0.4)', marginBottom: 36 }}>
            standard estimate
          </p>

          {/* Grade cards — stacked full-width */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left', maxWidth: 600, margin: '0 auto' }}>
            {[
              { label: 'BASIC',    value: r.grandTotal.basic,    note: 'Min spec + local labour' },
              { label: 'STANDARD', value: r.grandTotal.standard, note: 'CPWD rates + overhead', active: true },
              { label: 'PREMIUM',  value: r.grandTotal.premium,  note: 'Premium labour + oversight' },
            ].map(t => (
              <div
                key={t.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  border: t.active ? '1.5px solid #1F4E79' : '1px solid rgba(244,244,240,0.1)',
                  background: t.active ? 'rgba(31,78,121,0.12)' : 'rgba(244,244,240,0.03)',
                }}
              >
                <div>
                  <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, letterSpacing: '0.08em', color: t.active ? '#7BA7CC' : 'rgba(244,244,240,0.4)', marginBottom: 2 }}>{t.label}</p>
                  <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 13, color: 'rgba(244,244,240,0.5)' }}>{t.note}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 24, fontWeight: 700, color: t.active ? '#F4F4F0' : 'rgba(244,244,240,0.6)' }}>{formatLakhs(t.value)}</p>
                  <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: 'rgba(244,244,240,0.35)' }}>₹{r.perSqftCost[t.label.toLowerCase() as 'basic' | 'standard' | 'premium']}/sqft</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 16, fontFamily: 'var(--font-plex-mono)', fontSize: 12, color: 'rgba(244,244,240,0.35)' }}>
            <span>BUA {totalBUA.toLocaleString('en-IN')} sqft</span>
            <span>·</span>
            <span>Zone {r.seismicZone} · Z={r.zFactor}</span>
            <span>·</span>
            <span>{r.foundationRecommendation.label}</span>
          </div>
        </div>

        {/* ── IS COMPLIANCE PANEL — FREE ── */}
        <div style={{ border: '1px solid rgba(30,34,39,0.15)' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(30,34,39,0.1)', background: 'rgba(31,78,121,0.04)' }}>
            <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: '#1F4E79', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              IS COMPLIANCE PANEL — IS 456:2000 · IS 13920:2016 · IS 1904:2016
            </p>
          </div>
          <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
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

        {/* ── DETAILED RESULTS — TABBED ── */}
        <div className="border rounded-[2px] overflow-hidden" style={{ borderColor: 'rgba(30,34,39,0.18)' }}>
          {/* Tab bar */}
          <div className="px-2 pt-2" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)', background: 'rgba(30,34,39,0.03)' }}>
            <div className="flex gap-0 overflow-x-auto">
              {([
                { id: 'raw_materials',  label: 'Raw Materials' },
                { id: 'steel_schedule', label: 'Steel Schedule' },
                { id: 'concrete',       label: 'Concrete' },
                { id: 'labour',         label: 'Labour' },
                { id: 'by_floor',       label: 'By Floor' },
              ] as { id: ResultTab; label: string }[]).map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className="px-4 py-2 text-[11px] font-medium whitespace-nowrap border-b-2 transition-colors"
                  style={{
                    fontFamily: 'var(--font-plex-mono)',
                    color: activeTab === tab.id ? '#1F4E79' : 'rgba(30,34,39,0.45)',
                    borderColor: activeTab === tab.id ? '#1F4E79' : 'transparent',
                    background: 'transparent',
                    letterSpacing: '0.04em',
                  }}
                >
                  {tab.label}
                  {tab.id !== 'raw_materials' && !isPaid && (
                    <span className="ml-1 text-[9px]" style={{ color: '#8C3A22' }}>🔒</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4">

            {/* ── TAB 1: Raw Materials ── */}
            {activeTab === 'raw_materials' && (
              <>
                <table className="w-full text-[13px]" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #1E2227', background: 'rgba(30,34,39,0.04)' }}>
                      {isPaid && <th className="text-left py-2 px-1 text-[9px] uppercase tracking-widest" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)', width: 44 }}>Item</th>}
                      <th className="text-left py-2 text-[9px] uppercase tracking-widest" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>Description</th>
                      <th className="text-right py-2 text-[9px] uppercase tracking-widest" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)', width: 44 }}>Unit</th>
                      <th className="text-right py-2 text-[9px] uppercase tracking-widest" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)', width: 70 }}>Qty</th>
                      {isPaid && <th className="text-right py-2 text-[9px] uppercase tracking-widest" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)', width: 70 }}>Rate (₹)</th>}
                      <th className="text-right py-2 text-[9px] uppercase tracking-widest" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)', width: 90 }}>Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Proof-of-work rows: always visible */}
                    {[
                      { itemNo: '1.1', name: `Cement — ${input.concreteGrade}`, unit: 'bags', qty: r.quantities.cementBags, cost: r.costs.cement },
                      { itemNo: '1.2', name: `TMT Steel — ${input.steelGrade}`, unit: 'kg',   qty: r.quantities.steelKg,   cost: r.costs.steel },
                    ].map((row, i) => (
                      <tr key={row.itemNo} style={{ borderBottom: '1px solid rgba(30,34,39,0.08)', background: i % 2 ? 'rgba(30,34,39,0.018)' : 'transparent' }}>
                        {isPaid && <td className="py-2 px-1" style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)', fontSize: 11 }}>{row.itemNo}</td>}
                        <td className="py-2" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)', fontSize: 13 }}>{row.name}</td>
                        <td className="py-2 text-right" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)', fontSize: 12 }}>{row.unit}</td>
                        <td className="py-2 text-right" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)', fontSize: 13, fontWeight: 500 }}>{row.qty.toLocaleString('en-IN')}</td>
                        {isPaid && <td className="py-2 text-right" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)', fontSize: 12 }}>{Math.round(row.cost / Math.max(row.qty, 1)).toLocaleString('en-IN')}</td>}
                        <td className="py-2 text-right" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)', fontSize: 13 }}>{isPaid ? row.cost.toLocaleString('en-IN') : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {!isPaid ? (
                  <div style={{ position: 'relative', marginTop: 0 }}>
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
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(244,244,240,0.72)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: 'rgba(30,34,39,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        4 more items + labour + total locked
                      </p>
                      <button onClick={handleUnlock} style={{ background: '#8C3A22', color: '#F4F4F0', fontFamily: 'var(--font-plex-mono)', fontSize: 12, padding: '8px 18px', borderRadius: 6, border: 'none', cursor: 'pointer', letterSpacing: '0.03em' }}>
                        Unlock Full BOQ — ₹499
                      </button>
                    </div>
                  </div>
                ) : (
                  <table className="w-full text-[13px] mt-0" style={{ borderCollapse: 'collapse' }}>
                    <tbody>
                      {[
                        { itemNo: '1.3', name: 'Coarse Aggregate (20mm)',            unit: 'cft',  qty: r.quantities.aggregateCft,  cost: r.costs.aggregate },
                        { itemNo: '1.4', name: 'Sand (River/M-Sand)',                unit: 'cft',  qty: r.quantities.sandCft,       cost: r.costs.sand },
                        { itemNo: '1.5', name: 'Binding Wire (GI)',                  unit: 'kg',   qty: r.quantities.bindingWireKg, cost: r.costs.bindingWire },
                        { itemNo: '1.6', name: 'Formwork (wooden/steel shuttering)', unit: 'sqft', qty: r.quantities.formworkSqft,  cost: r.costs.formwork },
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
              </>
            )}

            {/* ── TAB 2: Steel Schedule ── */}
            {activeTab === 'steel_schedule' && (
              !isPaid ? (
                <div className="py-8 text-center">
                  <p className="text-[12px] mb-3" style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>STEEL SCHEDULE LOCKED</p>
                  <p className="text-[13px] mb-4" style={{ color: 'rgba(30,34,39,0.65)', fontFamily: 'var(--font-plex-sans)' }}>
                    Bar diameter breakdown by member (columns, beams, slabs, footing) — unlock to view.
                  </p>
                  <button onClick={handleUnlock} className="px-5 py-2.5 rounded-[6px] text-[13px] font-semibold text-white" style={{ background: '#8C3A22', fontFamily: 'var(--font-plex-sans)' }}>
                    Unlock Steel Schedule — ₹499
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-[11px] mb-3" style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>
                    IS 1786:2008 · IS 456:2000 — steel percentages by member type
                  </p>
                  <table className="w-full text-[12px]" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #1E2227', background: 'rgba(30,34,39,0.04)' }}>
                        {['Member', '% Steel (IS 456)', 'Volume (m³ est.)', 'Steel (kg)', 'Cost (₹)'].map(h => (
                          <th key={h} className="py-2 px-2 text-left text-[9px] uppercase tracking-widest" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const totalSteel = r.quantities.steelKg
                        const totalCost  = r.costs.steel
                        const splits = [
                          { member: 'Footing / Foundation',  pct: '0.50%', share: 0.10 },
                          { member: 'Plinth Beam',           pct: '1.50%', share: 0.08 },
                          { member: 'Columns',               pct: '2.50%', share: 0.20 },
                          { member: 'Beams',                 pct: '1.50%', share: 0.30 },
                          { member: 'Slabs',                 pct: '1.00%', share: 0.32 },
                        ]
                        return splits.map((s, i) => {
                          const kg   = Math.round(totalSteel * s.share)
                          const cost = Math.round(totalCost * s.share)
                          const vol  = (kg / (s.share > 0.1 ? 196.25 : 39.25)).toFixed(1)
                          return (
                            <tr key={s.member} style={{ borderBottom: '1px solid rgba(30,34,39,0.08)', background: i % 2 ? 'rgba(30,34,39,0.018)' : 'transparent' }}>
                              <td className="py-2 px-2" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)', fontSize: 13 }}>{s.member}</td>
                              <td className="py-2 px-2" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)', fontSize: 12 }}>{s.pct}</td>
                              <td className="py-2 px-2 text-right" style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-mono)', fontSize: 12 }}>{vol}</td>
                              <td className="py-2 px-2 text-right" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)', fontSize: 13, fontWeight: 500 }}>{kg.toLocaleString('en-IN')}</td>
                              <td className="py-2 px-2 text-right" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)', fontSize: 13 }}>{cost.toLocaleString('en-IN')}</td>
                            </tr>
                          )
                        })
                      })()}
                      <tr style={{ borderTop: '2px solid #1E2227', background: 'rgba(30,34,39,0.03)' }}>
                        <td colSpan={3} className="py-2 px-2 font-semibold" style={{ fontFamily: 'var(--font-plex-sans)', color: '#1E2227', fontSize: 13 }}>Total Steel</td>
                        <td className="py-2 px-2 text-right font-bold" style={{ fontFamily: 'var(--font-plex-mono)', color: '#1E2227', fontSize: 14 }}>{r.quantities.steelKg.toLocaleString('en-IN')} kg</td>
                        <td className="py-2 px-2 text-right font-bold" style={{ fontFamily: 'var(--font-plex-mono)', color: '#1E2227', fontSize: 14 }}>{r.costs.steel.toLocaleString('en-IN')}</td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="text-[10px] mt-3" style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
                    Binding wire: {r.quantities.bindingWireKg.toLocaleString('en-IN')} kg (10 kg per tonne — IS 1786:2008)
                  </p>
                </>
              )
            )}

            {/* ── TAB 3: Concrete ── */}
            {activeTab === 'concrete' && (
              !isPaid ? (
                <div className="py-8 text-center">
                  <p className="text-[12px] mb-3" style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>CONCRETE SCHEDULE LOCKED</p>
                  <p className="text-[13px] mb-4" style={{ color: 'rgba(30,34,39,0.65)', fontFamily: 'var(--font-plex-sans)' }}>
                    Concrete volume by member with cement, sand and aggregate quantities — unlock to view.
                  </p>
                  <button onClick={handleUnlock} className="px-5 py-2.5 rounded-[6px] text-[13px] font-semibold text-white" style={{ background: '#8C3A22', fontFamily: 'var(--font-plex-sans)' }}>
                    Unlock Concrete Schedule — ₹499
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-[11px] mb-3" style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>
                    IS 456:2000 — {input.concreteGrade} · dry volume factor 1.54
                  </p>
                  <table className="w-full text-[12px]" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #1E2227', background: 'rgba(30,34,39,0.04)' }}>
                        {['Member', 'Volume (m³)', 'Cement (bags)', 'Sand (cft)', 'Aggregate (cft)'].map(h => (
                          <th key={h} className="py-2 px-2 text-left text-[9px] uppercase tracking-widest" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const totalCement = r.quantities.cementBags
                        const totalSand   = r.quantities.sandCft
                        const totalAgg    = r.quantities.aggregateCft
                        const splits = [
                          { member: 'Foundation',  share: 0.15 },
                          { member: 'Plinth Beam', share: 0.08 },
                          { member: 'Columns',     share: 0.18 },
                          { member: 'Beams',       share: 0.27 },
                          { member: 'Slabs',       share: 0.32 },
                        ]
                        const totalVol = totalCement / 8.07
                        return splits.map((s, i) => {
                          const vol = (totalVol * s.share).toFixed(2)
                          const cem = Math.round(totalCement * s.share)
                          const san = Math.round(totalSand * s.share)
                          const agg = Math.round(totalAgg * s.share)
                          return (
                            <tr key={s.member} style={{ borderBottom: '1px solid rgba(30,34,39,0.08)', background: i % 2 ? 'rgba(30,34,39,0.018)' : 'transparent' }}>
                              <td className="py-2 px-2" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)', fontSize: 13 }}>{s.member}</td>
                              <td className="py-2 px-2 text-right" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)', fontSize: 12 }}>{vol}</td>
                              <td className="py-2 px-2 text-right" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)', fontSize: 13 }}>{cem.toLocaleString('en-IN')}</td>
                              <td className="py-2 px-2 text-right" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)', fontSize: 13 }}>{san.toLocaleString('en-IN')}</td>
                              <td className="py-2 px-2 text-right" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)', fontSize: 13 }}>{agg.toLocaleString('en-IN')}</td>
                            </tr>
                          )
                        })
                      })()}
                      <tr style={{ borderTop: '2px solid #1E2227', background: 'rgba(30,34,39,0.03)' }}>
                        <td className="py-2 px-2 font-semibold" style={{ fontFamily: 'var(--font-plex-sans)', color: '#1E2227', fontSize: 13 }}>Total</td>
                        <td className="py-2 px-2 text-right font-bold" style={{ fontFamily: 'var(--font-plex-mono)', color: '#1E2227', fontSize: 13 }}>{(r.quantities.cementBags / 8.07).toFixed(1)} m³</td>
                        <td className="py-2 px-2 text-right font-bold" style={{ fontFamily: 'var(--font-plex-mono)', color: '#1E2227', fontSize: 13 }}>{r.quantities.cementBags.toLocaleString('en-IN')}</td>
                        <td className="py-2 px-2 text-right font-bold" style={{ fontFamily: 'var(--font-plex-mono)', color: '#1E2227', fontSize: 13 }}>{r.quantities.sandCft.toLocaleString('en-IN')}</td>
                        <td className="py-2 px-2 text-right font-bold" style={{ fontFamily: 'var(--font-plex-mono)', color: '#1E2227', fontSize: 13 }}>{r.quantities.aggregateCft.toLocaleString('en-IN')}</td>
                      </tr>
                    </tbody>
                  </table>
                </>
              )
            )}

            {/* ── TAB 4: Labour ── */}
            {activeTab === 'labour' && (
              !isPaid ? (
                <div className="py-8 text-center">
                  <p className="text-[12px] mb-3" style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>LABOUR SCHEDULE LOCKED</p>
                  <p className="text-[13px] mb-4" style={{ color: 'rgba(30,34,39,0.65)', fontFamily: 'var(--font-plex-sans)' }}>
                    Trade-by-trade labour man-days and cost — unlock to view.
                  </p>
                  <button onClick={handleUnlock} className="px-5 py-2.5 rounded-[6px] text-[13px] font-semibold text-white" style={{ background: '#8C3A22', fontFamily: 'var(--font-plex-sans)' }}>
                    Unlock Labour Schedule — ₹499
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-[11px] mb-3" style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>
                    CPWD DSR 2023 — standard productivity rates
                  </p>
                  <table className="w-full text-[12px]" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #1E2227', background: 'rgba(30,34,39,0.04)' }}>
                        {['Trade', 'Workers', 'Rate/Day (₹)', 'Est. Days', 'Cost (₹)'].map(h => (
                          <th key={h} className="py-2 px-2 text-left text-[9px] uppercase tracking-widest" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: 'Bar Bender (Sariya Mistri)',   workers: 2, rate: 950,  days: Math.ceil(r.quantities.steelKg / 600) },
                        { name: 'Shuttering Carpenter',          workers: 2, rate: 900,  days: Math.ceil(r.quantities.formworkSqft / 100) },
                        { name: 'Concreting Mason (RCC)',        workers: 2, rate: 900,  days: Math.ceil(r.quantities.cementBags / 8.07 / 2.5) },
                        { name: 'Vibrator Operator',             workers: 1, rate: 800,  days: Math.ceil(r.quantities.cementBags / 8.07 / 2.5) },
                        { name: 'General Helper / Beldar',       workers: 4, rate: 580,  days: Math.ceil(r.quantities.cementBags / 8.07 / 2.5) },
                        { name: 'Curing / Water Man',            workers: 1, rate: 500,  days: (input.numFloors + 1) * 14 },
                        { name: 'Night Watchman',                workers: 1, rate: 500,  days: (input.numFloors + 1) * 21 },
                        { name: 'Junior Site Engineer',          workers: 1, rate: 1500, days: Math.ceil(r.quantities.cementBags / 8.07 / 2.5) + 10 },
                      ].map((t, i) => {
                        const cost = t.workers * t.rate * t.days
                        return (
                          <tr key={t.name} style={{ borderBottom: '1px solid rgba(30,34,39,0.08)', background: i % 2 ? 'rgba(30,34,39,0.018)' : 'transparent' }}>
                            <td className="py-2 px-2" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)', fontSize: 13 }}>{t.name}</td>
                            <td className="py-2 px-2 text-right" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)', fontSize: 12 }}>{t.workers}</td>
                            <td className="py-2 px-2 text-right" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)', fontSize: 12 }}>{t.rate.toLocaleString('en-IN')}</td>
                            <td className="py-2 px-2 text-right" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)', fontSize: 12 }}>{t.days}</td>
                            <td className="py-2 px-2 text-right" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)', fontSize: 13 }}>{cost.toLocaleString('en-IN')}</td>
                          </tr>
                        )
                      })}
                      <tr style={{ borderTop: '2px solid #1E2227', background: 'rgba(30,34,39,0.03)' }}>
                        <td colSpan={4} className="py-2 px-2 font-semibold" style={{ fontFamily: 'var(--font-plex-sans)', color: '#1E2227', fontSize: 13 }}>Total Labour (CPWD benchmark)</td>
                        <td className="py-2 px-2 text-right font-bold" style={{ fontFamily: 'var(--font-plex-mono)', color: '#1E2227', fontSize: 14 }}>{r.labourCost.toLocaleString('en-IN')}</td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="text-[10px] mt-2" style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
                    Actual days depend on site conditions. CPWD rates ±20–30% for private work.
                  </p>
                </>
              )
            )}

            {/* ── TAB 5: By Floor ── */}
            {activeTab === 'by_floor' && (
              !isPaid ? (
                <div className="py-8 text-center">
                  <p className="text-[12px] mb-3" style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>FLOOR-BY-FLOOR BREAKDOWN LOCKED</p>
                  <p className="text-[13px] mb-4" style={{ color: 'rgba(30,34,39,0.65)', fontFamily: 'var(--font-plex-sans)' }}>
                    Cost and material quantity for each floor separately — unlock to view.
                  </p>
                  <button onClick={handleUnlock} className="px-5 py-2.5 rounded-[6px] text-[13px] font-semibold text-white" style={{ background: '#8C3A22', fontFamily: 'var(--font-plex-sans)' }}>
                    Unlock Floor Breakdown — ₹499
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-[11px] mb-3" style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>
                    IS 456:2000 · IS 875:2015 — allocation per floor
                  </p>
                  <table className="w-full text-[12px]" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #1E2227', background: 'rgba(30,34,39,0.04)' }}>
                        {['Floor', 'Area (sqft)', 'Cement (bags)', 'Steel (kg)', 'Concrete (m³)', 'Est. Cost (₹)'].map(h => (
                          <th key={h} className="py-2 px-2 text-left text-[9px] uppercase tracking-widest" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const numFloors = input.numFloors + 1
                        const areaPerFloor = totalBUA / numFloors
                        const floorNames = ['Ground Floor', 'First Floor', 'Second Floor', 'Third Floor', 'Fourth Floor', 'Fifth Floor']
                        return Array.from({ length: numFloors }, (_, i) => {
                          const share = 1 / numFloors
                          const cem  = Math.round(r.quantities.cementBags * share)
                          const stl  = Math.round(r.quantities.steelKg * share)
                          const conc = (r.quantities.cementBags * share / 8.07).toFixed(2)
                          const cost = Math.round(r.grandTotal.standard * share)
                          return (
                            <tr key={i} style={{ borderBottom: '1px solid rgba(30,34,39,0.08)', background: i % 2 ? 'rgba(30,34,39,0.018)' : 'transparent' }}>
                              <td className="py-2 px-2" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)', fontSize: 13 }}>{floorNames[i] ?? `Floor ${i}`}</td>
                              <td className="py-2 px-2 text-right" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)', fontSize: 12 }}>{Math.round(areaPerFloor).toLocaleString('en-IN')}</td>
                              <td className="py-2 px-2 text-right" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)', fontSize: 12 }}>{cem.toLocaleString('en-IN')}</td>
                              <td className="py-2 px-2 text-right" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)', fontSize: 12 }}>{stl.toLocaleString('en-IN')}</td>
                              <td className="py-2 px-2 text-right" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)', fontSize: 12 }}>{conc}</td>
                              <td className="py-2 px-2 text-right font-medium" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)', fontSize: 13 }}>{cost.toLocaleString('en-IN')}</td>
                            </tr>
                          )
                        })
                      })()}
                      <tr style={{ borderTop: '2px solid #1E2227', background: 'rgba(30,34,39,0.03)' }}>
                        <td className="py-2 px-2 font-semibold" style={{ fontFamily: 'var(--font-plex-sans)', color: '#1E2227', fontSize: 13 }}>All Floors</td>
                        <td className="py-2 px-2 text-right font-bold" style={{ fontFamily: 'var(--font-plex-mono)', color: '#1E2227', fontSize: 13 }}>{totalBUA.toLocaleString('en-IN')}</td>
                        <td className="py-2 px-2 text-right font-bold" style={{ fontFamily: 'var(--font-plex-mono)', color: '#1E2227', fontSize: 13 }}>{r.quantities.cementBags.toLocaleString('en-IN')}</td>
                        <td className="py-2 px-2 text-right font-bold" style={{ fontFamily: 'var(--font-plex-mono)', color: '#1E2227', fontSize: 13 }}>{r.quantities.steelKg.toLocaleString('en-IN')}</td>
                        <td className="py-2 px-2 text-right font-bold" style={{ fontFamily: 'var(--font-plex-mono)', color: '#1E2227', fontSize: 13 }}>{(r.quantities.cementBags / 8.07).toFixed(1)}</td>
                        <td className="py-2 px-2 text-right font-bold" style={{ fontFamily: 'var(--font-plex-mono)', color: '#1E2227', fontSize: 14 }}>{r.grandTotal.standard.toLocaleString('en-IN')}</td>
                      </tr>
                    </tbody>
                  </table>
                </>
              )
            )}

          </div>
        </div>

        {/* ── PAYMENT GATE — dramatic dark unlock card ── */}
        {!isPaid && (
          <div style={{ background: '#1E2227', padding: '56px 48px', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: 'rgba(244,244,240,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
              YOUR PHASE 1 ESTIMATE IS READY
            </p>
            <h2 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 'clamp(28px,4vw,48px)', fontWeight: 600, color: '#F4F4F0', lineHeight: 1.15, marginBottom: 12 }}>
              Unlock Full IS-Code BOQ<br />+ Professional PDF
            </h2>
            <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 16, color: 'rgba(244,244,240,0.55)', marginBottom: 36, maxWidth: 500, margin: '0 auto 36px' }}>
              Exact quantities, local market rates, contractor comparison, and a 10-page IS-code PDF report
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, maxWidth: 480, margin: '0 auto' }}>
              <button
                onClick={handleUnlock}
                disabled={payStatus === 'creating' || payStatus === 'verifying' || payStatus === 'polling'}
                style={{
                  width: '100%',
                  background: '#8C3A22',
                  color: '#F4F4F0',
                  fontFamily: 'var(--font-plex-mono)',
                  fontSize: 16,
                  fontWeight: 600,
                  padding: '18px 32px',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  letterSpacing: '0.03em',
                  opacity: (payStatus === 'creating' || payStatus === 'verifying' || payStatus === 'polling') ? 0.6 : 1,
                }}
              >
                {payStatus === 'creating'  ? 'Creating order…' :
                 payStatus === 'verifying' ? 'Verifying payment…' :
                 payStatus === 'polling'   ? 'Confirming payment…' :
                 'Unlock Report — ₹499'}
              </button>
              <div style={{ width: '100%', padding: '14px 20px', border: '1px dashed rgba(244,244,240,0.2)', textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: 'rgba(244,244,240,0.4)', marginBottom: 2 }}>Or save ₹1,496</p>
                <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 14, color: 'rgba(244,244,240,0.7)' }}>Complete Bundle — All 5 Apps <span style={{ fontFamily: 'var(--font-plex-mono)', color: '#F4F4F0' }}>₹2,999</span></p>
              </div>
            </div>

            {payError && (
              <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 12, color: '#D99A06', marginTop: 12 }}>
                ⚠ {payError}
              </p>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16, marginTop: 28 }}>
              {['IS 456:2000 calculations', 'Itemised BOQ', 'Contractor comparison', '10-page PDF report'].map(f => (
                <span key={f} style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 13, color: 'rgba(244,244,240,0.45)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#14532D', fontWeight: 700 }}>✓</span>{f}
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
