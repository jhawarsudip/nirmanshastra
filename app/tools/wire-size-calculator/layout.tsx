import type { Metadata } from 'next'

const title = 'Wire Size Calculator — Correct Cable Gauge by Circuit | IS 732:2019'
const description =
  'Free wire size calculator. Pick the circuit — lighting & fans, power sockets, AC/geyser, sub-panel feed, or main incomer — and get the minimum copper conductor cross-section required by IS 732:2019 Cl 6.2: 1.5, 2.5, 4.0, 6.0 or 10.0 sqmm. Categorical, code-based sizing (not a guess-the-watts calculation), shared with NirmanShastra’s ElectroPro tool. Permanently free, no login.'
const url = '/tools/wire-size-calculator'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: url },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'NirmanShastra',
    url,
    title: 'Wire Size Calculator — Correct Cable Gauge by Circuit Type',
    description:
      'Choose a household circuit type and get the IS 732:2019 Cl 6.2 minimum wire size — 1.5 / 2.5 / 4.0 / 6.0 / 10.0 sqmm. Free, no login. Same locked table as ElectroPro.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NirmanShastra — Wire Size Calculator (IS 732:2019 Cl 6.2)',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wire Size Calculator — Cable Gauge by Circuit | IS 732:2019',
    description:
      'Lighting 1.5 · sockets 2.5 · AC/geyser 4.0 · sub-panel 6.0 · main incomer 10.0 sqmm. Code-minimum wire sizes, free and no login.',
    images: ['/og-image.png'],
  },
}

export default function WireSizeCalculatorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
