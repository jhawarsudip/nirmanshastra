import type { Metadata } from 'next'

const title = "InteriorPro — Home Interior Cost Estimator | Flooring, Kitchen & Paint"
const description = "Calculate flooring, kitchen, false ceiling, and paint costs across 4 quality grades — Basic to Luxury. Get exact interior BOQ for your home construction. ₹899/report."
const url = '/tools/interiorpro'

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
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
}

export default function InteriorProLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
