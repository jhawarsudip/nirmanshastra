'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { useReveal } from '@/lib/v2/store'
import { Arrow } from '../Icons'
import Calc from '../Calc'
import '@/styles/v2/closing.css'

/*
  Check a quote, by quantity. No rupee figure and no quantity of the visitor's own house appears here:
  the picture only shows HOW a line in a quote reads against the range the full report gives, and what to ask when it is low or high.
  The real comparison happens inside the paid StructurePro report, where the visitor types the contractor's numbers next to ours.
*/

type Line = 'steel' | 'cement' | 'concrete' | 'formwork'
type Where = 'lo' | 'ok' | 'hi'
const LINES: Line[] = ['steel', 'cement', 'concrete', 'formwork']
const WHERES: Where[] = ['lo', 'ok', 'hi']

const L = {
  en: {
    eye: 'Check a quote', h: 'Does your contractor’s quantity hold up?',
    p: 'A price only means something if you know what it counts. Ask your contractor for the quantities behind the quote: bags of cement, kilos of steel, cubic metres of concrete. Our report counts the same things for your house, with an honest range, and tells you for each line whether it is low, inside the range or high.',
    line: 'Which line of the quote?', where: 'Where does it sit against our range?',
    lines: { steel: 'Steel', cement: 'Cement', concrete: 'Concrete', formwork: 'Shuttering' },
    wheres: { lo: 'Below the range', ok: 'Inside the range', hi: 'Above the range' },
    low: 'Low end', mid: 'Most likely', high: 'High end', pin: 'Your quote',
    sample: 'A picture of how a line reads. The numbers for your own house are in the report.',
    say: {
      steel: {
        lo: 'Below our range. Ask what has been left out: some bar sizes, the lap lengths, the stirrups, or a lighter grade than the drawing calls for.',
        ok: 'Inside our range. Still ask for the weight by bar diameter, not one total, so you can match it to the delivery challans.',
        hi: 'Above our range. Ask how the weight was worked out: from cutting lengths with laps, or from a thumb rule. Check that wastage and binding wire are not counted twice.',
      },
      cement: {
        lo: 'Below our range. Ask whether the mix is leaner than the concrete grade needs, or whether the cement for walls and plaster is counted in a different line.',
        ok: 'Inside our range. Ask which cement (OPC or PPC) and which mix the figure assumes.',
        hi: 'Above our range. Ask whether cement for masonry and plaster sits in the same line, and how much wastage has been added on top.',
      },
      concrete: {
        lo: 'Below our range. Ask whether the footings and slab are as thick as the structural drawing says, and whether any member has been left out.',
        ok: 'Inside our range. Ask for the volume member by member: footings, columns, beams, slabs.',
        hi: 'Above our range. Ask whether the volume is measured to the outside of the shuttering, and whether a thick levelling bed under the footings is counted as structure.',
      },
      formwork: {
        lo: 'Below our range. Shuttering is the line most often forgotten. Ask whether it is counted at all, and for how many reuses.',
        ok: 'Inside our range. Ask how many times the same shuttering is assumed to be reused.',
        hi: 'Above our range. Ask whether every reuse is counted as fresh shuttering, and whether props are added again.',
      },
    },
    note: 'This covers only the frame: footings, columns, beams, slabs and stair. It is not a formal quotation, a rate check or a structural approval.',
    cta: 'Get the quantities for my house', cta2: 'Compare quantities line by line',
    calcTitle: 'Why there is a range at all',
    calcNote: 'A quantity worked out from a drawing is still not one exact number: bar lengths are cut and lapped on site, shuttering is reused, and some wastage is unavoidable. The report therefore gives a range around its most likely figure. It is wider for steel and shuttering, which are decided on site, than for concrete, which is measured from the drawing.',
  },
  hi: {
    eye: 'कोटेशन जाँचिए', h: 'क्या ठेकेदार की मात्रा टिकती है?',
    p: 'दाम का मतलब तभी है जब पता हो कि उसमें क्या गिना गया है। ठेकेदार से कोटेशन के पीछे की मात्राएँ माँगिए: सीमेंट के बैग, सरिये के किलो, कंक्रीट के घन मीटर। हमारी रिपोर्ट आपके घर के लिए यही चीज़ें एक ईमानदार दायरे के साथ गिनती है, और हर लाइन के लिए बताती है कि वह कम है, दायरे के भीतर है या ज़्यादा।',
    line: 'कोटेशन की कौन-सी लाइन?', where: 'वह हमारे दायरे के मुक़ाबले कहाँ है?',
    lines: { steel: 'स्टील', cement: 'सीमेंट', concrete: 'कंक्रीट', formwork: 'शटरिंग' },
    wheres: { lo: 'दायरे से कम', ok: 'दायरे के भीतर', hi: 'दायरे से ज़्यादा' },
    low: 'निचला सिरा', mid: 'सबसे संभावित', high: 'ऊपरी सिरा', pin: 'आपका कोटेशन',
    sample: 'यह दिखाने वाली तस्वीर है कि एक लाइन कैसे पढ़ी जाती है। आपके अपने घर के आँकड़े रिपोर्ट में हैं।',
    say: {
      steel: {
        lo: 'हमारे दायरे से कम। पूछिए क्या छूट गया है: कुछ सरिया साइज़, लैप की लंबाई, स्टिरप, या नक्शे से हल्का ग्रेड।',
        ok: 'हमारे दायरे के भीतर। फिर भी कुल एक आँकड़ा नहीं, सरिया साइज़ के हिसाब से वज़न माँगिए, ताकि डिलीवरी चालान से मिला सकें।',
        hi: 'हमारे दायरे से ज़्यादा। पूछिए वज़न कैसे निकाला: लैप सहित कटिंग लंबाई से, या अंदाज़े के नियम से। देखिए कि वेस्टेज और बाइंडिंग वायर दो बार तो नहीं गिने गए।',
      },
      cement: {
        lo: 'हमारे दायरे से कम। पूछिए क्या मिश्रण कंक्रीट ग्रेड के लिए ज़रूरी से कमज़ोर है, या दीवार और प्लास्टर का सीमेंट किसी और लाइन में गिना गया है।',
        ok: 'हमारे दायरे के भीतर। पूछिए यह आँकड़ा कौन-सा सीमेंट (OPC या PPC) और कौन-सा मिश्रण मानकर बना है।',
        hi: 'हमारे दायरे से ज़्यादा। पूछिए क्या चिनाई और प्लास्टर का सीमेंट इसी लाइन में है, और ऊपर से कितना वेस्टेज जोड़ा गया है।',
      },
      concrete: {
        lo: 'हमारे दायरे से कम। पूछिए क्या फुटिंग और स्लैब उतनी मोटी हैं जितनी स्ट्रक्चरल नक्शा कहता है, और कोई हिस्सा छूटा तो नहीं।',
        ok: 'हमारे दायरे के भीतर। आयतन हिस्सा-दर-हिस्सा माँगिए: फुटिंग, कॉलम, बीम, स्लैब।',
        hi: 'हमारे दायरे से ज़्यादा। पूछिए क्या आयतन शटरिंग की बाहरी सतह तक नापा गया है, और क्या फुटिंग के नीचे की मोटी बिछावन भी ढाँचे में गिनी गई है।',
      },
      formwork: {
        lo: 'हमारे दायरे से कम। शटरिंग वह लाइन है जो सबसे ज़्यादा भूली जाती है। पूछिए क्या वह गिनी गई है, और कितनी बार दोबारा इस्तेमाल मानी गई है।',
        ok: 'हमारे दायरे के भीतर। पूछिए एक ही शटरिंग को कितनी बार दोबारा इस्तेमाल मानकर चला गया है।',
        hi: 'हमारे दायरे से ज़्यादा। पूछिए क्या हर बार का इस्तेमाल नई शटरिंग मानकर गिना गया है, और क्या सपोर्ट फिर से जोड़े गए हैं।',
      },
    },
    note: 'यह सिर्फ़ ढाँचे के लिए है: फुटिंग, कॉलम, बीम, स्लैब और सीढ़ी। यह औपचारिक कोटेशन, रेट की जाँच या स्ट्रक्चरल मंज़ूरी नहीं है।',
    cta: 'मेरे घर की मात्राएँ पाएँ', cta2: 'मात्राएँ लाइन-दर-लाइन मिलाएँ',
    calcTitle: 'दायरा क्यों होता है',
    calcNote: 'नक्शे से निकली मात्रा भी एक सटीक संख्या नहीं होती: सरिये साइट पर काटे और जोड़े जाते हैं, शटरिंग दोबारा इस्तेमाल होती है, और कुछ वेस्टेज अपरिहार्य है। इसलिए रिपोर्ट अपने सबसे संभावित आँकड़े के चारों ओर दायरा देती है। सरिये और शटरिंग के लिए यह चौड़ा है क्योंकि इन्हें साइट पर तय किया जाता है, कंक्रीट के लिए कम चौड़ा क्योंकि उसे नक्शे से नापा जाता है।',
  },
} as const

// where the pin sits on the picture, as a percentage of the ruler
const PIN: Record<Where, number> = { lo: 10, ok: 50, hi: 90 }
const BAND = { from: 28, to: 72 }

export default function QuoteCheck() {
  const loc = useLocale() === 'hi' ? 'hi' : 'en'
  const c = L[loc]
  const [line, setLine] = useState<Line>('steel')
  const [where, setWhere] = useState<Where>('hi')
  const { ref } = useReveal<HTMLDivElement>()
  const tone = where

  return (
    <section className="ns-section ns-qc" id="quote-check" aria-labelledby="ns-qc-h">
      <div className="ns-wrap" ref={ref}>
        <p className="ns-eyebrow ns-rise">{c.eye}</p>
        <h2 className="ns-h2 ns-rise" id="ns-qc-h" style={{ ['--d' as string]: '.05s' }}>{c.h}</h2>
        <p className="ns-lede ns-rise" style={{ ['--d' as string]: '.12s' }}>{c.p}</p>

        <div className="ns-plate ns-qc__plate ns-rise" style={{ ['--d' as string]: '.18s' }}>
          <div className="ns-qc__ctl">
            <div className="ns-sc__row" role="radiogroup" aria-label={c.line}>
              <span>{c.line}</span><output className="ns-mono">{c.lines[line]}</output>
              <div className="ns-seg ns-seg--wrap">{LINES.map(k => (
                <button key={k} type="button" role="radio" aria-checked={line === k} onClick={() => setLine(k)}>{c.lines[k]}</button>
              ))}</div>
            </div>
            <div className="ns-sc__row" role="radiogroup" aria-label={c.where}>
              <span>{c.where}</span><output className="ns-mono">{c.wheres[where]}</output>
              <div className="ns-seg ns-seg--wrap ns-seg--3">{WHERES.map(k => (
                <button key={k} type="button" role="radio" aria-checked={where === k} onClick={() => setWhere(k)}>{c.wheres[k]}</button>
              ))}</div>
            </div>
          </div>

          <div className="ns-qc__out" aria-live="polite">
            <div className="ns-qc__ruler" data-tone={tone} role="img" aria-label={`${c.lines[line]}: ${c.wheres[where]}`}>
              <div className="ns-qc__band" style={{ left: `${BAND.from}%`, width: `${BAND.to - BAND.from}%` }} />
              <span className="ns-qc__tick" data-k="basic" style={{ left: `${BAND.from}%` }}><i /><b className="ns-mono">{c.low}</b></span>
              <span className="ns-qc__tick" data-k="standard" style={{ left: '50%' }}><i /><b className="ns-mono">{c.mid}</b></span>
              <span className="ns-qc__tick" data-k="premium" style={{ left: `${BAND.to}%` }}><i /><b className="ns-mono">{c.high}</b></span>
              <span className="ns-qc__pin" style={{ left: `${PIN[where]}%` }}><i className="ns-mono">{c.pin} · {c.lines[line]}</i></span>
            </div>
            <p className={`ns-qc__verdict is-${tone}`}>{c.say[line][where]}</p>
            <p className="ns-sc__note">{c.sample} {c.note}</p>
            <Calc loc={loc} title={{ en: L.en.calcTitle, hi: L.hi.calcTitle }} note={c.calcNote} standards={['IS 456:2000', 'IS 1786:2008']} />
            <div className="ns-qc__cta">
              <Link className="ns-btn" href="/tools/structopro" data-snap>{c.cta}<Arrow /></Link>
              <Link className="ns-btn ns-btn--paper" href="/compare-quote" data-snap>{c.cta2}<Arrow /></Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
