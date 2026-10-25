'use client'

import { useLocale } from 'next-intl'
import { useReveal } from '@/lib/v2/store'
import Sticker from '../Sticker'
import '@/styles/v2/closing.css'
import Pour from '../Pour'

/** Four small drafted marks, one per step. Each answers hover / focus. */
function Mark({ i }: { i: number }) {
  const p = { viewBox: '0 0 120 84', className: 'ns-how__mark', 'aria-hidden': true } as const
  if (i === 0) return (
    <svg {...p}>
      <rect x="22" y="6" width="76" height="72" fill="var(--ns-paper)" stroke="var(--ns-ink)" strokeWidth="2" />
      {[20, 38, 56].map(y => <g key={y}><rect x="32" y={y} width="10" height="10" fill="none" stroke="var(--ns-ink)" strokeWidth="1.6" /><line x1="50" x2="88" y1={y + 5} y2={y + 5} stroke="var(--ns-ink)" strokeWidth="2" /></g>)}
      <path className="ns-how__tick" d="M34 25 l3 3 l6 -8 M34 43 l3 3 l6 -8" fill="none" stroke="var(--ns-laterite)" strokeWidth="2.6" />
    </svg>
  )
  if (i === 1) return (
    <svg {...p}>
      <path d="M60 6 L104 22 V46 C104 62 84 74 60 80 C36 74 16 62 16 46 V22 Z" fill="var(--ns-paper)" stroke="var(--ns-ink)" strokeWidth="2" />
      <path className="ns-how__tick" d="M40 44 l14 14 l28 -28" fill="none" stroke="var(--ns-verdigris)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
  if (i === 2) return (
    <svg {...p}>
      <path d="M60 6 L102 26 V58 L60 78 L18 58 V26 Z" fill="var(--ns-paper)" stroke="var(--ns-ink)" strokeWidth="2" strokeLinejoin="round" />
      <path d="M18 26 L60 46 L102 26 M60 46 V78" fill="none" stroke="var(--ns-ink)" strokeWidth="1.6" strokeLinejoin="round" />
      <g className="ns-how__slide"><rect x="50" y="52" width="20" height="14" rx="3" fill="var(--ns-laterite)" stroke="var(--ns-ink)" strokeWidth="1.4" /><path d="M54 52 v-4 a6 6 0 0 1 12 0 v4" fill="none" stroke="var(--ns-ink)" strokeWidth="1.6" /></g>
    </svg>
  )
  return (
    <svg {...p}>
      <rect x="18" y="8" width="84" height="68" fill="var(--ns-paper)" stroke="var(--ns-ink)" strokeWidth="2" />
      {[24, 38, 52].map((y, k) => <g key={y}><line x1="28" x2="62" y1={y} y2={y} stroke="var(--ns-ink)" strokeWidth="2" /><rect className="ns-how__bar" x="68" y={y - 5} width={[22, 14, 28][k]} height="9" fill="var(--ns-laterite)" style={{ ['--k' as string]: k }} /></g>)}
      <line x1="26" x2="94" y1="64" y2="64" stroke="var(--ns-ink)" strokeWidth="2.4" /><line x1="26" x2="94" y1="68" y2="68" stroke="var(--ns-ink)" strokeWidth="1" />
    </svg>
  )
}

const COPY = {
  en: {
    eye: 'How it works', h: 'Four steps to a quantity you can trust',
    steps: [
      ['Answer simple questions', 'Tell us about your house in plain words: its size, the floors, where it is. No engineering degree needed.'],
      ['We design it on our side', 'We lay out the frame the way an engineer would, then check it against Indian building standards. You never see a formula unless you ask for it.'],
      ['See the shape, then unlock the numbers', 'Before you pay, you see the frame we worked out: grid, columns and footings, in 3D. The quantities come with the full report.'],
      ['Get quantities you can rely on', 'A clear list of exactly what to order and how much, based on the Bureau of Indian Standards, with an honest range and a list of what is not counted.'],
    ],
  },
  hi: {
    eye: 'यह कैसे काम करता है', h: 'चार क़दम, एक भरोसेमंद मात्रा तक',
    steps: [
      ['सरल सवालों के जवाब दीजिए', 'अपने घर के बारे में सीधे शब्दों में बताइए: आकार, मंज़िलें, और वह कहाँ है। इंजीनियरिंग की डिग्री की ज़रूरत नहीं।'],
      ['डिज़ाइन हम अपनी तरफ़ से करते हैं', 'हम ढाँचे को वैसे ही बिछाते हैं जैसे इंजीनियर बिछाता है, फिर उसे भारतीय निर्माण मानकों से मिलाते हैं। आपको कोई फ़ॉर्मूला तब तक नहीं दिखता जब तक आप न माँगें।'],
      ['पहले आकार देखिए, फिर संख्याएँ खोलिए', 'भुगतान से पहले आप वह ढाँचा देखते हैं जो हमने निकाला: ग्रिड, कॉलम और फुटिंग, 3D में। मात्राएँ पूरी रिपोर्ट के साथ मिलती हैं।'],
      ['भरोसे लायक मात्रा पाइए', 'ब्यूरो ऑफ़ इंडियन स्टैंडर्ड्स पर आधारित, क्या मँगवाना है और कितना, इसकी साफ़ सूची, एक ईमानदार दायरे और इस सूची के साथ कि क्या नहीं गिना गया।'],
    ],
  },
} as const

export default function HowItWorks() {
  const loc = useLocale() === 'hi' ? 'hi' : 'en'
  const c = COPY[loc]
  const { ref } = useReveal<HTMLDivElement>()
  return (
    <section className="ns-section ns-how" id="how-it-works" aria-labelledby="ns-how-h">
      <div className="ns-wrap" ref={ref}>
        <p className="ns-eyebrow ns-rise">{c.eye}</p>
        <h2 className="ns-h2 ns-rise" id="ns-how-h" style={{ ['--d' as string]: '.05s' }}>{c.h}</h2>
        <ol className="ns-how__list">
          {c.steps.map((st, i) => (
            <li key={i} className="ns-plate ns-how__step ns-rise" tabIndex={0} data-snap style={{ ['--d' as string]: `${0.1 * i + 0.12}s` }}>
              <span className="ns-how__no" aria-hidden="true">0{i + 1}</span>
              <Mark i={i} />
              <h3 className="ns-how__h">{st[0]}</h3>
              <p>{st[1]}</p>
            </li>
          ))}
        </ol>
        <Sticker src="/v2/cutouts/o09-rolled-drawings.webp" w={820} h={535} width="clamp(62px, 13vw, 200px)" rot={-8} pos={{ right: '3%', top: '0px' }} />
        <Sticker src="/v2/cutouts/o05-auto-level-tripod.webp" w={519} h={820} width="clamp(48px, 6.4vw, 96px)" rot={6} pos={{ right: '14%', bottom: '16px' }} />
        <Sticker src="/v2/cutouts/o08-binding-wire-pliers.webp" w={820} h={496} width="clamp(80px, 10vw, 150px)" rot={-12} pos={{ left: '2%', bottom: '14px' }} />
      </div>
      <Pour tone="bg" v={5} />
    </section>
  )
}
