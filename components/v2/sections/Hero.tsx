'use client'

import Link from 'next/link'
import CutLink from '../CutLink'
import Sticker from '../Sticker'
import HeroEstimator from '../HeroEstimator'
import { Arrow } from '../Icons'
import { HERO, pick, type Loc } from '@/lib/v2/copy'
import '@/styles/v2/hero.css'

export default function Hero({ loc }: { loc: Loc }) {
  return (
    <section className="ns-hero" id="top" aria-labelledby="ns-h1">
      <div className="ns-wrap">
        <div className="ns-hero__top">
          <p className="ns-eyebrow">{pick(HERO.eyebrow, loc)}</p>
          <h1 className="ns-h1 ns-hero__h1" id="ns-h1">
            <span className="ns-hero__ln"><span className="ns-wipe" style={{ ['--d' as string]: '.1s' }}>{pick(HERO.h1a, loc)}</span></span>{' '}
            <span className="ns-hero__ln">
              <span className="ns-wipe ns-hero__hl" style={{ ['--d' as string]: '.4s' }}>{pick(HERO.h1b, loc)}</span>
            </span>
          </h1>
          <Sticker src="/v2/cutouts/o01-spirit-level.webp" w={820} h={324} width="clamp(150px, 21vw, 330px)" rot={-7}
            pos={{ right: '1%', top: '44%' }} />
        </div>

        <div className="ns-hero__grid">
          <div className="ns-hero__copy">
            <p className="ns-lede ns-hero__sub">{pick(HERO.sub, loc)}</p>
            <div className="ns-hero__cta">
              <CutLink href="/tools/vastu-pro" className="ns-btn" data-snap>{pick(HERO.cta1, loc)}</CutLink>
              <Link href={loc === 'hi' ? '/hi#quote-check' : '/#quote-check'} className="ns-btn ns-btn--paper" data-snap>{pick(HERO.cta2, loc)}</Link>
            </div>
            <ul className="ns-hero__chips">
              {HERO.chips.map((c, i) => (
                <li key={i}>
                  <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="var(--ns-verdigris)" /><path d="M4.600 8.300 7 10.600l4.400-5" fill="none" stroke="#fff" strokeWidth="1.900" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  {pick(c, loc)}
                </li>
              ))}
            </ul>
            <a className="ns-hero__scroll" href="#structure"><Arrow style={{ transform: 'rotate(90deg)' }} /> {pick(HERO.scroll, loc)}</a>
            <Sticker src="/v2/cutouts/o03-trowel.webp" w={820} h={537} width="clamp(96px, 10vw, 150px)" rot={14}
              pos={{ right: '0%', bottom: '0%' }} />
          </div>
          <HeroEstimator loc={loc} />
        </div>
      </div>
    </section>
  )
}
