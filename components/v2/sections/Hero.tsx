'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import CutLink from '../CutLink'
import Sticker from '../Sticker'
import SectionCut from '../SectionCut'
import { Arrow } from '../Icons'
import '@/styles/v2/hero.css'

export default function Hero() {
  const th = useTranslations('hero')
  const hi = useLocale() === 'hi'

  return (
    <section className="ns-hero" id="top" aria-labelledby="ns-h1">
      <div className="ns-wrap">
        <div className="ns-hero__top">
          <p className="ns-eyebrow">IS 456:2000 · IS 1786:2008 · IS 13920:2016</p>
          <h1 className="ns-h1 ns-hero__h1" id="ns-h1">
            <span className="ns-hero__ln"><span className="ns-wipe" style={{ ['--d' as string]: '.1s' }}>{th('heroTitlePrefix')}</span></span>{' '}
            <span className="ns-hero__ln">
              <span className="ns-wipe ns-hero__hl" style={{ ['--d' as string]: '.4s' }}>
                {th('heroTitleHighlight')}
                <svg className="ns-hero__ul" viewBox="0 0 600 26" preserveAspectRatio="none" aria-hidden="true">
                  <line x1="2" y1="13" x2="598" y2="13" stroke="currentColor" strokeWidth="3" />
                  <line x1="2" y1="3" x2="2" y2="23" stroke="currentColor" strokeWidth="3" />
                  <line x1="598" y1="3" x2="598" y2="23" stroke="currentColor" strokeWidth="3" />
                  <rect x="262" y="4" width="76" height="18" rx="9" fill="var(--ns-bg)" stroke="currentColor" strokeWidth="2.5" />
                  <circle className="ns-hero__bub" cx="300" cy="13" r="5.5" fill="currentColor" />
                </svg>
              </span>
              <span className="ns-hero__dot">.</span>
            </span>
          </h1>
          <Sticker src="/v2/cutouts/o01-spirit-level.webp" w={820} h={324} width="clamp(150px, 21vw, 330px)" rot={-7}
            pos={{ right: "2%", top: "2%" }} />
          <Sticker src="/v2/cutouts/o03-trowel.webp" w={820} h={537} width="clamp(96px, 12vw, 190px)" rot={14}
            pos={{ right: '19%', bottom: '-6%' }} />
        </div>

        <div className="ns-hero__grid">
          <div className="ns-hero__copy">
            <p className="ns-lede ns-hero__sub">{th('subheadline')}</p>
            <div className="ns-hero__cta">
              <CutLink href="/tools/vastu-pro" className="ns-btn" data-snap>{th('ctaFree')}</CutLink>
              <Link href="#pricing" className="ns-btn ns-btn--paper" data-snap>{th('ctaPricing')}</Link>
            </div>
            <dl className="ns-hero__stats">
              {[0, 1, 2].map(i => (
                <div key={i}>
                  <dt>{th(`stat${i}Label` as 'stat0Label')}</dt>
                  <dd className="ns-mono">{th(`stat${i}Val` as 'stat0Val')}</dd>
                </div>
              ))}
            </dl>
            <p className="ns-hero__scroll ns-mono"><Arrow style={{ transform: 'rotate(90deg)' }} /> {hi ? 'स्क्रॉल' : 'scroll'} · 0.000 → 4.000 m</p>
          </div>
          <SectionCut />
        </div>
      </div>
    </section>
  )
}
