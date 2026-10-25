'use client'

import { useId, useState, type ReactNode } from 'react'
import { CALC, pick, type Bi, type Loc } from '@/lib/v2/copy'

export interface CalcRow {
  /** what is being worked out, in plain words */
  label: string
  /** the working, e.g. "1,500 sq ft × 0.4 bag" */
  how?: string
  /** the answer for this row */
  value: string
  /** highlight the row (usually the total) */
  strong?: boolean
}

/**
 * "Show the calculation": the formulas, rates and IS-code references stay out of sight until someone asks.
 * The numbers on the page are always computed by the engine/rules; this only reveals the working.
 */
export default function Calc({
  loc,
  rows,
  note,
  standards,
  children,
  className,
  labels,
  title,
}: {
  loc: Loc
  rows?: CalcRow[]
  note?: string
  standards?: string[]
  children?: ReactNode
  className?: string
  /** override the button text, e.g. "Show the 25 standards" */
  labels?: { show: Bi; hide: Bi }
  /** override the heading inside the opened sheet */
  title?: Bi
}) {
  const id = useId()
  const [open, setOpen] = useState(false)
  return (
    <div className={`ns-calc${open ? ' is-open' : ''}${className ? ` ${className}` : ''}`}>
      <button
        type="button"
        className="ns-calc__btn"
        aria-expanded={open}
        aria-controls={`${id}-p`}
        onClick={() => setOpen(o => !o)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="ns-calc__ico">
          <rect x="4.5" y="2.5" width="15" height="19" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <rect x="7.5" y="5.5" width="9" height="4" rx="1" fill="currentColor" opacity=".85" />
          <g fill="currentColor">
            <circle cx="8.6" cy="13.2" r="1.15" /><circle cx="12" cy="13.2" r="1.15" /><circle cx="15.4" cy="13.2" r="1.15" />
            <circle cx="8.6" cy="17" r="1.15" /><circle cx="12" cy="17" r="1.15" /><circle cx="15.4" cy="17" r="1.15" />
          </g>
        </svg>
        <span>{pick(open ? (labels?.hide ?? CALC.hide) : (labels?.show ?? CALC.show), loc)}</span>
        <svg viewBox="0 0 12 12" aria-hidden="true" className="ns-calc__caret"><path d="M2 4.2 6 8l4-3.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      <div className="ns-calc__panel" id={`${id}-p`} inert={!open}>
        <div className="ns-calc__inner">
          <div className="ns-calc__sheet">
            <p className="ns-calc__title">{pick(title ?? CALC.title, loc)}</p>
            {rows && rows.length > 0 && (
              <ul className="ns-calc__rows">
                {rows.map((r, i) => (
                  <li key={i} className={r.strong ? 'is-strong' : undefined}>
                    <span className="ns-calc__lab">{r.label}</span>
                    {r.how && <code className="ns-calc__how">{r.how}</code>}
                    <b className="ns-calc__val">{r.value}</b>
                  </li>
                ))}
              </ul>
            )}
            {children}
            {note && <p className="ns-calc__note">{note}</p>}
            {standards && standards.length > 0 && (
              <p className="ns-calc__std">
                <span>{pick(CALC.standards, loc)}</span>
                {standards.map(s => <code key={s}>{s}</code>)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
