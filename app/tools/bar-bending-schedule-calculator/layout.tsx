import type { Metadata } from 'next'

const title = 'Bar Bending Schedule Calculator — Free Cutting Length Tool | IS 2502'
const description =
  'Free bar bending schedule calculator. Get exact rebar cutting length and unit weight for 13 standard shapes — stirrups, cranked bars, hooks — with bend deductions and hook allowances per IS 2502. Permanently free, no login.'
const url = '/tools/bar-bending-schedule-calculator'

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
        alt: 'NirmanShastra — Bar Bending Schedule Calculator (IS 2502)',
      },
    ],
  },
}

export default function BarBendingScheduleLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
