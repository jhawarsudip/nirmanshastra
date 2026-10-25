'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import '@/styles/v2/results.css'
import type { FreePayload, PaidPayload } from '@/lib/structopro-qty/payload'
import { sceneFromGeometry, sceneFromPreview } from '@/lib/structopro-qty/scene'
import { buildingLabelStilt, storeyLabel, beamLevelLabel, bars12m, isCoil, bandBelowPct, bandAbovePct } from '@/lib/structopro-qty/labels'
import type { MemberTotals } from '@/lib/structopro-qty/types'
import StructureViewer from '@/components/3d/StructureViewer'
import { PAYMENT_BYPASS } from '@/lib/payment-config'
import { TOOLS } from '@/lib/v2/content'
import { Note, IcArrow, IcCheck } from '@/components/v2/inner/kit'
import { Tot, ReportTable as Table, DeliveryNote } from '@/components/v2/qty/parts'
import QuoteCheck from './QuoteCheck'

/*
  StructurePro results.
  Free: the 3D model (already running), the frame at a glance, the IS-code checks. Paid: the quantities. No rupee figure anywhere.
  The server never sends a quantity before payment is verified; this file only draws what it is given.
*/

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any
  }
}

const TOOL = TOOLS.find(t => t.key === 'struct')!

type PayStatus = 'idle' | 'creating' | 'open' | 'verifying' | 'polling' | 'paid' | 'error'
type PdfStatus = 'idle' | 'generating' | 'ready' | 'error'
type ReportStatus = 'idle' | 'loading' | 'ready' | 'error'

// ─── number formats ───────────────────────────────────────────────────────────

const f = (v: number, d = 0) => v.toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d })

const zoneWord = (z: string) => `Zone ${z}`

// ─── the page ─────────────────────────────────────────────────────────────────

interface Props {
  free: FreePayload
  estimateId: string | null
  contactName: string
  projectName: string
  onStartOver: () => void
}

export default function ResultsV2({ free, estimateId, contactName, projectName, onStartOver }: Props) {
  const [payStatus, setPayStatus] = useState<PayStatus>('idle')
  const [payError, setPayError] = useState('')
  const [isPaid, setIsPaid] = useState(PAYMENT_BYPASS)
  const [orderId, setOrderId] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [reportStatus, setReportStatus] = useState<ReportStatus>('idle')
  const [report, setReport] = useState<PaidPayload | null>(null)
  const [reportError, setReportError] = useState('')

  const [pdfStatus, setPdfStatus] = useState<PdfStatus>('idle')
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  // true or false once the server has tried to email the report; null when it did not try this time (the PDF already existed)
  const [emailSent, setEmailSent] = useState<boolean | null>(null)
  const [downloading, setDownloading] = useState(false)

  // payment script
  useEffect(() => {
    if (document.querySelector('script[src*="checkout.razorpay.com"]')) return
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.async = true
    document.body.appendChild(s)
  }, [])

  // after Razorpay's handler, wait for the server to record the verified payment
  useEffect(() => {
    if (!orderId || payStatus !== 'polling') return
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/status/${orderId}`)
        const json = await res.json()
        if (json.status === 'success') {
          if (pollRef.current) clearInterval(pollRef.current)
          setIsPaid(true)
          setPayStatus('paid')
        } else if (json.status === 'failed') {
          if (pollRef.current) clearInterval(pollRef.current)
          setPayStatus('error')
          setPayError('The payment did not go through. Please try again.')
        }
      } catch { /* a dropped request is fine, the next tick retries */ }
    }, 2000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [orderId, payStatus])

  // the paid report is fetched only when the server will give it
  const loadReport = useCallback(async () => {
    if (!estimateId) return
    setReportStatus('loading')
    setReportError('')
    try {
      const res = await fetch(`/api/structopro/report?estimateId=${encodeURIComponent(estimateId)}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Could not load the report')
      setReport(json.report as PaidPayload)
      setReportStatus('ready')
    } catch (e) {
      setReportStatus('error')
      setReportError(e instanceof Error ? e.message : 'Could not load the report')
    }
  }, [estimateId])

  useEffect(() => { if (isPaid) loadReport() }, [isPaid, loadReport])

  // PDF
  const generatePdf = useCallback(async () => {
    if (!estimateId) return
    setPdfStatus('generating')
    try {
      const g = await fetch(`/api/structopro/generate-pdf?estimateId=${encodeURIComponent(estimateId)}`)
      const gj = await g.json()
      if (gj.pdfUrl) { setPdfUrl(gj.pdfUrl); setPdfStatus('ready'); return }
      const p = await fetch('/api/structopro/generate-pdf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estimateId }) })
      const pj = await p.json()
      if (pj.pdfUrl) { setPdfUrl(pj.pdfUrl); setEmailSent(typeof pj.emailSent === 'boolean' ? pj.emailSent : null); setPdfStatus('ready') } else setPdfStatus('error')
    } catch {
      setPdfStatus('error')
    }
  }, [estimateId])

  useEffect(() => { if (reportStatus === 'ready') generatePdf() }, [reportStatus, generatePdf])

  const downloadPdf = useCallback(async () => {
    if (!pdfUrl || downloading) return
    setDownloading(true)
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
      window.open(pdfUrl, '_blank')
    } finally {
      setDownloading(false)
    }
  }, [pdfUrl, downloading])

  async function handleUnlock() {
    if (!estimateId) { setPayError('Your estimate is not saved yet. Please wait a moment and try again.'); return }
    setPayStatus('creating')
    setPayError('')
    try {
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estimateId }), // the amount is decided on the server
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Could not start the payment')
      setOrderId(json.orderId)
      setPayStatus('open')
      if (!window.Razorpay) throw new Error('The payment window did not load. Please refresh the page and try again.')
      const rzp = new window.Razorpay({
        key: json.keyId,
        amount: json.amount,
        currency: json.currency || 'INR',
        name: 'NirmanShastra',
        description: 'StructurePro report: RCC structure quantities',
        order_id: json.orderId,
        prefill: { name: contactName },
        notes: { estimateId },
        theme: { color: '#2E3F94' },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          setPayStatus('verifying')
          try {
            const vRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
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
            setPayError(err instanceof Error ? err.message : 'We could not verify the payment.')
          }
        },
        modal: {
          ondismiss: () => {
            setPayStatus(prev => (prev === 'open' || prev === 'creating' ? 'idle' : prev))
            setPayError('The payment was not completed. Press the button to try again.')
          },
        },
      })
      rzp.open()
    } catch (err) {
      setPayStatus('error')
      setPayError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    }
  }

  const busy = payStatus === 'creating' || payStatus === 'verifying' || payStatus === 'polling'

  // the model: typical sizes before payment, designed sizes after
  const model = useMemo(() => (report ? sceneFromGeometry(report.geometry, report.layout.foundingDepthM) : sceneFromPreview(free.preview)), [report, free.preview])

  const gl = free.glance
  const ft = (m: number) => Math.round(m * 3.28084)

  return (
    <div className="ns-r">
      <header className="ns-r-head">
        <p className="ns-i-card__eyebrow" style={{ margin: '0 0 6px', fontWeight: 700, color: 'var(--tc)', fontSize: 14 }}>Step 4 of 4 · {projectName || 'Your project'}</p>
        <h2>{report ? 'Your quantities are ready' : 'Your structure is ready'}</h2>
        <div className="ns-r-chips">
          <span className="ns-i-pill ns-i-pill--tc">{buildingLabelStilt(free.floors, free.stilt)} · {f(free.builtUpSqft)} sq ft</span>
          <span className="ns-i-pill">{zoneWord(free.zone)}</span>
          <span className="ns-i-pill">{free.foundation === 'raft' ? 'Raft foundation' : 'Separate footings'}</span>
          {PAYMENT_BYPASS ? <span className="ns-r-preview"><IcCheck width={16} height={16} />Preview mode: full report open for testing</span> : null}
        </div>
      </header>

      {/* the model: already on screen and running */}
      <StructureViewer key={model.mode} model={model} />

      {/* ───────────────────────── FREE ───────────────────────── */}
      <section className="ns-plate ns-r-hook" aria-labelledby="r-hook-t">
        <p className="ns-r-hook__k" id="r-hook-t">Your frame at a glance</p>
        <dl className="ns-r-facts" aria-label="The frame we worked out for your plan">
          <div className="ns-r-fact"><dt>Plan size</dt><dd>{f(gl.lengthM, 1)} × {f(gl.widthM, 1)} m</dd><small>About {ft(gl.lengthM)} × {ft(gl.widthM)} ft</small></div>
          <div className="ns-r-fact"><dt>Grid of columns</dt><dd>{gl.baysX} × {gl.baysY} bays</dd><small>Spans of about {f(gl.spanXM, 1)} and {f(gl.spanYM, 1)} m</small></div>
          <div className="ns-r-fact"><dt>Columns on each floor</dt><dd>{gl.columnsPerStorey}</dd></div>
          {free.stilt && <div className="ns-r-fact"><dt>Open parking level</dt><dd>Columns only</dd><small>Larger columns and closer ties, because an open level is the weak storey in an earthquake</small></div>}
          {free.balconies > 0 && <div className="ns-r-fact"><dt>Balconies</dt><dd>{free.balconies}</dd><small>Each hangs from the floor slab like a shelf</small></div>}
          <div className="ns-r-fact"><dt>{free.foundation === 'raft' ? 'Foundation' : 'Footings'}</dt><dd>{free.foundation === 'raft' ? 'One raft' : gl.footings}</dd><small>{free.foundation === 'raft' ? 'A thick slab under the whole building' : 'One under every column'}</small></div>
          <div className="ns-r-fact"><dt>Beams on each floor</dt><dd>{gl.beamsPerFloor}</dd></div>
          <div className="ns-r-fact"><dt>Slab panels on each floor</dt><dd>{gl.slabPanelsPerFloor}</dd></div>
        </dl>
        <p className="ns-r-hook__m">Counted from the grid we laid out for the shape of your plot. How much concrete, steel and cement that frame takes is in the full report, below.</p>
      </section>

      <dl className="ns-r-facts" aria-label="Your structure at a glance">
        <div className="ns-r-fact"><dt>Floors</dt><dd>{buildingLabelStilt(free.floors, free.stilt)}</dd>{free.stilt && <small>Open parking level, then {free.floors} {free.floors === 1 ? 'floor' : 'floors'}</small>}</div>
        <div className="ns-r-fact"><dt>Built-up area</dt><dd>{f(free.builtUpSqft)} sq ft</dd></div>
        <div className="ns-r-fact"><dt>Earthquake zone</dt><dd>{zoneWord(free.zone)}<small>{free.zoneNote}</small></dd></div>
        <div className="ns-r-fact"><dt>Concrete grade</dt><dd>{free.gradeAbove} above ground</dd><dd style={{ fontSize: 16, marginTop: 0 }}>{free.gradeBelow} in the foundation</dd></div>
        <div className="ns-r-fact"><dt>Steel</dt><dd>Fe500D</dd><small>Ductile TMT bars, IS 1786</small></div>
        <div className="ns-r-fact"><dt>Exposure</dt><dd style={{ textTransform: 'capitalize' }}>{free.exposure.replace('_', ' ')}</dd><small>Sets cover and cement content (IS 456 Table 5, Table 16)</small></div>
      </dl>

      <section className="ns-plate ns-r-sec" aria-labelledby="r-chk-t">
        <h3 id="r-chk-t">Checks against the Indian Standards</h3>
        <p className="ns-r-sec__sub">These are the checks the tool makes. A PASS for the steel grade or the concrete grade follows from the tool&apos;s own choices. Where a line says a limit is reached, the section shown does not pass it.</p>
        <ul className="ns-r-chks">
          {free.compliance.filter(c => c.id !== 'review').map(c => (
            <li key={c.id} className="ns-r-chk" data-s={c.status}>
              <span className="ns-r-chk__s">{c.status === 'pass' ? 'PASS' : c.status === 'advisory' ? 'NOTE' : 'FAIL'}</span>
              <p className="ns-r-chk__c">{c.clause}</p>
              <p className="ns-r-chk__t">{c.description}</p>
              <p className="ns-r-chk__d">{c.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      {free.warnings.length > 0 && (
        <Note kind="warn" title="Please read">
          {free.warnings.join(' ')}
        </Note>
      )}

      {/* the quantities are the product */}
      {!isPaid && (
        <section className="ns-plate ns-r-unlock" aria-labelledby="r-unlock-t">
          <div>
            <p className="ns-r-hook__k">The quantities are in the full report</p>
            <h3 id="r-unlock-t">Know how much to order, item by item</h3>
          </div>
          <ul className="ns-r-unlock__list">
            {[
              'Concrete in m³ for footings, columns, beams, slabs, stair and lintels',
              'Steel in kg for every bar diameter, and how many 12 m bars to buy',
              'Cement bags, sand, aggregate, shuttering area and excavation',
              'Column and beam sizes, bars and stirrups, floor by floor',
              'The assumptions behind every figure, what is not counted, and how far off it can be',
              'A PDF you can hand to your engineer or contractor',
            ].map(t => <li key={t}><IcCheck />{t}</li>)}
          </ul>
          <button type="button" className="ns-btn" onClick={handleUnlock} disabled={busy || !estimateId}>
            {payStatus === 'creating' ? 'Starting the payment…' : payStatus === 'verifying' ? 'Checking your payment…' : payStatus === 'polling' ? 'Confirming your payment…' : `Unlock the full report · ${TOOL.price}`}
            {!busy && <IcArrow width={22} height={11} />}
          </button>
          {payError && <Note kind="err">{payError}</Note>}
          <p className="ns-i-fine">One payment, no subscription. Paid through Razorpay; we never see your card details.</p>
        </section>
      )}

      {/* ───────────────────────── PAID ───────────────────────── */}
      {isPaid && reportStatus === 'loading' && (
        <div role="status" aria-live="polite"><div className="ns-r-skel" /><p className="ns-i-fine" style={{ marginTop: 10 }}>Putting your quantities together…</p></div>
      )}
      {isPaid && reportStatus === 'error' && (
        <Note kind="err" title="We could not load your report">
          {reportError} <button type="button" className="ns-i-link" onClick={loadReport}>Try again</button>
        </Note>
      )}
      {isPaid && report && <PaidSections r={report} preview={PAYMENT_BYPASS && payStatus !== 'paid'} pdfStatus={pdfStatus} pdfUrl={pdfUrl} emailSent={emailSent} downloading={downloading} onDownload={downloadPdf} onRetryPdf={generatePdf} />}

      <section className="ns-plate ns-r-next" aria-labelledby="r-next-t">
        <p className="ns-r-hook__k">Next · Phase 2</p>
        <h3 id="r-next-t">Brick and mortar quantities</h3>
        <p>With the frame sized, MasonryPro works out the bricks or blocks and the mortar for the walls of the same building.</p>
        <Link href="/tools/masonpro" className="ns-btn ns-btn--paper">Start MasonryPro<IcArrow width={22} height={11} /></Link>
      </section>

      <button type="button" className="ns-r-again" onClick={onStartOver}>Start a new estimate</button>
    </div>
  )
}

// ─── the paid report ──────────────────────────────────────────────────────────

function PaidSections({ r, preview, pdfStatus, pdfUrl, emailSent, downloading, onDownload, onRetryPdf }: {
  r: PaidPayload
  preview: boolean
  pdfStatus: PdfStatus
  pdfUrl: string | null
  emailSent: boolean | null
  downloading: boolean
  onDownload: () => void
  onRetryPdf: () => void
}) {
  const t = r.totals
  const m = r.materials
  const b = r.band
  const rng = (v: number, band: [number, number]) => `${f(v * band[0])} to ${f(v * band[1])}`

  const parts: [string, MemberTotals][] = [
    ['Footings (or raft)', r.members.footings],
    ['Plinth beams', r.members.plinthBeams],
    ['Columns', r.members.columns],
    ['Floor beams', r.members.beams],
    ['Slabs', r.members.slabs],
    ['Staircase', r.members.stairs],
    ['Lintels, sunshades, parapet band, stair head-room', r.members.secondary],
    ...(r.members.balconies ? [['Balcony slabs', r.members.balconies] as [string, MemberTotals]] : []),
  ]
  const rcc = parts.reduce((s, [, mt]) => ({ c: s.c + mt.concreteM3, s: s.s + mt.steelKg, f: s.f + mt.formworkM2 }), { c: 0, s: 0, f: 0 })
  const stilt = r.inputEcho.stilt

  const storeys = Math.max(0, ...r.schedules.columns.map(c => c.storey)) + 1
  const lowBand = bandBelowPct
  const highBand = bandAbovePct

  return (
    <>
      <section className="ns-plate ns-r-pdf" aria-labelledby="r-pdf-t">
        <p className="ns-r-hook__k">{preview ? 'Preview mode · no payment taken' : 'Payment received'}</p>
        <h3 id="r-pdf-t">Your report is unlocked</h3>
        <DeliveryNote emailSent={emailSent} />
        {pdfStatus === 'generating' && <p className="ns-i-fine" role="status">Preparing your PDF…</p>}
        {pdfStatus === 'ready' && pdfUrl && (
          <button type="button" className="ns-btn" onClick={onDownload} disabled={downloading}>{downloading ? 'Preparing the download…' : 'Download the PDF report'}</button>
        )}
        {pdfStatus === 'error' && (
          <Note kind="warn">The PDF could not be prepared just now. Everything is on this page. <button type="button" className="ns-i-link" onClick={onRetryPdf}>Try the PDF again</button></Note>
        )}
      </section>

      <section className="ns-plate ns-r-sec" aria-labelledby="r-tot-t">
        <h3 id="r-tot-t">What to order</h3>
        <p className="ns-r-sec__sub">Totals for the whole structure. The line under each figure is the range the real number is likely to fall in (see “How far off can this be”).</p>
        <div className="ns-r-tots">
          <Tot k="Concrete" v={f(t.concreteM3, 1)} unit="m³" range={`${rng(t.concreteM3, b.concrete)} m³`} />
          <Tot k="Steel to buy" v={f(t.steelBuyKg)} unit="kg" range={`${rng(t.steelBuyKg, b.steel)} kg`} />
          <Tot k="Cement" v={f(m.cementBags)} unit="bags" range={`${rng(m.cementBags, b.cement)} bags`} />
          <Tot k="Shuttering" v={f(m.formworkSqft)} unit="sq ft" range={`${rng(m.formworkSqft, b.formwork)} sq ft`} />
        </div>
      </section>

      <section className="ns-plate ns-r-sec" aria-labelledby="r-buy-t">
        <h3 id="r-buy-t">Buy list</h3>
        <Table
          head={['Material', 'Quantity', 'Unit', 'How it was worked out']}
          num={[1]}
          rows={[
            ['Cement (50 kg bags)', f(m.cementBags), 'bags', 'Per cubic metre of each mix (see “Mixes”), plus 3% site wastage'],
            ['Sand', f(m.sandCft), 'cft', `${f(m.sandM3, 1)} m³`],
            ['Coarse aggregate', f(m.aggregateCft), 'cft', `${f(m.aggregateM3, 1)} m³`],
            ['Reinforcement steel Fe500D', f(m.steelBuyKg), 'kg', `Bar weight ${f(t.steelNetKg)} kg + 5% cutting waste (CPWD DAR 5.22.1)`],
            ['Binding wire', f(m.bindingWireKg, 1), 'kg', '9 kg per tonne of steel'],
            ['Shuttering (contact area)', f(m.formworkSqft), 'sq ft', `${f(t.formworkM2)} m² of formwork face`],
            ['Excavation', f(m.excavationCft), 'cft', `${f(t.excavationM3, 1)} m³ for the foundation pits`],
          ]}
        />
      </section>

      <section className="ns-plate ns-r-sec" aria-labelledby="r-mem-t">
        <h3 id="r-mem-t">Concrete, steel and shuttering by part</h3>
        <Table
          head={['Part', 'Pieces', 'Concrete m³', 'Steel kg', 'Shuttering m²']}
          num={[1, 2, 3, 4]}
          rows={parts.map(([label, mt]) => [label, f(mt.count), f(mt.concreteM3, 2), f(mt.steelKg), f(mt.formworkM2, 1)])}
          foot={['Reinforced concrete total', '', f(rcc.c, 2), f(rcc.s), f(rcc.f, 1)]}
        />
        <p className="ns-r-tblnote">Steel here is the bar weight before the 5% cutting waste. Lean concrete under the footings (M7.5) is {f(r.members.pcc.concreteM3, 2)} m³ and is not part of the total above.</p>
      </section>

      <section className="ns-plate ns-r-sec" aria-labelledby="r-steel-t">
        <h3 id="r-steel-t">Steel by bar diameter</h3>
        <Table
          head={['Diameter', 'Weight to buy kg', '12 m bars']}
          num={[1, 2]}
          rows={r.steelByDiameter.map(s => [`${s.phi} mm`, f(s.kg), isCoil(s.phi) ? 'coil' : f(bars12m(s.phi, s.kg))])}
          foot={['All diameters', f(r.steelByDiameter.reduce((a, s) => a + s.kg, 0)), f(r.steelByDiameter.reduce((a, s) => a + bars12m(s.phi, s.kg), 0))]}
        />
        <p className="ns-r-tblnote">Weights include the 5% cutting waste. The bar count rounds each diameter up to whole 12 m lengths (weight per metre = d²/162.2, IS 1786). 6 mm bar is bought as a coil and cut and bent on site, so it has no bar count.</p>
      </section>

      <section className="ns-plate ns-r-sec" aria-labelledby="r-mix-t">
        <h3 id="r-mix-t">Mixes</h3>
        <Table
          head={['Where', 'Grade', 'Cement kg/m³', 'Sand m³/m³', 'Aggregate m³/m³']}
          num={[2, 3, 4]}
          rows={r.mixes.map(x => [x.where, x.grade, f(x.cementKgPerM3), f(x.sandM3PerM3, 2), f(x.aggM3PerM3, 2)])}
        />
        <ul className="ns-r-list">{r.mixes.map(x => <li key={x.where}><b>{x.grade}</b> {x.where}: {x.basis}</li>)}</ul>
      </section>

      <section className="ns-plate ns-r-sec" aria-labelledby="r-col-t">
        <h3 id="r-col-t">Columns and beams</h3>
        <Table
          tight
          head={['Storey', 'Column type', 'Pieces', 'Size mm', 'Main bars', 'Steel %', 'Ties']}
          num={[2, 5]}
          rows={r.schedules.columns.map(c => [storeyLabel(c.storey, stilt), c.type, f(c.count), `${c.bMm}\u00a0×\u00a0${c.dMm}`, c.bars, f(c.asPercent, 2), c.ties])}
        />
        <Table
          tight
          head={['Slab level', 'Beam', 'Pieces', 'Size mm', 'Bars']}
          num={[2]}
          rows={r.schedules.beams.map(x => [beamLevelLabel(x.floor, storeys), x.type, f(x.count), `${x.bMm}\u00a0×\u00a0${x.dMm}`, x.note])}
        />
        <p className="ns-r-tblnote">Bars read as number-diameter: 8-16 means eight 16 mm bars. In beams, the top bars are two continuous bars plus the extra bars after the plus sign, which sit over the supports. Every size is the smallest the tool&apos;s IS 456 and IS 13920 checks accept for your zone, except where the report says a limit is reached; your engineer may round up.</p>
      </section>

      <section className="ns-plate ns-r-sec" aria-labelledby="r-sec-t">
        <h3 id="r-sec-t">Smaller items, counted</h3>
        <Table
          tight
          head={['Item', 'Count', 'Concrete m³', 'Steel kg', 'Basis']}
          num={[1, 2, 3]}
          rows={r.secondary.map(s => [s.label, f(s.count), f(s.concreteM3, 2), f(s.steelKg), s.basis])}
        />
      </section>

      <section className="ns-plate ns-r-sec" aria-labelledby="r-lay-t">
        <h3 id="r-lay-t">The frame we designed</h3>
        <dl className="ns-r-facts">
          <div className="ns-r-fact"><dt>Footprint</dt><dd>{f(r.layout.lengthM, 1)} × {f(r.layout.widthM, 1)} m</dd></div>
          <div className="ns-r-fact"><dt>Column grid</dt><dd>{r.layout.baysX} × {r.layout.baysY} bays</dd><small>Spans about {f(r.layout.spanX, 2)} × {f(r.layout.spanY, 2)} m</small></div>
          <div className="ns-r-fact"><dt>Storey height</dt><dd>{f(r.layout.storeyHeightM, 1)} m</dd><small>Plinth {f(r.layout.plinthM, 2)} m above ground</small></div>
          <div className="ns-r-fact"><dt>Founding depth</dt><dd>{f(r.layout.foundingDepthM, 1)} m</dd><small>Below ground level</small></div>
          <div className="ns-r-fact"><dt>Steel per m²</dt><dd>{f(r.perM2.steelKgPerM2, 1)} kg</dd><small>{stilt ? 'Of roofed floor area, parking level included' : 'Of built-up floor area'}</small></div>
          <div className="ns-r-fact"><dt>Concrete per m²</dt><dd>{f(r.perM2.concreteM3PerM2, 3)} m³</dd><small>{stilt ? 'Of roofed floor area, parking level included' : 'Of built-up floor area'}</small></div>
          <div className="ns-r-fact"><dt>Wind speed used</dt><dd>{r.wind.vbMs} m/s</dd><small>{r.wind.basis === 'city' ? r.wind.place : `${r.wind.place}, state value`}. {r.wind.governs.x === 'wind' || r.wind.governs.y === 'wind' ? 'Wind is the larger force in one direction.' : 'Earthquake is the larger force.'}</small></div>
        </dl>
      </section>

      <section className="ns-plate ns-r-sec" aria-labelledby="r-acc-t">
        <h3 id="r-acc-t">How far off can this be</h3>
        <p className="ns-r-sec__sub">This is a code-based planning estimate, not a structural design for your drawing. It designs a regular frame to the Indian Standards and counts the extras. Your engineer&rsquo;s drawing will differ, and a real building is more likely to use more than this than less.</p>
        <ul className="ns-r-list">
          <li>Concrete: from {lowBand(b.concrete)}% below to {highBand(b.concrete)}% above the figure shown.</li>
          <li>Steel: from {lowBand(b.steel)}% below to {highBand(b.steel)}% above.</li>
          <li>Cement: from {lowBand(b.cement)}% below to {highBand(b.cement)}% above.</li>
          <li>Shuttering: from {lowBand(b.formwork)}% below to {highBand(b.formwork)}% above.</li>
        </ul>
        <p className="ns-r-tblnote">Use the figure to compare and to order the first lots. For a budget, plan on the upper half of each range, because the range is lopsided on purpose: the code sets a floor under what a frame needs, and site practice only adds to it. Get the final bar bending schedule from the structural engineer who signs your drawings.</p>
      </section>

      {r.practice && (
      <section className="ns-plate ns-r-sec" aria-labelledby="r-prac-t">
        <h3 id="r-prac-t">Against buildings that were actually built</h3>
        <p className="ns-r-sec__sub">The figures above are the steel and concrete a code-based design of this regular frame needs, at the section sizes shown. Built houses usually use more, because site practice adds margin that no code asks for. For orientation, here is what a published study of real {r.practice.classLabel} found.</p>
        <Table
          head={['', 'This report', 'Real buildings, low to high', 'For your floor area']}
          num={[1, 2, 3]}
          rows={[
            ['Steel per m² of floor (bar weight)', `${f(r.practice.thisReport.steelKgPerM2, 1)} kg`, `${f(r.practice.steelKgPerM2[0])} to ${f(r.practice.steelKgPerM2[1])} kg`, `${f(r.practice.steelKg[0])} to ${f(r.practice.steelKg[1])} kg`],
            ['Concrete per m² of floor', `${f(r.practice.thisReport.concreteM3PerM2, 2)} m³`, `${f(r.practice.concreteM3PerM2[0], 2)} to ${f(r.practice.concreteM3PerM2[1], 2)} m³`, `${f(r.practice.concreteM3[0], 1)} to ${f(r.practice.concreteM3[1], 1)} m³`],
          ]}
        />
        <p className="ns-r-tblnote">If your contractor&rsquo;s quantities fall between this report and the real-building range, that is common and worth a conversation, not an accusation. If they are above the range, ask for the bar bending schedule. Source: {r.practice.source} The study does not publish how many buildings fell in each class, so treat the range as orientation, not as a prediction for your house.</p>
      </section>
      )}

      <QuoteCheck r={r} />

      <section className="ns-plate ns-r-sec" aria-labelledby="r-as-t">
        <h3 id="r-as-t">Assumptions</h3>
        <ul className="ns-r-list">{r.assumptions.map(a => <li key={a}>{a}</li>)}</ul>
      </section>

      <section className="ns-plate ns-r-sec" aria-labelledby="r-ni-t">
        <h3 id="r-ni-t">Not counted in this report</h3>
        <ul className="ns-r-list">{r.notIncluded.map(a => <li key={a}>{a}</li>)}</ul>
      </section>
    </>
  )
}
