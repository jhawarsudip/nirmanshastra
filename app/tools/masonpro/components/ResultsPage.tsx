'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { animate } from 'framer-motion'
import {
  type MasonResult,
  type MasonInput,
  formatLakhs,
  EXTERNAL_WALL_SPECS,
} from '../masonpro-engine'
import Link from 'next/link'
import { PAYMENT_BYPASS } from '@/lib/payment-config'

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
  result:      MasonResult
  input:       MasonInput
  estimateId:  string | null
  contactName: string
  onStartOver: () => void
}

type PayStatus = 'idle' | 'creating' | 'open' | 'verifying' | 'polling' | 'paid' | 'error'
type PdfStatus = 'idle' | 'generating' | 'ready' | 'error'

function StampBadge({ status, clause, description }: {
  status: 'pass' | 'advisory' | 'fail'; clause: string; description: string
}) {
  const c = {
    pass:     { border: '#14532D', text: '#14532D', bg: 'rgba(20,83,45,0.04)',   label: 'PASS'     },
    advisory: { border: '#D99A06', text: '#D99A06', bg: 'rgba(217,154,6,0.06)',  label: 'ADVISORY' },
    fail:     { border: '#8C3A22', text: '#8C3A22', bg: 'rgba(140,58,34,0.05)', label: 'FAIL'     },
  }[status]
  return (
    <div className="flex items-start gap-3 p-3 rounded-[2px]"
      style={{ border: `1px solid ${c.border}22`, background: c.bg }}>
      <div className="shrink-0 mt-0.5"
        style={{
          border: `1.5px double ${c.border}`, borderRadius: 1, padding: '1px 5px',
          transform: 'rotate(-2deg)', fontSize: 9, fontFamily: 'var(--font-plex-mono)',
          fontWeight: 600, color: c.text, letterSpacing: '0.06em', whiteSpace: 'nowrap',
        }}>
        {c.label}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium" style={{ color: c.text, fontFamily: 'var(--font-plex-mono)' }}>
          {clause}
        </p>
        <p className="text-[12px]" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-plex-sans)' }}>
          {description}
        </p>
      </div>
    </div>
  )
}

function BlurOverlay({ onClick }: { onClick: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[2px] z-10"
      style={{ background: 'rgba(10,10,10,0.88)', backdropFilter: 'blur(2px)' }}>
      <div className="text-center px-6 py-5 rounded-[2px] max-w-sm"
        style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'var(--bg-surface)' }}>
        <p className="text-[11px] uppercase tracking-widest mb-1"
          style={{ color: 'rgba(255,255,255,0.40)', fontFamily: 'var(--font-plex-mono)' }}>
          ₹699 · UNLOCK TO VIEW
        </p>
        <p className="text-[13px] mb-3" style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-plex-sans)' }}>
          Exact brick counts, cement bags, sand cft, and contractor comparison
        </p>
        <button onClick={onClick}
          className="px-4 py-2 rounded-[6px] text-[13px] font-semibold text-white"
          style={{ background: '#8C3A22', fontFamily: 'var(--font-plex-sans)' }}>
          Unlock Now ₹699
        </button>
      </div>
    </div>
  )
}


export default function ResultsPage({ result, input, estimateId, contactName, onStartOver }: Props) {
  const [payStatus, setPayStatus] = useState<PayStatus>('idle')
  const [payError, setPayError]   = useState('')
  const [isPaid, setIsPaid]       = useState(PAYMENT_BYPASS)
  const [orderId, setOrderId]     = useState<string | null>(null)
  const pollRef                   = useRef<ReturnType<typeof setInterval> | null>(null)
  const [pdfStatus, setPdfStatus]     = useState<PdfStatus>('idle')
  const [pdfUrl, setPdfUrl]           = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    if (document.querySelector('script[src*="checkout.razorpay.com"]')) return
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)
  }, [])

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
      } catch { /* ignore transient */ }
    }, 2000)
    return () => clearInterval(pollRef.current!)
  }, [orderId, payStatus])

  const generatePdf = useCallback(async () => {
    if (!estimateId) return
    setPdfStatus('generating')
    try {
      const getRes = await fetch(`/api/masonpro/generate-pdf?estimateId=${estimateId}`)
      const getJson = await getRes.json()
      if (getJson.pdfUrl) { setPdfUrl(getJson.pdfUrl); setPdfStatus('ready'); return }
      const postRes = await fetch('/api/masonpro/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estimateId }),
      })
      const postJson = await postRes.json()
      if (postJson.pdfUrl) { setPdfUrl(postJson.pdfUrl); setPdfStatus('ready') }
      else setPdfStatus('error')
    } catch { setPdfStatus('error') }
  }, [estimateId])

  useEffect(() => { if (isPaid) generatePdf() }, [isPaid, generatePdf])

  const downloadPdf = useCallback(async () => {
    if (!pdfUrl || isDownloading) return
    setIsDownloading(true)
    try {
      const res = await fetch(pdfUrl)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'NirmanShastra-MasonryPro-Report.pdf'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      window.open(pdfUrl, '_blank')
    } finally {
      setIsDownloading(false)
    }
  }, [pdfUrl, isDownloading])

  async function handleUnlock() {
    if (!estimateId) { setPayError('Estimate not saved yet. Please wait a moment and try again.'); return }
    setPayStatus('creating')
    setPayError('')
    try {
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        
        body: JSON.stringify({ estimateId, amount: 69900 }),
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
        description: 'MasonryPro Report — Phase 2 Masonry',
        order_id:    json.orderId,
        prefill: { name: contactName, contact: input.state },
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
        modal: { ondismiss: () => { setPayStatus(prev => (prev === 'open' || prev === 'creating') ? 'idle' : prev); setPayError('Payment was not completed. Click "Unlock Report" to try again.') } },
      }
      if (!window.Razorpay) throw new Error('Payment SDK not loaded. Please refresh and try again.')
      new window.Razorpay(options).open()
    } catch (err) {
      setPayStatus('error')
      setPayError(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  const r = result
  const extSpec = EXTERNAL_WALL_SPECS[input.externalWallType]

  return (
    <div className="min-h-screen  pb-16">
      {/* Header */}
      <div className="py-8 px-6 md:px-12 lg:px-16" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: '#1F4E79', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
          02 · MASONRY ESTIMATE
        </p>
        <h1 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 'clamp(22px,3vw,32px)', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
          Your Estimate is Ready
        </h1>
      </div>

      <div className="px-6 md:px-12 lg:px-16 pt-6 space-y-6">

        {/* Preview mode banner */}
        {PAYMENT_BYPASS && (
          <div className="px-4 py-2 rounded-[2px] flex items-center gap-2"
            style={{ background: 'rgba(20,83,45,0.08)', border: '1px solid rgba(20,83,45,0.35)' }}>
            <span style={{ color: '#14532D', fontSize: 13 }}>✓</span>
            <p className="text-[12px]" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-plex-mono)' }}>
              PREVIEW MODE — Full report visible for testing
            </p>
          </div>
        )}

        {/* Grand total — FREE */}
        <div style={{ background: 'var(--bg-surface)', position: 'relative', overflow: 'hidden' }}>
          <div className="results-blob-1" aria-hidden="true" />
          <div className="results-blob-2" aria-hidden="true" />
          <div style={{ position: 'relative', zIndex: 1, padding: '56px 48px', textAlign: 'center', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', background: 'rgba(255,255,255,0.10)' }}>
          <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: 'rgba(244,244,240,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
            PHASE 2 — MASONRY · {input.city}, {input.state}
          </p>
          <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 15, color: 'rgba(244,244,240,0.55)', marginBottom: 16 }}>
            {extSpec.label} · {input.externalWallAreaSqm} sqm
          </p>
          <div className="grand-total-pulse" style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 'clamp(64px,8vw,96px)', fontWeight: 700, color: '#F4F4F0', lineHeight: 1, marginBottom: 8 }}>
            <CountUp to={r.grandTotal.standard} format={formatLakhs} />
          </div>
          <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 13, color: 'rgba(244,244,240,0.35)', marginBottom: 36 }}>standard estimate</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 600, margin: '0 auto' }}>
            {[
              { label: 'BASIC',    value: r.grandTotal.basic,    note: 'Min spec + local rates' },
              { label: 'STANDARD', value: r.grandTotal.standard, note: 'CPWD rates + overhead', active: true },
              { label: 'PREMIUM',  value: r.grandTotal.premium,  note: 'Premium rates + oversight' },
            ].map(t => (
              <div key={t.label} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 20px',
                border: t.active ? '1.5px solid rgba(31,78,121,0.7)' : '1px solid rgba(244,244,240,0.1)',
                background: t.active ? 'rgba(31,78,121,0.2)' : 'rgba(244,244,240,0.03)',
              }}>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 9, color: t.active ? '#7BA7CC' : 'rgba(244,244,240,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>{t.label}</p>
                  <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 12, color: 'rgba(244,244,240,0.45)' }}>{t.note}</p>
                </div>
                <div style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 24, fontWeight: 600, color: '#F4F4F0' }}>
                  {formatLakhs(t.value)}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
            <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: 'rgba(244,244,240,0.3)' }}>Ext wall {r.totalExternalWallAreaSqm} sqm</span>
            <span style={{ color: 'rgba(244,244,240,0.15)' }}>·</span>
            <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: 'rgba(244,244,240,0.3)' }}>Zone {r.seismicZone} · Z={r.zFactor}</span>
            {r.aacWarning && <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: '#D99A06' }}>⚠ AAC ZONE RESTRICTION</span>}
          </div>
          </div>{/* /glass inner */}
        </div>{/* /gradient mesh outer */}

        {/* Phase context — FREE */}
        <div className="border rounded-[2px] p-4"
          style={{ borderColor: 'rgba(31,78,121,0.25)', background: 'rgba(31,78,121,0.03)' }}>
          <p className="text-[11px] uppercase tracking-widest mb-2"
            style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
            PHASE 2 CONTEXT — IS 2212:1991
          </p>
          <p className="text-[14px] font-medium mb-1"
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-plex-sans)' }}>
            Masonry = {r.phaseContext.percentOfTotal} of total project cost
          </p>
          <p className="text-[12px] mb-3"
            style={{ color: 'rgba(255,255,255,0.50)', fontFamily: 'var(--font-plex-mono)' }}>
            Typical: {r.phaseContext.exampleAmount}
          </p>
          <p className="text-[11px] uppercase tracking-widest mb-1"
            style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-mono)' }}>
            Common Overcharging Methods to Watch:
          </p>
          <ul className="space-y-1">
            {r.phaseContext.overchargingRisks.map((risk, i) => (
              <li key={i} className="flex gap-2 text-[12px]"
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-plex-sans)' }}>
                <span style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-mono)', fontSize: 10, marginTop: 2 }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Wall type comparison — FREE */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(255,255,255,0.10)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[11px] uppercase tracking-widest"
              style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              ALL 8 WALL TYPES — COST PER SQM (PUNE 2026 RATES)
            </p>
          </div>
          <div className="p-4 space-y-2.5">
            {[...r.wallTypeComparison].sort((a, b) => a.costPerSqm - b.costPerSqm).map(w => {
              const maxCost = Math.max(...r.wallTypeComparison.map(x => x.costPerSqm))
              const pct = Math.round((w.costPerSqm / maxCost) * 100)
              const isSelected = w.type === input.externalWallType
              return (
                <div key={w.type}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[12px] font-medium"
                        style={{ fontFamily: 'var(--font-plex-mono)', color: isSelected ? '#1F4E79' : 'var(--text-primary)' }}>
                        {w.label}
                      </span>
                      <span className="text-[10px]"
                        style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-plex-mono)' }}>
                        {w.unitsPerSqm.toFixed(1)} {w.unitLabel}/sqm
                      </span>
                      {isSelected && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-[2px]"
                          style={{ background: '#1F4E79', color: '#fff', fontFamily: 'var(--font-plex-mono)' }}>
                          SELECTED
                        </span>
                      )}
                    </div>
                    <span className="text-[12px] font-medium"
                      style={{ fontFamily: 'var(--font-plex-mono)', color: 'var(--text-primary)' }}>
                      ₹{w.costPerSqm.toLocaleString('en-IN')}/sqm
                    </span>
                  </div>
                  <div className="h-2 rounded-[1px] overflow-hidden" style={{ background: 'rgba(30,34,39,0.06)' }}>
                    <div className="h-full rounded-[1px]"
                      style={{ width: `${pct}%`, background: isSelected ? '#1F4E79' : 'rgba(255,255,255,0.15)' }} />
                  </div>
                </div>
              )
            })}
            <p className="text-[10px] pt-1" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-plex-mono)' }}>
              Material only. Labour and plaster calculated separately. IS 2212:1991 rates.
            </p>
          </div>
        </div>

        {/* IS Compliance Panel — FREE */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(255,255,255,0.10)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[11px] uppercase tracking-widest"
              style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              IS COMPLIANCE PANEL — IS 1077:1992 · IS 2212:1991 · IS 4326:1993 · IS 2645:2003
            </p>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {r.compliance.map(c => (
              <StampBadge key={c.id} status={c.status} clause={c.clause} description={c.detail} />
            ))}
          </div>
        </div>

        {/* Technical reminders — FREE */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(255,255,255,0.10)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[11px] uppercase tracking-widest"
              style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              10 TECHNICAL REMINDERS — IS-CODE MANDATED
            </p>
          </div>
          <ol className="p-4 space-y-2">
            {r.technicalReminders.map((rem, i) => (
              <li key={i} className="flex gap-3 text-[13px]"
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-plex-sans)' }}>
                <span className="shrink-0 mt-0.5 text-[11px] w-5 text-right"
                  style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span>{rem}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* ── HOW THIS IS CALCULATED — FREE ── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(255,255,255,0.10)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[11px] uppercase tracking-widest" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              HOW THIS IS CALCULATED — FORMULAS &amp; IS CLAUSES
            </p>
          </div>
          <ol className="p-4 space-y-4">
            {[
              {
                clause: 'IS 1077:1992 · IS 2212:1991',
                formula: 'Bricks (9" modular wall) = 100 bricks/sqm × Net wall area (sqm)',
                note: 'Net area = gross wall area − door/window deductions. Modular 190×90×90mm. Non-modular 230×115×75mm = 90 bricks/sqm. 1:6 mortar (M4 grade IS 2250:1981).',
              },
              {
                clause: 'IS 2212:1991 — Mortar dry factor = 1.1',
                formula: 'Cement (mortar) = 0.20 bags/sqm × Wall area · Mortar dry factor 1.1',
                note: 'Mortar dry factor is 1.1, NOT 1.54 (that is for concrete). 4.5" partition wall: 0.10 bags/sqm at 1:4 mortar. AAC uses thin-bed adhesive — no sand.',
              },
              {
                clause: 'IS 1661:1972 Cl 8',
                formula: 'Plaster cement (internal, 12mm, 1:4) = 0.078 bags/sqm × Plaster area × 1.05',
                note: 'External 15mm 1:4 = 0.098 bags/sqm. Ceiling 6mm 1:3 = 0.042 bags/sqm. 5% wastage mandatory. Chicken mesh at all RCC–brick junctions.',
              },
              {
                clause: 'IS 2645:2003 — Terrace waterproofing',
                formula: 'Waterproofing cost (₹) = Avg rate (₹/sqft) × Terrace area (sqft)',
                note: 'BBC ₹155–225 · APP Membrane ₹120–175 · Liquid ₹85–130 · IPS ₹110–155 per sqft. Bathroom sunken: Cementitious ₹88–145 · Crystalline ₹145–220 per sqft.',
              },
              {
                clause: 'IS 2250:1981 — Mortar grades',
                formula: 'M1 (1:3) · M2 (1:4, load-bearing min) · M3 (1:5) · M4 (1:6, non-load-bearing min)',
                note: 'Load-bearing walls minimum M2 (1:4). 1:8 or weaker mortar used on site = defect. Most common mason fraud: quoting 1:4 but laying 1:8.',
              },
            ].map((item, i) => (
              <li key={i} className="flex gap-3">
                <span className="shrink-0 mt-0.5 text-[10px] w-5 text-right" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <p className="text-[10px] font-medium mb-0.5" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)', letterSpacing: '0.04em' }}>{item.clause}</p>
                  <p className="text-[12px] font-medium mb-0.5" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-plex-mono)' }}>{item.formula}</p>
                  <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.50)', fontFamily: 'var(--font-plex-sans)' }}>{item.note}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* PROOF-OF-WORK: first 2 BOQ rows always visible */}
        {!isPaid && (
          <div className="border rounded-[2px]" style={{ borderColor: 'rgba(255,255,255,0.10)' }}>
            <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[11px] uppercase tracking-widest" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                MATERIAL QUANTITIES — PREVIEW
              </p>
            </div>
            <div className="p-4">
              <table className="w-full text-[13px]" style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.20)', background: 'rgba(255,255,255,0.03)' }}>
                    <th className="text-left py-2 text-[9px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.50)', fontFamily: 'var(--font-plex-mono)' }}>Description</th>
                    <th className="text-right py-2 text-[9px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.50)', fontFamily: 'var(--font-plex-mono)', width: 44 }}>Unit</th>
                    <th className="text-right py-2 text-[9px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.50)', fontFamily: 'var(--font-plex-mono)', width: 70 }}>Qty</th>
                    <th className="text-right py-2 text-[9px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.50)', fontFamily: 'var(--font-plex-mono)', width: 90 }}>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td className="py-2" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-plex-sans)', fontSize: 13 }}>{extSpec.shortLabel} (external walls)</td>
                    <td className="py-2 text-right" style={{ color: 'rgba(255,255,255,0.50)', fontFamily: 'var(--font-plex-mono)', fontSize: 12 }}>{extSpec.unitLabel}</td>
                    <td className="py-2 text-right" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-plex-mono)', fontSize: 13, fontWeight: 500 }}>{r.brickworkQuantities.externalBricksOrBlocks.toLocaleString('en-IN')}</td>
                    <td className="py-2 text-right" style={{ color: 'rgba(255,255,255,0.50)', fontFamily: 'var(--font-plex-mono)', fontSize: 13 }}>—</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(30,34,39,0.018)' }}>
                    <td className="py-2" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-plex-sans)', fontSize: 13 }}>Cement — {extSpec.mortarRatio} mortar (brickwork)</td>
                    <td className="py-2 text-right" style={{ color: 'rgba(255,255,255,0.50)', fontFamily: 'var(--font-plex-mono)', fontSize: 12 }}>bags</td>
                    <td className="py-2 text-right" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-plex-mono)', fontSize: 13, fontWeight: 500 }}>{(r.brickworkQuantities.externalCementBags + r.brickworkQuantities.internalCementBags).toLocaleString('en-IN')}</td>
                    <td className="py-2 text-right" style={{ color: 'rgba(255,255,255,0.50)', fontFamily: 'var(--font-plex-mono)', fontSize: 13 }}>—</td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="py-2 text-center text-[11px]" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-plex-mono)', letterSpacing: '0.04em' }}>
                      + plaster, waterproofing, sand, labour &amp; totals locked →
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Blurred quantities section — PAID */}
        <div className="border rounded-[2px] overflow-hidden relative"
          style={{ borderColor: 'rgba(255,255,255,0.10)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[11px] uppercase tracking-widest"
              style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              {isPaid ? 'FULL IS-CODE BOQ — PHASE 2 · MASONRY & PLASTER' : 'EXACT QUANTITIES — BRICKWORK + PLASTER + WATERPROOFING'}
            </p>
          </div>

          <div style={{ filter: isPaid ? 'none' : 'blur(6px)', userSelect: isPaid ? 'auto' : 'none', transition: 'filter 0.5s' }}>
            <div className="p-4">

              {/* Per-floor brickwork breakdown (only when different wall types per floor) */}
              {r.perFloorBrickwork && r.perFloorBrickwork.length > 1 && (
                <div className="mb-5 p-3 rounded-[2px]"
                  style={{ border: '1px solid rgba(31,78,121,0.2)', background: 'rgba(31,78,121,0.03)' }}>
                  <p className="text-[10px] uppercase tracking-widest mb-2"
                    style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                    PER-FLOOR BRICKWORK BREAKDOWN
                  </p>
                  <table className="w-full text-[12px]" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        {['Floor', 'Wall Type', 'Area (sqm)', 'Units', 'Cost (₹)'].map(h => (
                          <th key={h} className={`py-1.5 px-1 text-[9px] uppercase tracking-widest ${h === 'Floor' || h === 'Wall Type' ? 'text-left' : 'text-right'}`}
                            style={{ color: 'rgba(255,255,255,0.40)', fontFamily: 'var(--font-plex-mono)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {r.perFloorBrickwork.map((flr, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(30,34,39,0.06)', background: i % 2 === 0 ? 'transparent' : 'rgba(30,34,39,0.015)' }}>
                          <td className="py-1.5 px-1 font-medium" style={{ fontFamily: 'var(--font-plex-mono)', color: '#1F4E79', whiteSpace: 'nowrap' }}>{flr.floorLabel}</td>
                          <td className="py-1.5 px-1 text-[11px]" style={{ fontFamily: 'var(--font-plex-sans)', color: 'var(--text-primary)' }}>
                            {flr.wallType.replace(/_/g, ' ')}
                          </td>
                          <td className="py-1.5 px-1 text-right" style={{ fontFamily: 'var(--font-plex-mono)', color: 'var(--text-primary)' }}>{flr.areaSqm.toFixed(1)}</td>
                          <td className="py-1.5 px-1 text-right" style={{ fontFamily: 'var(--font-plex-mono)', color: 'var(--text-primary)' }}>{flr.bricksOrBlocks.toLocaleString('en-IN')}</td>
                          <td className="py-1.5 px-1 text-right" style={{ fontFamily: 'var(--font-plex-mono)', color: 'var(--text-primary)' }}>{flr.materialCost.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Brickwork BOQ */}
              <p className="text-[10px] uppercase tracking-widest mb-2"
                style={{ color: 'rgba(255,255,255,0.40)', fontFamily: 'var(--font-plex-mono)' }}>
                BRICKWORK QUANTITIES (IS 1077:1992 + IS 2212:1991)
              </p>
              <table className="w-full text-[13px] mb-4" style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {['Item', 'Qty', 'Unit', 'Cost (₹)'].map(h => (
                      <th key={h} className={`py-2 text-[10px] uppercase tracking-widest ${h !== 'Item' ? 'text-right' : 'text-left'}`}
                        style={{ color: 'rgba(255,255,255,0.40)', fontFamily: 'var(--font-plex-mono)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      name: r.perFloorBrickwork && r.perFloorBrickwork.length > 0
                        ? `External walls — mixed (${r.perFloorBrickwork.length} floors)`
                        : `${extSpec.shortLabel} (external)`,
                      qty: r.brickworkQuantities.externalBricksOrBlocks,
                      unit: r.perFloorBrickwork && r.perFloorBrickwork.length > 0 ? 'units' : extSpec.unitLabel,
                      cost: r.costs.externalBrickworkMaterial,
                    },
                    ...(input.includeInternal && r.brickworkQuantities.internalBricksOrBlocks > 0 ? [{
                      name: `Internal partition ${input.internalWallType?.replace(/_/g, ' ')}`,
                      qty: r.brickworkQuantities.internalBricksOrBlocks,
                      unit: 'units',
                      cost: r.costs.internalPartitionMaterial,
                    }] : []),
                  ].map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(30,34,39,0.06)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                      <td className="py-2" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-plex-sans)' }}>{row.name}</td>
                      <td className="py-2 text-right" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-plex-mono)' }}>
                        {row.qty.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2 text-right" style={{ color: 'rgba(255,255,255,0.40)', fontFamily: 'var(--font-plex-mono)' }}>{row.unit}</td>
                      <td className="py-2 text-right" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-plex-mono)' }}>
                        {row.cost.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}

                  {/* Staircase Wall — separate line item, runs full building height */}
                  {r.staircaseWall && r.staircaseWall.materialCost > 0 && (
                    <tr style={{ borderBottom: '1px solid rgba(30,34,39,0.06)', background: 'rgba(31,78,121,0.03)' }}>
                      <td className="py-2" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-plex-sans)' }}>
                        <span style={{ fontWeight: 600 }}>Staircase Wall</span>
                        <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-[2px]"
                          style={{ background: 'rgba(31,78,121,0.1)', color: '#1F4E79', fontFamily: 'var(--font-plex-mono)', verticalAlign: 'middle' }}>
                          SHARED · ALL FLOORS
                        </span>
                        <br />
                        <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.40)', fontFamily: 'var(--font-plex-mono)' }}>
                          {r.staircaseWall.lengthFt.toFixed(1)} ft × {(r.staircaseWall.heightM / 0.3048).toFixed(1)} ft ht = {r.staircaseWall.areaSqm.toFixed(1)} sqm
                        </span>
                      </td>
                      <td className="py-2 text-right" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-plex-mono)' }}>
                        {r.staircaseWall.bricksOrBlocks.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2 text-right" style={{ color: 'rgba(255,255,255,0.40)', fontFamily: 'var(--font-plex-mono)' }}>
                        {r.staircaseWall.bricksOrBlocks > 0 ? 'units' : '—'}
                      </td>
                      <td className="py-2 text-right" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-plex-mono)' }}>
                        {r.staircaseWall.materialCost.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  )}

                  {/* Cement */}
                  <tr style={{ borderBottom: '1px solid rgba(30,34,39,0.06)' }}>
                    <td className="py-2" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-plex-sans)' }}>
                      Cement (brickwork) — {extSpec.mortarRatio} mortar
                    </td>
                    <td className="py-2 text-right" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-plex-mono)' }}>
                      {(r.brickworkQuantities.externalCementBags + r.brickworkQuantities.internalCementBags).toLocaleString('en-IN')}
                    </td>
                    <td className="py-2 text-right" style={{ color: 'rgba(255,255,255,0.40)', fontFamily: 'var(--font-plex-mono)' }}>bags</td>
                    <td className="py-2 text-right" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-plex-mono)' }}>—</td>
                  </tr>
                  {(r.brickworkQuantities.externalSandCft + r.brickworkQuantities.internalSandCft) > 0 && (
                    <tr style={{ borderBottom: '1px solid rgba(30,34,39,0.06)' }}>
                      <td className="py-2" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-plex-sans)' }}>Sand (brickwork)</td>
                      <td className="py-2 text-right" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-plex-mono)' }}>
                        {(r.brickworkQuantities.externalSandCft + r.brickworkQuantities.internalSandCft).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2 text-right" style={{ color: 'rgba(255,255,255,0.40)', fontFamily: 'var(--font-plex-mono)' }}>cft</td>
                      <td className="py-2 text-right" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-plex-mono)' }}>—</td>
                    </tr>
                  )}

                  {/* Plaster */}
                  {r.plasterQuantities && (
                    <>
                      <tr style={{ borderBottom: '1px solid rgba(30,34,39,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                        <td className="py-2" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-plex-sans)' }}>
                          Cement (plaster — IS 1661:1972, +5% wastage)
                        </td>
                        <td className="py-2 text-right" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-plex-mono)' }}>
                          {(r.plasterQuantities.externalPlasterCementBags + r.plasterQuantities.internalPlasterCementBags).toFixed(1)}
                        </td>
                        <td className="py-2 text-right" style={{ color: 'rgba(255,255,255,0.40)', fontFamily: 'var(--font-plex-mono)' }}>bags</td>
                        <td className="py-2 text-right" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-plex-mono)' }}>—</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid rgba(30,34,39,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                        <td className="py-2" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-plex-sans)' }}>Sand (plaster)</td>
                        <td className="py-2 text-right" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-plex-mono)' }}>
                          {(r.plasterQuantities.externalPlasterSandCft + r.plasterQuantities.internalPlasterSandCft).toFixed(1)}
                        </td>
                        <td className="py-2 text-right" style={{ color: 'rgba(255,255,255,0.40)', fontFamily: 'var(--font-plex-mono)' }}>cft</td>
                        <td className="py-2 text-right" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-plex-mono)' }}>
                          {r.costs.plasterMaterial.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    </>
                  )}

                  {/* Waterproofing */}
                  {r.waterproofingCosts && r.waterproofingCosts.total > 0 && (
                    <tr style={{ borderBottom: '1px solid rgba(30,34,39,0.06)' }}>
                      <td className="py-2" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-plex-sans)' }}>
                        Waterproofing (IS 2645:2003)
                      </td>
                      <td colSpan={2} className="py-2 text-right text-[11px]"
                        style={{ color: 'rgba(255,255,255,0.40)', fontFamily: 'var(--font-plex-sans)' }}>
                        Terrace + Bathroom
                      </td>
                      <td className="py-2 text-right" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-plex-mono)' }}>
                        {r.waterproofingCosts.total.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  )}

                  {/* Totals */}
                  <tr style={{ borderTop: '2px solid rgba(255,255,255,0.20)' }}>
                    <td colSpan={3} className="py-2 font-semibold text-[13px]"
                      style={{ fontFamily: 'var(--font-plex-sans)', color: 'var(--text-primary)' }}>
                      Total Material Cost
                    </td>
                    <td className="py-2 text-right font-bold text-[14px]"
                      style={{ fontFamily: 'var(--font-plex-mono)', color: 'var(--text-primary)' }}>
                      {r.costs.totalMaterial.toLocaleString('en-IN')}
                    </td>
                  </tr>
                  {input.includeLabour !== false ? (
                    <tr>
                      <td colSpan={3} className="py-1 text-[12px]"
                        style={{ fontFamily: 'var(--font-plex-sans)', color: 'rgba(255,255,255,0.45)' }}>
                        Labour (CPWD rates — brickwork + plaster + WP)
                      </td>
                      <td className="py-1 text-right text-[12px]"
                        style={{ fontFamily: 'var(--font-plex-mono)', color: 'rgba(255,255,255,0.45)' }}>
                        {r.labourCost.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-1 text-[11px]"
                        style={{ fontFamily: 'var(--font-plex-mono)', color: 'rgba(255,255,255,0.35)', fontStyle: 'italic' }}>
                        Labour cost not included in this estimate
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan={3} className="py-1 text-[12px]"
                      style={{ fontFamily: 'var(--font-plex-sans)', color: 'rgba(255,255,255,0.45)' }}>
                      Contractor overhead + margin (10%)
                    </td>
                    <td className="py-1 text-right text-[12px]"
                      style={{ fontFamily: 'var(--font-plex-mono)', color: 'rgba(255,255,255,0.45)' }}>
                      {r.overheadCost.toLocaleString('en-IN')}
                    </td>
                  </tr>
                  <tr style={{ borderTop: '2px solid #1F4E79', background: 'rgba(31,78,121,0.05)' }}>
                    <td colSpan={3} className="py-2 font-bold text-[14px]"
                      style={{ fontFamily: 'var(--font-plex-sans)', color: '#1F4E79' }}>
                      TOTAL STANDARD ESTIMATE
                    </td>
                    <td className="py-2 text-right font-bold text-[16px]"
                      style={{ fontFamily: 'var(--font-plex-mono)', color: '#1F4E79' }}>
                      {r.grandTotal.standard.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Contractor comparison (if quote entered) */}
              {isPaid && input.contractorQuote && input.contractorQuote > 0 && (
                <div className="mt-4 p-4 rounded-[2px]"
                  style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                  <p className="text-[11px] uppercase tracking-widest mb-3"
                    style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                    CONTRACTOR QUOTE COMPARISON
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Your Quote',      value: input.contractorQuote,       color: 'var(--text-primary)' },
                      { label: 'IS-Code Estimate', value: r.grandTotal.standard,      color: '#1F4E79' },
                      {
                        label: 'Difference',
                        value: Math.abs(input.contractorQuote - r.grandTotal.standard),
                        color: input.contractorQuote > r.grandTotal.standard * 1.15 ? '#8C3A22' : '#14532D',
                        prefix: input.contractorQuote > r.grandTotal.standard ? '+' : '-',
                      },
                    ].map(col => (
                      <div key={col.label} className="text-center">
                        <p className="text-[10px] uppercase tracking-widest mb-1"
                          style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-plex-mono)' }}>
                          {col.label}
                        </p>
                        <p className="text-[18px] font-bold"
                          style={{ color: col.color, fontFamily: 'var(--font-plex-mono)' }}>
                          {col.prefix ?? ''}{formatLakhs(col.value)}
                        </p>
                      </div>
                    ))}
                  </div>
                  {input.contractorQuote > r.grandTotal.standard * 1.15 && (
                    <p className="text-[12px] mt-3" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-sans)' }}>
                      ⚠ Contractor quote is {Math.round((input.contractorQuote / r.grandTotal.standard - 1) * 100)}% above IS-code estimate.
                      Common reasons: inflated brick counts, wrong mortar ratio, skipping curing, brick substitution.
                      Ask for itemised quote with brick count and mortar ratio specified.
                    </p>
                  )}
                  {input.contractorQuote <= r.grandTotal.standard * 1.15 && input.contractorQuote >= r.grandTotal.standard * 0.85 && (
                    <p className="text-[12px] mt-3" style={{ color: '#14532D', fontFamily: 'var(--font-plex-sans)' }}>
                      ✓ Contractor quote is within 15% of IS-code estimate — reasonable range. Verify itemised breakdown.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {!isPaid && <BlurOverlay onClick={handleUnlock} />}
        </div>

        {/* Payment gate — dramatic dark unlock card */}
        {!isPaid && (
          <div style={{ background: 'var(--bg-surface)', padding: '56px 48px', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: 'rgba(244,244,240,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
              YOUR PHASE 2 ESTIMATE IS READY
            </p>
            <h2 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 'clamp(28px,4vw,48px)', fontWeight: 600, color: '#F4F4F0', lineHeight: 1.15, marginBottom: 12 }}>
              Unlock Full IS-Code BOQ<br />+ Professional PDF
            </h2>
            <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 16, color: 'rgba(244,244,240,0.55)', margin: '0 auto 36px', maxWidth: 500 }}>
              Exact brick counts, plaster quantities, waterproofing schedule, and a 9-page IS-code PDF report
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, maxWidth: 480, margin: '0 auto' }}>
              <button
                onClick={handleUnlock}
                disabled={payStatus === 'creating' || payStatus === 'verifying' || payStatus === 'polling'}
                style={{
                  width: '100%', background: '#8C3A22', color: '#F4F4F0',
                  fontFamily: 'var(--font-plex-mono)', fontSize: 16, fontWeight: 600,
                  padding: '18px 32px', border: 'none', borderRadius: 6, cursor: 'pointer',
                  letterSpacing: '0.03em',
                  opacity: (payStatus === 'creating' || payStatus === 'verifying' || payStatus === 'polling') ? 0.6 : 1,
                }}
              >
                {payStatus === 'creating'  ? 'Creating order…' :
                 payStatus === 'verifying' ? 'Verifying payment…' :
                 payStatus === 'polling'   ? 'Confirming payment…' :
                 'Unlock Report — ₹699'}
              </button>
              <Link
                href="/#pricing"
                style={{ display: 'block', width: '100%', padding: '14px 20px', border: '1px dashed rgba(244,244,240,0.2)', textAlign: 'center', textDecoration: 'none', cursor: 'pointer' }}
              >
                <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: 'rgba(244,244,240,0.4)', marginBottom: 2 }}>Or save ₹596</p>
                <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 14, color: 'rgba(244,244,240,0.7)' }}>Complete Bundle — All 5 Apps <span style={{ fontFamily: 'var(--font-plex-mono)', color: '#F4F4F0' }}>₹2,999</span></p>
              </Link>
            </div>
            {payError && (
              <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 12, color: '#D99A06', marginTop: 12 }}>⚠ {payError}</p>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16, marginTop: 28 }}>
              {['IS 1077:1992 calculations', 'Exact brick counts', 'Plaster quantities', 'Contractor comparison', '9-page PDF report'].map(f => (
                <span key={f} style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 13, color: 'rgba(244,244,240,0.45)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#14532D', fontWeight: 700 }}>✓</span>{f}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Post-payment success */}
        {isPaid && (
          <div className="rounded-[2px] p-5"
            style={{ border: '2px solid #14532D', background: 'rgba(20,83,45,0.04)' }}>
            <p className="text-[11px] uppercase tracking-widest mb-2"
              style={{ color: '#14532D', fontFamily: 'var(--font-plex-mono)' }}>
              ✓ PAYMENT SUCCESSFUL — REPORT UNLOCKED
            </p>
            <p className="text-[13px] mb-4"
              style={{ color: 'rgba(255,255,255,0.60)', fontFamily: 'var(--font-plex-sans)' }}>
              Your full masonry estimate is visible above. Download your 9-page IS-code PDF report below.
            </p>
            {pdfStatus === 'generating' && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-[2px]"
                style={{ border: '1px solid rgba(31,78,121,0.3)', background: 'rgba(31,78,121,0.05)' }}>
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6" stroke="#1F4E79" strokeWidth="1.5" strokeDasharray="10 6" />
                </svg>
                <p className="text-[12px]" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                  GENERATING PDF REPORT — please wait…
                </p>
              </div>
            )}
            {pdfStatus === 'ready' && pdfUrl && (
              <button
                onClick={downloadPdf}
                disabled={isDownloading}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-[6px] text-[14px] font-semibold text-white"
                style={{ background: '#8C3A22', fontFamily: 'var(--font-plex-sans)', border: 'none', cursor: isDownloading ? 'wait' : 'pointer', opacity: isDownloading ? 0.7 : 1 }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2v8M5 7l3 3 3-3M3 13h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {isDownloading ? 'Downloading…' : 'Download PDF Report'}
              </button>
            )}
            {pdfStatus === 'error' && (
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-[12px]" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-mono)' }}>
                  ⚠ PDF generation failed. Check your email — the report may have been sent there.
                </p>
                <button onClick={generatePdf} className="text-[11px] underline"
                  style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-sans)' }}>
                  Retry
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── NEXT TOOL NUDGE ── */}
        <div className="rounded-[2px] p-5" style={{ border: '1px solid #1F4E79', background: 'rgba(31,78,121,0.04)' }}>
          <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
            NEXT — PHASE 3
          </p>
          <p className="text-[14px] font-semibold mb-1" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-plex-sans)' }}>
            Get your Electrical quantities — ElectroPro →
          </p>
          <p className="text-[12px] mb-3" style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-plex-sans)' }}>
            With your walls up, calculate circuits, DB panel, wire lengths and earthing costs with ElectroPro. Electrical is 8–12% of total project cost and the phase most skipped in estimates.
          </p>
          <a
            href="/tools/electropro"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[6px] text-[13px] font-semibold"
            style={{ background: '#1F4E79', color: '#F4F4F0', fontFamily: 'var(--font-plex-sans)', textDecoration: 'none' }}
          >
            Start ElectroPro →
          </a>
        </div>

        <div className="text-center pt-2">
          <button onClick={onStartOver} className="text-[12px] underline"
            style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-plex-sans)' }}>
            Start a new estimate
          </button>
        </div>
      </div>
    </div>
  )
}
