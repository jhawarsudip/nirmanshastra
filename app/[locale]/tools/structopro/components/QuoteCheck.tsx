'use client'

import { useState } from 'react'
import type { PaidPayload } from '@/lib/structopro-qty/payload'
import { checkQuote, readQuote, type QuoteItem, type QuoteVerdict } from '@/lib/structopro-qty/quoteCheck'
import { fmtIN } from '@/lib/structopro-qty/labels'
import { Field, Input, Select, Note } from '@/components/v2/inner/kit'

/*
  "Check your contractor's quantities". Runs in the browser on the report already paid for: nothing is sent or stored.
  The wording asks questions; it never says anyone overcharged. No rupee figure and no rate appears here.
*/

const TAG: Record<QuoteVerdict, string> = { near: 'CLOSE', inside: 'COMMON', below: 'LOW', above: 'HIGH', units: 'UNIT?' }
// green only for figures that need no question; amber for the rest. Never red: nothing here is an accusation.
const STATE: Record<QuoteVerdict, 'pass' | 'advisory'> = { near: 'pass', inside: 'pass', below: 'advisory', above: 'advisory', units: 'advisory' }

const sign = (p: number) => `${p >= 0 ? '+' : '−'}${Math.abs(Math.round(p))}%`

export default function QuoteCheck({ r }: { r: PaidPayload }) {
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

  return (
    <section className="ns-plate ns-r-sec" aria-labelledby="r-q-t">
      <h3 id="r-q-t">Check your contractor&rsquo;s quantities</h3>
      <p className="ns-r-sec__sub">Type in the quantities your contractor or engineer has given you, for the same reinforced-concrete frame. We set each one beside this report and say whether it is close, common, or worth a question. Fill in only the ones you have. Nothing you type here is sent anywhere.</p>

      <form className="ns-r-q" noValidate onSubmit={e => { e.preventDefault(); compare() }}>
        <div className="ns-r-q__rows">
          <div className="ns-r-q__row">
            <Field id="q-conc" label="Concrete"><Input inputMode="decimal" autoComplete="off" placeholder="for example 62" value={v.concrete} onChange={set('concrete')} /></Field>
            <Field id="q-conc-u" label="Unit"><Select value={u.concreteUnit} onChange={unit('concreteUnit')}><option value="m3">cubic metres (m³)</option><option value="cft">cubic feet (cft)</option></Select></Field>
          </div>

          <div className="ns-r-q__row">
            <Field id="q-steel" label="Steel"><Input inputMode="decimal" autoComplete="off" placeholder="for example 6500" value={v.steel} onChange={set('steel')} /></Field>
            <Field id="q-steel-u" label="Unit"><Select value={u.steelUnit} onChange={unit('steelUnit')}><option value="kg">kilograms (kg)</option><option value="quintal">quintals (100 kg)</option><option value="tonne">tonnes (1,000 kg)</option></Select></Field>
          </div>
          <fieldset className="ns-i-fs">
            <legend className="ns-i-lab">What does the steel figure mean?</legend>
            <div className="ns-i-seg">
              {([['Steel to order', 'order'], ['Steel in the drawing (bar bending schedule)', 'drawing']] as const).map(([label, val]) => (
                <label key={val} className="ns-i-segopt">
                  <input type="radio" name="q-steel-basis" checked={u.steelBasis === val} onChange={() => { setU(s => ({ ...s, steelBasis: val })); setItems(null) }} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            <p className="ns-i-hint" style={{ marginTop: 8 }}>If you were given one steel number to buy, pick the first. A bar bending schedule lists the weight of the bars before cutting waste; pick the second for that.</p>
          </fieldset>

          <div className="ns-r-q__row">
            <Field id="q-cem" label="Cement"><Input inputMode="decimal" autoComplete="off" placeholder="for example 520" value={v.cement} onChange={set('cement')} /></Field>
            <Field id="q-cem-u" label="Unit"><Select value="bags" disabled><option value="bags">50 kg bags</option></Select></Field>
          </div>

          <div className="ns-r-q__row">
            <Field id="q-sh" label="Shuttering (centering)"><Input inputMode="decimal" autoComplete="off" placeholder="for example 7800" value={v.shuttering} onChange={set('shuttering')} /></Field>
            <Field id="q-sh-u" label="Unit"><Select value={u.shutteringUnit} onChange={unit('shutteringUnit')}><option value="sqft">square feet (sq ft)</option><option value="sqm">square metres (m²)</option></Select></Field>
          </div>
        </div>

        {error && <p className="ns-i-err" role="alert">{error}</p>}
        <div><button type="submit" className="ns-btn">Compare with this report</button></div>
      </form>

      <div aria-live="polite">
        {items && (
          <ul className="ns-r-chks">
            {items.map(it => (
              <li key={it.key} className="ns-r-chk" data-s={STATE[it.verdict]}>
                <span className="ns-r-chk__s">{TAG[it.verdict]}</span>
                <p className="ns-r-chk__c">{it.label}</p>
                <p className="ns-r-chk__t">{it.headline}</p>
                <p className="ns-r-chk__d">{it.advice}</p>
                <p className="ns-r-q__fig">
                  Yours {fmtIN(it.yours, it.decimals)} {it.unit} · this report {fmtIN(it.report, it.decimals)} {it.unit} ({sign(it.pctVsReport)}) · expected {fmtIN(it.bandLow, it.decimals)} to {fmtIN(it.bandHigh, it.decimals)} {it.unit}
                  {it.practiceHigh ? ` · real buildings go up to ${fmtIN(it.practiceHigh, it.decimals)} ${it.unit}` : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Note>This report counts the reinforced-concrete frame only: footings or raft, plinth beams, columns, floor beams, slabs, the staircase, lintels, sunshades, the parapet band and any balcony slabs. A contractor&rsquo;s figure that also covers a boundary wall, a tank, a septic tank, an extension or the lean concrete under the footings will look higher. If the figures differ, ask what is inside them before you ask why.</Note>
    </section>
  )
}
