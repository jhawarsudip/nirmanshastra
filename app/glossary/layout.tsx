import type { Metadata } from 'next'
import InnerShell from '@/components/v2/inner/InnerShell'
import { GLOSSARY_TERM_COUNT } from '@/lib/seo/glossary'

// The root layout's title template appends " | NirmanShastra", so the brand is not repeated in `title`.
const title = `Construction Glossary: ${GLOSSARY_TERM_COUNT} Terms from BOQ to TMT`
const description =
  'Plain-English definitions of BOQ, M20, IS 456, TMT, BBS, RA bill, retention, LPCD, RCCB, earned value and more, with the IS code and the number each one uses.'
const url = '/glossary'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: url },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'NirmanShastra',
    url,
    title: `${title} | NirmanShastra`,
    description,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'NirmanShastra construction glossary' }],
  },
  twitter: { card: 'summary_large_image', title: `${title} | NirmanShastra`, description },
}

export default function GlossaryLayout({ children }: { children: React.ReactNode }) {
  return <InnerShell>{children}</InnerShell>
}
