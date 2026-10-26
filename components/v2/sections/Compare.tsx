'use client'

import { useLocale } from 'next-intl'
import { useReveal } from '@/lib/v2/store'
import { IS_CODES } from '@/lib/v2/content'
import { PRICE } from '@/lib/tool-pricing'
import '@/styles/v2/closing.css'
import Pour from '../Pour'

const COPY = {
  en: {
    eye: 'Free calculators vs NirmanShastra', h: 'How we compare with free calculators',
    intro: 'A free calculator is fine for a rough idea. Here is what you get when you want quantities you can take to your contractor.',
    colF: 'What you get', colFree: 'A typical free calculator', colNS: `NirmanShastra (from ${PRICE.from} a report)`,
    foot: 'The arithmetic is the same everywhere. What differs is how much of the house it looks at, and whether it shows its working.',
    rows: [
      ['How the quantities are worked out', 'A rough rate per square foot', 'The frame is laid out and sized to the Indian Standards, member by member, on our servers'],
      ['Quantities of material', 'One vague figure', 'Exact: bags of cement, kilos of steel by bar size, number of bricks, metres of wire and pipe'],
      ['Built on Indian Standards', 'Usually not mentioned', `${IS_CODES.length} Indian Standards, shown whenever you want to check`],
      ['How sure the figure is', 'One exact-looking number', 'A most-likely figure with an honest range, and a list of what is not counted'],
      ['Checking your contractor', 'Not possible', 'Put the contractor’s quantities next to ours, line by line'],
      ['Prices, rates and labour', 'City averages that go out of date', 'None. Quantities only, so nothing goes stale and nothing is guessed about your local market'],
      ['The report', 'A number on the screen', 'A PDF with the quantity list, the standards used, and what is and is not counted'],
      ['Your details', 'Policies vary', 'Never sold. Your project data is yours.'],
    ],
  },
  hi: {
    eye: 'मुफ़्त कैलकुलेटर बनाम NirmanShastra', h: 'मुफ़्त कैलकुलेटर से हम कैसे अलग हैं',
    intro: 'मोटा अंदाज़ा लेने के लिए मुफ़्त कैलकुलेटर ठीक है। पर जब आपको ऐसी मात्राएँ चाहिए जो आप ठेकेदार के सामने रख सकें, तब यह मिलता है।',
    colF: 'आपको क्या मिलता है', colFree: 'आम मुफ़्त कैलकुलेटर', colNS: `NirmanShastra (${PRICE.from} प्रति रिपोर्ट से)`,
    foot: 'हिसाब हर जगह एक जैसा है। फ़र्क़ यह है कि वह घर के कितने हिस्से को देखता है, और अपना हिसाब दिखाता है या नहीं।',
    rows: [
      ['मात्राएँ कैसे निकलती हैं', 'प्रति वर्ग फुट का मोटा रेट', 'ढाँचा हमारे सर्वर पर बिछाया और भारतीय मानकों के अनुसार हिस्सा-दर-हिस्सा तय किया जाता है'],
      ['सामग्री की मात्रा', 'एक धुँधला आँकड़ा', 'सटीक: सीमेंट की बोरी, सरिया साइज़ के हिसाब से किलो, ईंटों की संख्या, तार और पाइप के मीटर'],
      ['भारतीय मानकों पर आधारित', 'आमतौर पर ज़िक्र नहीं', `${IS_CODES.length} भारतीय मानक, जब चाहें जाँचने के लिए दिखते हैं`],
      ['आँकड़ा कितना पक्का है', 'एक सटीक दिखने वाली संख्या', 'सबसे संभावित आँकड़ा, एक ईमानदार दायरे और इस सूची के साथ कि क्या नहीं गिना गया'],
      ['ठेकेदार को परखना', 'संभव नहीं', 'ठेकेदार की मात्राएँ हमारी मात्राओं के बगल में, लाइन-दर-लाइन'],
      ['दाम, रेट और मज़दूरी', 'शहरी औसत जो पुराने पड़ जाते हैं', 'कुछ नहीं। सिर्फ़ मात्राएँ, इसलिए कुछ पुराना नहीं पड़ता और आपके स्थानीय बाज़ार के बारे में कोई अंदाज़ा नहीं लगाया जाता'],
      ['रिपोर्ट', 'स्क्रीन पर एक संख्या', 'PDF: मात्रा सूची, इस्तेमाल हुए मानक, और क्या गिना गया व क्या नहीं'],
      ['आपका ब्योरा', 'नीतियाँ अलग-अलग', 'कभी बेचा नहीं जाता। आपके प्रोजेक्ट का डेटा आपका है।'],
    ],
  },
} as const

/** The comparison, set as a bill of quantities: the middle column is the usual free tool, the right is what you get here. */
export default function Compare() {
  const loc = useLocale() === 'hi' ? 'hi' : 'en'
  const c = COPY[loc]
  const { ref } = useReveal<HTMLDivElement>()
  return (
    <section className="ns-section ns-section--alt ns-cmp" id="compare" aria-labelledby="ns-cmp-h">
      <div className="ns-wrap" ref={ref}>
        <p className="ns-eyebrow ns-rise">{c.eye}</p>
        <h2 className="ns-h2 ns-rise" id="ns-cmp-h" style={{ ['--d' as string]: '.05s' }}>{c.h}</h2>
        <p className="ns-lede ns-rise" style={{ ['--d' as string]: '.12s' }}>{c.intro}</p>

        <div className="ns-plate ns-cmp__sheet ns-rise" style={{ ['--d' as string]: '.18s' }} role="table" aria-label={c.h}>
          <div className="ns-cmp__row ns-cmp__row--h" role="row">
            <span role="columnheader">{c.colF}</span>
            <span role="columnheader">{c.colFree}</span>
            <span role="columnheader" className="ns-cmp__ns">{c.colNS}</span>
          </div>
          {c.rows.map((r, i) => (
            <div key={i} className="ns-cmp__row" role="row" tabIndex={0} style={{ ['--i' as string]: i }}>
              <span role="rowheader" className="ns-cmp__f">{r[0]}</span>
              <span role="cell" className="ns-cmp__no"><i aria-hidden="true">✕</i>{r[1]}</span>
              <span role="cell" className="ns-cmp__ns"><i aria-hidden="true">✓</i>{r[2]}</span>
            </div>
          ))}
        </div>
        <p className="ns-cmp__foot ns-rise">{c.foot}</p>
      </div>
      <Pour tone="alt" v={6} />
    </section>
  )
}
