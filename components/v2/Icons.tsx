// Hand-drawn icons for the homepage: 1.7px stroke, round caps, no stock icon pack.
import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement>
const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

// NirmanShastra's own mark (compass ring + RCC column + north arrow), as supplied: transparent, no background.
// Two colourways: dark ink on light pages, cream on dark pages. The outline flips, the gold accents stay.
// `on="auto"` follows the day/night switch; `on="dark"` is for bands that are always dark (the footer stage).
export function BrandMark({ className, on = 'auto', size = 160 }: { className?: string; on?: 'auto' | 'dark' | 'light'; size?: 160 | 320 | 640 }) {
  const w = size
  const h = Math.round((size * 900) / 873)
  const light = size === 640 ? '/brand/real/mark-light-fine-640.webp' : `/brand/real/mark-light-${size}.webp`
  const dark = size === 640 ? '/brand/real/mark-dark-fine-640.webp' : `/brand/real/mark-dark-${size}.webp`
  /* eslint-disable @next/next/no-img-element */
  return (
    <span className={`ns-bm${className ? ` ${className}` : ''}`} data-on={on} aria-hidden="true">
      {on !== 'dark' && <img className="ns-bm__img ns-bm__img--light" src={light} width={w} height={h} alt="" decoding="async" />}
      {on !== 'light' && <img className="ns-bm__img ns-bm__img--dark" src={dark} width={w} height={h} alt="" decoding="async" />}
    </span>
  )
  /* eslint-enable @next/next/no-img-element */
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
