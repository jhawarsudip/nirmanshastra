import type { Metadata } from 'next'
import JsonLd from '@/components/seo/JsonLd'
import InnerShell from '@/components/v2/inner/InnerShell'
import { breadcrumbSchema } from '@/lib/seo/schema'
import { setRequestLocale } from 'next-intl/server'
import { localizeMetadata, type HiMeta } from '@/lib/i18n/meta'
import { asLocale, localizePath, type LocaleParams } from '@/lib/i18n/paths'

// The root layout's title template appends " | NirmanShastra", so the brand is not repeated in `title`.
const title = "Check a Contractor's Quantities: Concrete, Steel, Cement, Shuttering"
const description =
  "Before you compare prices, compare what each price counts. Ask for four quantities, then see whether each is close to, common for, or above what the Indian Standards need for your RCC frame. Quantities only."
const url = '/compare-quote'

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
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: "NirmanShastra: check a contractor's quantities against the Indian Standards" }],
  },
  twitter: { card: 'summary_large_image', title: `${title} | NirmanShastra`, description },
}

// Hindi title, description and share-image text. They say what the English says: four quantities, set against what the Indian Standards need.
const HI: HiMeta = {
  title: 'ठेकेदार की मात्राएँ जाँचिए: कंक्रीट, स्टील, सीमेंट, शटरिंग',
  description:
    'दाम की तुलना करने से पहले यह देखिए कि हर दाम में क्या गिना गया है। चार मात्राएँ माँगिए, फिर देखिए कि हर एक भारतीय मानकों के हिसाब से आपके RCC ढाँचे को जितना चाहिए, उसके क़रीब है, आम दायरे में है या उससे ऊपर है। सिर्फ़ मात्राएँ।',
  imageAlt: 'NirmanShastra: ठेकेदार की मात्राओं को भारतीय मानकों के सामने रखकर जाँचिए',
}

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params
  return localizeMetadata(metadata, asLocale(locale), '/compare-quote', HI)
}

export default async function CompareQuoteLayout({ children, params }: { children: React.ReactNode } & LocaleParams) {
  const { locale } = await params
  setRequestLocale(locale)
  const hi = asLocale(locale) === 'hi'
  return (
    <InnerShell locale={asLocale(locale)}>
      <JsonLd
        data={[
          breadcrumbSchema(
            hi
              ? [{ name: 'होम', path: localizePath('/', 'hi') }, { name: 'ठेकेदार की मात्राएँ जाँचिए', path: localizePath(url, 'hi') }]
              : [{ name: 'Home', path: '/' }, { name: "Check a contractor's quantities", path: url }],
          ),
        ]}
      />
      {children}
    </InnerShell>
  )
}
