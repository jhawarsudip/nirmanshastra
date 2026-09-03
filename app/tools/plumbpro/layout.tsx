import type { Metadata } from 'next'

const title = "PlumbingPro — Plumbing Cost Calculator | IS 1172:1993"
const description = "Calculate pipe lengths, tank sizes, pump HP, and fixture costs per IS 1172:1993. Get itemised plumbing BOQ for your home construction. ₹499/report."
const url = '/tools/plumbpro'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: url },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'NirmanShastra',
    url,
    title,
    description,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NirmanShastra — India\u2019s IS-Code Construction Cost Estimator',
      },
    ],
  },
}

export default function PlumbProLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
