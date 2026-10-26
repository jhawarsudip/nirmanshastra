import Link from 'next/link'
import type { ReactNode } from 'react'
import { IcArrow } from './kit'
import CalcTracker from '@/components/analytics/CalcTracker'
import '@/styles/v2/results.css'
import '@/styles/v2/freecalc.css'

/*
  Shared pieces for the free calculators (v2 look).
  Plain components with no state, so they work in the server layout and in the client pages alike.
  A calculator page is: <CalcPage> <ToolHead/> <QuickAnswer/> <CalcGrid input result/> sections… </CalcPage>
*/

/** The page frame: the same width and padding as every other inner page. */
export function CalcPage({ children }: { children: ReactNode }) {
  return (
    <div className="ns-i-page" data-ns-calc>
      <CalcTracker />
      <div className="ns-i-wrap ns-calc-page">{children}</div>
    </div>
  )
}

/** Two cards side by side on a desktop (the questions, then the answer), one above the other on a phone. */
export function CalcGrid({ input, result }: { input: ReactNode; result: ReactNode }) {
  return (
    <div className="ns-calc">
      <section className="ns-plate ns-calc__in" aria-label="Your numbers">{input}</section>
      <section className="ns-plate ns-calc__out" aria-label="The answer" aria-live="polite">{result}</section>
    </div>
  )
}

/** A small heading above a block of fields or results. */
export function CalcLabel({ children }: { children: ReactNode }) {
  return <p className="ns-calc-lab">{children}</p>
}

/** The one big number a calculator is for. */
export function Big({ k, v, unit, sub }: { k: string; v: string; unit?: string; sub?: string }) {
  // A long figure (₹11,20,000.00) steps the type size down so it stays on one line in the card.
  const n = v.length
  const fit = n <= 8 ? undefined : n <= 10 ? 'a' : n <= 12 ? 'b' : n <= 14 ? 'c' : n <= 16 ? 'd' : 'e'
  return (
    <div className="ns-calc-big">
      <span className="ns-calc-big__k">{k}</span>
      <span className="ns-calc-big__v" data-fit={fit}>{v}{unit ? <small>{unit}</small> : null}</span>
      {sub ? <span className="ns-calc-big__s">{sub}</span> : null}
    </div>
  )
}

/** A few small figures in a row. tone "ok" marks the figure to act on. */
export function Figures({ items }: { items: { k: string; v: string; unit?: string; tone?: 'ok' | 'warn' }[] }) {
  return (
    <dl className="ns-calc-figs">
      {items.map(f => (
        <div key={f.k} className="ns-calc-fig" data-tone={f.tone}>
          <dt>{f.k}</dt>
          <dd>{f.v}{f.unit ? <small>{f.unit}</small> : null}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Step-by-step working: what was done, how, and the figure it gave. */
export function Rows({ rows }: { rows: { label: string; detail?: string; value: string; tone?: 'ok' | 'dim' }[] }) {
  return (
    <div className="ns-i-tblw">
      <table className="ns-i-tbl ns-calc-rows">
        <tbody>
          {rows.map(r => (
            <tr key={r.label} data-tone={r.tone}>
              <th scope="row">{r.label}</th>
              <td className="ns-i-tbl__note">{r.detail ?? ''}</td>
              <td className="ns-i-num">{r.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** The IS codes a calculator rests on. */
export function Chips({ codes }: { codes: string[] }) {
  return (
    <ul className="ns-r-chips ns-calc-chips" aria-label="Standards used">
      {codes.map(c => <li key={c} className="ns-i-pill">{c}</li>)}
    </ul>
  )
}

/** A full-width block under the calculator: a reference table, an explainer. */
export function CalcSection({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <section className="ns-plate ns-r-sec ns-calc-sec">
      <h2>{title}</h2>
      {sub ? <p className="ns-r-sec__sub">{sub}</p> : null}
      {children}
    </section>
  )
}

/** Long-form text in the v2 reading style. */
export function Prose({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="ns-calc-prose">
      <h2>{title}</h2>
      <div className="ns-prose">{children}</div>
    </section>
  )
}

/** A line of working shown in the mono face (a formula or a worked sum). */
export function Formula({ children }: { children: ReactNode }) {
  return <p className="ns-calc-formula">{children}</p>
}

/** "Need the full report?" pointer to a paid tool. */
export function CalcCta({ kicker, text, href, label }: { kicker: string; text: string; href: string; label: string }) {
  return (
    <aside className="ns-plate ns-calc-cta">
      <div>
        <p className="ns-calc-cta__k">{kicker}</p>
        <p className="ns-calc-cta__t">{text}</p>
      </div>
      <Link href={href} className="ns-btn ns-btn--paper">{label}<IcArrow width={22} height={11} /></Link>
    </aside>
  )
}

/** The small print at the foot of a calculator. */
export function CalcFine({ children }: { children: ReactNode }) {
  return <p className="ns-i-fine ns-calc-fine">{children}</p>
}
