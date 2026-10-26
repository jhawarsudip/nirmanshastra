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
import Pricing from '@/components/v2/sections/Pricing'
import Testimonials from '@/components/v2/sections/Testimonials'
import FreeCalcs from '@/components/v2/sections/FreeCalcs'
import Toolkits from '@/components/v2/sections/Toolkits'
import Dealers from '@/components/v2/sections/Dealers'
import Footer from '@/components/v2/sections/Footer'

// Shown only when JavaScript is off: reveal states default to hidden so the page can animate in.
const NOSCRIPT_CSS =
  '.ns-rise{opacity:1!important;transform:none!important}.ns-wipe{clip-path:none!important}.ns-draw{stroke-dashoffset:0!important}.ns-bar{opacity:1!important}.ns-ex__layer{opacity:1!important}.ns-tie,.ns-bk{opacity:1!important}.ns-plumb{display:none!important}'

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const loc = locale === 'hi' ? 'hi' : 'en'

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
