import type { Metadata } from 'next'

const title = "FAQ — Construction Cost Estimator | NirmanShastra"
const description = "Frequently asked questions about NirmanShastra's IS-code construction cost tools — report accuracy, payment process, material rates, and how calculations are done."
const url = '/faq'

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
        alt: 'NirmanShastra — India’s IS-Code Construction Cost Estimator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
}

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
