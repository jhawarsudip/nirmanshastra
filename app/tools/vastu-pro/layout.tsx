import type { Metadata } from 'next'

const title = "VastuPro — Free Vastu Compliance Checker | 33-Room Analysis"
const description = "Free online Vastu analysis for your home. Upload floor plan, mark 33 rooms, get zone-by-zone compliance score and free PDF report. No payment needed."
const url = '/tools/vastu-pro'

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

export default function VastuProLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
