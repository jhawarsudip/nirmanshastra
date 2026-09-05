import type { Metadata } from 'next'

const title =
  'Construction Project Controls Excel Template — EVM Dashboard & Delay Register | India Edition'
const description =
  'A 17-sheet Excel project controls workbook for Indian construction — baseline plan, Gantt, value-weighted S-curve and earned value, cash flow, plus a delay and EOT register with contract classification and notice-deadline tracking. ₹2,299, instant download.'
const url = '/site-templates/planning-progress'

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
        alt: 'NirmanShastra — Construction Project Controls Excel Template (EVM & Delay Register, India Edition)',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
}

export default function PlanningProgressLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
