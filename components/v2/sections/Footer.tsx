'use client'

import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { BrandMark, Arrow } from '../Icons'
import { TOOLS, SITE_TEMPLATES, TEMPLATES_BUNDLE } from '@/lib/v2/content'
import '@/styles/v2/closing.css'

const CALCS: [string, string, string][] = [
  ['/tools/bar-bending-schedule-calculator', 'Bar Bending Schedule', 'बार बेंडिंग शेड्यूल'],
  ['/tools/water-tank-size-calculator', 'Water Tank Size', 'वॉटर टैंक साइज़'],
  ['/tools/concrete-mix-ratio-calculator', 'Concrete Mix Ratio', 'कंक्रीट मिक्स रेशियो'],
  ['/tools/brick-calculator', 'Brick Calculator', 'ईंट कैलकुलेटर'],
  ['/tools/wire-size-calculator', 'Wire Size', 'वायर साइज़'],
  ['/tools/ra-bill-retention-tds-calculator', 'RA Bill (Retention, GST, TDS)', 'आरए बिल (रिटेंशन, GST, TDS)'],
  ['/tools/concrete-cube-test-calculator', 'Concrete Cube Test', 'कंक्रीट क्यूब टेस्ट'],
  ['/tools/daily-wage-pf-esi-calculator', 'Daily-Wage PF & ESI', 'दैनिक मज़दूरी PF और ESI'],
  ['/tools/finish-tier-cost-calculator', 'Finish-Tier Cost Difference', 'फिनिश-टियर कॉस्ट अंतर'],
  ['/tools/earned-value-calculator', 'Earned Value (SPI, CPI, EAC)', 'अर्नड वैल्यू (SPI, CPI, EAC)'],
]

/** Ground layers under the page: slab, fill, murum, rock, with footings and starter bars standing up out of it. */
function Strata() {
  return (
    <svg className="ns-foot__strata" viewBox="0 0 1440 150" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <rect x="0" y="52" width="1440" height="98" fill="#E6DCC8" />
      <rect x="0" y="52" width="1440" height="98" fill="url(#h-rock)" />
      <rect x="0" y="52" width="1440" height="26" fill="#E6DCC8" />
      <rect x="0" y="52" width="1440" height="26" fill="url(#h-earth)" />
      <rect x="0" y="78" width="1440" height="30" fill="#E6DCC8" />
      <rect x="0" y="78" width="1440" height="30" fill="url(#h-murum)" />
      <line x1="0" x2="1440" y1="52" y2="52" stroke="#1C1B19" strokeWidth="2.4" />
      {Array.from({ length: 9 }, (_, k) => {
        const x = 70 + k * 165
        return (
          <g key={k} className="ns-foot__col" style={{ ['--k' as string]: k }}>
            <rect x={x - 34} y="52" width="68" height="20" fill="#F7F2E7" />
            <rect x={x - 34} y="52" width="68" height="20" fill="url(#h-concrete)" stroke="#1C1B19" strokeWidth="1.6" />
            <rect x={x - 10} y="20" width="20" height="32" fill="#F7F2E7" />
            <rect x={x - 10} y="20" width="20" height="32" fill="url(#h-concrete)" stroke="#1C1B19" strokeWidth="1.6" />
            <path d={`M${x - 5} 20 V4 M${x} 20 V0 M${x + 5} 20 V4`} stroke="#D2694A" strokeWidth="2.4" strokeLinecap="round" fill="none" />
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
        <p className="ns-foot__big">{t('tagline')}</p>
        <div className="ns-foot__cols">
          <div className="ns-foot__brand">
            <BrandMark className="ns-foot__mark" />
            <p className="ns-foot__name">NIRMAN<b>SHASTRA</b></p>
            <p className="ns-foot__note">{t('note')}</p>
          </div>
          <nav aria-label={t('colTools')}>
            <h2 className="ns-mono">{t('colTools')}</h2>
            <ul>{TOOLS.map(k => <li key={k.key}><Link href={k.href}>{k.name}{k.free ? <em className="ns-mono">{t('toolFree')}</em> : null}</Link></li>)}</ul>
          </nav>
          <nav aria-label={hi ? 'निःशुल्क कैलकुलेटर' : 'Free calculators'}>
            <h2 className="ns-mono">{hi ? 'निःशुल्क कैलकुलेटर' : 'FREE CALCULATORS'}</h2>
            <ul>{CALCS.map(([h, en, hn]) => <li key={h}><Link href={h}>{hi ? hn : en}</Link></li>)}</ul>
          </nav>
          <nav aria-label={t('colTemplates')}>
            <h2 className="ns-mono">{t('colTemplates')}</h2>
            <ul>
              {SITE_TEMPLATES.map(s => <li key={s.href}><Link href={s.href}>{s.title}<em className="ns-mono">{s.price}</em></Link></li>)}
              <li><Link href={TEMPLATES_BUNDLE.href}>{t('templatesBundle')}<em className="ns-mono">{TEMPLATES_BUNDLE.price}</em></Link></li>
            </ul>
          </nav>
          <nav aria-label={t('colCompany')}>
            <h2 className="ns-mono">{t('colCompany')}</h2>
            <ul>{company.map(([l, h]) => <li key={h}><Link href={h}>{l}</Link></li>)}</ul>
            <h2 className="ns-mono ns-foot__h2b">{t('colLegal')}</h2>
            <ul>{legal.map(([l, h]) => <li key={h}><Link href={h}>{l}</Link></li>)}</ul>
          </nav>
        </div>
        <div className="ns-foot__base">
          <span className="ns-mono">&copy; {yr} NirmanShastra</span>
          <button type="button" className="ns-foot__top ns-mono" data-snap onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>{hi ? 'ऊपर जाएँ' : 'Back to top'}<Arrow style={{ transform: 'rotate(-90deg)' }} /></button>
        </div>
      </div>
    </footer>
  )
}
