'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { PAYMENT_BYPASS } from '@/lib/payment-config'

// ─── Types ────────────────────────────────────────────────────────────────────

type AppTypeKey = 'structopro' | 'masonpro' | 'electropro' | 'plumbpro' | 'interiorpro'

interface EstimateRecord {
  id:          string
  app_type:    AppTypeKey
  project_name: string | null
  result_data: { grandTotal: { basic: number; standard: number; premium: number } } | null
  status:      string
  created_at:  string
}

type PayStatus = 'idle' | 'creating_estimate' | 'creating_order' | 'open' | 'verifying' | 'polling' | 'paid' | 'error'
type PdfStatus = 'idle' | 'generating' | 'ready' | 'error'

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TOOLS: { key: AppTypeKey; phase: string; name: string; label: string; href: string }[] = [
  { key: 'structopro',  phase: 'P1', name: 'StructurePro',  label: 'Phase 1 — RCC Structure', href: '/tools/structopro'  },
  { key: 'masonpro',    phase: 'P2', name: 'MasonryPro',   label: 'Phase 2 — Masonry',       href: '/tools/masonpro'    },
  { key: 'electropro',  phase: 'P3', name: 'ElectricalPro', label: 'Phase 3 — Electrical',   href: '/tools/electropro'  },
  { key: 'plumbpro',    phase: 'P4', name: 'PlumbingPro',  label: 'Phase 4 — Plumbing',      href: '/tools/plumbpro'    },
  { key: 'interiorpro', phase: 'P5', name: 'InteriorPro', label: 'Phase 5 — Interior',      href: '/tools/interiorpro' },
]

const PHASE_COLORS: Record<AppTypeKey, string> = {
  structopro:  '#1F4E79',
  masonpro:    '#14532D',
  electropro:  '#D99A06',
  plumbpro:    '#8C3A22',
  interiorpro: '#6B21A8',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtLakhs(n: number): string {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)} Cr`
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(1)} L`
  return `₹${n.toLocaleString('en-IN')}`
}

function getGrandTotal(estimate: EstimateRecord) {
  return estimate.result_data?.grandTotal ?? null
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const mono: React.CSSProperties  = { fontFamily: 'var(--font-plex-mono)' }
const serif: React.CSSProperties = { fontFamily: 'var(--font-plex-serif)' }
const sans: React.CSSProperties  = { fontFamily: 'var(--font-plex-sans)' }

function PhaseCard({
  tool,
  estimate,
  selected,
  onToggle,
  disabled,
}: {
  tool:     typeof TOOLS[number]
  estimate: EstimateRecord | null
  selected: boolean
  onToggle: () => void
  disabled: boolean
}) {
  const gt     = estimate ? getGrandTotal(estimate) : null
  const hasPaid = !!estimate

  return (
    <div
      onClick={hasPaid && !disabled ? onToggle : undefined}
      style={{
        border:      `1px solid ${selected ? '#1F4E79' : hasPaid ? '#D0D2D4' : 'rgba(30,34,39,0.12)'}`,
        background:  selected ? '#EBF0F7' : hasPaid ? '#F4F4F0' : 'rgba(30,34,39,0.02)',
        padding:     20,
        cursor:      hasPaid && !disabled ? 'pointer' : 'default',
        transition:  'all 0.15s',
        position:    'relative',
        opacity:     !hasPaid ? 0.6 : 1,
      }}
    >
      {/* Phase badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <span style={{ ...mono, fontSize: 10, color: '#1F4E79', letterSpacing: 1, textTransform: 'uppercase' }}>
          {tool.phase}
        </span>
        {hasPaid && !disabled && (
          <div style={{
            width: 18, height: 18,
            border:      `2px solid ${selected ? '#1F4E79' : '#D0D2D4'}`,
            background:  selected ? '#1F4E79' : 'transparent',
            borderRadius: 2,
            display:      'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {selected && <span style={{ color: '#fff', fontSize: 11, lineHeight: 1 }}>✓</span>}
          </div>
        )}
      </div>

      <div style={{ ...serif, fontSize: 16, fontWeight: 700, color: '#1E2227', marginBottom: 2 }}>{tool.name}</div>
      <div style={{ ...sans, fontSize: 11, color: 'rgba(30,34,39,0.5)', marginBottom: 12 }}>{tool.label}</div>

      {estimate && gt ? (
        <div>
          <div style={{ ...mono, fontSize: 8, color: 'rgba(30,34,39,0.5)', marginBottom: 4 }}>
            {estimate.project_name || 'Estimate'} · {new Date(estimate.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
          <div style={{ ...mono, fontSize: 14, fontWeight: 500, color: '#1F4E79' }}>
            {fmtLakhs(gt.basic)} – {fmtLakhs(gt.premium)}
          </div>
          <div style={{ ...mono, fontSize: 8, color: 'rgba(30,34,39,0.5)', marginTop: 2 }}>Standard: {fmtLakhs(gt.standard)}</div>
        </div>
      ) : (
        <Link
          href={tool.href}
          onClick={e => e.stopPropagation()}
          style={{ ...mono, fontSize: 11, color: '#8C3A22', textDecoration: 'none', borderBottom: '1px solid #8C3A22' }}
        >
          Not started — Calculate now →
        </Link>
      )}
    </div>
  )
}

// Horizontal Gantt bar chart
function GanttChart({ selectedKeys }: { selectedKeys: AppTypeKey[] }) {
  const rows = [
    { key: 'structopro' as AppTypeKey,  label: 'Structure (RCC)',      start: 0, end: 3 },
    { key: 'masonpro' as AppTypeKey,    label: 'Masonry',              start: 3, end: 5 },
    { key: 'electropro' as AppTypeKey,  label: 'Electrical (rough-in)',start: 3, end: 5 },
    { key: 'plumbpro' as AppTypeKey,    label: 'Plumbing (rough-in)',  start: 3, end: 5 },
    { key: 'interiorpro' as AppTypeKey, label: 'Interior',             start: 5, end: 8 },
  ].filter(r => selectedKeys.includes(r.key))

  const months = 9

  return (
    <div style={{ overflowX: 'auto' }}>
      {/* Month header */}
      <div style={{ display: 'flex', paddingLeft: 140, marginBottom: 4 }}>
        {Array.from({ length: months }, (_, i) => (
          <div key={i} style={{ flex: 1, ...mono, fontSize: 10, color: 'rgba(30,34,39,0.5)', minWidth: 32 }}>
            M{i + 1}
          </div>
        ))}
      </div>
      {rows.map(row => (
        <div key={row.key} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ width: 140, flexShrink: 0, ...sans, fontSize: 11, color: '#1E2227', paddingRight: 8 }}>
            {row.label}
          </div>
          <div style={{ flex: 1, display: 'flex', position: 'relative', height: 24, background: 'rgba(30,34,39,0.04)', borderRadius: 2 }}>
            <div style={{
              position:  'absolute',
              left:      `${(row.start / months) * 100}%`,
              width:     `${((row.end - row.start) / months) * 100}%`,
              top:       0,
              bottom:    0,
              background: PHASE_COLORS[row.key],
              borderRadius: 2,
              display:   'flex',
              alignItems: 'center',
              paddingLeft: 6,
            }}>
              <span style={{ ...mono, fontSize: 9, color: '#fff' }}>Mth {row.start + 1}–{row.end}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function GrandTotalPage() {
  const supabase = createClient()

  const [user, setUser]             = useState<User | null>(null)
  const [loading, setLoading]       = useState(true)
  const [estimates, setEstimates]   = useState<EstimateRecord[]>([])
  const [selected, setSelected]     = useState<Set<string>>(new Set())

  const [step, setStep]             = useState<'select' | 'preview' | 'paid'>('select')
  const [gtEstimateId, setGtEstimateId] = useState<string | null>(null)

  const [payStatus, setPayStatus]   = useState<PayStatus>('idle')
  const [payError, setPayError]     = useState('')
  const [orderId, setOrderId]       = useState<string | null>(null)
  const [isPaid, setIsPaid]         = useState(PAYMENT_BYPASS)

  const [pdfStatus, setPdfStatus]   = useState<PdfStatus>('idle')
  const [pdfUrl, setPdfUrl]         = useState<string | null>(null)

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Auth + data fetch ──────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [supabase])

  useEffect(() => {
    if (!user) { setLoading(false); return }
    setLoading(true)
    supabase
      .from('estimates')
      .select('id, app_type, project_name, result_data, status, created_at')
      .eq('user_id', user.id)
      .in('app_type', ['structopro', 'masonpro', 'electropro', 'plumbpro', 'interiorpro'])
      .eq('status', 'paid')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        // Keep only the most recent paid estimate per app_type
        const seen = new Set<string>()
        const filtered: EstimateRecord[] = []
        for (const e of (data ?? [])) {
          if (!seen.has(e.app_type)) {
            seen.add(e.app_type)
            filtered.push(e as unknown as EstimateRecord)
          }
        }
        setEstimates(filtered)
        setLoading(false)
      })
  }, [user, supabase])

  // ── Razorpay script ────────────────────────────────────────────────────────
  useEffect(() => {
    if (document.querySelector('script[src*="checkout.razorpay.com"]')) return
    const script = document.createElement('script')
    script.src   = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)
  }, [])

  // ── Payment polling ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!orderId || payStatus !== 'polling') return
    pollRef.current = setInterval(async () => {
      try {
        const res  = await fetch(`/api/payments/status/${orderId}`)
        const json = await res.json()
        if (json.status === 'success') {
          clearInterval(pollRef.current!)
          setIsPaid(true)
          setPayStatus('paid')
          setStep('paid')
        } else if (json.status === 'failed') {
          clearInterval(pollRef.current!)
          setPayStatus('error')
          setPayError('Payment failed. Please try again.')
        }
      } catch { /* ignore */ }
    }, 2000)
    return () => clearInterval(pollRef.current!)
  }, [orderId, payStatus])

  // ── PDF generation ─────────────────────────────────────────────────────────
  const generatePdf = useCallback(async () => {
    if (!gtEstimateId) return
    setPdfStatus('generating')
    try {
      const getRes  = await fetch(`/api/grand-total/generate-pdf?estimateId=${gtEstimateId}`)
      const getJson = await getRes.json()
      if (getJson.pdfUrl) { setPdfUrl(getJson.pdfUrl); setPdfStatus('ready'); return }

      const postRes  = await fetch('/api/grand-total/generate-pdf', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ estimateId: gtEstimateId }),
      })
      const postJson = await postRes.json()
      if (postJson.pdfUrl) { setPdfUrl(postJson.pdfUrl); setPdfStatus('ready') }
      else setPdfStatus('error')
    } catch { setPdfStatus('error') }
  }, [gtEstimateId])

  useEffect(() => {
    if (isPaid && gtEstimateId && step === 'paid') generatePdf()
  }, [isPaid, gtEstimateId, step, generatePdf])

  // ── Derived state ──────────────────────────────────────────────────────────
  const estimateByType: Partial<Record<AppTypeKey, EstimateRecord>> = {}
  for (const e of estimates) estimateByType[e.app_type] = e

  const selectedEstimates = estimates.filter(e => selected.has(e.id))
  const canGenerate       = selectedEstimates.length >= 2

  let combinedBasic    = 0, combinedStandard = 0, combinedPremium = 0
  const phaseBreakdown = selectedEstimates.map(e => {
    const gt = getGrandTotal(e)!
    combinedBasic    += gt.basic
    combinedStandard += gt.standard
    combinedPremium  += gt.premium
    return { appType: e.app_type, ...gt }
  })

  const pieData = phaseBreakdown.map(ph => ({
    name:  TOOLS.find(t => t.key === ph.appType)?.name ?? ph.appType,
    value: ph.standard,
    color: PHASE_COLORS[ph.appType],
  }))

  const barData = phaseBreakdown.map(ph => ({
    name:     TOOLS.find(t => t.key === ph.appType)?.name ?? ph.appType,
    Basic:    Math.round(ph.basic    / 100_000),
    Standard: Math.round(ph.standard / 100_000),
    Premium:  Math.round(ph.premium  / 100_000),
  }))

  // ── Handlers ──────────────────────────────────────────────────────────────
  function toggleEstimate(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleGenerate() {
    if (!canGenerate || !user) return
    setPayStatus('creating_estimate')
    setPayError('')

    // Step 1: Create grand total estimate
    try {
      const res  = await fetch('/api/grand-total/create-estimate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ selectedEstimateIds: [...selected], userId: user.id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to create estimate')
      setGtEstimateId(json.estimateId)
      setStep('preview')
      setPayStatus('idle')
    } catch (err) {
      setPayError(err instanceof Error ? err.message : 'Failed to prepare report')
      setPayStatus('error')
    }
  }

  async function handleUnlock() {
    if (!gtEstimateId) return
    setPayStatus('creating_order')
    setPayError('')
    try {
      const res  = await fetch('/api/payments/create-order', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ estimateId: gtEstimateId, amount: 99900 }),
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
        description: 'Grand Total Master Project Report',
        order_id:    json.orderId,
        notes:       { estimateId: gtEstimateId },
        theme:       { color: '#1F4E79' },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          setPayStatus('verifying')
          try {
            const vRes  = await fetch('/api/payments/verify', {
              method:  'POST',
              headers: { 'Content-Type': 'application/json' },
              body:    JSON.stringify({
                razorpayOrderId:   response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                estimateId:        gtEstimateId,
              }),
            })
            const vJson = await vRes.json()
            if (vJson.success) {
              setIsPaid(true)
              setPayStatus('paid')
              setStep('paid')
            } else {
              setPayStatus('polling')
            }
          } catch {
            setPayStatus('polling')
          }
        },
        modal: { ondismiss: () => { if (payStatus === 'open') setPayStatus('idle') } },
      }
      const rp = new window.Razorpay(options)
      rp.open()
    } catch (err) {
      setPayError(err instanceof Error ? err.message : 'Payment failed')
      setPayStatus('error')
    }
  }

  // Bypass: skip Razorpay and go straight to PDF
  async function handleBypassUnlock() {
    if (!gtEstimateId) return
    setPayStatus('verifying')
    try {
      // Mark as paid via verify endpoint using dummy values
      await fetch('/api/payments/verify', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          razorpayOrderId:   'bypass-order',
          razorpayPaymentId: 'bypass-payment',
          razorpaySignature: 'bypass-signature',
          estimateId:        gtEstimateId,
        }),
      })
    } catch { /* bypass is best-effort */ }
    setIsPaid(true)
    setPayStatus('paid')
    setStep('paid')
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F4F4F0' }}>
        <span style={{ ...mono, fontSize: 12, color: 'rgba(30,34,39,0.4)', letterSpacing: 2 }}>LOADING…</span>
      </div>
    )
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#F4F4F0' }}>
        <div style={{ maxWidth: 480, textAlign: 'center' }}>
          <div style={{ ...mono, fontSize: 9, color: '#1F4E79', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>
            GRAND TOTAL REPORT · ₹999
          </div>
          <h1 style={{ ...serif, fontSize: 28, fontWeight: 700, color: '#1E2227', marginBottom: 12 }}>
            Log In to Access Your Estimates
          </h1>
          <p style={{ ...sans, fontSize: 14, color: 'rgba(30,34,39,0.6)', lineHeight: 1.6, marginBottom: 24 }}>
            The Grand Total Report pulls from your completed paid estimates. Log in to see
            your estimates and generate a combined master project report.
          </p>
          <Link href="/auth" style={{
            ...mono, display: 'inline-block', background: '#8C3A22', color: '#F4F4F0',
            fontSize: 14, padding: '12px 32px', borderRadius: 6, textDecoration: 'none', letterSpacing: '0.04em',
          }}>
            Log In →
          </Link>
        </div>
      </div>
    )
  }

  // ── Step: Select ────────────────────────────────────────────────────────────
  if (step === 'select') {
    const completedCount = estimates.length

    return (
      <div className="min-h-screen" style={{ background: '#F4F4F0' }}>
        <div className="px-6 md:px-16 lg:px-24 py-12 max-w-5xl mx-auto">
          {/* Header */}
          <div style={{ borderBottom: '1px solid #D0D2D4', paddingBottom: 20, marginBottom: 28 }}>
            <div style={{ ...mono, fontSize: 9, color: '#1F4E79', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
              MASTER PROJECT REPORT · ₹999
            </div>
            <h1 style={{ ...serif, fontSize: 32, fontWeight: 700, color: '#1E2227', marginBottom: 8 }}>
              Grand Total Report
            </h1>
            <p style={{ ...sans, fontSize: 14, color: 'rgba(30,34,39,0.6)', lineHeight: 1.6, maxWidth: 560 }}>
              Combine your completed phase estimates into one 12-page master project report.
              Select which phases to include below.
            </p>
          </div>

          {completedCount < 2 && (
            <div style={{ border: '1px solid #D99A06', background: 'rgba(217,154,6,0.07)', padding: 16, marginBottom: 24, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ color: '#D99A06', fontSize: 16 }}>⚠</span>
              <div>
                <div style={{ ...mono, fontSize: 11, color: '#D99A06', marginBottom: 4 }}>
                  Complete at least 2 tools to generate a Grand Total Report
                </div>
                <div style={{ ...sans, fontSize: 12, color: 'rgba(30,34,39,0.6)' }}>
                  You have {completedCount} paid estimate{completedCount !== 1 ? 's' : ''}.
                  Complete and unlock any 2 tools to access this report.
                </div>
              </div>
            </div>
          )}

          {/* Phase cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {TOOLS.map(tool => {
              const estimate = estimateByType[tool.key] ?? null
              const id       = estimate?.id ?? ''
              return (
                <PhaseCard
                  key={tool.key}
                  tool={tool}
                  estimate={estimate}
                  selected={selected.has(id)}
                  onToggle={() => id && toggleEstimate(id)}
                  disabled={completedCount < 2}
                />
              )
            })}
          </div>

          {/* Selection summary + CTA */}
          <div style={{
            border: '1px solid #1E2227', padding: 20,
            display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 14,
          }}>
            <div>
              <div style={{ ...mono, fontSize: 11, color: 'rgba(30,34,39,0.5)', marginBottom: 4 }}>
                {selected.size} of {completedCount} estimates selected
              </div>
              {selected.size >= 2 && (
                <div style={{ ...mono, fontSize: 14, color: '#1F4E79' }}>
                  Combined Standard: {fmtLakhs(combinedStandard)}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              {payError && (
                <span style={{ ...mono, fontSize: 11, color: '#8C3A22' }}>{payError}</span>
              )}
              <button
                onClick={handleGenerate}
                disabled={!canGenerate || payStatus !== 'idle'}
                style={{
                  ...mono,
                  background:    canGenerate && payStatus === 'idle' ? '#8C3A22' : 'rgba(140,58,34,0.3)',
                  color:         '#F4F4F0',
                  border:        'none',
                  padding:       '12px 28px',
                  fontSize:      13,
                  cursor:        canGenerate && payStatus === 'idle' ? 'pointer' : 'not-allowed',
                  borderRadius:  6,
                  letterSpacing: '0.04em',
                  whiteSpace:    'nowrap',
                }}
              >
                {payStatus === 'creating_estimate' ? 'Preparing…' : `Generate Grand Total Report — ₹999`}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Step: Preview ───────────────────────────────────────────────────────────
  if (step === 'preview') {
    // First selected estimate's first 2 BOQ keys for blurred preview
    const firstEst   = selectedEstimates[0]
    const blurRows   = ['Foundation BOQ', 'Superstructure Quantities', 'Material Schedule', 'Labour Cost']

    return (
      <div className="min-h-screen" style={{ background: '#F4F4F0' }}>
        <div className="px-6 md:px-16 lg:px-24 py-12 max-w-5xl mx-auto">

          {/* Back */}
          <button
            onClick={() => { setStep('select'); setPayStatus('idle'); setPayError('') }}
            style={{ ...mono, fontSize: 11, color: 'rgba(30,34,39,0.5)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20, letterSpacing: 1 }}
          >
            ← Back to Selection
          </button>

          {/* Header */}
          <div style={{ borderBottom: '1px solid #D0D2D4', paddingBottom: 20, marginBottom: 28 }}>
            <div style={{ ...mono, fontSize: 9, color: '#1F4E79', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
              PREVIEW — {selectedEstimates.length} PHASES SELECTED
            </div>
            <h1 style={{ ...serif, fontSize: 28, fontWeight: 700, color: '#1E2227', marginBottom: 4 }}>
              Master Project Report
            </h1>
            <p style={{ ...sans, fontSize: 13, color: 'rgba(30,34,39,0.5)' }}>
              Unlock the complete 12-page PDF for ₹999
            </p>
          </div>

          {/* Combined Grand Total */}
          <div style={{ border: '1px solid #1F4E79', background: '#EBF0F7', padding: 24, marginBottom: 24 }}>
            <div style={{ ...mono, fontSize: 9, color: '#1F4E79', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>
              Combined Project Cost
            </div>
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              {[
                { label: 'Basic',    val: combinedBasic,    dim: true  },
                { label: 'Standard', val: combinedStandard, dim: false },
                { label: 'Premium',  val: combinedPremium,  dim: true  },
              ].map(({ label, val, dim }) => (
                <div key={label}>
                  <div style={{ ...mono, fontSize: 8, color: 'rgba(30,34,39,0.5)', marginBottom: 4 }}>{label}</div>
                  <div style={{ ...mono, fontSize: dim ? 20 : 28, fontWeight: dim ? 400 : 700, color: dim ? 'rgba(30,34,39,0.5)' : '#1F4E79' }}>
                    {fmtLakhs(val)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Phase breakdown bar chart */}
          <div style={{ border: '1px solid #D0D2D4', padding: 20, marginBottom: 24 }}>
            <div style={{ ...mono, fontSize: 9, color: 'rgba(30,34,39,0.5)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 }}>
              Phase-wise Cost Breakdown (₹ Lakhs)
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10 }} />
                <YAxis tick={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10 }} unit="L" />
                <Tooltip
                  formatter={(v) => [`₹${v} L`, '']}
                  contentStyle={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, border: '1px solid #D0D2D4' }}
                />
                <Bar dataKey="Basic"    fill="#A8AAAD" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Standard" fill="#1F4E79" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Premium"  fill="#8C3A22" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Construction timeline */}
          <div style={{ border: '1px solid #D0D2D4', padding: 20, marginBottom: 24 }}>
            <div style={{ ...mono, fontSize: 9, color: 'rgba(30,34,39,0.5)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 }}>
              Construction Timeline
            </div>
            <GanttChart selectedKeys={selectedEstimates.map(e => e.app_type)} />
            <div style={{ ...sans, fontSize: 11, color: 'rgba(30,34,39,0.5)', marginTop: 10 }}>
              Masonry starts 60–90 days after RCC pour (IS 456:2000 curing).
              Electrical + Plumbing rough-in runs parallel with masonry.
            </div>
          </div>

          {/* Pie chart */}
          {pieData.length >= 2 && (
            <div style={{ border: '1px solid #D0D2D4', padding: 20, marginBottom: 24 }}>
              <div style={{ ...mono, fontSize: 9, color: 'rgba(30,34,39,0.5)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 }}>
                Cost Distribution by Phase (Standard)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
                <PieChart width={200} height={200}>
                  <Pie data={pieData} cx={95} cy={95} outerRadius={80} dataKey="value">
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {pieData.map(d => (
                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 1, background: d.color, flexShrink: 0 }} />
                      <span style={{ ...mono, fontSize: 11, color: '#1E2227' }}>{d.name}</span>
                      <span style={{ ...mono, fontSize: 11, color: 'rgba(30,34,39,0.5)' }}>
                        {combinedStandard > 0 ? `${((d.value / combinedStandard) * 100).toFixed(0)}%` : '—'}
                      </span>
                      <span style={{ ...mono, fontSize: 11, color: '#1F4E79' }}>{fmtLakhs(d.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Blurred BOQ preview */}
          {firstEst && (
            <div style={{ border: '1px solid #D0D2D4', padding: 20, marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
              <div style={{ ...mono, fontSize: 9, color: 'rgba(30,34,39,0.5)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 }}>
                BOQ Preview — {TOOLS.find(t => t.key === firstEst.app_type)?.name}
              </div>
              {/* 2 visible rows */}
              {['Foundation PCC — 100mm M10 (IS 456:2000)', 'Column reinforcement — M20 / Fe500D'].map((label, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(30,34,39,0.08)', ...sans, fontSize: 12, color: '#1E2227' }}>
                  <span>{label}</span>
                  <span style={mono}>—</span>
                </div>
              ))}
              {/* Blurred rows */}
              <div style={{ position: 'relative' }}>
                {blurRows.map((label, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(30,34,39,0.08)', ...sans, fontSize: 12, color: '#1E2227', filter: 'blur(4px)', userSelect: 'none' }}>
                    <span>{label}</span>
                    <span style={mono}>₹{(Math.random() * 200000 + 100000).toFixed(0)}</span>
                  </div>
                ))}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(244,244,240,0.85)',
                  display:    'flex', alignItems: 'center', justifyContent: 'center',
                  backdropFilter: 'blur(2px)',
                }}>
                  <span style={{ ...mono, fontSize: 11, color: 'rgba(30,34,39,0.6)', letterSpacing: 1 }}>
                    UNLOCK TO VIEW COMPLETE BOQ
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Payment gate */}
          <div style={{ border: '2px solid #1E2227', padding: 28, background: '#F4F4F0' }}>
            <div style={{ ...mono, fontSize: 9, color: 'rgba(30,34,39,0.5)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
              UNLOCK COMPLETE PROJECT REPORT
            </div>
            <div style={{ ...serif, fontSize: 24, fontWeight: 700, color: '#1E2227', marginBottom: 6 }}>
              ₹999
            </div>
            <div style={{ ...sans, fontSize: 13, color: 'rgba(30,34,39,0.6)', marginBottom: 20, lineHeight: 1.5 }}>
              Combines all {selectedEstimates.length} selected phases into one 12-page master BOQ with contractor-ready format.
              Includes Gantt timeline, IS compliance summary, and material procurement plan.
            </div>
            {payError && (
              <div style={{ ...mono, fontSize: 11, color: '#8C3A22', marginBottom: 12 }}>{payError}</div>
            )}
            <button
              onClick={PAYMENT_BYPASS ? handleBypassUnlock : handleUnlock}
              disabled={payStatus !== 'idle'}
              style={{
                ...mono,
                background:   payStatus === 'idle' ? '#8C3A22' : 'rgba(140,58,34,0.4)',
                color:        '#F4F4F0',
                border:       'none',
                padding:      '14px 36px',
                fontSize:     14,
                cursor:       payStatus === 'idle' ? 'pointer' : 'not-allowed',
                borderRadius: 6,
                letterSpacing: '0.04em',
              }}
            >
              {payStatus === 'creating_order' ? 'Creating order…' :
               payStatus === 'open'           ? 'Complete payment…' :
               payStatus === 'verifying'      ? 'Verifying…' :
               payStatus === 'polling'        ? 'Confirming…' :
               'Unlock Complete Project Report — ₹999'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Step: Paid ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: '#F4F4F0' }}>
      <div className="px-6 md:px-16 lg:px-24 py-12 max-w-3xl mx-auto">

        {/* Success header */}
        <div style={{ borderBottom: '1px solid #D0D2D4', paddingBottom: 20, marginBottom: 28 }}>
          <div style={{ ...mono, fontSize: 9, color: '#14532D', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
            PAYMENT CONFIRMED
          </div>
          <h1 style={{ ...serif, fontSize: 28, fontWeight: 700, color: '#1E2227', marginBottom: 4 }}>
            Master Project Report
          </h1>
          <p style={{ ...sans, fontSize: 13, color: 'rgba(30,34,39,0.5)' }}>
            Your 12-page combined report is being generated.
          </p>
        </div>

        {/* Combined total summary */}
        <div style={{ border: '1px solid #14532D', background: '#E9F2EB', padding: 20, marginBottom: 24 }}>
          <div style={{ ...mono, fontSize: 8, color: '#14532D', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
            Combined Project Cost — {selectedEstimates.length} Phases
          </div>
          <div style={{ ...mono, fontSize: 22, fontWeight: 700, color: '#14532D', marginBottom: 4 }}>
            {fmtLakhs(combinedStandard)} (Standard)
          </div>
          <div style={{ ...mono, fontSize: 11, color: 'rgba(30,34,39,0.5)' }}>
            Basic: {fmtLakhs(combinedBasic)} — Premium: {fmtLakhs(combinedPremium)}
          </div>
        </div>

        {/* PDF download */}
        <div style={{ border: '1px solid #D0D2D4', padding: 24, marginBottom: 24, textAlign: 'center' }}>
          {pdfStatus === 'generating' && (
            <div>
              <div style={{ ...mono, fontSize: 12, color: 'rgba(30,34,39,0.5)', marginBottom: 8 }}>
                Generating your 12-page report…
              </div>
              <div style={{ ...sans, fontSize: 12, color: 'rgba(30,34,39,0.4)' }}>
                This takes 15–30 seconds
              </div>
            </div>
          )}
          {pdfStatus === 'ready' && pdfUrl && (
            <div>
              <div style={{ ...mono, fontSize: 9, color: '#14532D', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>
                YOUR REPORT IS READY
              </div>
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  ...mono,
                  display:       'inline-block',
                  background:    '#8C3A22',
                  color:         '#F4F4F0',
                  fontSize:      14,
                  padding:       '14px 36px',
                  borderRadius:  6,
                  textDecoration: 'none',
                  letterSpacing: '0.04em',
                }}
              >
                Download Master Project Report (PDF)
              </a>
              <div style={{ ...sans, fontSize: 12, color: 'rgba(30,34,39,0.4)', marginTop: 10 }}>
                A copy has been emailed to you
              </div>
            </div>
          )}
          {pdfStatus === 'error' && (
            <div>
              <div style={{ ...mono, fontSize: 11, color: '#8C3A22', marginBottom: 10 }}>
                PDF generation failed. Try again.
              </div>
              <button
                onClick={generatePdf}
                style={{ ...mono, background: '#8C3A22', color: '#F4F4F0', border: 'none', padding: '10px 24px', fontSize: 12, cursor: 'pointer', borderRadius: 4 }}
              >
                Retry PDF
              </button>
            </div>
          )}
        </div>

        {/* Phase list */}
        <div style={{ ...mono, fontSize: 9, color: 'rgba(30,34,39,0.5)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>
          Included Phases
        </div>
        {selectedEstimates.map(e => {
          const gt   = getGrandTotal(e)
          const tool = TOOLS.find(t => t.key === e.app_type)
          return (
            <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(30,34,39,0.08)' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ width: 8, height: 8, borderRadius: 1, background: PHASE_COLORS[e.app_type] }} />
                <span style={{ ...sans, fontSize: 13, color: '#1E2227' }}>{tool?.name}</span>
                <span style={{ ...mono, fontSize: 10, color: 'rgba(30,34,39,0.4)' }}>{tool?.label}</span>
              </div>
              {gt && (
                <span style={{ ...mono, fontSize: 12, color: '#1F4E79' }}>{fmtLakhs(gt.standard)}</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
