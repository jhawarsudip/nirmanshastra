// Small friendly icons for v3. Rounded caps, 2px strokes, drawn for this site (no stock pack).
import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement>
const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

/** Compact NirmanShastra mark (compass ring + column + north arrow). Ink = currentColor, accent = brand rust. */
export function BrandMark(props: P) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" {...props}>
      <path d="M37.3 7.06A25.5 25.5 0 1 1 26.7 7.06" stroke="currentColor" strokeWidth="3.2" />
      <path d="M3.5 32H10.5M53.5 32H60.5M32 53.5V60.5" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M32 1.5L36.8 13 32 10.2 27.2 13Z" fill="var(--c-rust)" />
      <rect x="17.5" y="17" width="29" height="5.5" fill="currentColor" />
      <rect x="24.5" y="22.5" width="15" height="25" stroke="currentColor" strokeWidth="2.4" />
      <path d="M29.3 24V47M34.7 24V47" stroke="var(--c-rust)" strokeWidth="1.7" />
      <rect x="20.5" y="47.5" width="23" height="4.5" fill="currentColor" />
    </svg>
  )
}

export function Arrow(props: P) {
  return (
    <svg viewBox="0 0 24 24" {...base} aria-hidden="true" {...props}>
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  )
}

export function Caret(props: P) {
  return (
    <svg viewBox="0 0 12 12" {...base} strokeWidth={2.2} aria-hidden="true" {...props}>
      <path d="M2.5 4.5L6 8l3.5-3.5" />
    </svg>
  )
}

export function Burger(props: P) {
  return (
    <svg viewBox="0 0 24 24" {...base} strokeWidth={2.4} aria-hidden="true" {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}

export function Cross(props: P) {
  return (
    <svg viewBox="0 0 24 24" {...base} strokeWidth={2.4} aria-hidden="true" {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

export function Sun(props: P) {
  return (
    <svg viewBox="0 0 24 24" {...base} aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5.3 5.3L7 7M17 17l1.7 1.7M5.3 18.7L7 17M17 7l1.7-1.7" />
    </svg>
  )
}

export function Moon(props: P) {
  return (
    <svg viewBox="0 0 24 24" {...base} aria-hidden="true" {...props}>
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />
    </svg>
  )
}

export function Wind({ calm, ...props }: P & { calm?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" {...base} aria-hidden="true" {...props}>
      {calm ? <path d="M3 9h11a3 3 0 1 0-3-3M3 15h15a3 3 0 1 1-3 3M3 12h6" opacity=".35" /> : <path d="M3 9h11a3 3 0 1 0-3-3M3 15h15a3 3 0 1 1-3 3M3 12h6" />}
      {calm ? <path d="M4 20L20 4" /> : null}
    </svg>
  )
}

export function Check(props: P) {
  return (
    <svg viewBox="0 0 20 20" {...base} strokeWidth={2.4} aria-hidden="true" {...props}>
      <path d="M4 10.5l4 4 8-9" />
    </svg>
  )
}

/** Hand-drawn curly arrow used next to margin notes. */
export function Squiggle(props: P) {
  return (
    <svg viewBox="0 0 60 40" {...base} strokeWidth={2.2} aria-hidden="true" {...props}>
      <path d="M4 8c14-8 30-6 36 8s2 18-10 16M30 28l1 8 8-4" />
    </svg>
  )
}

/* door icons: each one is a small scene */
export function CementBag(props: P) {
  return (
    <svg viewBox="0 0 48 48" {...base} aria-hidden="true" {...props}>
      <path d="M10 14c0-3 3-5 6-5h16c3 0 6 2 6 5l1 24c0 2-2 4-4 4H13c-2 0-4-2-4-4z" fill="currentColor" fillOpacity=".12" />
      <path d="M14 9c2 2 5 2 10 2s8 0 10-2M15 22h18M15 28h18" />
    </svg>
  )
}

export function Paper(props: P) {
  return (
    <svg viewBox="0 0 48 48" {...base} aria-hidden="true" {...props}>
      <path d="M12 6h18l8 8v28H12z" fill="currentColor" fillOpacity=".12" />
      <path d="M30 6v8h8M18 22h14M18 28h14M18 34h8" />
    </svg>
  )
}

export function Compass(props: P) {
  return (
    <svg viewBox="0 0 48 48" {...base} aria-hidden="true" {...props}>
      <circle cx="24" cy="24" r="16" fill="currentColor" fillOpacity=".12" />
      <path d="M24 8v4M24 36v4M8 24h4M36 24h4M30 18l-4 8-8 4 4-8z" />
    </svg>
  )
}

export function Rupee(props: P) {
  return (
    <svg viewBox="0 0 24 24" {...base} aria-hidden="true" {...props}>
      <path d="M7 5h10M7 10h10M7 5c6 0 7 3 5 6s-5 3-5 3l7 6" />
    </svg>
  )
}

export function Shield(props: P) {
  return (
    <svg viewBox="0 0 24 24" {...base} aria-hidden="true" {...props}>
      <path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z" />
      <path d="M9 12l2.2 2.2L15.5 10" />
    </svg>
  )
}

export function Globe(props: P) {
  return (
    <svg viewBox="0 0 24 24" {...base} aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
    </svg>
  )
}

export function Heart(props: P) {
  return (
    <svg viewBox="0 0 24 24" {...base} aria-hidden="true" {...props}>
      <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.4A4 4 0 0 1 19 10c0 5.600-7 10-7 10z" />
    </svg>
  )
}
