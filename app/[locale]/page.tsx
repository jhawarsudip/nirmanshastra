import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { PRICE } from '@/lib/tool-pricing'
import { asLocale, type LocaleParams } from '@/lib/i18n/paths'
import Chrome from '@/components/v2/Chrome'
import PlumbLoad from '@/components/v2/PlumbLoad'
import Hero from '@/components/v2/sections/Hero'
import Tape from '@/components/v2/sections/Tape'
import Problems from '@/components/v2/sections/Problems'
import Exploded from '@/components/v2/sections/Exploded'
import Disciplines from '@/components/v2/sections/Disciplines'
import Lab from '@/components/v2/sections/Lab'
import QuoteCheck from '@/components/v2/sections/QuoteCheck'
import HowItWorks from '@/components/v2/sections/HowItWorks'
import Compare from '@/components/v2/sections/Compare'
import IsCodes from '@/components/v2/sections/IsCodes'
import FounderBand from '@/components/v2/sections/Founder'
import Pricing from '@/components/v2/sections/Pricing'
import Testimonials from '@/components/v2/sections/Testimonials'
import FreeCalcs from '@/components/v2/sections/FreeCalcs'
import Toolkits from '@/components/v2/sections/Toolkits'
import Dealers from '@/components/v2/sections/Dealers'
import Footer from '@/components/v2/sections/Footer'

// Shown only when JavaScript is off: reveal states default to hidden so the page can animate in.
const NOSCRIPT_CSS =
  '.ns-rise{opacity:1!important;transform:none!important}.ns-wipe{clip-path:none!important}.ns-draw{stroke-dashoffset:0!important}.ns-bar{opacity:1!important}.ns-ex__layer{opacity:1!important}.ns-tie,.ns-bk{opacity:1!important}.ns-plumb{display:none!important}'

// Metadata lives on the page, not the locale layout: a layout's metadata is inherited by every page below it,
// and the other pages must not inherit the home page's canonical URL.
// Home page metadata per locale. English inherits the root layout's title and
// description; Hindi gets its own. Both declare the hreflang pair (en-IN <-> hi-IN
// plus x-default) so search and AI engines can match the two versions.
const HI_TITLE = 'NirmanShastra — IS कोड से घर की सामग्री की मात्रा का हिसाब'
const HI_DESCRIPTION =
  `अपने घर के लिए कंक्रीट, स्टील, सीमेंट, ईंट, रेत, तार और पाइप की मात्रा IS कोड के अनुसार निकालें, ऑर्डर देने से पहले। ${PRICE.from} से शुरू होने वाली मात्रा रिपोर्ट और मुफ़्त कैलकुलेटर, हिंदी और अंग्रेज़ी में।`

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params
  const languages = { 'en-IN': '/', 'hi-IN': '/hi', 'x-default': '/' }

  if (locale !== 'hi') {
    return { alternates: { canonical: '/', languages } }
  }

  return {
    // absolute: do not let the root template append the brand a second time
    title: { absolute: HI_TITLE },
    description: HI_DESCRIPTION,
    alternates: { canonical: '/hi', languages },
    openGraph: {
      type: 'website',
      locale: 'hi_IN',
      alternateLocale: ['en_IN'],
      siteName: 'NirmanShastra',
      url: '/hi',
      title: HI_TITLE,
      description: HI_DESCRIPTION,
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: 'NirmanShastra — IS कोड पर आधारित सामग्री की मात्रा का हिसाब',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: HI_TITLE,
      description: HI_DESCRIPTION,
    },
  }
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const loc = asLocale(locale)

  return (
    <div className="ns2">
      <noscript><style>{NOSCRIPT_CSS}</style></noscript>
      <PlumbLoad />
      <Chrome locale={loc} />
      <main id="main">
        <Hero loc={loc} />
        <Tape loc={loc} />
        <Problems loc={loc} />
        <Exploded />
        <Disciplines />
        <Lab />
        <QuoteCheck />
        <HowItWorks />
        <Compare />
        <IsCodes />
        <FounderBand loc={loc} />
        <Pricing />
        <Testimonials loc={loc} />
        <FreeCalcs />
        <Toolkits />
        <Dealers />
      </main>
      <Footer />
    </div>
  )
}
