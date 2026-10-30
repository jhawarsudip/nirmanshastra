'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { useCopy } from '@/lib/i18n/use-copy'
import { useStructTr } from '@/lib/i18n/labels/structopro-tr'
import { RCOPY } from '../results-copy'
import type { PaidPayload } from '@/lib/structopro-qty/payload'
import { checkQuote, readQuote, type QuoteItem, type QuoteVerdict } from '@/lib/structopro-qty/quoteCheck'
import { fmtIN } from '@/lib/structopro-qty/labels'
import { Field, Input, Select, Note } from '@/components/v2/inner/kit'

/*
  "Check your contractor's quantities". Runs in the browser on the report already paid for: nothing is sent or stored.
  The wording asks questions; it never says anyone overcharged. No rupee figure and no rate appears here.
*/

// green only for figures that need no question; amber for the rest. Never red: nothing here is an accusation.
const STATE: Record<QuoteVerdict, 'pass' | 'advisory'> = { near: 'pass', inside: 'pass', below: 'advisory', above: 'advisory', units: 'advisory' }

const sign = (p: number) => `${p >= 0 ? '+' : '−'}${Math.abs(Math.round(p))}%`

export default function QuoteCheck({ r }: { r: PaidPayload }) {
  const t = useCopy(RCOPY).quote
  const tr = useStructTr()
  const hi = useLocale() === 'hi'
  const [v, setV] = useState({ concrete: '', steel: '', cement: '', shuttering: '' })
  const [u, setU] = useState({ concreteUnit: 'm3', steelUnit: 'kg', steelBasis: 'order', shutteringUnit: 'sqft' })
  const [items, setItems] = useState<QuoteItem[] | null>(null)
  const [error, setError] = useState('')

  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => { setV(s => ({ ...s, [k]: e.target.value })); setItems(null) }
  const unit = (k: keyof typeof u) => (e: React.ChangeEvent<HTMLSelectElement>) => { setU(s => ({ ...s, [k]: e.target.value })); setItems(null) }

  function compare() {
    const read = readQuote({ ...v, ...u })
    if (!read.ok) { setError(read.error); setItems(null); return }
    setError('')
    setItems(checkQuote(r, read.input))
  }

  // English keeps the engine's own words. Hindi is put together from the verdict, the figure and the hints in the copy file.
  const labelOf = (it: QuoteItem) =>
    !hi ? it.label : it.key === 'steel' ? (it.label.includes('drawing') ? t.labels.steelDrawing : t.labels.steelOrder) : t.labels[it.key]
  const adviceOf = (it: QuoteItem) => {
    if (!hi) return it.advice
    const h = t.hints[it.key]
    switch (it.verdict) {
      case 'units': return t.adviceUnits(h.unit)
      case 'below': return t.adviceBelow(h.scope)
      case 'near': return t.adviceNear
      case 'inside': return t.adviceInside
      default: return t.adviceAbove(h.askFor)
    }
  }

  return (
    <section className="ns-plate ns-r-sec" aria-labelledby="r-q-t">
      <h3 id="r-q-t">{t.title}</h3>
      <p className="ns-r-sec__sub">{t.sub}</p>

      <form className="ns-r-q" noValidate onSubmit={e => { e.preventDefault(); compare() }}>
        <div className="ns-r-q__rows">
          <div className="ns-r-q__row">
            <Field id="q-conc" label={t.concrete}><Input inputMode="decimal" autoComplete="off" placeholder={t.eg(62)} value={v.concrete} onChange={set('concrete')} /></Field>
            <Field id="q-conc-u" label={t.unit}><Select value={u.concreteUnit} onChange={unit('concreteUnit')}><option value="m3">{t.m3}</option><option value="cft">{t.cft}</option></Select></Field>
          </div>

          <div className="ns-r-q__row">
            <Field id="q-steel" label={t.steel}><Input inputMode="decimal" autoComplete="off" placeholder={t.eg(6500)} value={v.steel} onChange={set('steel')} /></Field>
            <Field id="q-steel-u" label={t.unit}><Select value={u.steelUnit} onChange={unit('steelUnit')}><option value="kg">{t.kg}</option><option value="quintal">{t.quintal}</option><option value="tonne">{t.tonne}</option></Select></Field>
          </div>
          <fieldset className="ns-i-fs">
            <legend className="ns-i-lab">{t.basisLegend}</legend>
            <div className="ns-i-seg">
              {([[t.basisOrder, 'order'], [t.basisDrawing, 'drawing']] as const).map(([label, val]) => (
                <label key={val} className="ns-i-segopt">
                  <input type="radio" name="q-steel-basis" checked={u.steelBasis === val} onChange={() => { setU(s => ({ ...s, steelBasis: val })); setItems(null) }} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            <p className="ns-i-hint" style={{ marginTop: 8 }}>{t.basisHint}</p>
          </fieldset>

          <div className="ns-r-q__row">
            <Field id="q-cem" label={t.cement}><Input inputMode="decimal" autoComplete="off" placeholder={t.eg(520)} value={v.cement} onChange={set('cement')} /></Field>
            <Field id="q-cem-u" label={t.unit}><Select value="bags" disabled><option value="bags">{t.bags}</option></Select></Field>
          </div>

          <div className="ns-r-q__row">
            <Field id="q-sh" label={t.shuttering}><Input inputMode="decimal" autoComplete="off" placeholder={t.eg(7800)} value={v.shuttering} onChange={set('shuttering')} /></Field>
            <Field id="q-sh-u" label={t.unit}><Select value={u.shutteringUnit} onChange={unit('shutteringUnit')}><option value="sqft">{t.sqft}</option><option value="sqm">{t.sqm}</option></Select></Field>
          </div>
        </div>

        {error && <p className="ns-i-err" role="alert">{tr(error)}</p>}
        <div><button type="submit" className="ns-btn">{t.compare}</button></div>
      </form>

      <div aria-live="polite">
        {items && (
          <ul className="ns-r-chks">
            {items.map(it => {
              const unitWord = hi ? (t.unitWord[it.unit] ?? it.unit) : it.unit
              return (
                <li key={it.key} className="ns-r-chk" data-s={STATE[it.verdict]}>
                  <span className="ns-r-chk__s">{t.tag[it.verdict]}</span>
                  <p className="ns-r-chk__c">{labelOf(it)}</p>
                  <p className="ns-r-chk__t">{hi ? t.headlines[it.verdict] : it.headline}</p>
                  <p className="ns-r-chk__d">{adviceOf(it)}</p>
                  <p className="ns-r-q__fig">
                    {t.fig(fmtIN(it.yours, it.decimals), unitWord, fmtIN(it.report, it.decimals), sign(it.pctVsReport), fmtIN(it.bandLow, it.decimals), fmtIN(it.bandHigh, it.decimals))}
                    {it.practiceHigh ? t.figReal(fmtIN(it.practiceHigh, it.decimals), unitWord) : ''}
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <Note>{t.note}</Note>
    </section>
  )
}
