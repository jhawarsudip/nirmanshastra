'use client'

import { useLocale } from 'next-intl'
import Link from 'next/link'
import { useReveal } from '@/lib/v2/store'
import { SITE_TEMPLATES, TEMPLATES_BUNDLE } from '@/lib/v2/content'
import { CALCULATORS } from '@/lib/v2/calculators'
import { Arrow } from '../Icons'
import '@/styles/v2/closing.css'

const L = {
  en: { eye: 'For builders, contractors and engineers', h: 'Working on site every day?', p: 'Six ready-made spreadsheet toolkits for the work that starts once the quote is signed: billing, bar bending schedules, labour and compliance, site records and progress.', sheets: 'sheets', bundle: 'All six toolkits, bundled', open: 'Open',
        calc: 'Calculators for the site office', calcP: 'Free, no sign-up. Bills, steel cutting lengths, cube tests, wages and progress.' },
  hi: { eye: 'बिल्डर, ठेकेदार और इंजीनियरों के लिए', h: 'रोज़ साइट पर काम करते हैं?', p: 'कोटेशन पर दस्तख़त के बाद शुरू होने वाले काम के लिए छह तैयार स्प्रेडशीट टूलकिट: बिलिंग, बार बेंडिंग शेड्यूल, मज़दूरी और अनुपालन, साइट रिकॉर्ड और प्रगति।', sheets: 'शीट', bundle: 'सभी छह टूलकिट, बंडल में', open: 'खोलें',
        calc: 'साइट ऑफ़िस के कैलकुलेटर', calcP: 'मुफ़्त, बिना साइन-अप। बिल, स्टील की कटिंग लंबाई, क्यूब टेस्ट, मज़दूरी और प्रगति।' },
} as const

// the five calculators homeowners get in their own section are not repeated here
const HOME_CALCS = new Set([
  '/tools/brick-calculator', '/tools/concrete-mix-ratio-calculator', '/tools/water-tank-size-calculator',
  '/tools/wire-size-calculator', '/tools/paint-tile-calculator',
])

export default function Toolkits() {
  const loc = useLocale() === 'hi' ? 'hi' : 'en'
  const c = L[loc]
  const { ref } = useReveal<HTMLDivElement>()
  return (
    <section className="ns-section ns-section--alt ns-tk" id="builders" aria-labelledby="ns-tk-h">
      <span id="toolkits" aria-hidden="true" />
      <div className="ns-wrap" ref={ref}>
        <p className="ns-eyebrow ns-rise">{c.eye}</p>
        <h2 className="ns-h2 ns-rise" id="ns-tk-h" style={{ ['--d' as string]: '.05s' }}>{c.h}</h2>
        <p className="ns-lede ns-rise" style={{ ['--d' as string]: '.12s' }}>{c.p}</p>

        <ul className="ns-tk__grid">
          {SITE_TEMPLATES.map((s, i) => (
            <li key={s.href} className="ns-rise" style={{ ['--d' as string]: `${(i % 3) * 0.08 + 0.1}s` }}>
              <Link href={s.href} className="ns-plate ns-tk__card" data-snap>
                <span className="ns-tk__sh ns-mono" aria-hidden="true">{String(s.sheets).padStart(2, '0')}</span>
                <span className="ns-tk__meta ns-mono">{s.sheets} {c.sheets}</span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
                <span className="ns-tk__foot"><b className="ns-mono">{s.price}</b><span>{c.open}<Arrow /></span></span>
              </Link>
            </li>
          ))}
        </ul>
        <Link href={TEMPLATES_BUNDLE.href} className="ns-tk__bundle ns-btn" data-snap>{c.bundle} · {TEMPLATES_BUNDLE.price}<Arrow /></Link>

        <div className="ns-tk__calc">
          <h3 className="ns-h3 ns-rise">{c.calc}</h3>
          <p className="ns-muted ns-rise">{c.calcP}</p>
          <ul className="ns-tk__calcs">
            {CALCULATORS.filter(k => !HOME_CALCS.has(k.href)).map((k, i) => (
              <li key={k.href} className="ns-rise" style={{ ['--d' as string]: `${(i % 5) * 0.05}s` }}>
                <Link href={k.href} className="ns-tk__calcl" data-snap>
                  <span><b>{k.title[loc]}</b><i>{k.desc[loc]}</i></span>
                  <Arrow />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
