import type { SVGProps } from 'react'

/* Plain one-colour glyphs for the four contact links. They take the colour of the text around them (currentColor). */
type P = SVGProps<SVGSVGElement>
const common = { viewBox: '0 0 24 24', width: 22, height: 22, 'aria-hidden': true, focusable: false } as const

export function InstagramIcon(props: P) {
  return (
    <svg {...common} fill="none" stroke="currentColor" strokeWidth={1.8} {...props}>
      <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5" />
      <circle cx="12" cy="12" r="4.1" />
      <circle cx="17.2" cy="6.8" r="1.05" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function YouTubeIcon(props: P) {
  return (
    <svg {...common} fill="none" stroke="currentColor" strokeWidth={1.8} {...props}>
      <rect x="2.6" y="5.4" width="18.8" height="13.2" rx="3.6" />
      <path d="M10 9.1v5.8l5-2.9z" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function FacebookIcon(props: P) {
  return (
    <svg {...common} fill="currentColor" {...props}>
      <path d="M13.6 21.2v-8.1h2.7l.5-3.3h-3.2V7.7c0-.9.4-1.6 1.7-1.6h1.6V3.2c-.3 0-1.3-.2-2.5-.2-2.5 0-4.1 1.5-4.1 4.2v2.6H7.6v3.3h2.7v8.1z" />
    </svg>
  )
}
