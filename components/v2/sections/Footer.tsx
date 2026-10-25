'use client'

import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { BrandMark, Arrow } from '../Icons'
import { TOOLS, SITE_TEMPLATES, TEMPLATES_BUNDLE } from '@/lib/v2/content'
import { FOOT, pick } from '@/lib/v2/copy'
import '@/styles/v2/closing.css'

const CALCS: [string, string, string][] = [
  ['/tools/bar-bending-schedule-calculator', 'Bar Bending', 'बार बेंडिंग'],
  ['/tools/water-tank-size-calculator', 'Water Tank Size', 'वॉटर टैंक साइज़'],
  ['/tools/concrete-mix-ratio-calculator', 'Concrete Mix', 'कंक्रीट मिक्स'],
  ['/tools/brick-calculator', 'Brick Calculator', 'ईंट कैलकुलेटर'],
  ['/tools/wire-size-calculator', 'Wire Size', 'वायर साइज़'],
  ['/tools/ra-bill-retention-tds-calculator', 'RA Bill (Retention, GST, TDS)', 'आरए बिल (रिटेंशन, GST, TDS)'],
  ['/tools/concrete-cube-test-calculator', 'Concrete Cube Test', 'कंक्रीट क्यूब टेस्ट'],
  ['/tools/daily-wage-pf-esi-calculator', 'Daily-Wage PF & ESI', 'दैनिक मज़दूरी PF और ESI'],
  ['/tools/paint-tile-calculator', 'Paint and Tile', 'पेंट और टाइल'],
  ['/tools/earned-value-calculator', 'Earned Value (SPI, CPI, EAC)', 'अर्नड वैल्यू (SPI, CPI, EAC)'],
]

/** Soft ground under the page: topsoil, laterite, rock, with footings and starter bars standing up out of it. */
function Strata() {
  return (
    <svg className="ns-foot__strata" viewBox="0 0 1440 150" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <rect x="0" y="52" width="1440" height="98" fill="#9C4A2E" />
      <rect x="0" y="52" width="1440" height="30" fill="#E7C48A" />
      <rect x="0" y="82" width="1440" height="34" fill="#C56A43" />
      <g fill="#FBF4E4" opacity=".22">
        {Array.from({ length: 42 }, (_, i) => (
          <circle key={i} cx={(i * 197) % 1440} cy={60 + ((i * 53) % 84)} r={2 + (i % 3)} />
        ))}
      </g>
      <line x1="0" x2="1440" y1="52" y2="52" stroke="#2A1E16" strokeWidth="2" strokeOpacity=".5" />
      {Array.from({ length: 9 }, (_, k) => {
        const x = 70 + k * 165
        return (
          <g key={k} className="ns-foot__col" style={{ ['--k' as string]: k }}>
            <rect x={x - 34} y="52" width="68" height="20" rx="5" fill="#FFFCF3" stroke="#2A1E16" strokeWidth="1.5" strokeOpacity=".6" />
            <rect x={x - 10} y="20" width="20" height="32" rx="3" fill="#FFFCF3" stroke="#2A1E16" strokeWidth="1.5" strokeOpacity=".6" />
            <path d={`M${x - 5} 20 V4 M${x} 20 V0 M${x + 5} 20 V4`} stroke="#B5472B" strokeWidth="2.6" strokeLinecap="round" fill="none" />
          </g>
        )
      })}
    </svg>
  )
}

export default function Footer() {
  const t = useTranslations('footer')
  const loc = useLocale() === 'hi' ? 'hi' : 'en'
  const [yr, setYr] = useState(2026)
  useEffect(() => setYr(new Date().getFullYear()), [])
  const hi = loc === 'hi'
  const legal: [string, string][] = [
    [t('privacy'), '/privacy-policy'], [t('terms'), '/terms-of-use'], [t('disclaimer'), '/disclaimer'], [t('isCodes'), '/is-codes-used'],
    [hi ? 'शब्दावली' : 'Glossary', '/glossary'], [hi ? 'AI असिस्टेंट के लिए' : 'For AI assistants', '/llms.txt'],
  ]
  const company: [string, string][] = [[t('about'), '/about'], [t('contact'), '/contact'], [t('blog'), '/blog'], [t('careers'), '/careers']]

  return (
    <footer className="ns-foot ns-stage">
      <Strata />
      <div className="ns-wrap">
        <p className="ns-foot__big">{pick(FOOT.tag, loc)}</p>
        <div className="ns-foot__cols">
          <div className="ns-foot__brand">
            <BrandMark className="ns-foot__mark" on="dark" size={320} />
            <p className="ns-foot__name">Nirman<b>Shastra</b></p>
            <p className="ns-foot__note">{pick(FOOT.note, loc)}</p>
          </div>
          <nav aria-label={pick(FOOT.tools, loc)}>
            <h2>{pick(FOOT.tools, loc)}</h2>
            <ul>{TOOLS.map(k => <li key={k.key}><Link href={k.href}>{k.name}{k.free ? <em>{pick(FOOT.free, loc)}</em> : null}</Link></li>)}</ul>
          </nav>
          <nav aria-label={pick(FOOT.calcs, loc)}>
            <h2>{pick(FOOT.calcs, loc)}</h2>
            <ul>{CALCS.map(([h, en, hn]) => <li key={h}><Link href={h}>{hi ? hn : en}</Link></li>)}</ul>
          </nav>
          <nav aria-label={pick(FOOT.kits, loc)}>
            <h2>{pick(FOOT.kits, loc)}</h2>
            <ul>
              {SITE_TEMPLATES.map(s => <li key={s.href}><Link href={s.href}>{s.title}<em>{s.price}</em></Link></li>)}
              <li><Link href={TEMPLATES_BUNDLE.href}>{t('templatesBundle')}<em>{TEMPLATES_BUNDLE.price}</em></Link></li>
            </ul>
          </nav>
          <nav aria-label={pick(FOOT.company, loc)}>
            <h2>{pick(FOOT.company, loc)}</h2>
            <ul>{company.map(([l, h]) => <li key={h}><Link href={h}>{l}</Link></li>)}</ul>
            <h2 className="ns-foot__h2b">{pick(FOOT.legal, loc)}</h2>
            <ul>{legal.map(([l, h]) => <li key={h}><Link href={h}>{l}</Link></li>)}</ul>
          </nav>
        </div>
        <div className="ns-foot__base">
          <span>&copy; {yr} NirmanShastra</span>
          <button type="button" className="ns-foot__top" data-snap onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>{pick(FOOT.top, loc)}<Arrow style={{ transform: 'rotate(-90deg)' }} /></button>
        </div>
      </div>
    </footer>
  )
}
