'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { animate } from 'framer-motion'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
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
          Know exactly where your money goes — before your contractor does.
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

const PAYMENT_BYPASS = true

export default function ResultsPage({ result, input, estimateId, contactName, onStartOver }: Props) {
  const [payStatus, setPayStatus]   = useState<PayStatus>('idle')
  const [payError, setPayError]     = useState('')
  const [isPaid, setIsPaid]         = useState(PAYMENT_BYPASS)
  const [orderId, setOrderId]       = useState<string | null>(null)
  const pollRef                     = useRef<ReturnType<typeof setInterval> | null>(null)
  const [pdfStatus, setPdfStatus]   = useState<PdfStatus>('idle')
  const [pdfUrl, setPdfUrl]         = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)

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

  // Download PDF as blob to force browser download instead of opening in tab
  const downloadPdf = useCallback(async () => {
    if (!pdfUrl || isDownloading) return
    setIsDownloading(true)
    try {
      const res = await fetch(pdfUrl)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'NirmanShastra-StructurePro-Report.pdf'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      // Fallback to opening in tab if blob fetch fails
      window.open(pdfUrl, '_blank')
    } finally {
      setIsDownloading(false)
    }
  }, [pdfUrl, isDownloading])

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
        description: 'StructurePro Report — Phase 1 RCC Structure',
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

        {/* Preview mode banner */}
        {PAYMENT_BYPASS && (
          <div
            className="px-4 py-2 rounded-[2px] flex items-center gap-2"
            style={{ background: 'rgba(20,83,45,0.08)', border: '1px solid rgba(20,83,45,0.35)' }}
          >
            <span style={{ color: '#14532D', fontSize: 13 }}>✓</span>
            <p className="text-[12px]" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)' }}>
              PREVIEW MODE — Full report visible for testing
            </p>
          </div>
        )}

        {/* ── GRAND TOTAL — FREE, ALWAYS VISIBLE ── */}
        <div style={{ background: '#1E2227', position: 'relative', overflow: 'hidden' }}>
          <div className="results-blob-1" aria-hidden="true" />
          <div className="results-blob-2" aria-hidden="true" />
          <div style={{
            position: 'relative',
            zIndex: 1,
            padding: '56px 48px',
            textAlign: 'center',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            background: 'rgba(30,34,39,0.18)',
          }}>
          <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: 'rgba(244,244,240,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
            PHASE 1 — RCC STRUCTURE · {input.city}, {input.state} · IS 456:2000
          </p>
          <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 16, color: 'rgba(244,244,240,0.55)', marginBottom: 16 }}>
            Your Structure Cost ({input.concreteGrade} · {input.steelGrade})
          </p>

          {/* Grand Total — dominant number */}
          <div className="grand-total-pulse" style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 'clamp(64px,8vw,96px)', fontWeight: 700, color: '#F4F4F0', lineHeight: 1, marginBottom: 8 }}>
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
          </div>{/* /glass inner */}
        </div>{/* /gradient mesh outer */}

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

        {/* ── COST BREAKDOWN PIE CHART — FREE ── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.18)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.1)' }}>
            <p className="text-[11px] uppercase tracking-widest" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              MATERIAL COST BREAKDOWN
            </p>
          </div>
          <div className="p-4 flex flex-col sm:flex-row gap-6 items-center">
            {(() => {
              const pieItems = [
                { name: 'Cement',     value: r.costs.cement,     color: '#1F4E79' },
                { name: 'Steel',      value: r.costs.steel,      color: '#14532D' },
                { name: 'Aggregate',  value: r.costs.aggregate,  color: '#8C3A22' },
                { name: 'Sand',       value: r.costs.sand,       color: '#D99A06' },
                { name: 'Formwork',   value: r.costs.formwork,   color: '#455A64' },
                { name: 'Foundation', value: r.costs.foundation, color: '#5C4033' },
              ]
              const total = pieItems.reduce((s, i) => s + i.value, 0)
              return (
                <>
                  <div style={{ width: 200, height: 200, flexShrink: 0 }}>
                    <PieChart width={200} height={200}>
                      <Pie data={pieItems} cx={100} cy={100} innerRadius={52} outerRadius={82} paddingAngle={2} dataKey="value">
                        {pieItems.map((item, i) => <Cell key={i} fill={item.color} />)}
                      </Pie>
                      <Tooltip
                        formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`}
                        contentStyle={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, background: '#F4F4F0', border: '1px solid #1F4E79', borderRadius: 2 }}
                      />
                    </PieChart>
                  </div>
                  <div className="flex flex-col gap-2 flex-1">
                    {pieItems.map(item => {
                      const pct = total > 0 ? Math.round((item.value / total) * 100) : 0
                      return (
                        <div key={item.name} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-[1px] shrink-0" style={{ background: item.color }} />
                          <span className="text-[12px] flex-1" style={{ fontFamily: 'var(--font-plex-sans)', color: '#1E2227' }}>{item.name}</span>
                          <span className="text-[12px] font-medium" style={{ fontFamily: 'var(--font-plex-mono)', color: '#1E2227' }}>{pct}%</span>
                          <span className="text-[11px]" style={{ fontFamily: 'var(--font-plex-mono)', color: 'rgba(30,34,39,0.45)' }}>₹{item.value.toLocaleString('en-IN')}</span>
                        </div>
                      )
                    })}
                  </div>
                </>
              )
            })()}
          </div>
        </div>

        {/* ── GRADE COMPARISON BAR CHART — FREE ── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.18)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.1)' }}>
            <p className="text-[11px] uppercase tracking-widest" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              CONCRETE GRADE COMPARISON — COST IMPACT
            </p>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={r.gradeSummary.map(g => ({ grade: g.grade, label: g.label, costPerSqft: g.costPerSqft, selected: g.grade === input.concreteGrade }))}
                margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
              >
                <XAxis dataKey="grade" style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11 }} tick={{ fill: '#1E2227' }} />
                <YAxis style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11 }} tickFormatter={(v: number) => `₹${v}`} tick={{ fill: 'rgba(30,34,39,0.55)' }} />
                <Tooltip
                  formatter={(value) => `₹${Number(value)}/sqft`}
                  contentStyle={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, background: '#F4F4F0', border: '1px solid #1F4E79', borderRadius: 2 }}
                />
                <Bar dataKey="costPerSqft" radius={[2, 2, 0, 0]}>
                  {r.gradeSummary.map((g, i) => (
                    <Cell key={i} fill={g.grade === input.concreteGrade ? '#1F4E79' : 'rgba(30,34,39,0.18)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 mt-2">
              {r.gradeSummary.map(g => (
                <div key={g.grade} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-[1px]" style={{ background: g.grade === input.concreteGrade ? '#1F4E79' : 'rgba(30,34,39,0.18)' }} />
                  <span className="text-[11px]" style={{ fontFamily: 'var(--font-plex-mono)', color: g.grade === input.concreteGrade ? '#1F4E79' : 'rgba(30,34,39,0.55)' }}>
                    {g.grade} ₹{g.costPerSqft}/sqft{g.grade === input.concreteGrade ? ' ◀' : ''}
                  </span>
                </div>
              ))}
            </div>
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
                clause: 'IS 456:2000 Table 9',
                formula: 'Cement (bags) = BUA × 0.40 bags/sqft × Floor Factor × Grade Factor',
                note: 'Dry volume factor 1.54 (wet→dry). Floor Factor: G=0.85, G+1 to G+3=1.00, G+4=1.08, G+5=1.12. Grade Factor: M20=1.00, M25=1.12, M30=1.22.',
              },
              {
                clause: 'IS 1786:2008 · IS 456:2000',
                formula: 'Steel (kg) = BUA × 4 kg/sqft × Floor Factor',
                note: 'By member: Footing 0.50% → 39.25 kg/m³ · Column 2.50% → 196.25 · Beam 1.50% → 117.75 · Slab 1.00% → 78.50. Steel density 7,850 kg/m³.',
              },
              {
                clause: 'IS 456:2000 Table 9 — M20 mix 1:1.5:3',
                formula: 'Aggregate (cft) = BUA × 1.35 cft/sqft × Floor Factor',
                note: 'Coarse aggregate 20mm. M20 = 22.44 cft/m³ concrete volume. M25 = 14.96 cft/m³.',
              },
              {
                clause: 'IS 456:2000 Table 9',
                formula: 'Sand (cft) = BUA × 1.80 cft/sqft × Floor Factor',
                note: 'River sand or M-sand. M20 = 11.22 cft/m³; M25 = 7.48 cft/m³ concrete volume.',
              },
              {
                clause: 'IS 1786:2008',
                formula: 'Binding wire (kg) = Steel (kg) ÷ 1,000 × 12 kg/tonne',
                note: 'GI binding wire. IS code value is 10 kg/tonne; 12 kg/tonne used here to allow 20% site wastage.',
              },
              {
                clause: 'IS 1904:2016 · Min foundation depth 500mm',
                formula: 'Foundation cost (₹) = Ground floor area (sqft) × Avg rate (₹/sqft)',
                note: 'Rate by type: Isolated ₹220–350 · Strip ₹200–320 · Raft ₹350–550 · Under-reamed pile ₹400–600 per sqft.',
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
                {isPaid ? (
                  /* Paid: single unified table — colgroup guarantees column alignment */
                  <table className="w-full text-[13px]" style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                    <colgroup>
                      <col style={{ width: '8%' }} />
                      <col style={{ width: '40%' }} />
                      <col style={{ width: '10%' }} />
                      <col style={{ width: '12%' }} />
                      <col style={{ width: '15%' }} />
                      <col style={{ width: '15%' }} />
                    </colgroup>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #1E2227', background: 'rgba(30,34,39,0.04)' }}>
                        <th className="text-left py-2 px-1 text-[9px] uppercase tracking-widest" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>Item</th>
                        <th className="text-left py-2 text-[9px] uppercase tracking-widest" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>Description</th>
                        <th className="text-right py-2 text-[9px] uppercase tracking-widest" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>Unit</th>
                        <th className="text-right py-2 text-[9px] uppercase tracking-widest" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>Qty</th>
                        <th className="text-right py-2 text-[9px] uppercase tracking-widest" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>Rate (₹)</th>
                        <th className="text-right py-2 text-[9px] uppercase tracking-widest" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { itemNo: '1.1', name: `Cement — ${input.concreteGrade}`,               unit: 'bags', qty: r.quantities.cementBags,    cost: r.costs.cement },
                        { itemNo: '1.2', name: `TMT Steel — ${input.steelGrade}`,               unit: 'kg',   qty: r.quantities.steelKg,        cost: r.costs.steel },
                        { itemNo: '1.3', name: 'Coarse Aggregate (20mm)',                        unit: 'cft',  qty: r.quantities.aggregateCft,   cost: r.costs.aggregate },
                        { itemNo: '1.4', name: 'Sand (River/M-Sand)',                            unit: 'cft',  qty: r.quantities.sandCft,        cost: r.costs.sand },
                        { itemNo: '1.5', name: 'Binding Wire (GI)',                              unit: 'kg',   qty: r.quantities.bindingWireKg,  cost: r.costs.bindingWire },
                        { itemNo: '1.6', name: 'Formwork (wooden/steel shuttering)',             unit: 'sqft', qty: r.quantities.formworkSqft,   cost: r.costs.formwork },
                      ].map((row, i) => (
                        <tr key={row.itemNo} style={{ borderBottom: '1px solid rgba(30,34,39,0.08)', background: i % 2 ? 'rgba(30,34,39,0.018)' : 'transparent' }}>
                          <td className="py-2 px-1" style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)', fontSize: 11 }}>{row.itemNo}</td>
                          <td className="py-2" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)', fontSize: 13 }}>{row.name}</td>
                          <td className="py-2 text-right" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)', fontSize: 12 }}>{row.unit}</td>
                          <td className="py-2 text-right" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)', fontSize: 13, fontWeight: 500 }}>{row.qty.toLocaleString('en-IN')}</td>
                          <td className="py-2 text-right" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)', fontSize: 12 }}>{Math.round(row.cost / Math.max(row.qty, 1)).toLocaleString('en-IN')}</td>
                          <td className="py-2 text-right" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)', fontSize: 13 }}>{row.cost.toLocaleString('en-IN')}</td>
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
                      {input.includeLabour !== false && (
                        <tr>
                          <td colSpan={5} className="py-1.5 text-[12px]" style={{ fontFamily: 'var(--font-plex-sans)', color: 'rgba(30,34,39,0.5)' }}>Labour — CPWD standard rates</td>
                          <td className="py-1.5 text-right text-[12px]" style={{ fontFamily: 'var(--font-plex-mono)', color: 'rgba(30,34,39,0.5)' }}>{r.labourCost.toLocaleString('en-IN')}</td>
                        </tr>
                      )}
                      <tr>
                        <td colSpan={5} className="py-1.5 text-[12px]" style={{ fontFamily: 'var(--font-plex-sans)', color: 'rgba(30,34,39,0.5)' }}>
                          {input.includeLabour !== false ? 'Contractor overhead + margin (10%)' : 'Overhead + margin (10%)'}
                        </td>
                        <td className="py-1.5 text-right text-[12px]" style={{ fontFamily: 'var(--font-plex-mono)', color: 'rgba(30,34,39,0.5)' }}>{r.overheadCost.toLocaleString('en-IN')}</td>
                      </tr>
                      <tr style={{ borderTop: '2px solid #1F4E79', background: 'rgba(31,78,121,0.06)' }}>
                        <td colSpan={5} className="py-2 font-bold text-[14px]" style={{ fontFamily: 'var(--font-plex-sans)', color: '#1F4E79' }}>
                          {input.includeLabour !== false ? 'TOTAL STANDARD ESTIMATE' : 'TOTAL — MATERIALS + OVERHEAD'}
                        </td>
                        <td className="py-2 text-right font-bold text-[16px]" style={{ fontFamily: 'var(--font-plex-mono)', color: '#1F4E79' }}>{r.grandTotal.standard.toLocaleString('en-IN')}</td>
                      </tr>
                    </tbody>
                  </table>
                ) : (
                  /* Free (locked): two tables share identical colgroup so columns align */
                  <>
                    <table className="w-full text-[13px]" style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                      <colgroup>
                        <col style={{ width: '40%' }} />
                        <col style={{ width: '12%' }} />
                        <col style={{ width: '18%' }} />
                        <col style={{ width: '30%' }} />
                      </colgroup>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #1E2227', background: 'rgba(30,34,39,0.04)' }}>
                          <th className="text-left py-2 text-[9px] uppercase tracking-widest" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>Description</th>
                          <th className="text-right py-2 text-[9px] uppercase tracking-widest" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>Unit</th>
                          <th className="text-right py-2 text-[9px] uppercase tracking-widest" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>Qty</th>
                          <th className="text-right py-2 text-[9px] uppercase tracking-widest" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { name: `Cement — ${input.concreteGrade}`, unit: 'bags', qty: r.quantities.cementBags },
                          { name: `TMT Steel — ${input.steelGrade}`, unit: 'kg',   qty: r.quantities.steelKg },
                        ].map((row, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid rgba(30,34,39,0.08)', background: i % 2 ? 'rgba(30,34,39,0.018)' : 'transparent' }}>
                            <td className="py-2" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)', fontSize: 13 }}>{row.name}</td>
                            <td className="py-2 text-right" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)', fontSize: 12 }}>{row.unit}</td>
                            <td className="py-2 text-right" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)', fontSize: 13, fontWeight: 500 }}>{row.qty.toLocaleString('en-IN')}</td>
                            <td className="py-2 text-right" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)', fontSize: 13 }}>—</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{ position: 'relative', marginTop: 0 }}>
                      <div style={{ filter: 'blur(5px)', userSelect: 'none', pointerEvents: 'none' }}>
                        <table className="w-full text-[13px]" style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                          <colgroup>
                            <col style={{ width: '40%' }} />
                            <col style={{ width: '12%' }} />
                            <col style={{ width: '18%' }} />
                            <col style={{ width: '30%' }} />
                          </colgroup>
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
                  </>
                )}
              </>
            )}

            {/* ── TAB 2: Steel Schedule ── */}
            {activeTab === 'steel_schedule' && (
              !isPaid ? (
                <div>
                  <p className="text-[11px] mb-3" style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>
                    IS 1786:2008 · IS 456:2000 — first 2 members shown free
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
                      {[
                        { member: 'Footing / Foundation', pct: '0.50%', share: 0.10, density: 39.25 },
                        { member: 'Plinth Beam',          pct: '1.50%', share: 0.08, density: 117.75 },
                      ].map((s, i) => {
                        const kg   = Math.round(r.quantities.steelKg * s.share)
                        const cost = Math.round(r.costs.steel * s.share)
                        const vol  = (kg / s.density).toFixed(1)
                        return (
                          <tr key={s.member} style={{ borderBottom: '1px solid rgba(30,34,39,0.08)', background: i % 2 ? 'rgba(30,34,39,0.018)' : 'transparent' }}>
                            <td className="py-2 px-2" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)', fontSize: 13 }}>{s.member}</td>
                            <td className="py-2 px-2" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)', fontSize: 12 }}>{s.pct}</td>
                            <td className="py-2 px-2 text-right" style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-mono)', fontSize: 12 }}>{vol}</td>
                            <td className="py-2 px-2 text-right" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)', fontSize: 13, fontWeight: 500 }}>{kg.toLocaleString('en-IN')}</td>
                            <td className="py-2 px-2 text-right" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)', fontSize: 13 }}>{cost.toLocaleString('en-IN')}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  <div style={{ position: 'relative', marginTop: 0 }}>
                    <div style={{ filter: 'blur(4px)', userSelect: 'none', pointerEvents: 'none' }}>
                      <table className="w-full text-[12px]" style={{ borderCollapse: 'collapse' }}>
                        <tbody>
                          {[
                            { member: 'Columns', pct: '2.50%', share: 0.20, density: 196.25 },
                            { member: 'Beams',   pct: '1.50%', share: 0.30, density: 117.75 },
                            { member: 'Slabs',   pct: '1.00%', share: 0.32, density: 78.50 },
                          ].map((s, i) => {
                            const kg   = Math.round(r.quantities.steelKg * s.share)
                            const cost = Math.round(r.costs.steel * s.share)
                            const vol  = (kg / s.density).toFixed(1)
                            return (
                              <tr key={s.member} style={{ borderBottom: '1px solid rgba(30,34,39,0.08)', background: i % 2 ? 'rgba(30,34,39,0.018)' : 'transparent' }}>
                                <td className="py-2 px-2" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)', fontSize: 13 }}>{s.member}</td>
                                <td className="py-2 px-2" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)', fontSize: 12 }}>{s.pct}</td>
                                <td className="py-2 px-2 text-right" style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-mono)', fontSize: 12 }}>{vol}</td>
                                <td className="py-2 px-2 text-right" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)', fontSize: 13 }}>{kg.toLocaleString('en-IN')}</td>
                                <td className="py-2 px-2 text-right" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)', fontSize: 13 }}>{cost.toLocaleString('en-IN')}</td>
                              </tr>
                            )
                          })}
                          <tr style={{ borderTop: '2px solid #1E2227', background: 'rgba(30,34,39,0.03)' }}>
                            <td colSpan={3} className="py-2 px-2 font-semibold" style={{ fontFamily: 'var(--font-plex-sans)', color: '#1E2227', fontSize: 13 }}>Total Steel</td>
                            <td className="py-2 px-2 text-right font-bold" style={{ fontFamily: 'var(--font-plex-mono)', color: '#1E2227', fontSize: 14 }}>{r.quantities.steelKg.toLocaleString('en-IN')} kg</td>
                            <td className="py-2 px-2 text-right font-bold" style={{ fontFamily: 'var(--font-plex-mono)', color: '#1E2227', fontSize: 14 }}>{r.costs.steel.toLocaleString('en-IN')}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(244,244,240,0.75)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: 'rgba(30,34,39,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>3 more members + total locked</p>
                      <button onClick={handleUnlock} style={{ background: '#8C3A22', color: '#F4F4F0', fontFamily: 'var(--font-plex-mono)', fontSize: 12, padding: '8px 18px', borderRadius: 6, border: 'none', cursor: 'pointer', letterSpacing: '0.03em' }}>
                        Unlock Full BOQ — ₹499
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-[11px] mb-3" style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>
                    IS 1786:2008 · IS 456:2000 — steel percentages by member type
                  </p>
                  <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }} className="text-[12px]">
                    <colgroup>
                      <col style={{ width: '25%' }} />
                      <col style={{ width: '15%' }} />
                      <col style={{ width: '15%' }} />
                      <col style={{ width: '20%' }} />
                      <col style={{ width: '25%' }} />
                    </colgroup>
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
                <div>
                  <p className="text-[11px] mb-3" style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>
                    IS 456:2000 — {input.concreteGrade} · dry volume factor 1.54 · first 2 members free
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
                        const totalVol = r.quantities.cementBags / 8.07
                        return [
                          { member: 'Foundation',  share: 0.15 },
                          { member: 'Plinth Beam', share: 0.08 },
                        ].map((s, i) => {
                          const vol = (totalVol * s.share).toFixed(2)
                          const cem = Math.round(r.quantities.cementBags * s.share)
                          const san = Math.round(r.quantities.sandCft * s.share)
                          const agg = Math.round(r.quantities.aggregateCft * s.share)
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
                    </tbody>
                  </table>
                  <div style={{ position: 'relative', marginTop: 0 }}>
                    <div style={{ filter: 'blur(4px)', userSelect: 'none', pointerEvents: 'none' }}>
                      <table className="w-full text-[12px]" style={{ borderCollapse: 'collapse' }}>
                        <tbody>
                          {(() => {
                            const totalVol = r.quantities.cementBags / 8.07
                            return [
                              { member: 'Columns', share: 0.18 },
                              { member: 'Beams',   share: 0.27 },
                              { member: 'Slabs',   share: 0.32 },
                            ].map((s, i) => {
                              const vol = (totalVol * s.share).toFixed(2)
                              const cem = Math.round(r.quantities.cementBags * s.share)
                              const san = Math.round(r.quantities.sandCft * s.share)
                              const agg = Math.round(r.quantities.aggregateCft * s.share)
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
                    </div>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(244,244,240,0.75)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: 'rgba(30,34,39,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>3 more members + totals locked</p>
                      <button onClick={handleUnlock} style={{ background: '#8C3A22', color: '#F4F4F0', fontFamily: 'var(--font-plex-mono)', fontSize: 12, padding: '8px 18px', borderRadius: 6, border: 'none', cursor: 'pointer', letterSpacing: '0.03em' }}>
                        Unlock Concrete Schedule — ₹499
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-[11px] mb-3" style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>
                    IS 456:2000 — {input.concreteGrade} · dry volume factor 1.54
                  </p>
                  <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }} className="text-[12px]">
                    <colgroup>
                      <col style={{ width: '25%' }} />
                      <col style={{ width: '20%' }} />
                      <col style={{ width: '20%' }} />
                      <col style={{ width: '17%' }} />
                      <col style={{ width: '18%' }} />
                    </colgroup>
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
                <div>
                  <p className="text-[11px] mb-3" style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>
                    CPWD DSR 2023 — first 2 trades shown free
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
                        { name: 'Bar Bender (Sariya Mistri)', workers: 2, rate: 950,  days: Math.ceil(r.quantities.steelKg / 600) },
                        { name: 'Shuttering Carpenter',        workers: 2, rate: 900,  days: Math.ceil(r.quantities.formworkSqft / 100) },
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
                    </tbody>
                  </table>
                  <div style={{ position: 'relative', marginTop: 0 }}>
                    <div style={{ filter: 'blur(4px)', userSelect: 'none', pointerEvents: 'none' }}>
                      <table className="w-full text-[12px]" style={{ borderCollapse: 'collapse' }}>
                        <tbody>
                          {[
                            { name: 'Concreting Mason (RCC)',  workers: 2, rate: 900,  days: Math.ceil(r.quantities.cementBags / 8.07 / 2.5) },
                            { name: 'Vibrator Operator',        workers: 1, rate: 800,  days: Math.ceil(r.quantities.cementBags / 8.07 / 2.5) },
                            { name: 'General Helper / Beldar',  workers: 4, rate: 580,  days: Math.ceil(r.quantities.cementBags / 8.07 / 2.5) },
                            { name: 'Curing / Water Man',       workers: 1, rate: 500,  days: (input.numFloors + 1) * 14 },
                            { name: 'Night Watchman',           workers: 1, rate: 500,  days: (input.numFloors + 1) * 21 },
                            { name: 'Junior Site Engineer',     workers: 1, rate: 1500, days: Math.ceil(r.quantities.cementBags / 8.07 / 2.5) + 10 },
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
                            <td colSpan={4} className="py-2 px-2 font-semibold" style={{ fontFamily: 'var(--font-plex-sans)', color: '#1E2227', fontSize: 13 }}>Total Labour</td>
                            <td className="py-2 px-2 text-right font-bold" style={{ fontFamily: 'var(--font-plex-mono)', color: '#1E2227', fontSize: 14 }}>{r.labourCost.toLocaleString('en-IN')}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(244,244,240,0.75)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: 'rgba(30,34,39,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>6 more trades + total locked</p>
                      <button onClick={handleUnlock} style={{ background: '#8C3A22', color: '#F4F4F0', fontFamily: 'var(--font-plex-mono)', fontSize: 12, padding: '8px 18px', borderRadius: 6, border: 'none', cursor: 'pointer', letterSpacing: '0.03em' }}>
                        Unlock Labour Schedule — ₹499
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-[11px] mb-3" style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>
                    CPWD DSR 2023 — standard productivity rates
                  </p>
                  {input.includeLabour === false ? (
                    <>
                      <div className="p-4 rounded-[2px]" style={{ border: '1px solid rgba(30,34,39,0.15)', background: 'rgba(30,34,39,0.02)' }}>
                        <p className="text-[13px]" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)', lineHeight: 1.6 }}>
                          Labour cost not included in this estimate. You selected material quantities only. To add labour costs, start a new estimate and select &apos;Include Labour Cost&apos; in Step 3c.
                        </p>
                      </div>
                      <div className="flex items-center justify-between py-2 px-2 mt-3" style={{ borderTop: '2px solid #1E2227', background: 'rgba(30,34,39,0.03)' }}>
                        <span className="font-semibold text-[13px]" style={{ fontFamily: 'var(--font-plex-sans)', color: '#1E2227' }}>Total Labour</span>
                        <span className="font-bold text-[13px]" style={{ fontFamily: 'var(--font-plex-mono)', color: 'rgba(30,34,39,0.45)' }}>Not included</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }} className="text-[12px]">
                        <colgroup>
                          <col style={{ width: '30%' }} />
                          <col style={{ width: '12%' }} />
                          <col style={{ width: '18%' }} />
                          <col style={{ width: '18%' }} />
                          <col style={{ width: '22%' }} />
                        </colgroup>
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
                  )}
                </>
              )
            )}

            {/* ── TAB 5: By Floor ── */}
            {activeTab === 'by_floor' && (
              !isPaid ? (() => {
                const numF = input.numFloors + 1
                const floorNames = ['Ground Floor', 'First Floor', 'Second Floor', 'Third Floor', 'Fourth Floor', 'Fifth Floor']
                const previewRows = Math.min(2, numF)
                const lockedRows  = numF - previewRows
                return (
                  <div>
                    <p className="text-[11px] mb-3" style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>
                      IS 456:2000 · IS 875:2015 — first {previewRows} floor{previewRows > 1 ? 's' : ''} shown free
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
                        {Array.from({ length: previewRows }, (_, i) => {
                          const floorArea = input.perFloorAreas?.[i] ?? (totalBUA / numF)
                          const share = totalBUA > 0 ? floorArea / totalBUA : 1 / numF
                          const cem  = Math.round(r.quantities.cementBags * share)
                          const stl  = Math.round(r.quantities.steelKg * share)
                          const conc = (r.quantities.cementBags * share / 8.07).toFixed(2)
                          const cost = Math.round(r.grandTotal.standard * share)
                          return (
                            <tr key={i} style={{ borderBottom: '1px solid rgba(30,34,39,0.08)', background: i % 2 ? 'rgba(30,34,39,0.018)' : 'transparent' }}>
                              <td className="py-2 px-2" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)', fontSize: 13 }}>{floorNames[i] ?? `Floor ${i}`}</td>
                              <td className="py-2 px-2 text-right" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)', fontSize: 12 }}>{Math.round(floorArea).toLocaleString('en-IN')}</td>
                              <td className="py-2 px-2 text-right" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)', fontSize: 12 }}>{cem.toLocaleString('en-IN')}</td>
                              <td className="py-2 px-2 text-right" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)', fontSize: 12 }}>{stl.toLocaleString('en-IN')}</td>
                              <td className="py-2 px-2 text-right" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)', fontSize: 12 }}>{conc}</td>
                              <td className="py-2 px-2 text-right font-medium" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)', fontSize: 13 }}>{cost.toLocaleString('en-IN')}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                    {lockedRows > 0 && (
                      <div style={{ position: 'relative', marginTop: 0 }}>
                        <div style={{ filter: 'blur(4px)', userSelect: 'none', pointerEvents: 'none' }}>
                          <table className="w-full text-[12px]" style={{ borderCollapse: 'collapse' }}>
                            <tbody>
                              {Array.from({ length: lockedRows }, (_, j) => {
                                const i = j + previewRows
                                const floorArea = input.perFloorAreas?.[i] ?? (totalBUA / numF)
                                const share = totalBUA > 0 ? floorArea / totalBUA : 1 / numF
                                const cem  = Math.round(r.quantities.cementBags * share)
                                const stl  = Math.round(r.quantities.steelKg * share)
                                const conc = (r.quantities.cementBags * share / 8.07).toFixed(2)
                                const cost = Math.round(r.grandTotal.standard * share)
                                return (
                                  <tr key={i} style={{ borderBottom: '1px solid rgba(30,34,39,0.08)', background: i % 2 ? 'rgba(30,34,39,0.018)' : 'transparent' }}>
                                    <td className="py-2 px-2" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)', fontSize: 13 }}>{floorNames[i] ?? `Floor ${i}`}</td>
                                    <td className="py-2 px-2 text-right" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)', fontSize: 12 }}>{Math.round(floorArea).toLocaleString('en-IN')}</td>
                                    <td className="py-2 px-2 text-right" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)', fontSize: 12 }}>{cem.toLocaleString('en-IN')}</td>
                                    <td className="py-2 px-2 text-right" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)', fontSize: 12 }}>{stl.toLocaleString('en-IN')}</td>
                                    <td className="py-2 px-2 text-right" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)', fontSize: 12 }}>{conc}</td>
                                    <td className="py-2 px-2 text-right font-medium" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)', fontSize: 13 }}>{cost.toLocaleString('en-IN')}</td>
                                  </tr>
                                )
                              })}
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
                        </div>
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(244,244,240,0.75)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                          <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: 'rgba(30,34,39,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{lockedRows} more floor{lockedRows > 1 ? 's' : ''} + total locked</p>
                          <button onClick={handleUnlock} style={{ background: '#8C3A22', color: '#F4F4F0', fontFamily: 'var(--font-plex-mono)', fontSize: 12, padding: '8px 18px', borderRadius: 6, border: 'none', cursor: 'pointer', letterSpacing: '0.03em' }}>
                            Unlock Floor Breakdown — ₹499
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })() : (
                <>
                  <p className="text-[11px] mb-3" style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>
                    IS 456:2000 · IS 875:2015 — allocation per floor
                  </p>
                  <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }} className="text-[12px]">
                    <colgroup>
                      <col style={{ width: '20%' }} />
                      <col style={{ width: '16%' }} />
                      <col style={{ width: '16%' }} />
                      <col style={{ width: '16%' }} />
                      <col style={{ width: '16%' }} />
                      <col style={{ width: '16%' }} />
                    </colgroup>
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
                        const floorNames = ['Ground Floor', 'First Floor', 'Second Floor', 'Third Floor', 'Fourth Floor', 'Fifth Floor']
                        return Array.from({ length: numFloors }, (_, i) => {
                          const floorArea = input.perFloorAreas?.[i] ?? (totalBUA / numFloors)
                          const share = totalBUA > 0 ? floorArea / totalBUA : 1 / numFloors
                          const cem  = Math.round(r.quantities.cementBags * share)
                          const stl  = Math.round(r.quantities.steelKg * share)
                          const conc = (r.quantities.cementBags * share / 8.07).toFixed(2)
                          const cost = Math.round(r.grandTotal.standard * share)
                          return (
                            <tr key={i} style={{ borderBottom: '1px solid rgba(30,34,39,0.08)', background: i % 2 ? 'rgba(30,34,39,0.018)' : 'transparent' }}>
                              <td className="py-2 px-2" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)', fontSize: 13 }}>{floorNames[i] ?? `Floor ${i}`}</td>
                              <td className="py-2 px-2 text-right" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)', fontSize: 12 }}>{Math.round(floorArea).toLocaleString('en-IN')}</td>
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
              Exact quantities, local market rates, contractor comparison, and a 10+ page IS-code PDF report
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
                <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: 'rgba(244,244,240,0.4)', marginBottom: 2 }}>Or save ₹496</p>
                <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 14, color: 'rgba(244,244,240,0.7)' }}>Complete Bundle — All 5 Apps <span style={{ fontFamily: 'var(--font-plex-mono)', color: '#F4F4F0' }}>₹1,999</span></p>
              </div>
            </div>

            {payError && (
              <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 12, color: '#D99A06', marginTop: 12 }}>
                ⚠ {payError}
              </p>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16, marginTop: 28 }}>
              {['IS 456:2000 calculations', 'Itemised BOQ', 'Contractor comparison', '10+ page PDF report'].map(f => (
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
              Your full estimate is now visible above. Download your 10+ page IS-code PDF report below.
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
              <button
                onClick={downloadPdf}
                disabled={isDownloading}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-[6px] text-[14px] font-semibold text-white cursor-pointer disabled:opacity-60"
                style={{ background: '#8C3A22', fontFamily: 'var(--font-plex-sans)', border: 'none' }}
              >
                {isDownloading ? (
                  <>
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="10 6" />
                    </svg>
                    Preparing download…
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8 2v8M5 7l3 3 3-3M3 13h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Download PDF Report
                  </>
                )}
              </button>
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

        {/* ── NEXT TOOL NUDGE ── */}
        <div className="rounded-[2px] p-5" style={{ border: '1px solid #1F4E79', background: 'rgba(31,78,121,0.04)' }}>
          <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
            NEXT — PHASE 2
          </p>
          <p className="text-[14px] font-semibold mb-1" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>
            Get your Masonry quantities — MasonryPro →
          </p>
          <p className="text-[12px] mb-3" style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-sans)' }}>
            Now that your structure is sized, get exact brick and mortar quantities with MasonryPro. Masonry is 20–25% of total project cost — the most common area for contractor overcharging.
          </p>
          <a
            href="/tools/masonpro"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[6px] text-[13px] font-semibold"
            style={{ background: '#1F4E79', color: '#F4F4F0', fontFamily: 'var(--font-plex-sans)', textDecoration: 'none' }}
          >
            Start MasonryPro →
          </a>
        </div>

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
