'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import '@/styles/v2/results.css'
import { Note } from '@/components/v2/inner/kit'
import { ReportTable } from './parts'
import type { QtyLine } from '@/lib/qty/types'
import { rateItems, type RateItem } from '@/lib/rates/items'
import { RESULT_LABEL, computeRupees, inr, inrRate, parseRate } from '@/lib/rates/compute'
import { hintFor, latestHintDate } from '@/lib/rates/hints'
import { trackRatesEntered } from '@/lib/analytics/events'
import { useLocale } from 'next-intl'
import { useCopy } from '@/lib/i18n/use-copy'
import { useQtyTr } from '@/lib/i18n/use-qty-tr'
import { QTY_RATES, dateHi } from '@/lib/i18n/labels/qty-ui'
import { isTradeSlug } from '@/lib/qty/meta'

/*
  "Want this in rupees? Enter your local rates." (Group 9)

  Sits after the quantities of every paid report and of the Grand Total. It starts closed and every box starts empty.
  The quantities stay the product: this only multiplies each quantity by a rate the visitor types, and says so.
    - Nothing here supplies a rate. The "Typical" hint beside a box comes from lib/rates/hints.ts, which the founder keeps and dates.
    - Typed rates live in this component's state only. They are not saved, and go to the server only if the visitor asks for the PDF
      with rupees, which is built from them and sent straight back.
    - rates_entered is sent once per page view, a moment after the first rate is typed (and only if the visitor accepted analytics).
*/

interface Props {
  /** the report: plumbpro, electropro, masonpro, interiorpro, structopro or grandtotal. Used in the analytics event. */
  tool: string
  lines: QtyLine[]
  /** where the PDF with rupees is asked for: POST { estimateId, rates } answers with the PDF itself */
  pdf: { api: string; estimateId: string | null; fileName: string }
}

/** A group with more items than this is folded up so the panel does not open as a wall of boxes. */
const FOLD_OVER = 8

export default function RatesPanel({ tool, lines, pdf }: Props) {
  const uid = useId()
  const k = useCopy(QTY_RATES)
  const hi = useLocale() === 'hi'
  // the words of the report's lines (item names, units, groups) are the server's English; the dictionaries of this tool turn them into Hindi
  const t = useQtyTr(tool === 'grandtotal' ? 'all' : isTradeSlug(tool) ? tool : 'none')
  const { items } = useMemo(() => rateItems(lines), [lines])
  const [typed, setTyped] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const sent = useRef(false)

  const rates = useMemo(() => {
    const out: Record<string, number> = {}
    for (const it of items) {
      const n = parseRate(typed[it.id])
      if (n !== null) out[it.id] = n
    }
    return out
  }, [items, typed])
  const result = useMemo(() => computeRupees(lines, rates), [lines, rates])

  // rates_entered: once, a moment after the visitor has stopped typing the first rate(s)
  useEffect(() => {
    if (sent.current || result.priced === 0) return
    const t = window.setTimeout(() => {
      if (sent.current) return
      sent.current = true
      trackRatesEntered(tool, result.priced, result.total)
    }, 1500)
    return () => window.clearTimeout(t)
  }, [tool, result.priced, result.total])

  if (items.length === 0) return null

  const groups: { name: string; items: RateItem[] }[] = []
  for (const it of items) {
    const g = groups.find(x => x.name === it.group)
    if (g) g.items.push(it)
    else groups.push({ name: it.group, items: [it] })
  }
  const updatedEn = latestHintDate(items.map(i => i.id))
  const updated = hi ? dateHi(updatedEn) : updatedEn
  const rowOf = new Map(result.rows.map(r => [r.id, r]))

  /** The words beside a rate box. lib/rates/hints.ts words them in English; the Hindi page re-words the same two shapes. */
  function hintLine(h: { text: string; updated: string }): { text: string; updated: string } {
    if (!hi) return h
    const m = /^Typical: (.+?) (?:a|per) (.+?) \(ask your dealer\)$/.exec(h.text)
    const text = m ? `${k.typical}: ${m[1]} ${t(`per ${m[2]}`)} (${k.askDealer})` : h.text === "Ask your dealer for today's rate" ? k.askToday : h.text
    const d = /^updated (.+)$/.exec(h.updated)
    return { text, updated: d ? k.updatedOn(dateHi(d[1])) : h.updated }
  }

  async function download() {
    if (busy || result.priced === 0) return
    if (!pdf.estimateId) { setError(k.notSaved); return }
    setBusy(true)
    setError('')
    try {
      const res = await fetch(pdf.api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estimateId: pdf.estimateId, rates }) })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || k.pdfFailed)
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = pdf.fileName
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 5000)
    } catch (e) {
      setError(e instanceof Error ? e.message : k.pdfFailed)
    } finally {
      setBusy(false)
    }
  }

  const box = (it: RateItem) => {
    const id = `${uid}-${it.id}`
    const text = typed[it.id] ?? ''
    const bad = text.trim() !== '' && parseRate(text) === null
    const hint = hintLine(hintFor(it.id, it.unit))
    const row = rowOf.get(it.id)
    return (
      <div key={it.id} className="ns-rates__row">
        <label className="ns-rates__lab" htmlFor={id}>
          <b>{t(it.label)}</b>
          <small>{k.youNeed(t(it.need))}</small>
        </label>
        <div className="ns-rates__in">
          <span aria-hidden="true">₹</span>
          <input
            id={id}
            className="ns-i-in"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder={k.yourRate}
            value={text}
            aria-invalid={bad || undefined}
            aria-describedby={`${id}-h`}
            onChange={e => setTyped(prev => ({ ...prev, [it.id]: e.target.value.replace(/[^\d.,\s₹]/g, '').slice(0, 12) }))}
          />
          <span className="ns-rates__per">{t(it.per)}</span>
        </div>
        <p className="ns-rates__hint" id={`${id}-h`}>
          {bad ? <span className="ns-rates__bad">{k.badRate}</span> : hint.text}
          {!bad && hint.updated ? <span className="ns-rates__asof"> · {hint.updated}</span> : null}
        </p>
        {row ? <p className="ns-rates__amt"><span className="ns-sr">{k.amount}</span>{inr(row.amount)}</p> : null}
      </div>
    )
  }

  return (
    <section className="ns-plate ns-r-sec ns-rates" aria-labelledby={`${uid}-t`}>
      <details className="ns-rates__d">
        <summary className="ns-rates__sum">
          <span>
            <b id={`${uid}-t`}>{k.title}</b>
            <small>{k.optional}</small>
          </span>
        </summary>

        <div className="ns-rates__body">
          <p className="ns-r-sec__sub">
            {k.intro}
            {updated ? k.updated(updated) : k.noGuess}
          </p>

          {groups.map((g, gi) => {
            const filled = g.items.filter(i => rates[i.id] !== undefined).length
            const body = <div className="ns-rates__rows">{g.items.map(box)}</div>
            if (g.items.length <= FOLD_OVER) {
              return (
                <fieldset key={g.name} className="ns-rates__g">
                  <legend>{t(g.name)}</legend>
                  {body}
                </fieldset>
              )
            }
            return (
              <details key={g.name} className="ns-rates__g ns-rates__g--fold" open={gi === 0 || filled > 0 ? true : undefined}>
                <summary>{t(g.name)} <small>{k.items(g.items.length)}{filled ? k.pricedN(filled) : ''}</small></summary>
                {body}
              </details>
            )
          })}

          {result.priced > 0 && (
            <div className="ns-rates__res" aria-live="polite">
              <h4>{k.inRupees}</h4>
              <ReportTable
                head={k.head}
                num={[2, 3]}
                stack
                rows={result.rows.map(r => [t(r.label), t(r.need), `${inrRate(r.rate)} ${t(r.per)}`, inr(r.amount)])}
                foot={[k.totalFor(result.priced), '', '', inr(result.total)]}
              />
              <p className="ns-rates__label"><b>{t(RESULT_LABEL)}</b></p>
              {result.blank.length > 0 && (
                <p className="ns-r-tblnote">{k.gave(result.priced, result.of, result.blank.length)}</p>
              )}
              {result.unpriced.length > 0 && (
                <p className="ns-r-tblnote">
                  {k.notPriced}{result.unpriced.map(u => t(u.item)).join(', ')}{hi ? '। ' : '. '}{Array.from(new Set(result.unpriced.map(u => u.why))).map(w => t(w)).join(' ')}
                </p>
              )}
              <div className="ns-rates__act">
                <button type="button" className="ns-btn" onClick={download} disabled={busy}>
                  {busy ? k.making : k.download}
                </button>
                <button type="button" className="ns-i-link" onClick={() => { setTyped({}); setError('') }}>{k.clear}</button>
              </div>
              {error && <Note kind="err" title={k.didNotGoThrough}>{t(error)}</Note>}
              <p className="ns-i-fine">{k.pdfFine}</p>
            </div>
          )}
        </div>
      </details>
    </section>
  )
}
