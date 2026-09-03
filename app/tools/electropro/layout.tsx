import type { Metadata } from 'next'

const title = "ElectricalPro — House Wiring Cost Estimator | IS 732:2019"
const description = "Calculate wire lengths, DB panel circuits, and MCB costs using IS 732:2019. Know exact electrical quantities before your contractor quotes. ₹499/report."
const url = '/tools/electropro'

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

export default function ElectroProLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
