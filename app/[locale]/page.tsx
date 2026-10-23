import Header from '@/components/v3/Header'
import RevealObserver from '@/components/v3/RevealObserver'
import Hero from '@/components/v3/sections/Hero'
import Doors from '@/components/v3/sections/Doors'
import TryIt from '@/components/v3/sections/TryIt'
import Story from '@/components/v3/sections/Story'
import Quote from '@/components/v3/sections/Quote'
import Steps from '@/components/v3/sections/Steps'
import Pricing from '@/components/v3/sections/Pricing'
import Pros from '@/components/v3/sections/Pros'
import Trust from '@/components/v3/sections/Trust'
import Footer from '@/components/v3/sections/Footer'
// Server-side import: the default rates reach the page as plain numbers, so the engine stays out of the client bundle.
import { DEFAULT_RATES } from '@/app/tools/structopro/structopro-engine'

// Shown only when JavaScript is off: the house is drawn finished instead of waiting for its build steps.
const NOSCRIPT_CSS = '.s3-house .hs{opacity:1!important;clip-path:none!important;transform:none!important}'

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const loc = locale === 'hi' ? 'hi' : 'en'

  return (
    <div className="ns3">
      <noscript><style>{NOSCRIPT_CSS}</style></noscript>
      <Header locale={loc} />
      <main id="main">
        <Hero loc={loc} />
        <Doors loc={loc} />
        <TryIt loc={loc} rates={{ cement: DEFAULT_RATES.cement, steel: DEFAULT_RATES.steel }} />
        <Story loc={loc} />
        <Quote loc={loc} />
        <Steps loc={loc} />
        <Pricing loc={loc} />
        <Pros loc={loc} />
        <Trust loc={loc} />
      </main>
      <Footer loc={loc} />
      <RevealObserver />
    </div>
  )
}
