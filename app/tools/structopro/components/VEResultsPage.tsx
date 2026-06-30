'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { animate } from 'framer-motion'
import { type VEResult, type VEInput } from '../structopro-ve-engine'
import { formatLakhs } from '../structopro-engine'

// ─── CountUp ─────────────────────────────────────────────────────────────────

function CountUp({ to, format }: { to: number; format: (n: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const controls = animate(0, to, {
      duration: 1.1, ease: 'easeOut',
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

// ─── Blur overlay ─────────────────────────────────────────────────────────────

function BlurOverlay({ onClick }: { onClick: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[2px] z-10"
      style={{ background: 'rgba(244,244,240,0.85)', backdropFilter: 'blur(2px)' }}>
      <div className="text-center px-6 py-5 rounded-[2px] max-w-sm"
        style={{ border: '1px solid rgba(30,34,39,0.15)', background: '#F4F4F0' }}>
        <p className="text-[11px] uppercase tracking-widest mb-1" style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
          ₹499 · UNLOCK TO VIEW
        </p>
        <p className="text-[13px] mb-3" style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-sans)' }}>
          Exact quantities, itemised costs, and splice bar schedule
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

// ─── Stamp badge ──────────────────────────────────────────────────────────────

function StampBadge({ status, clause, description }: { status: 'pass' | 'advisory' | 'fail'; clause: string; description: string }) {
  const colours = {
    pass:     { border: '#14532D', text: '#14532D', bg: 'rgba(20,83,45,0.04)', label: 'PASS' },
    advisory: { border: '#D99A06', text: '#D99A06', bg: 'rgba(217,154,6,0.06)', label: 'ADVISORY' },
    fail:     { border: '#8C3A22', text: '#8C3A22', bg: 'rgba(140,58,34,0.05)', label: 'FAIL' },
  }
  const c = colours[status]
  return (
    <div className="flex items-start gap-3 p-3 rounded-[2px]"
      style={{ border: `1px solid ${c.border}22`, background: c.bg }}>
      <div className="shrink-0 mt-0.5" style={{
        border: `1.5px double ${c.border}`, borderRadius: 1, padding: '1px 5px',
        transform: 'rotate(-2deg)', fontSize: 9, fontFamily: 'var(--font-plex-mono)',
        fontWeight: 600, color: c.text, letterSpacing: '0.06em', whiteSpace: 'nowrap',
      }}>
        {c.label}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium" style={{ color: c.text, fontFamily: 'var(--font-plex-mono)' }}>{clause}</p>
        <p className="text-[12px]" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>{description}</p>
      </div>
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  result:      VEResult
  input:       VEInput
  estimateId:  string | null
  contactName: string
  onStartOver: () => void
}

type PayStatus = 'idle' | 'creating' | 'open' | 'verifying' | 'polling' | 'paid' | 'error'
type PdfStatus = 'idle' | 'generating' | 'ready' | 'error'

const PAYMENT_BYPASS = true

// ─── Component ────────────────────────────────────────────────────────────────

export default function VEResultsPage({ result, input, estimateId, contactName, onStartOver }: Props) {
  const [payStatus, setPayStatus] = useState<PayStatus>('idle')
  const [payError, setPayError]   = useState('')
  const [isPaid, setIsPaid]       = useState(PAYMENT_BYPASS)
  const [orderId, setOrderId]     = useState<string | null>(null)
  const pollRef                   = useRef<ReturnType<typeof setInterval> | null>(null)
  const [pdfStatus, setPdfStatus] = useState<PdfStatus>('idle')
  const [pdfUrl, setPdfUrl]       = useState<string | null>(null)

  const r = result
  const colAdq = r.columnAdequacy

  // Load Razorpay script
  useEffect(() => {
    if (document.querySelector('script[src*="checkout.razorpay.com"]')) return
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.async = true
    document.body.appendChild(s)
  }, [])

  // Poll payment status
  useEffect(() => {
    if (!orderId || payStatus !== 'polling') return
    pollRef.current = setInterval(async () => {
      try {
        const res  = await fetch(`/api/payments/status/${orderId}`)
        const json = await res.json()
        if (json.status === 'success') { clearInterval(pollRef.current!); setIsPaid(true); setPayStatus('paid') }
        else if (json.status === 'failed') { clearInterval(pollRef.current!); setPayStatus('error'); setPayError('Payment failed. Please try again.') }
      } catch { /* ignore */ }
    }, 2000)
    return () => clearInterval(pollRef.current!)
  }, [orderId, payStatus])

  const generatePdf = useCallback(async () => {
    if (!estimateId) return
    setPdfStatus('generating')
    try {
      const getRes  = await fetch(`/api/structopro/generate-pdf?estimateId=${estimateId}`)
      const getJson = await getRes.json()
      if (getJson.pdfUrl) { setPdfUrl(getJson.pdfUrl); setPdfStatus('ready'); return }
      const postRes  = await fetch('/api/structopro/generate-pdf', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estimateId }),
      })
      const postJson = await postRes.json()
      if (postJson.pdfUrl) { setPdfUrl(postJson.pdfUrl); setPdfStatus('ready') }
      else { setPdfStatus('error') }
    } catch { setPdfStatus('error') }
  }, [estimateId])

  useEffect(() => { if (isPaid) generatePdf() }, [isPaid, generatePdf])

  async function handleUnlock() {
    if (!estimateId) { setPayError('Estimate not saved yet. Wait a moment and try again.'); return }
    setPayStatus('creating'); setPayError('')
    try {
      const res  = await fetch('/api/payments/create-order', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estimateId, amount: 49900 }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Could not create order')
      setOrderId(json.orderId); setPayStatus('open')
      const options = {
        key: json.keyId, amount: json.amount, currency: json.currency || 'INR',
        name: 'NirmanShastra',
        description: 'StructurePro VE Report — Add Floors Estimate',
        order_id: json.orderId,
        prefill: { name: contactName, contact: input.state },
        notes: { estimateId },
        theme: { color: '#1F4E79' },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          setPayStatus('verifying')
          try {
            const vRes = await fetch('/api/payments/verify', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id, razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature, estimateId,
              }),
            })
            const vJson = await vRes.json()
            if (!vRes.ok) throw new Error(vJson.error || 'Verification failed')
            setPayStatus('polling')
          } catch (err) {
            setPayStatus('error'); setPayError(err instanceof Error ? err.message : 'Verification failed.')
          }
        },
        modal: { ondismiss: () => { if (payStatus === 'open') setPayStatus('idle') } },
      }
      if (!window.Razorpay) throw new Error('Payment SDK not loaded. Please refresh and try again.')
      new window.Razorpay(options).open()
    } catch (err) {
      setPayStatus('error'); setPayError(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  const existingLabel   = colAdq.existingUpperFloors === 0 ? 'G' : `G+${colAdq.existingUpperFloors}`
  const resultingLabel  = colAdq.resultingUpperFloors === 0 ? 'G' : `G+${colAdq.resultingUpperFloors}`

  const colStatusColour = {
    pass:     { bg: 'rgba(20,83,45,0.06)',   border: '#14532D', text: '#14532D', label: '✓ PASS' },
    warning:  { bg: 'rgba(217,154,6,0.08)', border: '#D99A06', text: '#7C5500', label: '⚠ ADVISORY' },
    critical: { bg: 'rgba(140,58,34,0.07)', border: '#8C3A22', text: '#8C3A22', label: '⛔ CRITICAL' },
  }[colAdq.status]

  return (
    <div className="min-h-screen pb-16" style={{ background: '#F4F4F0' }}>
      <div className="px-6 md:px-12 lg:px-16 pt-6 space-y-6">

        {/* Test mode banner */}
        <div className="px-4 py-2 rounded-[2px] flex items-center gap-2"
          style={{ background: 'rgba(217,154,6,0.1)', border: '1px solid rgba(217,154,6,0.4)' }}>
          <span style={{ color: '#D99A06', fontSize: 13 }}>⚠</span>
          <p className="text-[12px]" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)' }}>
            TEST MODE — Razorpay sandbox. No real money charged. Use test card 4111 1111 1111 1111.
          </p>
        </div>

        {/* Header */}
        <div className="p-6 rounded-[2px]" style={{ background: '#1E2227', border: '1px solid rgba(30,34,39,0.7)' }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-0.5 rounded-[2px] text-[10px]" style={{ background: 'rgba(217,154,6,0.2)', color: '#D99A06', fontFamily: 'var(--font-plex-mono)', border: '1px solid rgba(217,154,6,0.4)' }}>
              🔼 VERTICAL EXTENSION — NEW FLOORS ONLY
            </span>
          </div>
          <p className="text-[11px] uppercase tracking-widest mb-2" style={{ color: 'rgba(244,244,240,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
            STRUCTOPRO · P1 · RCC STRUCTURE ESTIMATOR
          </p>
          <h2 className="font-bold mb-2" style={{ color: '#F4F4F0', fontFamily: 'var(--font-plex-serif)', fontSize: 'clamp(22px,3.5vw,30px)' }}>
            {input.projectName || 'Your Vertical Extension Estimate'}
          </h2>
          <div className="flex flex-wrap gap-4 mt-3">
            <div>
              <p className="text-[10px] uppercase" style={{ color: 'rgba(244,244,240,0.4)', fontFamily: 'var(--font-plex-mono)' }}>Existing</p>
              <p className="text-[14px] font-semibold" style={{ color: '#F4F4F0', fontFamily: 'var(--font-plex-mono)' }}>{existingLabel} · {input.existingColumnSize}mm · {input.existingConcreteGrade}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase" style={{ color: 'rgba(244,244,240,0.4)', fontFamily: 'var(--font-plex-mono)' }}>Adding</p>
              <p className="text-[14px] font-semibold" style={{ color: '#F4F4F0', fontFamily: 'var(--font-plex-mono)' }}>{input.floorsToAdd} floor{input.floorsToAdd > 1 ? 's' : ''} → {resultingLabel} total</p>
            </div>
            <div>
              <p className="text-[10px] uppercase" style={{ color: 'rgba(244,244,240,0.4)', fontFamily: 'var(--font-plex-mono)' }}>New BUA</p>
              <p className="text-[14px] font-semibold" style={{ color: '#F4F4F0', fontFamily: 'var(--font-plex-mono)' }}>{r.newFloorBUASqft.toLocaleString('en-IN')} sqft</p>
            </div>
            <div>
              <p className="text-[10px] uppercase" style={{ color: 'rgba(244,244,240,0.4)', fontFamily: 'var(--font-plex-mono)' }}>Seismic Zone</p>
              <p className="text-[14px] font-semibold" style={{ color: '#F4F4F0', fontFamily: 'var(--font-plex-mono)' }}>Zone {r.seismicZone} (Z = {r.zFactor})</p>
            </div>
          </div>
        </div>

        {/* ── IS Safety Warning (always visible) ─────────────────────────────── */}
        <div className="p-5 rounded-[2px]" style={{ background: 'rgba(140,58,34,0.05)', border: '2px solid #8C3A2240' }}>
          <p className="text-[12px] font-bold mb-2" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-mono)' }}>
            ⚠️ IS 1893:2016 + IS 456:2000 — MANDATORY SAFETY ADVISORY
          </p>
          <p className="text-[13px] leading-relaxed" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>
            Adding floors to an existing building increases loads on existing foundations and columns. A structural audit by a licensed engineer is <strong>MANDATORY</strong> before adding floors. NirmanShastra calculates the additional material cost only — suitability of the existing structure must be certified by a structural engineer.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {['IS 456:2000', 'IS 1893:2016 Cl 7.3', 'IS 13920:2016', 'SP 34'].map(ref => (
              <span key={ref} className="px-2 py-0.5 text-[10px] rounded-[2px]"
                style={{ background: 'rgba(140,58,34,0.08)', color: '#8C3A22', border: '1px solid #8C3A2220', fontFamily: 'var(--font-plex-mono)' }}>
                {ref}
              </span>
            ))}
          </div>
        </div>

        {/* ── Grand Total Range (FREE) ─────────────────────────────────────────── */}
        <div className="p-6 rounded-[2px]" style={{ border: '2px solid #1F4E79', background: '#F4F4F0' }}>
          <p className="text-[11px] uppercase tracking-widest mb-1" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
            ADDITIONAL MATERIAL COST — NEW FLOORS ONLY · FOUNDATION EXCLUDED
          </p>
          <p className="text-[12px] mb-4" style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-sans)' }}>
            What you need to budget for the new floors. Foundation and excavation are separately assessed by your structural engineer.
          </p>
          <div className="flex flex-col sm:flex-row items-end gap-4 mb-4">
            <div>
              <p className="text-[11px] uppercase tracking-widest mb-1" style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
                YOUR STRUCTURE COST
              </p>
              <div style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 'clamp(32px,5vw,52px)', fontWeight: 700, color: '#1E2227', lineHeight: 1.1 }}>
                <CountUp to={r.grandTotalRange.basic}    format={n => formatLakhs(n)} />
                {' – '}
                <CountUp to={r.grandTotalRange.premium}  format={n => formatLakhs(n)} />
              </div>
            </div>
            <div className="text-right sm:ml-auto">
              <p className="text-[11px]" style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>Standard estimate</p>
              <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 20, fontWeight: 600, color: '#1F4E79' }}>
                <CountUp to={r.grandTotalRange.standard} format={n => formatLakhs(n)} />
              </p>
              <p className="text-[11px]" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
                ≈ ₹<CountUp to={r.perSqftCost.standard} format={n => Math.round(n).toLocaleString('en-IN')} />/sqft
              </p>
            </div>
          </div>

          {/* 3-tier band */}
          <div className="grid grid-cols-3 gap-2">
            {([
              { label: 'Basic',    val: r.grandTotalRange.basic,    note: 'Materials + minimal labour + 5% OH' },
              { label: 'Standard', val: r.grandTotalRange.standard, note: 'Materials + CPWD labour + 5% OH', highlight: true },
              { label: 'Premium',  val: r.grandTotalRange.premium,  note: 'Materials + premium labour + 15% OH' },
            ]).map(tier => (
              <div key={tier.label} className="p-3 rounded-[2px] text-center"
                style={{ background: tier.highlight ? '#1F4E7912' : '#1E22270A', border: `1px solid ${tier.highlight ? '#1F4E7930' : '#1E222715'}` }}>
                <p className="text-[11px] uppercase tracking-wide mb-1" style={{ color: tier.highlight ? '#1F4E79' : '#1E222780', fontFamily: 'var(--font-plex-mono)' }}>{tier.label}</p>
                <p className="text-[18px] font-bold" style={{ color: tier.highlight ? '#1F4E79' : '#1E2227', fontFamily: 'var(--font-plex-mono)' }}>{formatLakhs(tier.val)}</p>
                <p className="text-[10px] mt-0.5" style={{ color: '#1E222760', fontFamily: 'var(--font-plex-sans)' }}>{tier.note}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 p-3 rounded-[2px]" style={{ background: 'rgba(30,34,39,0.04)', border: '1px solid rgba(30,34,39,0.1)' }}>
            <p className="text-[11px]" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-sans)' }}>
              <strong>Scope of this estimate:</strong> New floor materials only (concrete + steel + formwork). Excludes: foundation strengthening, existing structure repairs, masonry/plaster/finishing, electrical, plumbing, scaffold/hoist rental. These are estimated by MasonryPro, ElectricalPro, and PlumbingPro.
            </p>
          </div>
        </div>

        {/* ── Foundation Check — Column Adequacy (FREE) ───────────────────────── */}
        <div className="rounded-[2px]" style={{ border: '1px solid rgba(30,34,39,0.12)' }}>
          <div className="px-6 py-4" style={{ background: '#1E22270A', borderBottom: '1px solid rgba(30,34,39,0.1)' }}>
            <p className="text-[11px] uppercase tracking-widest" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              FOUNDATION CHECK — COLUMN LOAD ADEQUACY
            </p>
          </div>
          <div className="p-6 space-y-4">

            {/* Column adequacy result */}
            <div className="p-4 rounded-[2px]" style={{ background: colStatusColour.bg, border: `1.5px solid ${colStatusColour.border}40` }}>
              <div className="flex items-start gap-3">
                <div className="shrink-0 px-2 py-1 rounded-[2px] text-[10px] font-bold"
                  style={{ background: colStatusColour.border + '20', color: colStatusColour.text, fontFamily: 'var(--font-plex-mono)', border: `1px solid ${colStatusColour.border}40` }}>
                  {colStatusColour.label}
                </div>
                <div>
                  <p className="text-[13px] leading-relaxed" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>
                    {colAdq.message}
                  </p>
                  <p className="text-[11px] mt-1.5" style={{ color: colStatusColour.text, fontFamily: 'var(--font-plex-mono)' }}>
                    {colAdq.isRef}
                  </p>
                </div>
              </div>
            </div>

            {/* Column check table */}
            <div className="overflow-x-auto">
              <table className="w-full text-[12px] border-collapse">
                <thead>
                  <tr style={{ background: '#1E22270A' }}>
                    {['Check', 'Existing', 'After Adding', 'Thumb Rule Limit', 'Status'].map(h => (
                      <th key={h} className="px-3 py-2 text-left font-semibold" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)', borderBottom: '1px solid #1E222720' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #1E222710' }}>
                    <td className="px-3 py-2" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>Column size vs height</td>
                    <td className="px-3 py-2" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)' }}>{existingLabel} · {input.existingColumnSize}mm</td>
                    <td className="px-3 py-2 font-semibold" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>{resultingLabel}</td>
                    <td className="px-3 py-2" style={{ color: '#1E222780', fontFamily: 'var(--font-plex-mono)' }}>
                      {input.existingColumnSize}mm → max G+{colAdq.maxSafeUpperFloors}
                    </td>
                    <td className="px-3 py-2">
                      <span className="px-2 py-0.5 rounded-[2px] text-[10px] font-semibold"
                        style={{ background: colStatusColour.bg, color: colStatusColour.text, border: `1px solid ${colStatusColour.border}30`, fontFamily: 'var(--font-plex-mono)' }}>
                        {colStatusColour.label}
                      </span>
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #1E222710' }}>
                    <td className="px-3 py-2" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>Seismic zone</td>
                    <td className="px-3 py-2" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)' }}>Zone {r.seismicZone}</td>
                    <td className="px-3 py-2" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)' }}>Zone {r.seismicZone}</td>
                    <td className="px-3 py-2" style={{ color: '#1E222780', fontFamily: 'var(--font-plex-mono)' }}>
                      {['III','IV','V'].includes(r.seismicZone) ? 'Fe500D + IS 13920:2016' : 'Fe500 min'}
                    </td>
                    <td className="px-3 py-2">
                      <StampBadge
                        status={['III','IV','V'].includes(r.seismicZone) && input.newSteelGrade === 'Fe500' ? 'fail' : 'pass'}
                        clause={`IS 13920:2016`}
                        description={['III','IV','V'].includes(r.seismicZone) && input.newSteelGrade === 'Fe500'
                          ? `Zone ${r.seismicZone}: Fe500D mandatory`
                          : `${input.newSteelGrade} — acceptable`}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>Structural audit</td>
                    <td className="px-3 py-2 col-span-2" colSpan={3} style={{ color: '#1E222780', fontFamily: 'var(--font-plex-sans)' }}>
                      {input.hasStructuralAudit === 'yes' ? '✓ Audit done — proceed with engineer\'s report' : input.hasStructuralAudit === 'planning' ? 'Planned — obtain before starting work' : 'Not done — MANDATORY before any work'}
                    </td>
                    <td className="px-3 py-2">
                      <span className="px-2 py-0.5 rounded-[2px] text-[10px]"
                        style={{
                          background: input.hasStructuralAudit === 'yes' ? 'rgba(20,83,45,0.07)' : 'rgba(140,58,34,0.07)',
                          color: input.hasStructuralAudit === 'yes' ? '#14532D' : '#8C3A22',
                          fontFamily: 'var(--font-plex-mono)',
                        }}>
                        {input.hasStructuralAudit === 'yes' ? '✓ DONE' : '⚠ REQUIRED'}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Paid Section: Quantities + Splice Bar Schedule ───────────────────── */}
        <div className="rounded-[2px] relative overflow-hidden" style={{ border: '1px solid rgba(30,34,39,0.12)' }}>
          <div className="px-6 py-4" style={{ background: '#1E22270A', borderBottom: '1px solid rgba(30,34,39,0.1)' }}>
            <p className="text-[11px] uppercase tracking-widest" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              EXACT MATERIAL QUANTITIES + SPLICE BAR SCHEDULE
            </p>
          </div>

          {!isPaid && <BlurOverlay onClick={handleUnlock} />}

          <div className={`p-6 space-y-6 ${!isPaid ? 'select-none pointer-events-none' : ''}`}
            style={{ filter: isPaid ? 'none' : 'blur(4px)' }}>

            {/* Quantities table */}
            <div>
              <p className="text-[11px] uppercase tracking-widest mb-3" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                MATERIAL QUANTITIES — NEW FLOORS ONLY
              </p>
              <table className="w-full text-[12px] border-collapse">
                <thead>
                  <tr style={{ background: '#1E22270A' }}>
                    {['Material', 'Quantity', 'Unit', 'Cost', 'Note'].map(h => (
                      <th key={h} className="px-3 py-2 text-left" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)', borderBottom: '1px solid #1E222720', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { mat: 'Cement (OPC/PPC)', qty: r.quantities.cementBags, unit: 'bags (50kg)', cost: r.materialCost.cement, note: `${input.newConcreteGrade} · IS 269:2015` },
                    { mat: 'Steel TMT',        qty: r.quantities.steelKgWithSplice, unit: 'kg', cost: r.materialCost.steel, note: `${input.newSteelGrade} incl. +8% splice (IS 456 Cl 26.2.5)` },
                    { mat: 'Aggregate 20mm',   qty: r.quantities.aggregateCft, unit: 'cft', cost: r.materialCost.aggregate, note: 'IS 383:2016' },
                    { mat: 'Sand (M-sand)',    qty: r.quantities.sandCft, unit: 'cft', cost: r.materialCost.sand, note: 'IS 383:2016' },
                    { mat: 'Binding Wire',     qty: r.quantities.bindingWireKg, unit: 'kg', cost: r.materialCost.bindingWire, note: '12 kg/tonne steel · IS 280' },
                    { mat: 'Formwork',         qty: r.quantities.formworkSqft, unit: 'sqft contact', cost: r.materialCost.formwork, note: '~0.5× BUA' },
                  ].map(row => (
                    <tr key={row.mat} style={{ borderBottom: '1px solid #1E222710' }}>
                      <td className="px-3 py-2 font-medium" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>{row.mat}</td>
                      <td className="px-3 py-2 text-right" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)', fontWeight: 500 }}>{row.qty.toLocaleString('en-IN')}</td>
                      <td className="px-3 py-2" style={{ color: '#1E222770', fontFamily: 'var(--font-plex-mono)' }}>{row.unit}</td>
                      <td className="px-3 py-2 text-right" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>₹{row.cost.toLocaleString('en-IN')}</td>
                      <td className="px-3 py-2" style={{ color: '#1E222760', fontFamily: 'var(--font-plex-sans)', fontSize: 11 }}>{row.note}</td>
                    </tr>
                  ))}
                  <tr style={{ background: '#1E22270A', fontWeight: 700 }}>
                    <td className="px-3 py-2 font-bold" colSpan={3} style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>Total (with 7% wastage · no foundation)</td>
                    <td className="px-3 py-2 text-right font-bold" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>₹{r.materialCost.totalWithWastage.toLocaleString('en-IN')}</td>
                    <td />
                  </tr>
                </tbody>
              </table>
              <p className="text-[11px] mt-2" style={{ color: '#1E222760', fontFamily: 'var(--font-plex-sans)' }}>
                Foundation strengthening, scaffold/hoist, masonry, plaster, electrical, and plumbing are NOT included.
              </p>
            </div>

            {/* Splice Bar Schedule */}
            <div className="p-5 rounded-[2px]" style={{ background: 'rgba(31,78,121,0.04)', border: '1.5px solid #1F4E7930' }}>
              <p className="text-[11px] uppercase tracking-widest mb-3" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                SPLICE BAR SCHEDULE — COLUMN EXTENSION (IS 456:2000 Cl 26.2.5)
              </p>
              <p className="text-[12px] mb-4" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>
                Splice bars connect new column reinforcement to existing column bars at every extension junction. Most frequently omitted item in contractor steel schedules — verify before approving bar bending schedule.
              </p>

              <table className="w-full text-[12px] border-collapse">
                <tbody>
                  {[
                    { label: 'Bar diameter', val: `${r.spliceBarSchedule.barDiameterMm}mm (standard residential column)` },
                    { label: 'Lap/splice length', val: `${r.spliceBarSchedule.spliceLength}mm = 50 × ${r.spliceBarSchedule.barDiameterMm}mm (IS 456:2000 Cl 26.2.5)` },
                    { label: 'Bars per column', val: `${r.spliceBarSchedule.barsPerColumn} bars (${input.existingColumnSize}mm column)` },
                    { label: 'Columns estimated', val: `${r.spliceBarSchedule.numColumnsEstimated} nos. (floor area ÷ 150 sqft — verify with layout drawing)` },
                    { label: 'Splice weight per column', val: `${r.spliceBarSchedule.spliceWeightPerColKg} kg` },
                    { label: 'Total splice bar weight', val: `${r.spliceBarSchedule.totalSpliceWeightKg} kg (included in steel total above as part of +8%)` },
                    { label: 'IS reference', val: r.spliceBarSchedule.isRef },
                  ].map(row => (
                    <tr key={row.label} style={{ borderBottom: '1px solid #1E222710' }}>
                      <td className="py-2 pr-4 font-medium whitespace-nowrap" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)', width: '40%' }}>{row.label}</td>
                      <td className="py-2" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>{row.val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-4 p-3 rounded-[2px]" style={{ background: 'rgba(217,154,6,0.07)', border: '1px solid #D99A0630' }}>
                <p className="text-[12px] font-semibold mb-1" style={{ color: '#7C5500', fontFamily: 'var(--font-plex-mono)' }}>
                  ⚠ SP 34 — CONTRACTOR VERIFICATION REQUIRED
                </p>
                <p className="text-[12px]" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>
                  Splice bars at column tops are the most frequently omitted item in vertical extension contractor quotes. Ask your contractor to explicitly show splice/dowel bars in the bar bending schedule (BBS) with lap length clearly dimensioned. Do not accept a quote that does not itemise them.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Technical Reminders (free) ──────────────────────────────────────── */}
        <div className="rounded-[2px]" style={{ border: '1px solid rgba(30,34,39,0.12)' }}>
          <div className="px-6 py-4" style={{ background: '#1E22270A', borderBottom: '1px solid rgba(30,34,39,0.1)' }}>
            <p className="text-[11px] uppercase tracking-widest" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              TECHNICAL REMINDERS — VERTICAL EXTENSION
            </p>
          </div>
          <div className="p-4 space-y-2">
            {r.technicalReminders.map((rem, i) => (
              <div key={i} className="flex gap-3 py-2" style={{ borderBottom: i < r.technicalReminders.length - 1 ? '1px solid #1E222710' : 'none' }}>
                <span className="text-[11px] shrink-0 mt-0.5 font-bold" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>{String(i + 1).padStart(2, '0')}</span>
                <p className="text-[12px] leading-relaxed" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>{rem}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Unlock / Pay CTA ─────────────────────────────────────────────────── */}
        {!isPaid && (
          <div className="p-6 rounded-[2px]" style={{ background: '#1E2227', border: '1px solid rgba(30,34,39,0.7)' }}>
            <p className="text-[11px] uppercase tracking-widest mb-1" style={{ color: 'rgba(244,244,240,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
              UNLOCK YOUR FULL ESTIMATE
            </p>
            <h3 className="font-bold mb-2" style={{ color: '#F4F4F0', fontFamily: 'var(--font-plex-serif)', fontSize: 22 }}>
              Your Vertical Extension estimate is ready.
            </h3>
            <p className="text-[13px] mb-4" style={{ color: 'rgba(244,244,240,0.6)', fontFamily: 'var(--font-plex-sans)' }}>
              Unlock exact quantities, itemised costs, splice bar schedule, and contractor comparison for ₹499.
            </p>
            {payError && (
              <p className="text-[12px] mb-3" style={{ color: '#FF6B6B', fontFamily: 'var(--font-plex-sans)' }}>⚠ {payError}</p>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={handleUnlock}
                disabled={payStatus === 'creating' || payStatus === 'verifying' || payStatus === 'polling'}
                className="flex-1 py-3 rounded-[6px] font-semibold text-[15px]"
                style={{ background: '#8C3A22', color: '#F4F4F0', fontFamily: 'var(--font-plex-sans)' }}>
                {payStatus === 'creating' ? 'Creating order…' : payStatus === 'verifying' ? 'Verifying…' : payStatus === 'polling' ? 'Confirming payment…' : 'Unlock Report ₹499 →'}
              </button>
            </div>
          </div>
        )}

        {/* ── PDF Download (after payment) ─────────────────────────────────── */}
        {isPaid && (
          <div className="p-5 rounded-[2px]" style={{ background: 'rgba(20,83,45,0.06)', border: '1px solid #14532D30' }}>
            <p className="text-[13px] font-semibold mb-2" style={{ color: '#14532D', fontFamily: 'var(--font-plex-sans)' }}>
              ✓ Estimate unlocked — PDF includes splice bar schedule (Page 11 — VE only)
            </p>
            {pdfStatus === 'generating' && (
              <p className="text-[12px]" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>Generating your PDF report…</p>
            )}
            {pdfStatus === 'ready' && pdfUrl && (
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
                className="inline-block px-5 py-2.5 rounded-[6px] text-[14px] font-semibold"
                style={{ background: '#14532D', color: '#fff', fontFamily: 'var(--font-plex-sans)' }}>
                ↓ Download PDF Report
              </a>
            )}
            {pdfStatus === 'error' && (
              <div className="flex items-center gap-3">
                <p className="text-[12px]" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-sans)' }}>PDF generation failed.</p>
                <button onClick={generatePdf} className="text-[12px] px-3 py-1 rounded-[6px]" style={{ background: '#8C3A2215', color: '#8C3A22', border: '1px solid #8C3A2230' }}>Retry</button>
              </div>
            )}
          </div>
        )}

        {/* Start Over */}
        <div className="text-center pt-2">
          <button onClick={onStartOver}
            className="text-[12px] px-4 py-2 rounded-[6px]"
            style={{ color: 'rgba(30,34,39,0.5)', border: '1px solid rgba(30,34,39,0.2)', fontFamily: 'var(--font-plex-sans)' }}>
            ← Start a new estimate
          </button>
        </div>

      </div>
    </div>
  )
}
