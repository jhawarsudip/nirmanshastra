'use client'

import { useState, useEffect, useRef } from 'react'
import { type StructoResult, type StructoInput, formatLakhs } from '../structopro-engine'

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
              {formatLakhs(r.grandTotal.standard)}
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

        {/* ── BLURRED QUANTITIES SECTION ── */}
        <div className="border rounded-[2px] overflow-hidden relative" style={{ borderColor: 'rgba(30,34,39,0.18)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.1)' }}>
            <p className="text-[11px] uppercase tracking-widest" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              EXACT MATERIAL QUANTITIES
            </p>
          </div>

          {/* Blurred content */}
          <div style={{ filter: isPaid ? 'none' : 'blur(6px)', userSelect: isPaid ? 'auto' : 'none', transition: 'filter 0.5s' }}>
            <div className="p-4">
              <table className="w-full text-[13px]" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
                    <th className="text-left py-2 text-[10px] uppercase tracking-widest" style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>Material</th>
                    <th className="text-right py-2 text-[10px] uppercase tracking-widest" style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>Quantity</th>
                    <th className="text-right py-2 text-[10px] uppercase tracking-widest" style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>Unit</th>
                    <th className="text-right py-2 text-[10px] uppercase tracking-widest" style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>Cost (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: `Cement (${input.concreteGrade})`, qty: r.quantities.cementBags,    unit: 'bags',  cost: r.costs.cement },
                    { name: `Steel (${input.steelGrade} TMT)`, qty: r.quantities.steelKg,       unit: 'kg',    cost: r.costs.steel },
                    { name: 'Coarse Aggregate (20mm)',           qty: r.quantities.aggregateCft,  unit: 'cft',   cost: r.costs.aggregate },
                    { name: 'Sand (River/M-Sand)',               qty: r.quantities.sandCft,       unit: 'cft',   cost: r.costs.sand },
                    { name: 'Binding Wire (GI)',                 qty: r.quantities.bindingWireKg, unit: 'kg',    cost: r.costs.bindingWire },
                    { name: 'Formwork (shuttering)',             qty: r.quantities.formworkSqft,  unit: 'sqft',  cost: r.costs.formwork },
                  ].map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(30,34,39,0.06)', background: i % 2 === 0 ? 'transparent' : 'rgba(30,34,39,0.02)' }}>
                      <td className="py-2" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>{row.name}</td>
                      <td className="py-2 text-right" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)' }}>{row.qty.toLocaleString('en-IN')}</td>
                      <td className="py-2 text-right" style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>{row.unit}</td>
                      <td className="py-2 text-right" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)' }}>
                        {row.cost.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: '1px solid rgba(30,34,39,0.18)' }}>
                    <td colSpan={3} className="py-2 text-[12px] font-medium" style={{ fontFamily: 'var(--font-plex-sans)', color: '#1E2227' }}>
                      Foundation ({r.foundationRecommendation.label})
                    </td>
                    <td className="py-2 text-right font-medium" style={{ fontFamily: 'var(--font-plex-mono)', color: '#1E2227' }}>
                      {r.costs.foundation.toLocaleString('en-IN')}
                    </td>
                  </tr>
                  <tr style={{ borderTop: '2px solid #1E2227' }}>
                    <td colSpan={3} className="py-2 font-semibold text-[13px]" style={{ fontFamily: 'var(--font-plex-sans)', color: '#1E2227' }}>
                      Total Material Cost
                    </td>
                    <td className="py-2 text-right font-bold text-[14px]" style={{ fontFamily: 'var(--font-plex-mono)', color: '#1E2227' }}>
                      {r.costs.total.toLocaleString('en-IN')}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="py-1 text-[12px]" style={{ fontFamily: 'var(--font-plex-sans)', color: 'rgba(30,34,39,0.5)' }}>
                      Labour (standard CPWD rates)
                    </td>
                    <td className="py-1 text-right text-[12px]" style={{ fontFamily: 'var(--font-plex-mono)', color: 'rgba(30,34,39,0.5)' }}>
                      {r.labourCost.toLocaleString('en-IN')}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="py-1 text-[12px]" style={{ fontFamily: 'var(--font-plex-sans)', color: 'rgba(30,34,39,0.5)' }}>
                      Contractor overhead + margin (10%)
                    </td>
                    <td className="py-1 text-right text-[12px]" style={{ fontFamily: 'var(--font-plex-mono)', color: 'rgba(30,34,39,0.5)' }}>
                      {r.overheadCost.toLocaleString('en-IN')}
                    </td>
                  </tr>
                  <tr style={{ borderTop: '2px solid #1F4E79', background: 'rgba(31,78,121,0.05)' }}>
                    <td colSpan={3} className="py-2 font-bold text-[14px]" style={{ fontFamily: 'var(--font-plex-sans)', color: '#1F4E79' }}>
                      TOTAL STANDARD ESTIMATE
                    </td>
                    <td className="py-2 text-right font-bold text-[16px]" style={{ fontFamily: 'var(--font-plex-mono)', color: '#1F4E79' }}>
                      {r.grandTotal.standard.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Blur overlay — shown when not paid */}
          {!isPaid && <BlurOverlay onClick={handleUnlock} />}
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
              Unlock exact quantities and contractor comparison
            </h2>
            <p
              className="text-[13px] mb-4"
              style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-sans)' }}
            >
              Get cement bags, steel kg, aggregate cft, and line-by-line itemised costs. Compare with your contractor quote to spot overcharging.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <button
                onClick={handleUnlock}
                disabled={payStatus === 'creating' || payStatus === 'verifying' || payStatus === 'polling'}
                className="flex-1 py-3 rounded-[6px] text-[15px] font-semibold text-white disabled:opacity-60 transition-opacity"
                style={{ background: '#8C3A22', fontFamily: 'var(--font-plex-sans)' }}
              >
                {payStatus === 'creating'  ? 'Creating order…' :
                 payStatus === 'verifying' ? 'Verifying payment…' :
                 payStatus === 'polling'   ? 'Confirming payment…' :
                 'Unlock Report ₹499'}
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
              <p className="text-[12px]" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-mono)' }}>
                ⚠ {payError}
              </p>
            )}

            <div className="flex flex-wrap gap-3 mt-2">
              {['IS 456:2000 calculations', 'Itemised BOQ', 'Contractor comparison', 'PDF report (coming soon)'].map(f => (
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
            <p className="text-[11px] uppercase tracking-widest mb-1" style={{ color: '#14532D', fontFamily: 'var(--font-plex-mono)' }}>
              ✓ PAYMENT SUCCESSFUL — REPORT UNLOCKED
            </p>
            <p className="text-[13px]" style={{ color: 'rgba(30,34,39,0.65)', fontFamily: 'var(--font-plex-sans)' }}>
              Your full estimate is now visible above. PDF download will be available in a future update.
            </p>
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
