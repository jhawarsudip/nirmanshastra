// Drafted icons for v2: 1.5px stroke, square caps, no stock icon pack.
import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement>
const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'square', strokeLinejoin: 'miter' } as const

// Compact NirmanShastra mark (compass ring + RCC column + north arrow), drawn for <=48px.
// Same geometry as public/brand/nirmanshastra-mark-*.svg. Ink follows currentColor,
// accent follows --ns-laterite so it flips with the light/dark theme.
export function BrandMark(props: P) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" {...props}>
      <path d="M37.3 7.06A25.5 25.5 0 1 1 26.7 7.06" stroke="currentColor" strokeWidth="3.2" />
      <path d="M3.5 32H10.5M53.5 32H60.5M32 53.5V60.5" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M32 1.5L36.8 13 32 10.2 27.2 13Z" fill="var(--ns-laterite)" />
      <rect x="17.5" y="17" width="29" height="5.5" fill="currentColor" />
      <rect x="24.5" y="22.5" width="15" height="25" stroke="currentColor" strokeWidth="2.4" />
      <path d="M29.3 24V47M34.7 24V47" stroke="var(--ns-laterite)" strokeWidth="1.7" />
      <rect x="20.5" y="47.5" width="23" height="4.5" fill="currentColor" />
    </svg>
  )
}

export function LampIcon({ on, ...props }: P & { on?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" {...base} aria-hidden="true" {...props}>
      <g transform="rotate(-18 12 8)">
        <rect x="5.5" y="4" width="13" height="8" />
        <path d="M8.5 4v8M12 4v8M15.5 4v8" strokeWidth="1" />
      </g>
      <path d="M12 12.5V20M7.5 22l4.5-2 4.5 2" />
      {on ? <path d="M3 4l2.2 1.6M2 9h2.6M3.4 14l2.4-1" strokeWidth="1.3" /> : null}
    </svg>
  )
}

export function BubbleIcon({ calm, ...props }: P & { calm?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" {...base} aria-hidden="true" {...props}>
      <rect x="2.5" y="8" width="19" height="8" rx="4" />
      <path d="M9.2 8v8M14.8 8v8" strokeWidth="1" />
      <circle cx={calm ? 12 : 6.6} cy="12" r="2.2" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function Caret(props: P) {
  return (
    <svg viewBox="0 0 10 10" {...base} strokeWidth={1.6} aria-hidden="true" {...props}>
      <path d="M1.5 3.5L5 7l3.5-3.5" />
    </svg>
  )
}

export function Burger(props: P) {
  return (
    <svg viewBox="0 0 24 24" {...base} strokeWidth={1.8} aria-hidden="true" {...props}>
      <path d="M3 7h18M3 12h18M3 17h18" />
    </svg>
  )
}

export function Cross(props: P) {
  return (
    <svg viewBox="0 0 24 24" {...base} strokeWidth={1.8} aria-hidden="true" {...props}>
      <path d="M5 5l14 14M19 5L5 19" />
    </svg>
  )
}

export function Arrow(props: P) {
  return (
    <svg viewBox="0 0 24 12" {...base} strokeWidth={1.8} aria-hidden="true" {...props}>
      <path d="M1 6h20M16 1.5L21.5 6 16 10.5" />
    </svg>
  )
}

/** Shared SVG <defs>: the drafting hatch library. Render once per page. */
export function HatchDefs() {
  const ink = { stroke: 'var(--ns-ink)' } as const
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <pattern id="h-brick" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="7" strokeWidth="1" style={ink} />
        </pattern>
        <pattern id="h-steel" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="4" strokeWidth="1" style={ink} />
        </pattern>
        <pattern id="h-earth" width="12" height="9" patternUnits="userSpaceOnUse">
          <line x1="1" y1="8" x2="6" y2="2" strokeWidth="1" style={ink} />
          <line x1="8" y1="8" x2="12" y2="3" strokeWidth="1" style={ink} />
        </pattern>
        <pattern id="h-concrete" width="26" height="26" patternUnits="userSpaceOnUse">
          <circle cx="4" cy="5" r="1" style={{ fill: 'var(--ns-ink)' }} />
          <circle cx="17" cy="9" r=".8" style={{ fill: 'var(--ns-ink)' }} />
          <circle cx="9" cy="19" r="1.1" style={{ fill: 'var(--ns-ink)' }} />
          <circle cx="22" cy="22" r=".8" style={{ fill: 'var(--ns-ink)' }} />
          <path d="M13 3l2 3.4h-4z M3 14l2 3.4H1z M20 15l1.8 3h-3.6z" strokeWidth=".9" fill="none" style={ink} />
        </pattern>
        <pattern id="h-murum" width="14" height="10" patternUnits="userSpaceOnUse">
          <line x1="1" y1="9" x2="6" y2="2" strokeWidth="1" style={ink} />
          <line x1="8" y1="9" x2="13" y2="3" strokeWidth="1" style={ink} />
          <circle cx="7" cy="7" r=".9" style={{ fill: 'var(--ns-ink)' }} />
          <circle cx="12" cy="8" r=".7" style={{ fill: 'var(--ns-ink)' }} />
        </pattern>
        <pattern id="h-rock" width="34" height="26" patternUnits="userSpaceOnUse">
          <path d="M0 6l12-4 14 3 8-3M0 18l10-5 16 4 8-2M12 2l-2 11M26 5l-4 12M10 13l2 12M22 17l4 9" strokeWidth="1" fill="none" style={ink} />
        </pattern>
      </defs>
    </svg>
  )
}
