import { cloneElement, isValidElement } from 'react'
import type { InputHTMLAttributes, ReactElement, ReactNode, SelectHTMLAttributes, SVGProps } from 'react'
import Image from 'next/image'
import type { LiveSummaryData } from '@/components/ui/LiveSummaryPanel'

/* Shared pieces for every inner page. Plain components with no state, so they work in server and client files alike. */

type IP = SVGProps<SVGSVGElement>
const ib: IP = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }

export const IcCheck = (p: IP) => <svg viewBox="0 0 24 24" {...ib} {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
export const IcAlert = (p: IP) => <svg viewBox="0 0 24 24" {...ib} {...p}><path d="M12 4l9 16H3L12 4z" /><path d="M12 10v4.5M12 17.4v.1" /></svg>
export const IcInfo = (p: IP) => <svg viewBox="0 0 24 24" {...ib} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5.5M12 7.6v.1" /></svg>
export const IcArrow = (p: IP) => <svg viewBox="0 0 24 12" {...ib} strokeWidth={1.8} {...p}><path d="M1 6h20M16 1.5L21.5 6 16 10.5" /></svg>
export const IcPlan = (p: IP) => <svg viewBox="0 0 32 32" {...ib} strokeWidth={1.8} {...p}><path d="M5 27l3-9L22 4l6 6L14 24l-9 3z" /><path d="M19 7l6 6" /></svg>
export const IcFloors = (p: IP) => <svg viewBox="0 0 32 32" {...ib} strokeWidth={1.8} {...p}><path d="M16 4l12 6-12 6-12-6 12-6z" /><path d="M4 16l12 6 12-6" /><path d="M4 22l12 6 12-6" /></svg>
export const IcDraw = (p: IP) => <svg viewBox="0 0 32 32" {...ib} strokeWidth={1.8} {...p}><path d="M7 3h14l5 5v21H7V3z" /><path d="M21 3v5h5" /><path d="M11 15h10M11 20h10M11 25h6" /></svg>

/* ---- tool head: the first thing on a tool page ------------------------------ */

export function ToolHead({ eyebrow, name, blurb, price, art, artAlt }: {
  eyebrow: string; name: string; blurb: string; price?: string; art?: string; artAlt?: string
}) {
  return (
    <header className="ns-i-head">
      <div>
        <div className="ns-i-head__eyebrow">
          <span className="ns-i-pill ns-i-pill--tc">{eyebrow}</span>
          {price ? <span className="ns-i-pill ns-i-pill--price">{price}</span> : null}
        </div>
        <h1>{name}</h1>
        <p>{blurb}</p>
      </div>
      {art ? (
        <div className="ns-i-head__art">
          <Image src={art} alt={artAlt ?? ''} width={380} height={380} sizes="(max-width: 1200px) 13vw, 190px" priority />
        </div>
      ) : null}
    </header>
  )
}

/* ---- step bar --------------------------------------------------------------- */

export function StepBar({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="ns-i-steps" aria-label="Progress">
      {steps.map((label, i) => {
        const s = i < current ? 'done' : i === current ? 'now' : 'next'
        return (
          <li key={label} className="ns-i-step" data-s={s} aria-current={s === 'now' ? 'step' : undefined}>
            <span className="ns-i-step__dot">{s === 'done' ? <IcCheck /> : i + 1}</span>
            <span className="ns-i-step__label">{label}</span>
          </li>
        )
      })}
    </ol>
  )
}

/* ---- a form field: label, hint, control, error, all wired for screen readers --- */

export function Field({ id, label, required, hint, error, invalid, wide, aside, children }: {
  id: string; label: string; required?: boolean; hint?: string; error?: string
  /** mark the control as invalid without showing a message under it (the message is shown elsewhere) */
  invalid?: boolean
  wide?: boolean
  /** sits beside the label, e.g. the little "i" button that explains the question */
  aside?: ReactNode
  children: ReactElement<Record<string, unknown>>
}) {
  const describedBy = [hint ? `${id}-h` : '', error ? `${id}-e` : ''].filter(Boolean).join(' ') || undefined
  const control = isValidElement(children)
    ? cloneElement(children, { id, 'aria-invalid': error || invalid ? true : undefined, 'aria-describedby': describedBy, 'aria-required': required ? true : undefined })
    : children
  const lab = <label className="ns-i-lab" htmlFor={id}>{label}{required ? <i aria-hidden="true">*</i> : null}</label>
  return (
    <div className={`ns-i-f${wide ? ' ns-i-f--wide' : ''}`}>
      {aside ? <div className="ns-i-labrow">{lab}{aside}</div> : lab}
      {hint ? <p className="ns-i-hint" id={`${id}-h`}>{hint}</p> : null}
      {control}
      {error ? <p className="ns-i-err" id={`${id}-e`} role="alert"><IcAlert />{error}</p> : null}
    </div>
  )
}

/** The text box and the drop-down, with the site's look. Everything a normal input takes passes straight through. */
export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="ns-i-in" {...props} />
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <div className="ns-i-selw"><select className="ns-i-sel" {...props} /></div>
}

/* ---- notes ------------------------------------------------------------------ */

export function Note({ kind = 'info', title, foot, children }: { kind?: 'info' | 'ok' | 'warn' | 'err'; title?: string; foot?: string; children?: ReactNode }) {
  const Icon = kind === 'ok' ? IcCheck : kind === 'info' ? IcInfo : IcAlert
  return (
    <div className={`ns-i-note${kind === 'info' ? '' : ` ns-i-note--${kind}`}`} role={kind === 'err' ? 'alert' : undefined}>
      <Icon />
      <div>
        {title ? <p><b>{title}</b></p> : null}
        {children ? <p>{children}</p> : null}
        {foot ? <p className="ns-i-note__ref">{foot}</p> : null}
      </div>
    </div>
  )
}

/* ---- the rail: "your project so far" ------------------------------------------ */

type BaseReg = { name?: string; projectName?: string; city?: string; state?: string }

function SummaryBody({ toolName, price, regData, liveData }: { toolName: string; price: string; regData: BaseReg; liveData: LiveSummaryData }) {
  const rows: [string, string | undefined][] = [
    ['Floors', liveData.floors],
    ['Built-up area', liveData.bua ? `${liveData.bua.toLocaleString('en-IN')} sq ft` : undefined],
    ['Site condition', liveData.siteCondition],
    ['Concrete grade', liveData.concreteGrade],
    ['Steel grade', liveData.steelGrade],
    ['Wall type', liveData.wallType],
    ['Total area', liveData.totalArea ? `${liveData.totalArea.toLocaleString('en-IN')} sq m` : undefined],
    ['Finish level', liveData.grade],
  ]
  // A tool can hand over its own rows (label, value) instead of the fixed set above.
  const custom = Array.isArray(liveData.rows) ? (liveData.rows as [string, string][]) : null
  const shown = (custom ?? rows).filter(([, v]) => v)
  const where = [regData.city, regData.state].filter(Boolean).join(', ')
  return (
    <div className="ns-plate ns-i-sum">
      <p className="ns-i-sum__eyebrow">Your project so far</p>
      <h2>{regData.projectName || 'Your project'}</h2>
      <p className="ns-i-sum__who">{[regData.name, where].filter(Boolean).join(' · ')}</p>
      {shown.length ? (
        <ul className="ns-i-sum__rows">
          {shown.map(([k, v]) => <li key={k} className="ns-i-sum__row"><span>{k}</span><b>{v}</b></li>)}
        </ul>
      ) : (
        <p className="ns-i-sum__empty">Your answers will appear here as you go.</p>
      )}
      <div className="ns-i-sum__trust">
        <Note kind="ok" title="Checked against Indian Standards">Every quantity follows the IS codes and is worked out for you. This summary updates as you answer.</Note>
      </div>
      <p className="ns-i-sum__price"><span>{toolName} full report</span><b>{price}</b></p>
    </div>
  )
}

/** Desktop: sticks beside the form. */
export function RailAside(props: { toolName: string; price: string; regData: BaseReg; liveData: LiveSummaryData }) {
  return <aside className="ns-i-rail" aria-label="Your project so far"><SummaryBody {...props} /></aside>
}

/** Phone and tablet: the same summary, folded above the form. */
export function RailFold(props: { toolName: string; price: string; regData: BaseReg; liveData: LiveSummaryData }) {
  return (
    <details className="ns-i-railm">
      <summary>Your project so far</summary>
      <SummaryBody {...props} />
    </details>
  )
}
