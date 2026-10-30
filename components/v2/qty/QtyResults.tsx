'use client'

import { Link } from '@/i18n/navigation'
import '@/styles/v2/results.css'
import type { TradeFree, TradePaid } from '@/lib/qty/types'
import type { TradeMeta } from '@/lib/qty/meta'
import { PAYMENT_BYPASS } from '@/lib/payment-config'
import { Note, IcArrow, IcCheck } from '@/components/v2/inner/kit'
import { DeliveryNote, ReportTable, Tot } from './parts'
import { useUnlock } from './useUnlock'
import PackUnlock from './PackUnlock'
import PayAssurance from '@/components/policy/PayAssurance'
import RatesPanel from './RatesPanel'

/*
  Results of a trade tool.
  Free: the counts and sizes at a glance and the IS-code checks. Paid: every quantity, as tables.
  The server never sends a quantity before the payment is verified; this file only draws what it is given.
*/

interface Props {
  meta: TradeMeta
  price: string
  free: TradeFree
  estimateId: string | null
  contactName: string
  projectName: string
  onStartOver: () => void
}

const band = (low: number, high: number) => ({ below: Math.round((1 - low) * 100), above: Math.round((high - 1) * 100) })

export default function QtyResults({ meta, price, free, estimateId, contactName, projectName, onStartOver }: Props) {
  const u = useUnlock<TradePaid>({
    api: `/api/qty/${meta.slug}`,
    estimateId,
    contactName,
    description: `${meta.label} report: ${meta.heading.toLowerCase()}`,
    fileName: `NirmanShastra-${meta.label}-Report.pdf`,
  })
  const r = u.report

  return (
    <div className="ns-r">
      <header className="ns-r-head">
        <p className="ns-i-card__eyebrow" style={{ margin: '0 0 6px', fontWeight: 700, color: 'var(--tc)', fontSize: 14 }}>Step 4 of 4 · {projectName || 'Your project'}</p>
        <h2>{r ? 'Your quantities are ready' : 'Here is what we worked out'}</h2>
        <div className="ns-r-chips">
          {free.chips.map((c, i) => <span key={c} className={`ns-i-pill${i === 0 ? ' ns-i-pill--tc' : ''}`}>{c}</span>)}
          {PAYMENT_BYPASS ? <span className="ns-r-preview"><IcCheck width={16} height={16} />Preview mode: full report open for testing</span> : null}
        </div>
      </header>

      {/* ───────────────────────── FREE ───────────────────────── */}
      <section className="ns-plate ns-r-hook" aria-labelledby="r-hook-t">
        <p className="ns-r-hook__k" id="r-hook-t">{free.factsTitle}</p>
        <dl className="ns-r-facts" aria-label={free.factsTitle}>
          {free.facts.map(x => (
            <div key={x.k} className="ns-r-fact">
              <dt>{x.k}</dt>
              <dd>{x.v}</dd>
              {x.note ? <small>{x.note}</small> : null}
            </div>
          ))}
        </dl>
        <p className="ns-r-hook__m">{free.factsFoot}</p>
      </section>

      <section className="ns-plate ns-r-sec" aria-labelledby="r-chk-t">
        <h3 id="r-chk-t">Checked against the Indian Standards</h3>
        <ul className="ns-r-chks">
          {free.checks.map(c => (
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
        <Note kind="warn" title="Please read">{free.warnings.join(' ')}</Note>
      )}

      {/* the quantities are the product */}
      {!u.isPaid && (
        <section className="ns-plate ns-r-unlock" aria-labelledby="r-unlock-t">
          <div>
            <p className="ns-r-hook__k">The quantities are in the full report</p>
            <h3 id="r-unlock-t">Know how much to buy, item by item</h3>
          </div>
          <ul className="ns-r-unlock__list">
            {meta.includes.map(t => <li key={t}><IcCheck />{t}</li>)}
          </ul>
          <PackUnlock appType={meta.appType} estimateId={estimateId} onUnlocked={u.markPaid} />
          <button type="button" className="ns-btn" onClick={u.unlock} disabled={u.busy || !estimateId}>
            {u.payStatus === 'creating' ? 'Starting the payment…' : u.payStatus === 'verifying' ? 'Checking your payment…' : u.payStatus === 'polling' ? 'Confirming your payment…' : `Unlock the full report · ${price}`}
            {!u.busy && <IcArrow width={22} height={11} />}
          </button>
          {u.payError && <Note kind="err">{u.payError}</Note>}
          <PayAssurance sample={meta.appType} />
          <p className="ns-i-fine">One payment, no subscription. Paid through Razorpay; we never see your card details.</p>
        </section>
      )}

      {/* ───────────────────────── PAID ───────────────────────── */}
      {u.isPaid && u.reportStatus === 'loading' && (
        <div role="status" aria-live="polite"><div className="ns-r-skel" /><p className="ns-i-fine" style={{ marginTop: 10 }}>Putting your quantities together…</p></div>
      )}
      {u.isPaid && u.reportStatus === 'error' && (
        <Note kind="err" title="We could not load your report">
          {u.reportError} <button type="button" className="ns-i-link" onClick={u.loadReport}>Try again</button>
        </Note>
      )}

      {u.isPaid && r && (
        <>
          <section className="ns-plate ns-r-pdf" aria-labelledby="r-pdf-t">
            <p className="ns-r-hook__k">{u.previewOnly ? 'Preview mode · no payment taken' : 'Payment received'}</p>
            <h3 id="r-pdf-t">Your report is unlocked</h3>
            <DeliveryNote emailSent={u.emailSent} />
            {u.pdfStatus === 'generating' && <p className="ns-i-fine" role="status">Preparing your PDF…</p>}
            {u.pdfStatus === 'ready' && u.pdfUrl && (
              <button type="button" className="ns-btn" onClick={u.downloadPdf} disabled={u.downloading}>{u.downloading ? 'Preparing the download…' : 'Download the PDF report'}</button>
            )}
            {u.pdfStatus === 'error' && (
              <Note kind="warn">The PDF could not be prepared just now. Everything is on this page. <button type="button" className="ns-i-link" onClick={u.generatePdf}>Try the PDF again</button></Note>
            )}
          </section>

          {r.tiles.length > 0 && (
            <section className="ns-plate ns-r-sec" aria-labelledby="r-tot-t">
              <h3 id="r-tot-t">What to order</h3>
              <p className="ns-r-sec__sub">The main totals. The line under each figure is the range the real number is likely to fall in (see “How far off can this be”).</p>
              <div className="ns-r-tots">
                {r.tiles.map(t => <Tot key={t.k} k={t.k} v={t.v} unit={t.unit} range={t.range} />)}
              </div>
            </section>
          )}

          {r.tables.map(tb => (
            <section key={tb.id} className="ns-plate ns-r-sec" aria-labelledby={`r-tb-${tb.id}`}>
              <h3 id={`r-tb-${tb.id}`}>{tb.title}</h3>
              {tb.sub ? <p className="ns-r-sec__sub">{tb.sub}</p> : null}
              <ReportTable head={tb.head} rows={tb.rows} foot={tb.foot} num={tb.num} tight={tb.tight} stack={false} />
              {tb.note ? <p className="ns-r-tblnote">{tb.note}</p> : null}
            </section>
          ))}

          {/* optional: the same quantities in rupees, at rates the visitor types */}
          <RatesPanel tool={meta.slug} lines={r.lines ?? []} pdf={{ api: `/api/qty/${meta.slug}/generate-pdf`, estimateId, fileName: `NirmanShastra-${meta.label}-Report-with-rupees.pdf` }} />

          <section className="ns-plate ns-r-sec" aria-labelledby="r-acc-t">
            <h3 id="r-acc-t">How far off can this be</h3>
            <p className="ns-r-sec__sub">This is a code-based planning estimate worked out from your answers, not a design for your drawings. Your drawings will differ; the ranges say by how much the real figure is likely to.</p>
            <ul className="ns-r-list">
              {r.bands.map(b => {
                const p = band(b.low, b.high)
                return <li key={b.label}>{b.label}: from {p.below}% below to {p.above}% above the figure shown.</li>
              })}
            </ul>
            <p className="ns-r-tblnote">Use it to plan, to check a contractor&rsquo;s quantities for gross errors, and to order the first lots. Final quantities come from the drawings and the professional who signs them.</p>
          </section>

          <section className="ns-plate ns-r-sec" aria-labelledby="r-as-t">
            <h3 id="r-as-t">Assumptions</h3>
            <ul className="ns-r-list">{r.assumptions.map(a => <li key={a}>{a}</li>)}</ul>
          </section>

          <section className="ns-plate ns-r-sec" aria-labelledby="r-ni-t">
            <h3 id="r-ni-t">Not counted in this report</h3>
            <ul className="ns-r-list">{r.notIncluded.map(a => <li key={a}>{a}</li>)}</ul>
          </section>

          <section className="ns-plate ns-r-sec" aria-labelledby="r-src-t">
            <h3 id="r-src-t">Standards and sources used</h3>
            <ul className="ns-r-list">{r.sources.map(a => <li key={a}>{a}</li>)}</ul>
          </section>
        </>
      )}

      <section className="ns-plate ns-r-next" aria-labelledby="r-next-t">
        <p className="ns-r-hook__k">Next</p>
        <h3 id="r-next-t">{meta.next.name}</h3>
        <p>{meta.next.text}</p>
        <Link href={meta.next.href} className="ns-btn ns-btn--paper">Start {meta.next.name}<IcArrow width={22} height={11} /></Link>
      </section>

      <button type="button" className="ns-r-again" onClick={onStartOver}>Start a new estimate</button>
    </div>
  )
}
