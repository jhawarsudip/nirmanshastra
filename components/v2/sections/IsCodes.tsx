'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { useReveal } from '@/lib/v2/store'
import { IS_CODES } from '@/lib/v2/content'
import { Arrow } from '../Icons'
import Calc from '../Calc'
import '@/styles/v2/closing.css'

const N = IS_CODES.length

const COPY = {
  en: {
    eye: 'Built on Indian Standards', h: 'Every number follows the official rulebook',
    p: 'The quantities in your report are not guesses. They are worked out from the Indian Standards listed here, published by the Bureau of Indian Standards, the same rules your engineer works to. You never have to read them. They are here if you want to check.',
    show: `Show the ${N} standards`, hide: 'Hide the standards', title: `The ${N} standards behind the reports`,
    stamped: 'Ticked', all: 'See every clause',
    note: 'Press a standard to tick it off as you check it. A few of the values the free calculators use: M20 concrete is a 1 : 1.5 : 3 mix (not 1 : 2 : 4). The dry volume factor for concrete is 1.54, and for mortar 1.1.',
  },
  hi: {
    eye: 'भारतीय मानकों पर आधारित', h: 'हर संख्या आधिकारिक नियम-पुस्तिका पर चलती है',
    p: 'आपकी रिपोर्ट की मात्राएँ अंदाज़े नहीं हैं। वे यहाँ दिए गए भारतीय मानकों से निकाली जाती हैं, जिन्हें ब्यूरो ऑफ़ इंडियन स्टैंडर्ड्स ने प्रकाशित किया है, वही नियम जिन पर आपका इंजीनियर चलता है। आपको उन्हें पढ़ने की ज़रूरत नहीं। जाँचना चाहें तो वे यहाँ हैं।',
    show: `${N} मानक दिखाइए`, hide: 'मानक छिपाइए', title: `रिपोर्टों के पीछे के ${N} मानक`,
    stamped: 'टिक किए', all: 'हर क्लॉज़ देखें',
    note: 'किसी मानक को दबाकर जाँचते हुए टिक कीजिए। मुफ़्त कैलकुलेटरों में इस्तेमाल होने वाले कुछ मान: M20 कंक्रीट का मिक्स 1 : 1.5 : 3 है (1 : 2 : 4 नहीं)। कंक्रीट का ड्राई वॉल्यूम फ़ैक्टर 1.54 और मसाले का 1.1 है।',
  },
} as const

/** The standards live behind a button; press one to tick it. */
export default function IsCodes() {
  const loc = useLocale() === 'hi' ? 'hi' : 'en'
  const c = COPY[loc]
  const [on, setOn] = useState<Set<string>>(new Set())
  const { ref } = useReveal<HTMLDivElement>()
  const flip = (k: string) => setOn(s => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n })

  return (
    <section className="ns-section ns-stage ns-stage--drip ns-isc" id="is-codes" aria-labelledby="ns-isc-h">
      <div className="ns-wrap" ref={ref}>
        <p className="ns-eyebrow ns-rise">{c.eye}</p>
        <h2 className="ns-h2 ns-rise" id="ns-isc-h" style={{ ['--d' as string]: '.05s' }}>{c.h}</h2>
        <p className="ns-lede ns-rise" style={{ ['--d' as string]: '.12s' }}>{c.p}</p>
        <Calc
          loc={loc}
          className="ns-isc__calc"
          labels={{ show: { en: c.show, hi: COPY.hi.show }, hide: { en: COPY.en.hide, hi: COPY.hi.hide } }}
          title={{ en: COPY.en.title, hi: COPY.hi.title }}
          note={c.note}
        >
          <ul className="ns-isc__grid">
            {IS_CODES.map(k => (
              <li key={k}>
                <button type="button" className="ns-isc__chip ns-mono" aria-pressed={on.has(k)} onClick={() => flip(k)}>{k}</button>
              </li>
            ))}
          </ul>
          <div className="ns-isc__foot">
            <span className="ns-mono ns-isc__count" aria-live="polite">{c.stamped} · {on.size} / {IS_CODES.length}</span>
            <Link href="/is-codes-used" className="ns-link ns-isc__all">{c.all} <Arrow /></Link>
          </div>
        </Calc>
      </div>
    </section>
  )
}
