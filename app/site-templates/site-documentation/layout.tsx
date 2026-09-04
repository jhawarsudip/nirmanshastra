import type { Metadata } from 'next'

const title =
  'Construction Site Documentation Pack — RFI, Procurement & Test Registers | India Edition'
const description =
  'A 14-sheet Excel site documentation pack for Indian projects — drawing register, RFI register, NCR and test registers, procurement log, daily site log and snag list. The contemporaneous record that holds up in a dispute. ₹1,499, instant download.'
const url = '/site-templates/site-documentation'

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
        alt: 'NirmanShastra — Construction Site Documentation Pack (India Edition)',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
}

export default function SiteDocumentationLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
