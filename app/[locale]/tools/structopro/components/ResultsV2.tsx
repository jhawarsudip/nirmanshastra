'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'
import '@/styles/v2/results.css'
import type { FreePayload, PaidPayload } from '@/lib/structopro-qty/payload'
import { sceneFromGeometry, sceneFromPreview } from '@/lib/structopro-qty/scene'
import { bars12m, isCoil, bandBelowPct, bandAbovePct } from '@/lib/structopro-qty/labels'
import { buildingLabelFor, storeyLabelFor, beamLevelLabelFor } from '@/lib/i18n/labels/structopro-fmt'
import { useCopy } from '@/lib/i18n/use-copy'
import { useStructTr } from '@/lib/i18n/labels/structopro-tr'
import { RCOPY } from '../results-copy'
import type { MemberTotals } from '@/lib/structopro-qty/types'
import StructureViewer from '@/components/3d/StructureViewer'
import { PAYMENT_BYPASS } from '@/lib/payment-config'
import { getAttribution } from '@/lib/analytics/attribution'
import { orderCreated, paymentVerified } from '@/lib/analytics/checkout'
import { TOOLS } from '@/lib/v2/content'
import { Note, IcArrow, IcCheck } from '@/components/v2/inner/kit'
import { Tot, ReportTable as Table, DeliveryNote } from '@/components/v2/qty/parts'
import PackUnlock from '@/components/v2/qty/PackUnlock'
import RatesPanel from '@/components/v2/qty/RatesPanel'
import { structureLines } from '@/lib/rates/structure'
import QuoteCheck from './QuoteCheck'
import ContactCapture, { type CaptureMode } from './ContactCapture'
import PayAssurance from '@/components/policy/PayAssurance'

/*
  StructurePro results.
  Free: the 3D model (already running), the frame at a glance, the IS-code checks. Paid: the quantities, then an optional panel (RatesPanel) that shows rupees only at rates the visitor types. No rupee figure of ours anywhere.
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

/** The long reference to a study, with the English title of the publication set apart so it is read as English. */
function Source({ text, hi }: { text: string; hi: boolean }) {
  const TITLE = 'Building the Baseline: Embodied Carbon in India’s Urban Housing'
  const i = text.indexOf(TITLE)
  if (i < 0 || !hi) return <>{text}</>
  return <>{text.slice(0, i)}<span lang="en">{TITLE}</span>{text.slice(i + TITLE.length)}</>
}

// ─── the page ─────────────────────────────────────────────────────────────────

interface Props {
  free: FreePayload
  estimateId: string | null
  /** true when the estimate already has a contact (a signed-in visitor); otherwise a name and email are asked before payment */
  hasContact: boolean
  projectName: string
  onStartOver: () => void
}

export default function ResultsV2({ free, estimateId, hasContact, projectName, onStartOver }: Props) {
  const t = useCopy(RCOPY)
  const tr = useStructTr()
  const locale = useLocale()
  const [payStatus, setPayStatus] = useState<PayStatus>('idle')
  const [payError, setPayError] = useState('')
  const [isPaid, setIsPaid] = useState(PAYMENT_BYPASS)
  const [orderId, setOrderId] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Name and email are asked here, not before the result: when the visitor chooses to pay or to save the project.
  const [contactReady, setContactReady] = useState(hasContact)
  const [who, setWho] = useState<{ name: string; email: string } | null>(null)
  const [capture, setCapture] = useState<CaptureMode | null>(null)
  const [saved, setSaved] = useState(false)

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
          paymentVerified(orderId) // no-op when the success handler already reported this order
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

  // the PDF is emailed to the contact, so it waits until there is one
  useEffect(() => { if (reportStatus === 'ready' && contactReady) generatePdf() }, [reportStatus, contactReady, generatePdf])

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

  async function handleUnlock(by?: { name: string; email: string }) {
    if (!estimateId) { setPayError('Your estimate is not saved yet. Please wait a moment and try again.'); return }
    setPayStatus('creating')
    setPayError('')
    try {
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // the amount is decided on the server; the campaign tags say which reel or ad brought this sale
        body: JSON.stringify({ estimateId, attribution: getAttribution() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Could not start the payment')
      orderCreated(json) // begin_checkout / InitiateCheckout, with the amount the server will charge
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
        prefill: { name: (by ?? who)?.name ?? '', email: (by ?? who)?.email ?? '' },
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
            paymentVerified(response.razorpay_order_id) // purchase / Purchase, once per order
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
        <p className="ns-i-card__eyebrow" style={{ margin: '0 0 6px', fontWeight: 700, color: 'var(--tc)', fontSize: 14 }}>{t.head.step(projectName || t.head.yourProject)}</p>
        <h2>{report ? t.head.quantitiesReady : t.head.structureReady}</h2>
        <div className="ns-r-chips">
          <span className="ns-i-pill ns-i-pill--tc">{buildingLabelFor(locale, free.floors, free.stilt)} · {t.free.sqft(f(free.builtUpSqft))}</span>
          <span className="ns-i-pill">{t.head.zone(free.zone)}</span>
          <span className="ns-i-pill">{free.foundation === 'raft' ? t.head.raft : t.head.footings}</span>
          {PAYMENT_BYPASS ? <span className="ns-r-preview"><IcCheck width={16} height={16} />{t.head.previewMode}</span> : null}
        </div>
      </header>

      {/* the model: already on screen and running */}
      <StructureViewer key={model.mode} model={model} />

      {/* ───────────────────────── FREE ───────────────────────── */}
      <section className="ns-plate ns-r-hook" aria-labelledby="r-hook-t">
        <p className="ns-r-hook__k" id="r-hook-t">{t.free.glanceTitle}</p>
        <dl className="ns-r-facts" aria-label={t.free.glanceAria}>
          <div className="ns-r-fact"><dt>{t.free.planSize}</dt><dd>{f(gl.lengthM, 1)} × {f(gl.widthM, 1)} m</dd><small>{t.free.planSizeFt(ft(gl.lengthM), ft(gl.widthM))}</small></div>
          <div className="ns-r-fact"><dt>{t.free.grid}</dt><dd>{t.free.bays(gl.baysX, gl.baysY)}</dd><small>{t.free.spans(f(gl.spanXM, 1), f(gl.spanYM, 1))}</small></div>
          <div className="ns-r-fact"><dt>{t.free.colsPerFloor}</dt><dd>{gl.columnsPerStorey}</dd></div>
          {free.stilt && <div className="ns-r-fact"><dt>{t.free.openLevel}</dt><dd>{t.free.columnsOnly}</dd><small>{t.free.openLevelNote}</small></div>}
          {free.balconies > 0 && <div className="ns-r-fact"><dt>{t.free.balconies}</dt><dd>{free.balconies}</dd><small>{t.free.balconyNote}</small></div>}
          <div className="ns-r-fact"><dt>{free.foundation === 'raft' ? t.free.foundation : t.free.footingsLabel}</dt><dd>{free.foundation === 'raft' ? t.free.oneRaft : gl.footings}</dd><small>{free.foundation === 'raft' ? t.free.raftNote : t.free.footingNote}</small></div>
          <div className="ns-r-fact"><dt>{t.free.beamsPerFloor}</dt><dd>{gl.beamsPerFloor}</dd></div>
          <div className="ns-r-fact"><dt>{t.free.slabPanels}</dt><dd>{gl.slabPanelsPerFloor}</dd></div>
        </dl>
        <p className="ns-r-hook__m">{t.free.glanceNote}</p>
      </section>

      <dl className="ns-r-facts" aria-label={t.free.structureAria}>
        <div className="ns-r-fact"><dt>{t.free.floors}</dt><dd>{buildingLabelFor(locale, free.floors, free.stilt)}</dd>{free.stilt && <small>{t.free.stiltFloors(free.floors)}</small>}</div>
        <div className="ns-r-fact"><dt>{t.free.builtUp}</dt><dd>{t.free.sqft(f(free.builtUpSqft))}</dd></div>
        <div className="ns-r-fact"><dt>{t.free.quakeZone}</dt><dd>{t.head.zone(free.zone)}<small>{tr(free.zoneNote)}</small></dd></div>
        <div className="ns-r-fact"><dt>{t.free.concreteGrade}</dt><dd>{t.free.aboveGround(free.gradeAbove)}</dd><dd style={{ fontSize: 16, marginTop: 0 }}>{t.free.inFoundation(free.gradeBelow)}</dd></div>
        <div className="ns-r-fact"><dt>{t.free.steel}</dt><dd>Fe500D</dd><small>{t.free.steelNote}</small></div>
        <div className="ns-r-fact"><dt>{t.free.exposure}</dt><dd style={{ textTransform: 'capitalize' }}>{t.free.exposures[free.exposure] ?? free.exposure.replace('_', ' ')}</dd><small>{t.free.exposureNote}</small></div>
      </dl>

      <section className="ns-plate ns-r-sec" aria-labelledby="r-chk-t">
        <h3 id="r-chk-t">{t.free.checksTitle}</h3>
        <p className="ns-r-sec__sub">{t.free.checksSub}</p>
        <ul className="ns-r-chks">
          {free.compliance.filter(c => c.id !== 'review').map(c => (
            <li key={c.id} className="ns-r-chk" data-s={c.status}>
              <span className="ns-r-chk__s">{c.status === 'pass' ? t.free.pass : c.status === 'advisory' ? t.free.note : t.free.fail}</span>
              <p className="ns-r-chk__c">{tr(c.clause)}</p>
              <p className="ns-r-chk__t">{tr(c.description)}</p>
              <p className="ns-r-chk__d">{tr(c.detail)}</p>
            </li>
          ))}
        </ul>
      </section>

      {free.warnings.length > 0 && (
        <Note kind="warn" title={t.free.pleaseRead}>
          {free.warnings.map(tr).join(' ')}
        </Note>
      )}

      {/* the quantities are the product */}
      {!isPaid && (
        <section className="ns-plate ns-r-unlock" aria-labelledby="r-unlock-t">
          <div>
            <p className="ns-r-hook__k">{t.free.unlockKicker}</p>
            <h3 id="r-unlock-t">{t.free.unlockTitle}</h3>
          </div>
          <ul className="ns-r-unlock__list">
            {t.free.unlockList.map(line => <li key={line}><IcCheck />{line}</li>)}
          </ul>
          <PackUnlock appType="structopro" estimateId={estimateId} onUnlocked={() => { setContactReady(true); setIsPaid(true); setPayStatus('paid') }} />
          {capture === 'pay' ? (
            <ContactCapture
              estimateId={estimateId}
              mode="pay"
              onCancel={() => setCapture(null)}
              onDone={w => { setWho(w); setContactReady(true); setCapture(null); handleUnlock(w) }}
            />
          ) : (
            <button type="button" className="ns-btn" onClick={() => (contactReady ? handleUnlock() : setCapture('pay'))} disabled={busy || !estimateId}>
              {payStatus === 'creating' ? t.free.starting : payStatus === 'verifying' ? t.free.verifying : payStatus === 'polling' ? t.free.confirming : t.free.unlock(TOOL.price)}
              {!busy && <IcArrow width={22} height={11} />}
            </button>
          )}
          {payError && <Note kind="err">{tr(payError)}</Note>}
          <PayAssurance sample="structopro" hi={locale === 'hi'} />
          <p className="ns-i-fine">{t.free.onePayment}</p>
          {!contactReady && !saved && capture !== 'save' && capture !== 'pay' && (
            <p className="ns-i-fine">
              {t.free.notReady} <button type="button" className="ns-i-link" onClick={() => setCapture('save')}>{t.free.saveLink}</button> {t.free.andCome}
            </p>
          )}
          {capture === 'save' && (
            <ContactCapture
              estimateId={estimateId}
              mode="save"
              onCancel={() => setCapture(null)}
              onDone={w => { setWho(w); setContactReady(true); setCapture(null); setSaved(true) }}
            />
          )}
          {saved && (
            <Note kind="ok" title={t.free.savedTitle}>
              {t.free.saved(who?.email)}
            </Note>
          )}
        </section>
      )}

      {/* paid, but no name and email yet (the open preview mode): ask before the PDF is made and emailed */}
      {isPaid && !contactReady && (
        <section className="ns-plate ns-r-unlock" aria-label={t.free.whereToSend}>
          <ContactCapture estimateId={estimateId} mode="send" onDone={w => { setWho(w); setContactReady(true) }} />
        </section>
      )}

      {/* ───────────────────────── PAID ───────────────────────── */}
      {isPaid && reportStatus === 'loading' && (
        <div role="status" aria-live="polite"><div className="ns-r-skel" /><p className="ns-i-fine" style={{ marginTop: 10 }}>{t.free.putting}</p></div>
      )}
      {isPaid && reportStatus === 'error' && (
        <Note kind="err" title={t.free.loadFail}>
          {tr(reportError)} <button type="button" className="ns-i-link" onClick={loadReport}>{t.free.tryAgain}</button>
        </Note>
      )}
      {isPaid && report && <PaidSections r={report} estimateId={estimateId} preview={PAYMENT_BYPASS && payStatus !== 'paid'} pdfStatus={pdfStatus} pdfUrl={pdfUrl} emailSent={emailSent} downloading={downloading} onDownload={downloadPdf} onRetryPdf={generatePdf} />}

      <section className="ns-plate ns-r-next" aria-labelledby="r-next-t">
        <p className="ns-r-hook__k">{t.free.nextKicker}</p>
        <h3 id="r-next-t">{t.free.nextTitle}</h3>
        <p>{t.free.nextBody}</p>
        <Link href="/tools/masonpro" className="ns-btn ns-btn--paper">{t.free.nextGo}<IcArrow width={22} height={11} /></Link>
      </section>

      <button type="button" className="ns-r-again" onClick={onStartOver}>{t.free.again}</button>
    </div>
  )
}

// ─── the paid report ──────────────────────────────────────────────────────────

export function PaidSections({ r, estimateId, preview, pdfStatus, pdfUrl, emailSent, downloading, onDownload, onRetryPdf }: {
  r: PaidPayload
  estimateId: string | null
  preview: boolean
  pdfStatus: PdfStatus
  pdfUrl: string | null
  emailSent: boolean | null
  downloading: boolean
  onDownload: () => void
  onRetryPdf: () => void
}) {
  const all = useCopy(RCOPY)
  const pc = all.paid
  const tr = useStructTr()
  const locale = useLocale()
  const t = r.totals
  const m = r.materials
  const b = r.band
  const rng = (v: number, band: [number, number]) => `${f(v * band[0])} ${pc.rangeTo} ${f(v * band[1])}`

  const parts: [string, MemberTotals][] = [
    [pc.partFootings, r.members.footings],
    [pc.partPlinth, r.members.plinthBeams],
    [pc.partColumns, r.members.columns],
    [pc.partBeams, r.members.beams],
    [pc.partSlabs, r.members.slabs],
    [pc.partStair, r.members.stairs],
    [pc.partSecondary, r.members.secondary],
    ...(r.members.balconies ? [[pc.partBalcony, r.members.balconies] as [string, MemberTotals]] : []),
  ]
  const rcc = parts.reduce((s, [, mt]) => ({ c: s.c + mt.concreteM3, s: s.s + mt.steelKg, f: s.f + mt.formworkM2 }), { c: 0, s: 0, f: 0 })
  const stilt = r.inputEcho.stilt
  const lines = useMemo(() => structureLines(r), [r])

  const storeys = Math.max(0, ...r.schedules.columns.map(c => c.storey)) + 1
  const lowBand = bandBelowPct
  const highBand = bandAbovePct

  return (
    <>
      <section className="ns-plate ns-r-pdf" aria-labelledby="r-pdf-t">
        <p className="ns-r-hook__k">{preview ? pc.previewKicker : pc.paidKicker}</p>
        <h3 id="r-pdf-t">{pc.unlockedTitle}</h3>
        <DeliveryNote emailSent={emailSent} />
        {pdfStatus === 'generating' && <p className="ns-i-fine" role="status">{pc.pdfPreparing}</p>}
        {pdfStatus === 'ready' && pdfUrl && (
          <button type="button" className="ns-btn" onClick={onDownload} disabled={downloading}>{downloading ? pc.pdfDownloading : pc.pdfDownload}</button>
        )}
        {pdfStatus === 'error' && (
          <Note kind="warn">{pc.pdfFail} <button type="button" className="ns-i-link" onClick={onRetryPdf}>{pc.pdfRetry}</button></Note>
        )}
      </section>

      <section className="ns-plate ns-r-sec" aria-labelledby="r-tot-t">
        <h3 id="r-tot-t">{pc.orderTitle}</h3>
        <p className="ns-r-sec__sub">{pc.orderSub}</p>
        <div className="ns-r-tots">
          <Tot k={pc.tConcrete} v={f(t.concreteM3, 1)} unit="m³" range={`${rng(t.concreteM3, b.concrete)} m³`} />
          <Tot k={pc.tSteel} v={f(t.steelBuyKg)} unit="kg" range={`${rng(t.steelBuyKg, b.steel)} kg`} />
          <Tot k={pc.tCement} v={f(m.cementBags)} unit={pc.bags} range={`${rng(m.cementBags, b.cement)} ${pc.bags}`} />
          <Tot k={pc.tShuttering} v={f(m.formworkSqft)} unit={pc.sqft} range={`${rng(m.formworkSqft, b.formwork)} ${pc.sqft}`} />
        </div>
      </section>

      <section className="ns-plate ns-r-sec" aria-labelledby="r-buy-t">
        <h3 id="r-buy-t">{pc.buyTitle}</h3>
        <Table
          head={pc.buyHead}
          num={[1]}
          rows={[
            [pc.buyCement, f(m.cementBags), pc.bags, pc.buyCementHow],
            [pc.buySand, f(m.sandCft), 'cft', `${f(m.sandM3, 1)} m³`],
            [pc.buyAgg, f(m.aggregateCft), 'cft', `${f(m.aggregateM3, 1)} m³`],
            [pc.buySteel, f(m.steelBuyKg), 'kg', pc.buySteelHow(f(t.steelNetKg))],
            [pc.buyWire, f(m.bindingWireKg, 1), 'kg', pc.buyWireHow],
            [pc.buyShut, f(m.formworkSqft), 'sq ft', pc.buyShutHow(f(t.formworkM2))],
            [pc.buyExc, f(m.excavationCft), 'cft', pc.buyExcHow(f(t.excavationM3, 1))],
          ]}
        />
      </section>

      <section className="ns-plate ns-r-sec" aria-labelledby="r-mem-t">
        <h3 id="r-mem-t">{pc.partsTitle}</h3>
        <Table
          head={pc.partsHead}
          num={[1, 2, 3, 4]}
          rows={parts.map(([label, mt]) => [label, f(mt.count), f(mt.concreteM3, 2), f(mt.steelKg), f(mt.formworkM2, 1)])}
          foot={[pc.partTotal, '', f(rcc.c, 2), f(rcc.s), f(rcc.f, 1)]}
        />
        <p className="ns-r-tblnote">{pc.partsNote(f(r.members.pcc.concreteM3, 2))}</p>
      </section>

      <section className="ns-plate ns-r-sec" aria-labelledby="r-steel-t">
        <h3 id="r-steel-t">{pc.steelTitle}</h3>
        <Table
          head={pc.steelHead}
          num={[1, 2]}
          rows={r.steelByDiameter.map(s => [`${s.phi} mm`, f(s.kg), isCoil(s.phi) ? pc.coil : f(bars12m(s.phi, s.kg))])}
          foot={[pc.allDia, f(r.steelByDiameter.reduce((a, s) => a + s.kg, 0)), f(r.steelByDiameter.reduce((a, s) => a + bars12m(s.phi, s.kg), 0))]}
        />
        <p className="ns-r-tblnote">{pc.steelNote}</p>
      </section>

      <section className="ns-plate ns-r-sec" aria-labelledby="r-mix-t">
        <h3 id="r-mix-t">{pc.mixTitle}</h3>
        <Table
          head={pc.mixHead}
          num={[2, 3, 4]}
          rows={r.mixes.map(x => [tr(x.where), x.grade, f(x.cementKgPerM3), f(x.sandM3PerM3, 2), f(x.aggM3PerM3, 2)])}
        />
        <ul className="ns-r-list">{r.mixes.map(x => <li key={x.where}><b>{x.grade}</b> {tr(x.where)}: {tr(x.basis)}</li>)}</ul>
      </section>

      <section className="ns-plate ns-r-sec" aria-labelledby="r-col-t">
        <h3 id="r-col-t">{pc.colTitle}</h3>
        <Table
          tight
          head={pc.colHead}
          num={[2, 5]}
          rows={r.schedules.columns.map(c => [storeyLabelFor(locale, c.storey, stilt), tr(c.type), f(c.count), `${c.bMm}\u00a0×\u00a0${c.dMm}`, c.bars, f(c.asPercent, 2), tr(c.ties)])}
        />
        <Table
          tight
          head={pc.beamHead}
          num={[2]}
          rows={r.schedules.beams.map(x => [beamLevelLabelFor(locale, x.floor, storeys), tr(x.type), f(x.count), `${x.bMm}\u00a0×\u00a0${x.dMm}`, tr(x.note)])}
        />
        <p className="ns-r-tblnote">{pc.colNote}</p>
      </section>

      <section className="ns-plate ns-r-sec" aria-labelledby="r-sec-t">
        <h3 id="r-sec-t">{pc.smallTitle}</h3>
        <Table
          tight
          head={pc.smallHead}
          num={[1, 2, 3]}
          rows={r.secondary.map(s => [tr(s.label), f(s.count), f(s.concreteM3, 2), f(s.steelKg), tr(s.basis)])}
        />
      </section>

      {/* optional: the Buy list in rupees, at rates the visitor types */}
      <RatesPanel tool="structopro" lines={lines} pdf={{ api: '/api/structopro/generate-pdf', estimateId, fileName: 'NirmanShastra-StructurePro-Report-with-rupees.pdf' }} />

      <section className="ns-plate ns-r-sec" aria-labelledby="r-lay-t">
        <h3 id="r-lay-t">{pc.layTitle}</h3>
        <dl className="ns-r-facts">
          <div className="ns-r-fact"><dt>{pc.footprint}</dt><dd>{f(r.layout.lengthM, 1)} × {f(r.layout.widthM, 1)} m</dd></div>
          <div className="ns-r-fact"><dt>{pc.colGrid}</dt><dd>{all.free.bays(r.layout.baysX, r.layout.baysY)}</dd><small>{pc.spansAbout(f(r.layout.spanX, 2), f(r.layout.spanY, 2))}</small></div>
          <div className="ns-r-fact"><dt>{pc.storeyHeight}</dt><dd>{f(r.layout.storeyHeightM, 1)} m</dd><small>{pc.plinthAbove(f(r.layout.plinthM, 2))}</small></div>
          <div className="ns-r-fact"><dt>{pc.foundingDepth}</dt><dd>{f(r.layout.foundingDepthM, 1)} m</dd><small>{pc.belowGround}</small></div>
          <div className="ns-r-fact"><dt>{pc.steelPerM2}</dt><dd>{f(r.perM2.steelKgPerM2, 1)} kg</dd><small>{stilt ? pc.ofRoofed : pc.ofBuiltUp}</small></div>
          <div className="ns-r-fact"><dt>{pc.concretePerM2}</dt><dd>{f(r.perM2.concreteM3PerM2, 3)} m³</dd><small>{stilt ? pc.ofRoofed : pc.ofBuiltUp}</small></div>
          <div className="ns-r-fact"><dt>{pc.windSpeed}</dt><dd>{r.wind.vbMs} m/s</dd><small>{r.wind.basis === 'city' ? tr(r.wind.place) : pc.stateValue(tr(r.wind.place))}. {r.wind.governs.x === 'wind' || r.wind.governs.y === 'wind' ? pc.windLarger : pc.quakeLarger}</small></div>
        </dl>
      </section>

      <section className="ns-plate ns-r-sec" aria-labelledby="r-acc-t">
        <h3 id="r-acc-t">{pc.accTitle}</h3>
        <p className="ns-r-sec__sub">{pc.accSub}</p>
        <ul className="ns-r-list">
          <li>{pc.accRange(pc.accConcrete, lowBand(b.concrete), highBand(b.concrete))}</li>
          <li>{pc.accRange(pc.accSteel, lowBand(b.steel), highBand(b.steel))}</li>
          <li>{pc.accRange(pc.accCement, lowBand(b.cement), highBand(b.cement))}</li>
          <li>{pc.accRange(pc.accShuttering, lowBand(b.formwork), highBand(b.formwork))}</li>
        </ul>
        <p className="ns-r-tblnote">{pc.accNote}</p>
      </section>

      {r.practice && (
      <section className="ns-plate ns-r-sec" aria-labelledby="r-prac-t">
        <h3 id="r-prac-t">{pc.pracTitle}</h3>
        <p className="ns-r-sec__sub">{pc.pracSub(tr(r.practice.classLabel))}</p>
        <Table
          head={pc.pracHead}
          num={[1, 2, 3]}
          rows={[
            [pc.pracSteelRow, `${f(r.practice.thisReport.steelKgPerM2, 1)} kg`, `${f(r.practice.steelKgPerM2[0])} ${pc.pracTo} ${f(r.practice.steelKgPerM2[1])} kg`, `${f(r.practice.steelKg[0])} ${pc.pracTo} ${f(r.practice.steelKg[1])} kg`],
            [pc.pracConcRow, `${f(r.practice.thisReport.concreteM3PerM2, 2)} m³`, `${f(r.practice.concreteM3PerM2[0], 2)} ${pc.pracTo} ${f(r.practice.concreteM3PerM2[1], 2)} m³`, `${f(r.practice.concreteM3[0], 1)} ${pc.pracTo} ${f(r.practice.concreteM3[1], 1)} m³`],
          ]}
        />
        <p className="ns-r-tblnote">{pc.pracNote1}<Source text={tr(r.practice.source)} hi={locale === 'hi'} />{pc.pracNote2}</p>
      </section>
      )}

      <QuoteCheck r={r} />

      <section className="ns-plate ns-r-sec" aria-labelledby="r-as-t">
        <h3 id="r-as-t">{pc.assumpTitle}</h3>
        <ul className="ns-r-list">{r.assumptions.map(a => <li key={a}>{tr(a)}</li>)}</ul>
      </section>

      <section className="ns-plate ns-r-sec" aria-labelledby="r-ni-t">
        <h3 id="r-ni-t">{pc.notInTitle}</h3>
        <ul className="ns-r-list">{r.notIncluded.map(a => <li key={a}>{tr(a)}</li>)}</ul>
      </section>
    </>
  )
}
