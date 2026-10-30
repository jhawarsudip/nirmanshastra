import type { Metadata } from 'next'
import InnerShell from '@/components/v2/inner/InnerShell'
import JsonLd from '@/components/seo/JsonLd'
import { calcJsonLd } from '@/lib/i18n/labels/calc-jsonld'
import { setRequestLocale } from 'next-intl/server'
import { localizeMetadata, type HiMeta } from '@/lib/i18n/meta'
import { asLocale, type LocaleParams } from '@/lib/i18n/paths'

// The root layout's title template appends " | NirmanShastra", so the brand is not repeated in `title`.
const title = 'Daily-Wage PF and ESI Calculator: net pay for a site worker'
const description =
  'Free daily-wage PF and ESI calculator for a construction site. Enter the daily rate and the days worked (23.5 is fine), with overtime or an advance if any, to see the worker’s PF, ESI and net pay. Muster-roll style, not monthly payroll. No sign-in.'
const url = '/tools/daily-wage-pf-esi-calculator'

const metadata: Metadata = {
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
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'NirmanShastra Daily-Wage PF and ESI Calculator' }],
  },
  twitter: { card: 'summary_large_image', title: `${title} | NirmanShastra`, description },
}

// Hindi title, description and share-image text. The brand name, IS numbers and units stay in Latin letters.
const HI: HiMeta = {
  title: 'दैनिक मज़दूरी PF और ESI कैलकुलेटर: साइट के मज़दूर की नेट मज़दूरी',
  description:
    'निर्माण साइट के लिए निःशुल्क दैनिक मज़दूरी PF और ESI कैलकुलेटर। दैनिक दर और काम के दिन (23.5 भी चलेगा) डालिए, चाहें तो ओवरटाइम या एडवांस भी, और मज़दूर का PF, ESI और नेट मज़दूरी देखिए। मस्टर-रोल के तरीक़े का हिसाब, मासिक पेरोल नहीं। बिना साइन-इन।',
  imageAlt: 'NirmanShastra दैनिक मज़दूरी PF और ESI कैलकुलेटर',
}

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params
  return localizeMetadata(metadata, asLocale(locale), '/tools/daily-wage-pf-esi-calculator', HI)
}

export default async function DailyWagePfEsiCalculatorLayout({ children, params }: { children: React.ReactNode } & LocaleParams) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <InnerShell locale={asLocale(locale)}>
      <JsonLd data={calcJsonLd('/tools/daily-wage-pf-esi-calculator', locale)} />
      {children}
    </InnerShell>
  )
}
