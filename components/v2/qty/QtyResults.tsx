'use client'

import { useLocale } from 'next-intl'
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
import { useCopy } from '@/lib/i18n/use-copy'
import { useQtyTr } from '@/lib/i18n/use-qty-tr'
import { QTY_RES } from '@/lib/i18n/labels/qty-ui'
import { TRADE_META } from '@/lib/qty/meta'

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
  const k = useCopy(QTY_RES)
  const hi = useLocale() === 'hi'
  const t = useQtyTr(meta.slug)
  // what the payment window and the PDF say stays English; only the page is in the visitor's language
  const en = TRADE_META[meta.slug]
  const cell = (c: string | number) => (typeof c === 'string' ? t(c) : c)
  const u = useUnlock<TradePaid>({
    api: `/api/qty/${meta.slug}`,
    estimateId,
    contactName,
    description: `${en.label} report: ${en.heading.toLowerCase()}`,
    fileName: `NirmanShastra-${meta.label}-Report.pdf`,
  })
  const r = u.report

  return (
    <div className="ns-r">
      <header className="ns-r-head">
        <p className="ns-i-card__eyebrow" style={{ margin: '0 0 6px', fontWeight: 700, color: 'var(--tc)', fontSize: 14 }}>{k.stepProject(projectName || k.yourProject)}</p>
        <h2>{r ? k.ready : k.worked}</h2>
        <div className="ns-r-chips">
          {free.chips.map((c, i) => <span key={c} className={`ns-i-pill${i === 0 ? ' ns-i-pill--tc' : ''}`}>{t(c)}</span>)}
          {PAYMENT_BYPASS ? <span className="ns-r-preview"><IcCheck width={16} height={16} />{k.previewMode}</span> : null}
        </div>
      </header>

      {/* ───────────────────────── FREE ───────────────────────── */}
      <section className="ns-plate ns-r-hook" aria-labelledby="r-hook-t">
        <p className="ns-r-hook__k" id="r-hook-t">{t(free.factsTitle)}</p>
        <dl className="ns-r-facts" aria-label={t(free.factsTitle)}>
          {free.facts.map(x => (
            <div key={x.k} className="ns-r-fact">
              <dt>{t(x.k)}</dt>
              <dd>{t(x.v)}</dd>
              {x.note ? <small>{t(x.note)}</small> : null}
            </div>
          ))}
        </dl>
        <p className="ns-r-hook__m">{t(free.factsFoot)}</p>
      </section>

      <section className="ns-plate ns-r-sec" aria-labelledby="r-chk-t">
        <h3 id="r-chk-t">{k.checked}</h3>
        <ul className="ns-r-chks">
          {free.checks.map(c => (
            <li key={c.id} className="ns-r-chk" data-s={c.status}>
              <span className="ns-r-chk__s">{c.status === 'pass' ? k.pass : c.status === 'advisory' ? k.note : k.fail}</span>
              <p className="ns-r-chk__c">{t(c.clause)}</p>
              <p className="ns-r-chk__t">{t(c.description)}</p>
              <p className="ns-r-chk__d">{t(c.detail)}</p>
            </li>
          ))}
        </ul>
      </section>

      {free.warnings.length > 0 && (
        <Note kind="warn" title={k.pleaseRead}>{free.warnings.map(w => t(w)).join(' ')}</Note>
      )}

      {/* the quantities are the product */}
      {!u.isPaid && (
        <section className="ns-plate ns-r-unlock" aria-labelledby="r-unlock-t">
          <div>
            <p className="ns-r-hook__k">{k.lockedK}</p>
            <h3 id="r-unlock-t">{k.lockedTitle}</h3>
          </div>
          <ul className="ns-r-unlock__list">
            {meta.includes.map(t => <li key={t}><IcCheck />{t}</li>)}
          </ul>
          <PackUnlock appType={meta.appType} estimateId={estimateId} onUnlocked={u.markPaid} />
          <button type="button" className="ns-btn" onClick={u.unlock} disabled={u.busy || !estimateId}>
            {u.payStatus === 'creating' ? k.starting : u.payStatus === 'verifying' ? k.checkingPay : u.payStatus === 'polling' ? k.confirmingPay : k.unlock(price)}
            {!u.busy && <IcArrow width={22} height={11} />}
          </button>
          {u.payError && <Note kind="err">{t(u.payError)}</Note>}
          <PayAssurance sample={meta.appType} hi={hi} />
          <p className="ns-i-fine">{k.payFine}</p>
        </section>
      )}

      {/* ───────────────────────── PAID ───────────────────────── */}
      {u.isPaid && u.reportStatus === 'loading' && (
        <div role="status" aria-live="polite"><div className="ns-r-skel" /><p className="ns-i-fine" style={{ marginTop: 10 }}>{k.putting}</p></div>
      )}
      {u.isPaid && u.reportStatus === 'error' && (
        <Note kind="err" title={k.loadFailed}>
          {t(u.reportError)} <button type="button" className="ns-i-link" onClick={u.loadReport}>{k.tryAgain}</button>
        </Note>
      )}

      {u.isPaid && r && (
        <>
          <section className="ns-plate ns-r-pdf" aria-labelledby="r-pdf-t">
            <p className="ns-r-hook__k">{u.previewOnly ? k.previewNoPay : k.received}</p>
            <h3 id="r-pdf-t">{k.unlocked}</h3>
            <DeliveryNote emailSent={u.emailSent} />
            {u.pdfStatus === 'generating' && <p className="ns-i-fine" role="status">{k.preparingPdf}</p>}
            {u.pdfStatus === 'ready' && u.pdfUrl && (
              <button type="button" className="ns-btn" onClick={u.downloadPdf} disabled={u.downloading}>{u.downloading ? k.preparingDl : k.download}</button>
            )}
            {u.pdfStatus === 'error' && (
              <Note kind="warn">{k.pdfFailed} <button type="button" className="ns-i-link" onClick={u.generatePdf}>{k.pdfAgain}</button></Note>
            )}
          </section>

          {r.tiles.length > 0 && (
            <section className="ns-plate ns-r-sec" aria-labelledby="r-tot-t">
              <h3 id="r-tot-t">{k.order}</h3>
              <p className="ns-r-sec__sub">{k.orderSub}</p>
              <div className="ns-r-tots">
                {r.tiles.map(x => <Tot key={x.k} k={t(x.k)} v={x.v} unit={t(x.unit)} range={x.range ? t(x.range) : undefined} />)}
              </div>
            </section>
          )}

          {r.tables.map(tb => (
            <section key={tb.id} className="ns-plate ns-r-sec" aria-labelledby={`r-tb-${tb.id}`}>
              <h3 id={`r-tb-${tb.id}`}>{t(tb.title)}</h3>
              {tb.sub ? <p className="ns-r-sec__sub">{t(tb.sub)}</p> : null}
              <ReportTable head={tb.head.map(t)} rows={tb.rows.map(row => row.map(cell))} foot={tb.foot?.map(cell)} num={tb.num} tight={tb.tight} stack={false} />
              {tb.note ? <p className="ns-r-tblnote">{t(tb.note)}</p> : null}
            </section>
          ))}

          {/* optional: the same quantities in rupees, at rates the visitor types */}
          <RatesPanel tool={meta.slug} lines={r.lines ?? []} pdf={{ api: `/api/qty/${meta.slug}/generate-pdf`, estimateId, fileName: `NirmanShastra-${meta.label}-Report-with-rupees.pdf` }} />

          <section className="ns-plate ns-r-sec" aria-labelledby="r-acc-t">
            <h3 id="r-acc-t">{k.off}</h3>
            <p className="ns-r-sec__sub">{k.offSub}</p>
            <ul className="ns-r-list">
              {r.bands.map(b => {
                const p = band(b.low, b.high)
                return <li key={b.label}>{k.band(t(b.label), p.below, p.above)}</li>
              })}
            </ul>
            <p className="ns-r-tblnote">{k.offNote}</p>
          </section>

          <section className="ns-plate ns-r-sec" aria-labelledby="r-as-t">
            <h3 id="r-as-t">{k.assumptions}</h3>
            <ul className="ns-r-list">{r.assumptions.map(a => <li key={a}>{t(a)}</li>)}</ul>
          </section>

          <section className="ns-plate ns-r-sec" aria-labelledby="r-ni-t">
            <h3 id="r-ni-t">{k.notCounted}</h3>
            <ul className="ns-r-list">{r.notIncluded.map(a => <li key={a}>{t(a)}</li>)}</ul>
          </section>

          <section className="ns-plate ns-r-sec" aria-labelledby="r-src-t">
            <h3 id="r-src-t">{k.sources}</h3>
            <ul className="ns-r-list">{r.sources.map(a => <li key={a}>{t(a)}</li>)}</ul>
          </section>
        </>
      )}

      <section className="ns-plate ns-r-next" aria-labelledby="r-next-t">
        <p className="ns-r-hook__k">{k.next}</p>
        <h3 id="r-next-t">{meta.next.name}</h3>
        <p>{meta.next.text}</p>
        <Link href={meta.next.href} className="ns-btn ns-btn--paper">{k.start(meta.next.name)}<IcArrow width={22} height={11} /></Link>
      </section>

      <button type="button" className="ns-r-again" onClick={onStartOver}>{k.again}</button>
    </div>
  )
}
