'use client'

import PrivacyChoices from '@/components/analytics/PrivacyChoices'
import SocialLinks from '@/components/social/SocialLinks'
import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { BrandMark, Arrow } from '../Icons'
import FootingsArt from './FootingsArt'
import { TOOLS, SITE_TEMPLATES, TEMPLATES_BUNDLE, PACK_TOOL } from '@/lib/v2/content'
import { FOOT, pick } from '@/lib/v2/copy'
import { CONTACT_EMAIL } from '@/lib/site-contact'
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

export default function Footer() {
  const t = useTranslations('footer')
  const loc = useLocale() === 'hi' ? 'hi' : 'en'
  const [yr, setYr] = useState(2026)
  useEffect(() => setYr(new Date().getFullYear()), [])
  const hi = loc === 'hi'
  const legal: [string, string][] = [
    [t('privacy'), '/privacy-policy'], [t('terms'), '/terms-of-use'], [hi ? 'रिफ़ंड नीति' : 'Refund policy', '/refund-policy'], [t('disclaimer'), '/disclaimer'], [t('isCodes'), '/is-codes-used'],
    [hi ? 'शब्दावली' : 'Glossary', '/glossary'], [hi ? 'AI असिस्टेंट के लिए' : 'For AI assistants', '/llms.txt'],
  ]
  const company: [string, string][] = [[t('about'), '/about'], [t('contact'), '/contact'], [t('blog'), '/blog'], [t('careers'), '/careers']]

  return (
    <footer className="ns-foot ns-stage">
      <div className="ns-foot__strata"><FootingsArt /></div>
      <div className="ns-wrap">
        <p className="ns-foot__big">{pick(FOOT.tag, loc)}</p>
        <div className="ns-foot__cols">
          <div className="ns-foot__brand">
            <BrandMark className="ns-foot__mark" on="dark" size={320} />
            <p className="ns-foot__name">Nirman<b>Shastra</b></p>
            <p className="ns-foot__note">{pick(FOOT.note, loc)}</p>
            <SocialLinks hi={hi} where="footer" />
            <p className="ns-foot__mail">{hi ? 'हमें लिखिए: ' : 'Write to us: '}<a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>
          </div>
          <nav aria-label={pick(FOOT.tools, loc)}>
            <h2>{pick(FOOT.tools, loc)}</h2>
            <ul>
              {TOOLS.map(k => <li key={k.key}><Link href={k.href}>{k.name}{k.free ? <em>{pick(FOOT.free, loc)}</em> : null}</Link></li>)}
              <li><Link href={PACK_TOOL.href}>{pick(PACK_TOOL.name, loc)}</Link></li>
            </ul>
          </nav>
          <nav aria-label={pick(FOOT.calcs, loc)}>
            <h2>{pick(FOOT.calcs, loc)}</h2>
            <ul>{CALCS.map(([h, en, hn]) => <li key={h}><Link href={h}>{hi ? hn : en}</Link></li>)}</ul>
          </nav>
          <nav aria-label={pick(FOOT.kits, loc)}>
            <h2>{pick(FOOT.kits, loc)}</h2>
            <ul>
              {SITE_TEMPLATES.map(s => <li key={s.href}><Link href={s.href}>{hi ? s.hi.title : s.title}<em>{s.price}</em></Link></li>)}
              <li><Link href={TEMPLATES_BUNDLE.href}>{t('templatesBundle')}<em>{TEMPLATES_BUNDLE.price}</em></Link></li>
            </ul>
          </nav>
          <nav aria-label={pick(FOOT.company, loc)}>
            <h2>{pick(FOOT.company, loc)}</h2>
            <ul>{company.map(([l, h]) => <li key={h}><Link href={h}>{l}</Link></li>)}</ul>
            <h2 className="ns-foot__h2b">{pick(FOOT.legal, loc)}</h2>
            <ul>
              {/* /llms.txt is a file with no language: a plain link, not the language-aware one (that would send Hindi readers to /hi/llms.txt). */}
              {legal.map(([l, h]) => <li key={h}>{h.includes('.') ? <a href={h}>{l}</a> : <Link href={h}>{l}</Link>}</li>)}
              <li><PrivacyChoices>{hi ? 'गोपनीयता विकल्प' : 'Privacy choices'}</PrivacyChoices></li>
            </ul>
          </nav>
        </div>
        <div className="ns-foot__base">
          <span>&copy; {yr} NirmanShastra</span>
          <button type="button" className="ns-foot__top" data-snap onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>{pick(FOOT.top, loc)}<Arrow style={{ transform: 'rotate(-90deg)' }} /></button>
        </div>
        {/* Same line, same place as the foot of zeizzsystems.com: a quiet credit, centred, with the ZeizzLabs mark as the link. */}
        <div className="ns-foot__credit">
          {/* One line of text with the picture inline in it: an inline picture's bottom edge sits on the text baseline, so the mark and the words share a baseline at every width. */}
          <span>{pick(FOOT.credit, loc)}</span>{' '}
          <a href="https://www.zeizzlabs.com" target="_blank" rel="noopener noreferrer" aria-label={pick(FOOT.creditAria, loc)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/zeizzlabs.png" alt="ZeizzLabs" width={507} height={80} loading="lazy" decoding="async" />
          </a>
        </div>
      </div>
    </footer>
  )
}
