'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { animate } from 'framer-motion'
import {
  type PlumbResult,
  type PlumbInput,
  formatLakhs,
} from '../plumbpro-engine'
import Link from 'next/link'
import { PAYMENT_BYPASS } from '@/lib/payment-config'
import dynamic from 'next/dynamic'
import type { FloorDatum } from '@/components/3d/types'

const PlumbMassingPreview3DWrapper = dynamic(
  () => import('./MassingPreview3DWrapper'),
  { ssr: false, loading: () => null }
)

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any
  }
}

interface Props {
  result:      PlumbResult
  input:       PlumbInput
  estimateId:  string | null
  contactName: string
  onStartOver: () => void
}

type PayStatus = 'idle' | 'creating' | 'open' | 'verifying' | 'polling' | 'paid' | 'error'
type PdfStatus = 'idle' | 'generating' | 'ready' | 'error'

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
          ₹499 · UNLOCK TO VIEW
        </p>
        <p className="text-[13px] mb-3" style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-plex-sans)' }}>
          Exact pipe lengths, fixture counts, tank costs, and plumber quote comparison
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
  const [show3D, setShow3D] = useState(false)

  const plumb3DFloors = useMemo((): FloorDatum[] => {
    const totalFloors = input.numFloors ?? 1
    const heightM = 3.048
    const floorNames = ['Ground Floor', 'First Floor', 'Second Floor', 'Third Floor', 'Fourth Floor', 'Fifth Floor']
    return Array.from({ length: totalFloors }, (_, i) => ({
      areaSqft: input.buaPerFloorSqft,
      heightM,
      name: floorNames[i] ?? `Floor ${i}`,
    }))
  }, [input.numFloors, input.buaPerFloorSqft])

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
      const getRes = await fetch(`/api/plumbpro/generate-pdf?estimateId=${estimateId}`)
      const getJson = await getRes.json()
      if (getJson.pdfUrl) { setPdfUrl(getJson.pdfUrl); setPdfStatus('ready'); return }
      const postRes = await fetch('/api/plumbpro/generate-pdf', {
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
      a.download = 'NirmanShastra-PlumbingPro-Report.pdf'
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
        description: 'PlumbingPro Report — Phase 4 Plumbing',
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

  return (
    <div className="min-h-screen  pb-16">
      {/* Header */}
      <div className="py-8 px-6 md:px-12 lg:px-16" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: '#1F4E79', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
          04 · PLUMBING ESTIMATE
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
            PHASE 4 — PLUMBING · {input.city}, {input.state}
          </p>
          <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 15, color: 'rgba(244,244,240,0.55)', marginBottom: 16 }}>
            {r.totalBuaSqft.toFixed(0)} sqft · {input.numFloors} floor{input.numFloors > 1 ? 's' : ''} · {input.numBathrooms} bathroom{input.numBathrooms > 1 ? 's' : ''}
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
          </div>{/* /glass inner */}
        </div>{/* /gradient mesh outer */}

        {/* IS 1172:1993 Water Demand — FREE (unique feature) */}
        <div className="border rounded-[2px]"
          style={{ borderColor: 'rgba(31,78,121,0.3)', background: 'rgba(31,78,121,0.02)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(31,78,121,0.2)' }}>
            <p className="text-[11px] uppercase tracking-widest"
              style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              IS 1172:1993 WATER DEMAND CALCULATION (FREE)
            </p>
            <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-plex-sans)' }}>
              Tank undersizing is dangerous. Verify contractor&apos;s proposed size against IS requirements.
            </p>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'DAILY DEMAND',  value: `${r.waterDemand.dailyDemandL.toLocaleString('en-IN')} L`, sub: `${r.waterDemand.lpcd} LPCD × ${r.waterDemand.occupants} occupants` },
                { label: 'OHT REQUIRED',  value: `${r.waterDemand.ohtL.toLocaleString('en-IN')} L`,          sub: `${r.waterDemand.ohtM3} m³ (${Math.ceil(r.waterDemand.ohtL / 500) * 500}L tank)` },
                { label: 'SUMP REQUIRED', value: input.includeSump ? `${r.waterDemand.sumpL.toLocaleString('en-IN')} L` : 'Not included', sub: input.includeSump ? `${r.waterDemand.sumpM3} m³ underground` : 'Direct supply to OHT' },
                { label: 'PUMP CAPACITY', value: r.waterDemand.pumpHPStandard, sub: `${r.waterDemand.pumpFlowLPH} LPH · ${r.waterDemand.staticHeadM}m static head` },
              ].map(item => (
                <div key={item.label} className="px-3 py-2 rounded-[2px]"
                  style={{ border: '1px solid rgba(31,78,121,0.25)', background: 'var(--bg-surface)' }}>
                  <p className="text-[9px] uppercase tracking-widest"
                    style={{ color: 'rgba(255,255,255,0.40)', fontFamily: 'var(--font-plex-mono)' }}>
                    {item.label}
                  </p>
                  <p className="text-[18px] font-bold mt-0.5"
                    style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                    {item.value}
                  </p>
                  <p className="text-[10px] mt-0.5"
                    style={{ color: 'rgba(255,255,255,0.40)', fontFamily: 'var(--font-plex-sans)' }}>
                    {item.sub}
                  </p>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-[2px]" style={{ background: 'rgba(217,154,6,0.06)', border: '1px solid rgba(217,154,6,0.3)' }}>
              <p className="text-[11px]" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-plex-mono)' }}>
                ⚠ IS 1172:1993: Total storage required = {r.waterDemand.totalTankL.toLocaleString('en-IN')} litres (daily demand × 0.67).
                If your contractor quotes a smaller tank — ask them to show IS 1172:1993 calculation justifying the size.
                Tank undersizing causes dry taps and pump burnout within 1–2 years.
              </p>
            </div>
          </div>
        </div>

        {/* Phase context — FREE */}
        <div className="border rounded-[2px] p-4"
          style={{ borderColor: 'rgba(31,78,121,0.25)', background: 'rgba(31,78,121,0.03)' }}>
          <p className="text-[11px] uppercase tracking-widest mb-2"
            style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
            PHASE 4 CONTEXT — IS 1172:1993 · IS 1742:1983
          </p>
          <p className="text-[14px] font-medium mb-1"
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-plex-sans)' }}>
            Plumbing = {r.phaseContext.percentOfTotal} of total project cost
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

        {/* IS Compliance Panel — FREE */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(255,255,255,0.10)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[11px] uppercase tracking-widest"
              style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              IS COMPLIANCE PANEL — IS 1172:1993 · IS 1742:1983 · IS 12701 · NBC 2016
            </p>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {r.compliance.map(c => (
              <StampBadge key={c.id} status={c.status} clause={c.clause} description={c.detail} />
            ))}
          </div>
        </div>

        {/* ── 3D MASSING PREVIEW — FREE, OPT-IN ── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(255,255,255,0.10)' }}>
          <div
            className="px-4 py-3 flex items-center justify-between flex-wrap gap-2"
            style={{ borderBottom: show3D ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
          >
            <div>
              <p className="text-[11px] uppercase tracking-widest" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                3D MASSING PREVIEW
                <span style={{ color: 'rgba(255,255,255,0.35)', marginLeft: 8 }}>(BETA)</span>
              </p>
              {!show3D && (
                <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-plex-sans)' }}>
                  Floor massing with CPVC riser and SWR soil stack — drag to rotate, scroll to zoom
                </p>
              )}
            </div>
            <button
              onClick={() => setShow3D(v => !v)}
              style={{
                background: show3D ? 'rgba(31,78,121,0.15)' : '#1F4E79',
                color: '#F4F4F0',
                fontFamily: 'var(--font-plex-mono)',
                fontSize: 11,
                padding: '6px 14px',
                borderRadius: 6,
                border: show3D ? '1px solid rgba(31,78,121,0.4)' : 'none',
                cursor: 'pointer',
                letterSpacing: '0.04em',
                whiteSpace: 'nowrap',
              }}
            >
              {show3D ? 'CLOSE 3D VIEW' : 'VIEW 3D PREVIEW (BETA)'}
            </button>
          </div>
          {show3D && (
            <div>
              <PlumbMassingPreview3DWrapper
                floors={plumb3DFloors}
                numBathrooms={input.numBathrooms}
              />
              <div
                className="px-4 py-2"
                style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}
              >
                <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: 'rgba(255,255,255,0.30)', letterSpacing: '0.04em' }}>
                  ROUGH MASSING MODEL — teal lines: CPVC 32mm supply riser (lighter) + SWR 110mm soil stack (darker) per IS 1742:1983 · riser positions are schematic, not surveyed
                </p>
              </div>
            </div>
          )}
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
                clause: 'IS 1172:1993 — Water demand per capita',
                formula: 'Daily demand (L) = Occupants × LPCD · Occupants = (Bathrooms × 2) + 2',
                note: 'Municipal supply: 135 LPCD (IS 1172:1993 Table 1). Borewell: 150 LPCD. Occupant estimate: 2 persons per bathroom + 2 for common areas.',
              },
              {
                clause: 'IS 1172:1993 — Tank sizing',
                formula: 'OHT capacity (L) = Daily demand × 0.67 · UGT capacity (L) = Daily demand × 1.00',
                note: 'OHT holds 67% of daily demand (IS 1172:1993). UGT holds full day. Sump + OHT two-stage system recommended for >4 floors. Round up to nearest commercial size (1000L, 2000L, 5000L).',
              },
              {
                clause: 'IS 1742:1983 — Pump sizing',
                formula: 'Pump flow (LPH) = OHT capacity × 2 · Static head (m) = Floors × 3.5 m + 6 m',
                note: 'Fill OHT in 30 minutes → flow = OHT × 2. Total head = static head + friction (20% allowance). HP = (Flow/3600) × Head × 9.81 ÷ (0.70 × 746). 70% pump efficiency assumed.',
              },
              {
                clause: 'IS 1742:1983 Cl 5.2 — Soil & waste pipes',
                formula: 'Soil stack: 110mm SWR at 1:80 slope · Waste branch: 75mm SWR at 1:48 slope',
                note: 'IS 1742:1983 mandates minimum 100mm soil stack for WCs. 1:80 fall for stacks, 1:48 for branch wastes. P-traps at every fixture. Vent stack required for buildings > 2 floors.',
              },
              {
                clause: 'IS 15477:2004 — CPVC pipe sizing',
                formula: 'Domestic supply: 15mm CPVC for taps, 20mm for risers, 25mm for main lines',
                note: 'IS 15477:2004 for CPVC pipes. Hot water: CPVC only (not uPVC). External: uPVC IS 4985. Pipe lengths include 15% fitting wastage factor.',
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
                PIPE SCHEDULE — PREVIEW
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
                    <td className="py-2" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-plex-sans)', fontSize: 13 }}>CPVC 25mm pipe — branch supply (IS 1742:1983)</td>
                    <td className="py-2 text-right" style={{ color: 'rgba(255,255,255,0.50)', fontFamily: 'var(--font-plex-mono)', fontSize: 12 }}>m</td>
                    <td className="py-2 text-right" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-plex-mono)', fontSize: 13, fontWeight: 500 }}>{r.pipeSchedule.cpvc25m.toLocaleString('en-IN')}</td>
                    <td className="py-2 text-right" style={{ color: 'rgba(255,255,255,0.50)', fontFamily: 'var(--font-plex-mono)', fontSize: 13 }}>—</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(30,34,39,0.018)' }}>
                    <td className="py-2" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-plex-sans)', fontSize: 13 }}>SWR 110mm soil stack pipe (IS 14735:1999)</td>
                    <td className="py-2 text-right" style={{ color: 'rgba(255,255,255,0.50)', fontFamily: 'var(--font-plex-mono)', fontSize: 12 }}>m</td>
                    <td className="py-2 text-right" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-plex-mono)', fontSize: 13, fontWeight: 500 }}>{r.pipeSchedule.swr110m.toLocaleString('en-IN')}</td>
                    <td className="py-2 text-right" style={{ color: 'rgba(255,255,255,0.50)', fontFamily: 'var(--font-plex-mono)', fontSize: 13 }}>—</td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="py-2 text-center text-[11px]" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-plex-mono)', letterSpacing: '0.04em' }}>
                      + CPVC 32mm riser, SWR 75mm, uPVC 110mm, fixtures, tanks &amp; totals locked →
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
              {isPaid ? 'FULL IS-CODE BOQ — PHASE 4 · PLUMBING' : 'EXACT QUANTITIES — PIPE SCHEDULE + FIXTURE SCHEDULE + ITEMISED COSTS'}
            </p>
          </div>

          <div style={{ filter: isPaid ? 'none' : 'blur(6px)', userSelect: isPaid ? 'auto' : 'none', transition: 'filter 0.5s' }}>
            <div className="p-4">

              {/* Pipe schedule */}
              <p className="text-[10px] uppercase tracking-widest mb-2"
                style={{ color: 'rgba(255,255,255,0.40)', fontFamily: 'var(--font-plex-mono)' }}>
                PIPE SCHEDULE — IS 1742:1983 (LOCKED DIAMETERS)
              </p>
              <table className="w-full text-[13px] mb-5" style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {['Pipe Type / Use', 'Qty (m)', 'Rate ₹/m', 'Cost ₹'].map(h => (
                      <th key={h} className={`py-2 text-[10px] uppercase tracking-widest ${h === 'Pipe Type / Use' ? 'text-left' : 'text-right'}`}
                        style={{ color: 'rgba(255,255,255,0.40)', fontFamily: 'var(--font-plex-mono)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { type: 'CPVC 25mm (branch supply — IS 1742:1983)', qty: r.pipeSchedule.cpvc25m, rate: 120 },
                    { type: 'CPVC 32mm (main riser — IS 1742:1983)',    qty: r.pipeSchedule.cpvc32m, rate: 180 },
                    { type: 'SWR 75mm (waste pipes — slope 1:48)',      qty: r.pipeSchedule.swr75m,  rate: 95  },
                    { type: 'SWR 110mm (soil stack — slope 1:80)',      qty: r.pipeSchedule.swr110m, rate: 145 },
                    { type: 'uPVC 110mm (underground drain)',           qty: r.pipeSchedule.upvc110m,rate: 160 },
                  ].map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(30,34,39,0.06)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                      <td className="py-2" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-plex-sans)' }}>{row.type}</td>
                      <td className="py-2 text-right font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-plex-mono)' }}>{row.qty}</td>
                      <td className="py-2 text-right" style={{ color: 'rgba(255,255,255,0.40)', fontFamily: 'var(--font-plex-mono)' }}>{row.rate}</td>
                      <td className="py-2 text-right" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-plex-mono)' }}>{(row.qty * row.rate).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: '2px solid rgba(255,255,255,0.20)', background: 'rgba(255,255,255,0.02)' }}>
                    <td colSpan={2} className="py-2 text-[12px]" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-plex-sans)' }}>
                      + Fittings allowance (35% of pipe cost — elbows, tees, couplers)
                    </td>
                    <td colSpan={2} className="py-2 text-right text-[12px]" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
                      {r.costs.fittingsMaterial.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Fixture schedule */}
              <p className="text-[10px] uppercase tracking-widest mb-2"
                style={{ color: 'rgba(255,255,255,0.40)', fontFamily: 'var(--font-plex-mono)' }}>
                FIXTURE SCHEDULE
              </p>
              <table className="w-full text-[13px] mb-5" style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {['Fixture', 'Qty'].map(h => (
                      <th key={h} className={`py-2 text-[10px] uppercase tracking-widest ${h === 'Fixture' ? 'text-left' : 'text-right'}`}
                        style={{ color: 'rgba(255,255,255,0.40)', fontFamily: 'var(--font-plex-mono)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'EWC (Indian WC pan)',     qty: r.fixtureSchedule.ewcPan },
                    { name: 'Wash basin',              qty: r.fixtureSchedule.washBasin },
                    { name: 'Kitchen sink (SS)',       qty: r.fixtureSchedule.kitchenSink },
                    { name: 'CP shower set',           qty: r.fixtureSchedule.showerSet },
                    { name: 'CP bib taps (bathroom)',  qty: r.fixtureSchedule.bibTap },
                    { name: 'Pillar taps (kitchen/utility)', qty: r.fixtureSchedule.pillarTap },
                    { name: 'Floor traps (100mm)',     qty: r.fixtureSchedule.floorTrap },
                    { name: 'P-traps / bottle traps', qty: r.fixtureSchedule.pTrap },
                  ].map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(30,34,39,0.06)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                      <td className="py-2" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-plex-sans)' }}>{row.name}</td>
                      <td className="py-2 text-right font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-plex-mono)' }}>{row.qty}</td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: '2px solid rgba(255,255,255,0.20)' }}>
                    <td className="py-2 font-semibold" style={{ fontFamily: 'var(--font-plex-sans)', color: 'var(--text-primary)' }}>Total Fixtures</td>
                    <td className="py-2 text-right font-bold text-[14px]"
                      style={{ fontFamily: 'var(--font-plex-mono)', color: '#1F4E79' }}>
                      {r.fixtureSchedule.totalFixtures}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Cost summary */}
              <table className="w-full text-[13px]" style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <tbody>
                  {[
                    { label: 'CPVC pipes (25mm + 32mm)',        cost: r.costs.cpvcPipeMaterial },
                    { label: 'SWR pipes (75mm + 110mm)',        cost: r.costs.swrPipeMaterial  },
                    { label: 'uPVC underground drain (110mm)',   cost: r.costs.upvcPipeMaterial },
                    { label: 'Fittings (35% — elbows, tees)',   cost: r.costs.fittingsMaterial },
                    { label: 'Valves, traps, water meter',      cost: r.costs.valvesMaterial   },
                    { label: 'OHT + sump tanks (IS 12701 HDPE)',cost: r.costs.tanksMaterial    },
                    { label: `Pump — ${r.waterDemand.pumpHPStandard}`,cost: r.costs.pumpMaterial},
                  ].map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(30,34,39,0.06)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                      <td className="py-2" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-plex-sans)' }}>{row.label}</td>
                      <td className="py-2 text-right" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-plex-mono)' }}>
                        {row.cost.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: '2px solid rgba(255,255,255,0.20)' }}>
                    <td className="py-2 font-semibold" style={{ fontFamily: 'var(--font-plex-sans)', color: 'var(--text-primary)' }}>Total Material</td>
                    <td className="py-2 text-right font-bold text-[14px]"
                      style={{ fontFamily: 'var(--font-plex-mono)', color: 'var(--text-primary)' }}>
                      {r.costs.totalMaterial.toLocaleString('en-IN')}
                    </td>
                  </tr>
                  {input.includeLabour !== false ? (
                    <tr>
                      <td className="py-1 text-[12px]" style={{ fontFamily: 'var(--font-plex-sans)', color: 'rgba(255,255,255,0.45)' }}>
                        Labour (CPWD — plumber + helper + sanitary fitter + testing)
                      </td>
                      <td className="py-1 text-right text-[12px]" style={{ fontFamily: 'var(--font-plex-mono)', color: 'rgba(255,255,255,0.45)' }}>
                        {r.labourCost.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ) : (
                    <tr>
                      <td colSpan={2} className="py-1 text-[11px]"
                        style={{ fontFamily: 'var(--font-plex-mono)', color: 'rgba(255,255,255,0.35)', fontStyle: 'italic' }}>
                        Labour cost not included in this estimate
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td className="py-1 text-[12px]" style={{ fontFamily: 'var(--font-plex-sans)', color: 'rgba(255,255,255,0.45)' }}>
                      Contractor overhead + margin (10%)
                    </td>
                    <td className="py-1 text-right text-[12px]" style={{ fontFamily: 'var(--font-plex-mono)', color: 'rgba(255,255,255,0.45)' }}>
                      {r.overheadCost.toLocaleString('en-IN')}
                    </td>
                  </tr>
                  <tr style={{ borderTop: '2px solid #1F4E79', background: 'rgba(31,78,121,0.05)' }}>
                    <td className="py-2 font-bold text-[14px]" style={{ fontFamily: 'var(--font-plex-sans)', color: '#1F4E79' }}>
                      TOTAL STANDARD ESTIMATE
                    </td>
                    <td className="py-2 text-right font-bold text-[16px]" style={{ fontFamily: 'var(--font-plex-mono)', color: '#1F4E79' }}>
                      {r.grandTotal.standard.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Contractor comparison */}
              {isPaid && input.contractorQuote && input.contractorQuote > 0 && (
                <div className="mt-4 p-4 rounded-[2px]"
                  style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                  <p className="text-[11px] uppercase tracking-widest mb-3"
                    style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                    PLUMBER QUOTE COMPARISON
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Your Quote',       value: input.contractorQuote,          color: 'var(--text-primary)' },
                      { label: 'IS-Code Estimate', value: r.grandTotal.standard,           color: '#1F4E79' },
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
                      ⚠ Plumber quote is {Math.round((input.contractorQuote / r.grandTotal.standard - 1) * 100)}% above IS-code estimate.
                      Common reasons: upsized pipe diameters, unnecessary motor HP, billing for owner-supplied fixtures.
                      Ask for itemised quote with pipe diameters and metre lengths specified.
                    </p>
                  )}
                  {input.contractorQuote <= r.grandTotal.standard * 1.15 && input.contractorQuote >= r.grandTotal.standard * 0.85 && (
                    <p className="text-[12px] mt-3" style={{ color: '#14532D', fontFamily: 'var(--font-plex-sans)' }}>
                      ✓ Quote is within 15% of IS-code estimate — reasonable range. Verify pipe diameters match IS 1742:1983 specifications.
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
              YOUR PHASE 4 ESTIMATE IS READY
            </p>
            <h2 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 'clamp(28px,4vw,48px)', fontWeight: 600, color: '#F4F4F0', lineHeight: 1.15, marginBottom: 12 }}>
              Unlock Full IS-Code BOQ<br />+ Professional PDF
            </h2>
            <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 16, color: 'rgba(244,244,240,0.55)', margin: '0 auto 36px', maxWidth: 500 }}>
              Pipe schedule, tank sizing, fixture counts, and a 9-page IS-code PDF report
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
                <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: 'rgba(244,244,240,0.4)', marginBottom: 2 }}>Or save ₹596</p>
                <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 14, color: 'rgba(244,244,240,0.7)' }}>Complete Bundle — All 5 Apps <span style={{ fontFamily: 'var(--font-plex-mono)', color: '#F4F4F0' }}>₹2,999</span></p>
              </Link>
            </div>
            {payError && (
              <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 12, color: '#D99A06', marginTop: 12 }}>⚠ {payError}</p>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16, marginTop: 28 }}>
              {['IS 1172:1993 water demand', 'Pipe schedule by diameter', 'Tank + pump sizing', 'Fixture counts', 'Plumber comparison', '9-page PDF report'].map(f => (
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
              Your full plumbing estimate is visible above. Download your 9-page IS-code PDF report below.
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
            NEXT — PHASE 5
          </p>
          <p className="text-[14px] font-semibold mb-1" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-plex-sans)' }}>
            Get your Interior quantities — InteriorPro →
          </p>
          <p className="text-[12px] mb-3" style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-plex-sans)' }}>
            Plumbing is costed. Complete your estimate with flooring, paint, kitchen, and false ceiling with InteriorPro. Finishes are 30–40% of total project cost.
          </p>
          <a
            href="/tools/interiorpro"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[6px] text-[13px] font-semibold"
            style={{ background: '#1F4E79', color: '#F4F4F0', fontFamily: 'var(--font-plex-sans)', textDecoration: 'none' }}
          >
            Start InteriorPro →
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
