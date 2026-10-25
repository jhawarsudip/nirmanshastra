'use client'

import { useLocale } from 'next-intl'
import Link from 'next/link'
import { useReveal } from '@/lib/v2/store'
import { Arrow } from '../Icons'
import '@/styles/v2/plain.css'
import Pour from '../Pour'

const COPY = {
  en: {
    eye: 'Free, no sign-up', h: 'Quick answers, no account needed',
    p: 'Small calculators that answer one question each. Type your numbers and get your answer.',
    items: [
      { href: '/tools/brick-calculator', q: 'How many bricks do I need?', a: 'Enter the size of your wall and get the brick count, with a small allowance for breakage.' },
      { href: '/tools/concrete-mix-ratio-calculator', q: 'How much cement, sand and stone?', a: 'Choose the concrete grade and the volume, and see how much of each to order.' },
      { href: '/tools/water-tank-size-calculator', q: 'What size water tank do I need?', a: 'Based on how much water your household uses in a day.' },
      { href: '/tools/wire-size-calculator', q: 'Which wire for which circuit?', a: 'Pick the circuit or appliance and see the wire size it needs.' },
      { href: '/tools/paint-tile-calculator', q: 'How much paint and how many tiles?', a: 'Enter the area and the finish, and get the paint, putty and primer, or the tiles, grout and fixing, with an allowance for waste.' },
    ],
  },
  hi: {
    eye: 'मुफ़्त, बिना साइन-अप', h: 'झटपट जवाब, खाता बनाने की ज़रूरत नहीं',
    p: 'छोटे कैलकुलेटर, हर एक एक सवाल का जवाब देता है। अपनी संख्याएँ डालिए और जवाब पाइए।',
    items: [
      { href: '/tools/brick-calculator', q: 'मुझे कितनी ईंटें चाहिए?', a: 'अपनी दीवार का आकार डालिए और टूट-फूट की थोड़ी छूट के साथ ईंटों की गिनती पाइए।' },
      { href: '/tools/concrete-mix-ratio-calculator', q: 'कितना सीमेंट, रेत और गिट्टी?', a: 'कंक्रीट का ग्रेड और आयतन चुनिए, और देखिए हर चीज़ कितनी मँगानी है।' },
      { href: '/tools/water-tank-size-calculator', q: 'मुझे कितने आकार की पानी की टंकी चाहिए?', a: 'आपके घर में एक दिन में कितना पानी लगता है, उसके हिसाब से।' },
      { href: '/tools/wire-size-calculator', q: 'किस सर्किट के लिए कौन-सा तार?', a: 'सर्किट या उपकरण चुनिए और देखिए कितने साइज़ का तार चाहिए।' },
      { href: '/tools/paint-tile-calculator', q: 'कितना पेंट और कितनी टाइलें लगेंगी?', a: 'क्षेत्रफल और फ़िनिश डालिए, और पेंट, पुट्टी और प्राइमर, या टाइलें, ग्राउट और फ़िक्सिंग की मात्रा पाइए, बर्बादी की छूट के साथ।' },
    ],
  },
} as const

export default function FreeCalcs() {
  const loc = useLocale() === 'hi' ? 'hi' : 'en'
  const c = COPY[loc]
  const { ref } = useReveal<HTMLDivElement>()
  return (
    <section className="ns-section ns-fc" id="calculators" aria-labelledby="ns-fc-h">
      <div className="ns-wrap" ref={ref}>
        <p className="ns-eyebrow ns-rise">{c.eye}</p>
        <h2 className="ns-h2 ns-rise" id="ns-fc-h" style={{ ['--d' as string]: '.05s' }}>{c.h}</h2>
        <p className="ns-lede ns-rise" style={{ ['--d' as string]: '.12s' }}>{c.p}</p>
        <ul className="ns-fc__grid">
          {c.items.map((it, i) => (
            <li key={it.href} className="ns-rise" style={{ ['--d' as string]: `${i * 0.06 + 0.1}s` }}>
              <Link href={it.href} className="ns-plate ns-fc__card" data-snap>
                <h3>{it.q}</h3>
                <p>{it.a}</p>
                <span className="ns-fc__go">{loc === 'hi' ? 'खोलें' : 'Open'}<Arrow /></span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <Pour tone="bg" v={8} />
    </section>
  )
}
