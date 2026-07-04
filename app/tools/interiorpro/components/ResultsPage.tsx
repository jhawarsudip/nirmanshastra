'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { animate } from 'framer-motion'
import {
  type InteriorResult,
  type InteriorInput,
  type InteriorGrade,
  formatLakhs,
  FLOORING_RATES,
  KITCHEN_RATES,
  FALSE_CEILING_RATES,
} from '../interiorpro-engine'
import Link from 'next/link'
import { PAYMENT_BYPASS } from '@/lib/payment-config'

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any
  }
}

interface Props {
  result:      InteriorResult
  input:       InteriorInput
  estimateId:  string | null
  contactName: string
  onStartOver: () => void
}

type PayStatus = 'idle' | 'creating' | 'open' | 'verifying' | 'polling' | 'paid' | 'error'
type PdfStatus = 'idle' | 'generating' | 'ready' | 'error'

const GRADE_LABELS: Record<InteriorGrade, string> = {
  basic: 'Basic', standard: 'Standard', premium: 'Premium', luxury: 'Luxury',
}

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
        <p className="text-[12px]" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>
          {description}
        </p>
      </div>
    </div>
  )
}

function BlurOverlay({ onClick }: { onClick: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[2px] z-10"
      style={{ background: 'rgba(244,244,240,0.85)', backdropFilter: 'blur(2px)' }}>
      <div className="text-center px-6 py-5 rounded-[2px] max-w-sm"
        style={{ border: '1px solid rgba(30,34,39,0.15)', background: '#F4F4F0' }}>
        <p className="text-[11px] uppercase tracking-widest mb-1"
          style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
          ₹499 · UNLOCK TO VIEW
        </p>
        <p className="text-[13px] mb-3" style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-sans)' }}>
          Exact quantities, room breakdown, labour costs, and contractor comparison
        </p>
        <button onClick={onClick}
          className="px-4 py-2 rounded-[6px] text-[13px] font-semibold text-white"
          style={{ background: '#8C3A22', fontFamily: 'var(--font-plex-sans)' }}>
          Unlock Now ₹499
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
      const getRes = await fetch(`/api/interiorpro/generate-pdf?estimateId=${estimateId}`)
      const getJson = await getRes.json()
      if (getJson.pdfUrl) { setPdfUrl(getJson.pdfUrl); setPdfStatus('ready'); return }
      const postRes = await fetch('/api/interiorpro/generate-pdf', {
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
      a.download = 'NirmanShastra-InteriorPro-Report.pdf'
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
        // TEMPORARY - testing real payment flow at ₹1, revert to 49900 before real launch
        body: JSON.stringify({ estimateId, amount: 100 }),
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
        description: 'InteriorPro Report — Phase 5 Interior',
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
  const grades: InteriorGrade[] = ['basic', 'standard', 'premium', 'luxury']

  return (
    <div className="min-h-screen bg-sheet-white pb-16">
      {/* Header */}
      <div className="py-8 px-6 md:px-12 lg:px-16" style={{ borderBottom: '1px solid rgba(30,34,39,0.1)' }}>
        <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: '#1F4E79', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
          05 · INTERIOR ESTIMATE
        </p>
        <h1 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 'clamp(22px,3vw,32px)', fontWeight: 600, color: '#1E2227', lineHeight: 1.2 }}>
          Your Estimate is Ready
        </h1>
      </div>

      <div className="px-6 md:px-12 lg:px-16 pt-6 space-y-6">

        {/* Test mode banner */}
        <div className="px-4 py-2 rounded-[2px] flex items-center gap-2"
          style={{ background: 'rgba(217,154,6,0.1)', border: '1px solid rgba(217,154,6,0.4)' }}>
          <span style={{ color: '#D99A06', fontSize: 13 }}>⚠</span>
          <p className="text-[12px]" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)' }}>
            TEST MODE — Live Razorpay at ₹1. Use a real UPI or bank card. Test cards do not work on live keys. Revert amount to 49900 before launch.
          </p>
        </div>

        {/* Preview mode banner */}
        {PAYMENT_BYPASS && (
          <div className="px-4 py-2 rounded-[2px] flex items-center gap-2"
            style={{ background: 'rgba(20,83,45,0.08)', border: '1px solid rgba(20,83,45,0.35)' }}>
            <span style={{ color: '#14532D', fontSize: 13 }}>✓</span>
            <p className="text-[12px]" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)' }}>
              PREVIEW MODE — Full report visible for testing
            </p>
          </div>
        )}

        {/* Grand total — FREE */}
        <div style={{ background: '#1E2227', position: 'relative', overflow: 'hidden' }}>
          <div className="results-blob-1" aria-hidden="true" />
          <div className="results-blob-2" aria-hidden="true" />
          <div style={{ position: 'relative', zIndex: 1, padding: '56px 48px', textAlign: 'center', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', background: 'rgba(30,34,39,0.18)' }}>
          <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: 'rgba(244,244,240,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
            PHASE 5 — INTERIOR · {input.city}, {input.state} · {GRADE_LABELS[input.grade]} GRADE
          </p>
          <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 15, color: 'rgba(244,244,240,0.55)', marginBottom: 16 }}>
            {r.totalBuaSqft.toFixed(0)} sqft · {input.numFloors} floor{input.numFloors > 1 ? 's' : ''} · {input.numBedrooms} BHK
          </p>
          <div className="grand-total-pulse" style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 'clamp(64px,8vw,96px)', fontWeight: 700, color: '#F4F4F0', lineHeight: 1, marginBottom: 8 }}>
            <CountUp to={r.grandTotal[input.grade]} format={formatLakhs} />
          </div>
          <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 13, color: 'rgba(244,244,240,0.35)', marginBottom: 36 }}>{input.grade} estimate</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 600, margin: '0 auto' }}>
            {grades.map(g => (
              <div key={g} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 20px',
                border: g === input.grade ? '1.5px solid rgba(31,78,121,0.7)' : '1px solid rgba(244,244,240,0.1)',
                background: g === input.grade ? 'rgba(31,78,121,0.2)' : 'rgba(244,244,240,0.03)',
              }}>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 9, color: g === input.grade ? '#7BA7CC' : 'rgba(244,244,240,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>{GRADE_LABELS[g]}</p>
                  <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: 'rgba(244,244,240,0.3)' }}>₹{r.perSqftCost[g]}/sqft</p>
                </div>
                <div style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 24, fontWeight: 600, color: '#F4F4F0' }}>
                  {formatLakhs(r.grandTotal[g])}
                </div>
              </div>
            ))}
          </div>
          </div>{/* /glass inner */}
        </div>{/* /gradient mesh outer */}

        {/* Grade comparison table — FREE (unique feature) */}
        <div className="border rounded-[2px]"
          style={{ borderColor: 'rgba(31,78,121,0.3)', background: 'rgba(31,78,121,0.02)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(31,78,121,0.2)' }}>
            <p className="text-[11px] uppercase tracking-widest"
              style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              ✦ GRADE COMPARISON TABLE — ALL 4 TIERS (FREE)
            </p>
            <p className="text-[11px] mt-1" style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-sans)' }}>
              Interior grade affects total project cost more than any single phase. Basic 1.0× → Luxury 3.5×
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]" style={{ borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: 480 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(31,78,121,0.2)' }}>
                  <th className="text-left py-2 px-4 text-[9px] uppercase tracking-widest"
                    style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)', width: 140 }}>
                    Item
                  </th>
                  {grades.map(g => (
                    <th key={g} className="text-right py-2 px-3 text-[9px] uppercase tracking-widest"
                      style={{
                        color:      g === input.grade ? '#1F4E79' : 'rgba(30,34,39,0.45)',
                        fontFamily: 'var(--font-plex-mono)',
                        background: g === input.grade ? 'rgba(31,78,121,0.06)' : 'transparent',
                      }}>
                      {GRADE_LABELS[g]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: `Flooring rate`, vals: grades.map(g => `₹${FLOORING_RATES[g]}/sqft`) },
                  { label: `Kitchen rate`, vals: grades.map(g => `₹${KITCHEN_RATES[g].toLocaleString('en-IN')}/rft`) },
                  { label: `False ceiling rate`, vals: grades.map(g => FALSE_CEILING_RATES[g] ? `₹${FALSE_CEILING_RATES[g]}/sqft` : '—') },
                  { label: `Flooring cost`, vals: r.gradeComparison.map(g => formatLakhs(g.flooringCost)) },
                  { label: `Kitchen cost`, vals: r.gradeComparison.map(g => formatLakhs(g.kitchenCost)) },
                  { label: `False ceiling cost`, vals: r.gradeComparison.map(g => input.includeFalseCeiling ? formatLakhs(g.falseCeilingCost) : '—') },
                  { label: `Paint cost`, vals: r.gradeComparison.map(g => formatLakhs(g.paintCost)) },
                  { label: `Doors cost`, vals: r.gradeComparison.map(g => formatLakhs(g.doorsCost)) },
                  { label: `Grade multiplier`, vals: r.gradeComparison.map(g => `${g.multiplier}×`) },
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(30,34,39,0.06)', background: i % 2 === 0 ? 'transparent' : 'rgba(30,34,39,0.015)' }}>
                    <td className="py-2 px-4 text-[11px]"
                      style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-sans)' }}>
                      {row.label}
                    </td>
                    {row.vals.map((v, j) => (
                      <td key={j} className="py-2 px-3 text-right text-[11px]"
                        style={{
                          color:      grades[j] === input.grade ? '#1F4E79' : '#1E2227',
                          fontFamily: 'var(--font-plex-mono)',
                          fontWeight: grades[j] === input.grade ? 700 : 400,
                          background: grades[j] === input.grade ? 'rgba(31,78,121,0.04)' : 'transparent',
                        }}>
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr style={{ borderTop: '2px solid #1E2227', background: 'rgba(30,34,39,0.03)' }}>
                  <td className="py-2 px-4 text-[11px] font-semibold"
                    style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>
                    TOTAL (incl. labour)
                  </td>
                  {r.gradeComparison.map(g => (
                    <td key={g.grade} className="py-2 px-3 text-right text-[12px] font-bold"
                      style={{
                        color:      g.grade === input.grade ? '#1F4E79' : '#1E2227',
                        fontFamily: 'var(--font-plex-mono)',
                        background: g.grade === input.grade ? 'rgba(31,78,121,0.08)' : 'transparent',
                      }}>
                      {formatLakhs(r.grandTotal[g.grade])}
                    </td>
                  ))}
                </tr>
                <tr style={{ borderTop: '1px solid rgba(30,34,39,0.1)' }}>
                  <td className="py-1.5 px-4 text-[10px]"
                    style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-sans)' }}>
                    per sqft BUA
                  </td>
                  {r.gradeComparison.map(g => (
                    <td key={g.grade} className="py-1.5 px-3 text-right text-[10px]"
                      style={{
                        color:      g.grade === input.grade ? '#1F4E79' : 'rgba(30,34,39,0.5)',
                        fontFamily: 'var(--font-plex-mono)',
                        background: g.grade === input.grade ? 'rgba(31,78,121,0.04)' : 'transparent',
                      }}>
                      ₹{r.perSqftCost[g.grade]}/sqft
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Phase context — FREE */}
        <div className="border rounded-[2px] p-4"
          style={{ borderColor: 'rgba(31,78,121,0.25)', background: 'rgba(31,78,121,0.03)' }}>
          <p className="text-[11px] uppercase tracking-widest mb-2"
            style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
            PHASE 5 CONTEXT — IS 15477 · IS 2395 · IS 277 · IS 2645
          </p>
          <p className="text-[14px] font-medium mb-1"
            style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>
            Interior = {r.phaseContext.percentOfTotal} of total project cost
          </p>
          <p className="text-[12px] mb-3"
            style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
            {r.phaseContext.gradeImpact}
          </p>
          <p className="text-[11px] uppercase tracking-widest mb-1"
            style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-mono)' }}>
            Common Overcharging Methods to Watch:
          </p>
          <ul className="space-y-1">
            {r.phaseContext.overchargingRisks.map((risk, i) => (
              <li key={i} className="flex gap-2 text-[12px]"
                style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>
                <span style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-mono)', fontSize: 10, marginTop: 2 }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* IS Compliance Panel — FREE */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.18)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.1)' }}>
            <p className="text-[11px] uppercase tracking-widest"
              style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              IS COMPLIANCE PANEL — IS 15477 · IS 2395 · IS 277 · IS 2645 · NBC 2016
            </p>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {r.compliance.map(c => (
              <StampBadge key={c.id} status={c.status} clause={c.clause} description={c.detail} />
            ))}
          </div>
        </div>

        {/* Technical reminders — FREE */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.18)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.1)' }}>
            <p className="text-[11px] uppercase tracking-widest"
              style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              10 TECHNICAL REMINDERS — IS-CODE MANDATED
            </p>
          </div>
          <ol className="p-4 space-y-2">
            {r.technicalReminders.map((rem, i) => (
              <li key={i} className="flex gap-3 text-[13px]"
                style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>
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
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.18)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.1)' }}>
            <p className="text-[11px] uppercase tracking-widest" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              HOW THIS IS CALCULATED — FORMULAS &amp; IS CLAUSES
            </p>
          </div>
          <ol className="p-4 space-y-4">
            {[
              {
                clause: 'IS 8828:2007 — Ceramic tile installation',
                formula: 'Tiles (sqft with wastage) = Floor area (sqft) × 1.10 · Tile adhesive (bags) = Area × 1.10 × 0.42 kg/sqft ÷ 20 kg/bag',
                note: 'IS 8828:2007 mandates 10% wastage for cuts, breaks, and pattern matching. Adhesive rate 0.42 kg/sqft. 20 kg bag coverage ≈ 47 sqft. Anti-fracture membrane for heating systems.',
              },
              {
                clause: 'IS 2395:1994 — Paint coverage',
                formula: 'Paint (L) = BUA (sqft) × 0.18 L/sqft · Wall area (sqm) = BUA × 3.4',
                note: 'IS 2395:1994 Cl 5.3: emulsion coverage ≈ 10–12 sqm/L per coat (2 coats standard). 0.18 L/sqft BUA is the thumb rule for full internal + external painting. Primer coat separate.',
              },
              {
                clause: 'IS 277:2003 — False ceiling (GI framing)',
                formula: 'Basic false ceiling area = BUA × 0.20 · Standard/Premium/Luxury = BUA × 0.70',
                note: 'IS 277:2003 for GI sheet framing. Basic: living + dining only (20% BUA). Standard/Premium/Luxury: full house (70% BUA). Grid spacing 600×600mm standard.',
              },
              {
                clause: 'Modular kitchen — rate per sqft of BUA',
                formula: 'Kitchen cost (₹) = Rate (₹/sqft BUA) × BUA (sqft)',
                note: 'Basic ₹1,200 · Standard ₹2,200 · Premium ₹3,800 · Luxury ₹7,500 per sqft of BUA. Includes cabinets, countertop, and hardware. Does not include appliances.',
              },
              {
                clause: 'Flooring — rate per sqft',
                formula: 'Flooring cost (₹) = Rate (₹/sqft) × Floor area (sqft with wastage)',
                note: 'Basic ₹65 · Standard ₹120 · Premium ₹265 · Luxury ₹650 per sqft. Includes material and labour. Tile sizes above 800×800mm carry 15% upcharge for extra cuts.',
              },
            ].map((item, i) => (
              <li key={i} className="flex gap-3">
                <span className="shrink-0 mt-0.5 text-[10px] w-5 text-right" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <p className="text-[10px] font-medium mb-0.5" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)', letterSpacing: '0.04em' }}>{item.clause}</p>
                  <p className="text-[12px] font-medium mb-0.5" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)' }}>{item.formula}</p>
                  <p className="text-[11px]" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-sans)' }}>{item.note}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* PROOF-OF-WORK: first 2 BOQ rows always visible */}
        {!isPaid && (
          <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.18)' }}>
            <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.1)' }}>
              <p className="text-[11px] uppercase tracking-widest" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                MATERIAL SCHEDULE — PREVIEW
              </p>
            </div>
            <div className="p-4">
              <table className="w-full text-[13px]" style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #1E2227', background: 'rgba(30,34,39,0.04)' }}>
                    <th className="text-left py-2 text-[9px] uppercase tracking-widest" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>Description</th>
                    <th className="text-right py-2 text-[9px] uppercase tracking-widest" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)', width: 60 }}>Unit</th>
                    <th className="text-right py-2 text-[9px] uppercase tracking-widest" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)', width: 80 }}>Qty</th>
                    <th className="text-right py-2 text-[9px] uppercase tracking-widest" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)', width: 90 }}>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid rgba(30,34,39,0.08)' }}>
                    <td className="py-2" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)', fontSize: 13 }}>Flooring — tiles with 10% wastage (IS 15477:2004)</td>
                    <td className="py-2 text-right" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)', fontSize: 12 }}>sqft</td>
                    <td className="py-2 text-right" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)', fontSize: 13, fontWeight: 500 }}>{r.flooringSchedule.withWastageSqft.toLocaleString('en-IN')}</td>
                    <td className="py-2 text-right" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)', fontSize: 13 }}>—</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(30,34,39,0.08)', background: 'rgba(30,34,39,0.018)' }}>
                    <td className="py-2" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)', fontSize: 13 }}>Kitchen cabinets — modular ({GRADE_LABELS[input.grade]})</td>
                    <td className="py-2 text-right" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)', fontSize: 12 }}>rft</td>
                    <td className="py-2 text-right" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)', fontSize: 13, fontWeight: 500 }}>{input.kitchenRft}</td>
                    <td className="py-2 text-right" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)', fontSize: 13 }}>—</td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="py-2 text-center text-[11px]" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)', letterSpacing: '0.04em' }}>
                      + false ceiling, paint, doors, room-wise breakdown &amp; totals locked →
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Blurred section — PAID */}
        <div className="border rounded-[2px] overflow-hidden relative"
          style={{ borderColor: 'rgba(30,34,39,0.18)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.1)' }}>
            <p className="text-[11px] uppercase tracking-widest"
              style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              {isPaid ? 'FULL IS-CODE BOQ — PHASE 5 · INTERIOR' : 'EXACT QUANTITIES — FLOORING SCHEDULE + ROOM BREAKDOWN + COMPLETE BOQ'}
            </p>
          </div>

          <div style={{ filter: isPaid ? 'none' : 'blur(6px)', userSelect: isPaid ? 'auto' : 'none', transition: 'filter 0.5s' }}>
            <div className="p-4">

              {/* Flooring schedule */}
              <p className="text-[10px] uppercase tracking-widest mb-2"
                style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
                FLOORING SCHEDULE — IS 15477:2004 (TILE ADHESIVE · POLYMER GROUT)
              </p>
              <table className="w-full text-[13px] mb-5" style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <tbody>
                  {[
                    { label: 'Total BUA (flooring area)', value: `${r.flooringSchedule.totalBuaSqft.toLocaleString('en-IN')} sqft` },
                    { label: `With 10% wastage (IS 15477:2004)`, value: `${r.flooringSchedule.withWastageSqft.toLocaleString('en-IN')} sqft` },
                    { label: `Tile size`, value: r.flooringSchedule.tileSize },
                    { label: `Tile quantity to order`, value: `${r.flooringSchedule.tileQty.toLocaleString('en-IN')} tiles` },
                    { label: `Tile adhesive (IS 15477:2004 — not cement)`, value: `${r.flooringSchedule.adhesiveBags} bags × 20kg` },
                    { label: `Polymer grout (not plain cement)`, value: `${r.flooringSchedule.groutKg} kg` },
                  ].map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(30,34,39,0.06)', background: i % 2 === 0 ? 'transparent' : 'rgba(30,34,39,0.02)' }}>
                      <td className="py-2" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>{row.label}</td>
                      <td className="py-2 text-right font-bold" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Room breakdown */}
              <p className="text-[10px] uppercase tracking-widest mb-2"
                style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
                ROOM-BY-ROOM BREAKDOWN — {GRADE_LABELS[input.grade].toUpperCase()} GRADE
              </p>
              <table className="w-full text-[13px] mb-5" style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
                    {['Room', 'Area (sqft)', 'Flooring Cost (₹)'].map(h => (
                      <th key={h} className={`py-2 text-[10px] uppercase tracking-widest ${h === 'Room' ? 'text-left' : 'text-right'}`}
                        style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {r.roomBreakdown.map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(30,34,39,0.06)', background: i % 2 === 0 ? 'transparent' : 'rgba(30,34,39,0.02)' }}>
                      <td className="py-2" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>{row.room}</td>
                      <td className="py-2 text-right" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>{row.areaSqft.toLocaleString('en-IN')}</td>
                      <td className="py-2 text-right font-bold" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)' }}>{row.flooringCost.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Paint schedule */}
              <p className="text-[10px] uppercase tracking-widest mb-2"
                style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
                PAINT SCHEDULE — IS 2395:1994
              </p>
              <table className="w-full text-[13px] mb-5" style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <tbody>
                  {[
                    { label: 'Emulsion paint (0.18L/sqft BUA — IS 2395:1994)', value: `${r.paintSchedule.paintLitres} litres` },
                    { label: 'Primer coat (mandatory — IS 2395:1994 Part 1)', value: `${r.paintSchedule.primerLitres} litres` },
                    { label: 'Putty bags (smooth surface before primer)', value: `${r.paintSchedule.puttyBags} kg` },
                    { label: 'Number of paint coats (post primer)', value: `${r.paintSchedule.numCoats} coats` },
                  ].map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(30,34,39,0.06)', background: i % 2 === 0 ? 'transparent' : 'rgba(30,34,39,0.02)' }}>
                      <td className="py-2" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>{row.label}</td>
                      <td className="py-2 text-right font-bold" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Complete BOQ */}
              <p className="text-[10px] uppercase tracking-widest mb-2"
                style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
                COMPLETE BOQ — {GRADE_LABELS[input.grade].toUpperCase()} GRADE
              </p>
              <table className="w-full text-[13px]" style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <tbody>
                  {[
                    { label: `Flooring (${r.flooringSchedule.withWastageSqft.toLocaleString('en-IN')} sqft with wastage)`, cost: r.costs.flooringMaterial },
                    { label: `Kitchen (${input.kitchenRft} rft — ${GRADE_LABELS[input.grade]})`,                             cost: r.costs.kitchenMaterial },
                    { label: input.includeFalseCeiling ? `False ceiling (${input.falseCeilingSqft} sqft — IS 277:2003 MS)` : 'False ceiling (not included)', cost: r.costs.falseCeilingMaterial },
                    { label: `Paint (${r.paintSchedule.paintLitres}L emulsion + ${r.paintSchedule.primerLitres}L primer)`, cost: r.costs.paintMaterial },
                    { label: `Doors (${input.numDoors} units — ${GRADE_LABELS[input.grade]})`,                               cost: r.costs.doorsMaterial },
                  ].map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(30,34,39,0.06)', background: i % 2 === 0 ? 'transparent' : 'rgba(30,34,39,0.02)' }}>
                      <td className="py-2" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>{row.label}</td>
                      <td className="py-2 text-right" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)' }}>{row.cost.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: '2px solid #1E2227' }}>
                    <td className="py-2 font-semibold" style={{ fontFamily: 'var(--font-plex-sans)', color: '#1E2227' }}>Total Material</td>
                    <td className="py-2 text-right font-bold text-[14px]" style={{ fontFamily: 'var(--font-plex-mono)', color: '#1E2227' }}>{r.costs.totalMaterial.toLocaleString('en-IN')}</td>
                  </tr>
                  {input.includeLabour !== false ? (
                    <tr>
                      <td className="py-1 text-[12px]" style={{ fontFamily: 'var(--font-plex-sans)', color: 'rgba(30,34,39,0.5)' }}>
                        Labour (CPWD — tile mason + carpenter + painter + false ceiling + supervisor)
                      </td>
                      <td className="py-1 text-right text-[12px]" style={{ fontFamily: 'var(--font-plex-mono)', color: 'rgba(30,34,39,0.5)' }}>{r.labourCost.toLocaleString('en-IN')}</td>
                    </tr>
                  ) : (
                    <tr>
                      <td colSpan={2} className="py-1 text-[11px]"
                        style={{ fontFamily: 'var(--font-plex-mono)', color: 'rgba(30,34,39,0.4)', fontStyle: 'italic' }}>
                        Labour cost not included in this estimate
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td className="py-1 text-[12px]" style={{ fontFamily: 'var(--font-plex-sans)', color: 'rgba(30,34,39,0.5)' }}>Contractor overhead + margin (8%)</td>
                    <td className="py-1 text-right text-[12px]" style={{ fontFamily: 'var(--font-plex-mono)', color: 'rgba(30,34,39,0.5)' }}>{r.overheadCost.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr style={{ borderTop: '2px solid #1F4E79', background: 'rgba(31,78,121,0.05)' }}>
                    <td className="py-2 font-bold text-[14px]" style={{ fontFamily: 'var(--font-plex-sans)', color: '#1F4E79' }}>
                      TOTAL — {GRADE_LABELS[input.grade].toUpperCase()}
                    </td>
                    <td className="py-2 text-right font-bold text-[16px]" style={{ fontFamily: 'var(--font-plex-mono)', color: '#1F4E79' }}>
                      {r.grandTotal[input.grade].toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Contractor comparison */}
              {isPaid && input.contractorQuote && input.contractorQuote > 0 && (
                <div className="mt-4 p-4 rounded-[2px]"
                  style={{ border: '1px solid rgba(30,34,39,0.15)', background: 'rgba(30,34,39,0.02)' }}>
                  <p className="text-[11px] uppercase tracking-widest mb-3"
                    style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                    CONTRACTOR QUOTE COMPARISON
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Your Quote',        value: input.contractorQuote,              color: '#1E2227' },
                      { label: 'IS-Code Estimate',  value: r.grandTotal[input.grade],           color: '#1F4E79' },
                      {
                        label: 'Difference',
                        value: Math.abs(input.contractorQuote - r.grandTotal[input.grade]),
                        color: input.contractorQuote > r.grandTotal[input.grade] * 1.15 ? '#8C3A22' : '#14532D',
                        prefix: input.contractorQuote > r.grandTotal[input.grade] ? '+' : '-',
                      },
                    ].map(col => (
                      <div key={col.label} className="text-center">
                        <p className="text-[10px] uppercase tracking-widest mb-1"
                          style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
                          {col.label}
                        </p>
                        <p className="text-[18px] font-bold"
                          style={{ color: col.color, fontFamily: 'var(--font-plex-mono)' }}>
                          {('prefix' in col ? col.prefix : '')}{formatLakhs(col.value)}
                        </p>
                      </div>
                    ))}
                  </div>
                  {input.contractorQuote > r.grandTotal[input.grade] * 1.15 && (
                    <p className="text-[12px] mt-3" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-sans)' }}>
                      ⚠ Interior quote is {Math.round((input.contractorQuote / r.grandTotal[input.grade] - 1) * 100)}% above IS-code estimate.
                      Common reasons: inflated tile wastage, premium material billing for standard installation, non-IS tile adhesive billed at adhesive rates, plain cement grout billed as polymer.
                    </p>
                  )}
                  {input.contractorQuote <= r.grandTotal[input.grade] * 1.15 && input.contractorQuote >= r.grandTotal[input.grade] * 0.85 && (
                    <p className="text-[12px] mt-3" style={{ color: '#14532D', fontFamily: 'var(--font-plex-sans)' }}>
                      ✓ Quote within 15% of IS-code estimate — reasonable range. Verify tile adhesive grade (IS 15477:2004) and polymer grout specification before signing.
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
          <div style={{ background: '#1E2227', padding: '56px 48px', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: 'rgba(244,244,240,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
              YOUR PHASE 5 ESTIMATE IS READY
            </p>
            <h2 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 'clamp(28px,4vw,48px)', fontWeight: 600, color: '#F4F4F0', lineHeight: 1.15, marginBottom: 12 }}>
              Unlock Full IS-Code BOQ<br />+ Professional PDF
            </h2>
            <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 16, color: 'rgba(244,244,240,0.55)', margin: '0 auto 36px', maxWidth: 500 }}>
              Room-by-room flooring, paint litres, complete BOQ, and a 9-page IS-code PDF report
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
                 'Unlock Report — ₹499'}
              </button>
              <Link
                href="/#pricing"
                style={{ display: 'block', width: '100%', padding: '14px 20px', border: '1px dashed rgba(244,244,240,0.2)', textAlign: 'center', textDecoration: 'none', cursor: 'pointer' }}
              >
                <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: 'rgba(244,244,240,0.4)', marginBottom: 2 }}>Or save ₹496</p>
                <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 14, color: 'rgba(244,244,240,0.7)' }}>Complete Bundle — All 5 Apps <span style={{ fontFamily: 'var(--font-plex-mono)', color: '#F4F4F0' }}>₹1,999</span></p>
              </Link>
            </div>
            {payError && (
              <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 12, color: '#D99A06', marginTop: 12 }}>⚠ {payError}</p>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16, marginTop: 28 }}>
              {['Flooring schedule with tile count', 'Paint litres (IS 2395:1994)', 'Room-by-room breakdown', 'Complete BOQ', 'Contractor comparison', '9-page PDF report'].map(f => (
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
              style={{ color: 'rgba(30,34,39,0.65)', fontFamily: 'var(--font-plex-sans)' }}>
              Your full interior estimate is visible above. Download your 9-page IS-code PDF report below.
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
            NEXT — GRAND TOTAL
          </p>
          <p className="text-[14px] font-semibold mb-1" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>
            Combine all phases — Grand Total →
          </p>
          <p className="text-[12px] mb-3" style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-sans)' }}>
            You&apos;ve estimated all 5 phases. Now bring StructoPro, MasonryPro, ElectroPro, PlumbPro, and InteriorPro together into a single project cost summary.
          </p>
          <a
            href="/tools/grand-total"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[6px] text-[13px] font-semibold"
            style={{ background: '#1F4E79', color: '#F4F4F0', fontFamily: 'var(--font-plex-sans)', textDecoration: 'none' }}
          >
            View Grand Total →
          </a>
        </div>

        <div className="text-center pt-2">
          <button onClick={onStartOver} className="text-[12px] underline"
            style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-sans)' }}>
            Start a new estimate
          </button>
        </div>
      </div>
    </div>
  )
}
