'use client'

import { useLocale } from 'next-intl'
import Link from 'next/link'
import { useReveal } from '@/lib/v2/store'
import { SITE_TEMPLATES, TEMPLATES_BUNDLE } from '@/lib/v2/content'
import { CALCULATORS } from '@/lib/v2/calculators'
import { Arrow } from '../Icons'
import '@/styles/v2/closing.css'

const L = {
  en: { eye: 'Beyond the estimate', h: 'Site toolkits', p: 'Six spreadsheet toolkits for the work that happens after the quote is signed.', sheets: 'sheets', bundle: 'All six toolkits, bundled', open: 'Open',
        calc: 'Free calculators', calcP: 'No sign-up. One job each, IS-code values inside.' },
  hi: { eye: 'अनुमान के आगे', h: 'साइट टूलकिट', p: 'कोटेशन पर दस्तख़त के बाद के काम के लिए छह स्प्रेडशीट टूलकिट।', sheets: 'शीट', bundle: 'सभी छह टूलकिट, बंडल में', open: 'खोलें',
        calc: 'निःशुल्क कैलकुलेटर', calcP: 'बिना साइन-अप। हर एक का एक काम, भीतर IS-कोड के मान।' },
} as const

export default function Toolkits() {
  const loc = useLocale() === 'hi' ? 'hi' : 'en'
  const c = L[loc]
  const { ref } = useReveal<HTMLDivElement>()
  return (
    <section className="ns-section ns-section--alt ns-tk" id="toolkits" aria-labelledby="ns-tk-h">
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
            {CALCULATORS.map((k, i) => (
              <li key={k.href} className="ns-rise" style={{ ['--d' as string]: `${(i % 5) * 0.05}s` }}>
                <Link href={k.href} className="ns-tk__calcl" data-snap>
                  <span className="ns-mono">{String(i + 1).padStart(2, '0')}</span>
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
