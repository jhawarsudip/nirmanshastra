import type { Metadata } from 'next'

const title =
  'Bar Bending Schedule Excel Template — India Rebar Cutting Length Calculator (BBS) | IS 2502'
const description =
  'A 12-sheet Excel bar bending schedule template for India — shape library, cutting-length calculator with bend deductions and hook allowances per IS 2502, lap and development lengths, cutting optimiser and steel order note. ₹2,099, instant download.'
const url = '/site-templates/bar-bending-schedule'

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
        alt: 'NirmanShastra — Bar Bending Schedule Excel Template (India Edition, IS 2502)',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
}

export default function BarBendingScheduleLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
