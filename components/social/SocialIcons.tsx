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

export function WhatsAppIcon(props: P) {
  return (
    <svg {...common} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" {...props}>
      <path d="M12 3.1a8.9 8.9 0 0 0-7.7 13.4L3 21l4.6-1.2A8.9 8.9 0 1 0 12 3.1z" />
      <path
        d="M9.2 7.9c.2-.4.5-.4.8-.4h.4c.2 0 .4.1.5.4l.7 1.7c.1.2 0 .4-.1.6l-.5.6c-.1.1-.1.3 0 .4.6 1.1 1.5 2 2.7 2.5.2.1.4 0 .5-.1l.6-.7c.2-.2.4-.2.6-.1l1.6.8c.2.1.3.3.3.5 0 .9-.7 1.8-1.7 2-1 .2-2.5 0-4.3-1.4-1.9-1.4-2.8-3-3-4.3-.1-.8.2-1.6.9-2.2z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  )
}
