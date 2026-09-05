import type { Metadata } from 'next'

const title =
  'Construction Labour Payroll Excel Template — India Contractor Compliance Tracker | Four Labour Codes'
const description =
  'A 16-sheet Excel labour payroll and compliance workbook for Indian construction — muster roll, wage register, PF/ESI and minimum-wage checks, wage slips and subcontractor compliance holds under India’s four Labour Codes (in force since Nov 2025). ₹1,999, instant download.'
const url = '/site-templates/labour-compliance'

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
        alt: 'NirmanShastra — Construction Labour Payroll & Compliance Excel Template (India Edition)',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
}

export default function LabourComplianceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
